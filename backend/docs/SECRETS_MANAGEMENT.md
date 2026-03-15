# Secrets Management Guide

## Overview

This guide documents the secrets management strategy for Horizon-HCM. Secrets include sensitive configuration values such as database credentials, API keys, encryption keys, and third-party service credentials.

## Secrets Storage Options

### 1. GitHub Secrets (Recommended for CI/CD)

GitHub Secrets are used for CI/CD pipelines and automated deployments.

**Setting up GitHub Secrets:**

1. Navigate to your repository on GitHub
2. Go to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each required secret (see list below)

**Required GitHub Secrets:**

```
# Database
DATABASE_URL                    # PostgreSQL connection string
DATABASE_URL_STAGING           # Staging database connection string
DATABASE_URL_PRODUCTION        # Production database connection string

# Redis
REDIS_HOST                     # Redis host
REDIS_PORT                     # Redis port
REDIS_PASSWORD                 # Redis password (if applicable)

# JWT Authentication
JWT_PRIVATE_KEY                # RSA private key for JWT signing
JWT_PUBLIC_KEY                 # RSA public key for JWT verification
JWT_ACCESS_TOKEN_EXPIRATION    # Access token expiration (e.g., 15m)
JWT_REFRESH_TOKEN_EXPIRATION   # Refresh token expiration (e.g., 7d)

# Push Notifications
FCM_PROJECT_ID                 # Firebase Cloud Messaging project ID
FCM_PRIVATE_KEY                # Firebase service account private key
FCM_CLIENT_EMAIL               # Firebase service account email
APNS_KEY_ID                    # Apple Push Notification Service key ID
APNS_TEAM_ID                   # Apple Developer Team ID
APNS_PRIVATE_KEY               # APNS private key (.p8 file content)
WEB_PUSH_PUBLIC_KEY            # Web Push VAPID public key
WEB_PUSH_PRIVATE_KEY           # Web Push VAPID private key

# File Storage
AWS_ACCESS_KEY_ID              # AWS S3 access key (if using S3)
AWS_SECRET_ACCESS_KEY          # AWS S3 secret key
AWS_REGION                     # AWS region (e.g., us-east-1)
AWS_S3_BUCKET                  # S3 bucket name
AZURE_STORAGE_CONNECTION_STRING # Azure Blob Storage connection (if using Azure)

# Email Service (if applicable)
SMTP_HOST                      # SMTP server host
SMTP_PORT                      # SMTP server port
SMTP_USER                      # SMTP username
SMTP_PASSWORD                  # SMTP password

# Logging and Monitoring
SEQ_SERVER_URL                 # Seq server URL
SEQ_API_KEY                    # Seq API key for ingestion

# Security
ENCRYPTION_KEY                 # Application-level encryption key
HMAC_SECRET                    # HMAC signing secret for request signatures

# Third-party Services
STRIPE_SECRET_KEY              # Stripe payment processing (if applicable)
STRIPE_WEBHOOK_SECRET          # Stripe webhook signing secret
```

### 2. AWS Secrets Manager (Recommended for Production)

AWS Secrets Manager provides automatic rotation, fine-grained access control, and audit logging.

**Setting up AWS Secrets Manager:**

```bash
# Install AWS CLI
# Configure AWS credentials
aws configure

# Create a secret
aws secretsmanager create-secret \
    --name horizon-hcm/production/database \
    --description "Production database credentials" \
    --secret-string '{"username":"dbuser","password":"securepassword","host":"db.example.com","port":"5432","database":"horizon_hcm"}'

# Retrieve a secret
aws secretsmanager get-secret-value \
    --secret-id horizon-hcm/production/database \
    --query SecretString \
    --output text
```

**Secret Naming Convention:**

```
horizon-hcm/{environment}/{service}
```

Examples:
- `horizon-hcm/production/database`
- `horizon-hcm/production/redis`
- `horizon-hcm/production/jwt-keys`
- `horizon-hcm/staging/database`

### 3. Environment Variables (Development Only)

For local development, use `.env` files. **Never commit `.env` files to version control.**

**Setup:**

```bash
# Copy the example file
cp .env.example .env

# Edit with your local values
nano .env
```

## Secrets in Deployment Scripts

The deployment scripts have been updated to support multiple secrets sources:

### Environment Variable Priority

1. **AWS Secrets Manager** (if configured)
2. **GitHub Secrets** (in CI/CD)
3. **Local .env files** (development)

### Using Secrets in Deployment

**Option 1: GitHub Actions (Automated)**

Secrets are automatically injected from GitHub Secrets:

```yaml
# .github/workflows/deploy.yml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL_PRODUCTION }}
  JWT_PRIVATE_KEY: ${{ secrets.JWT_PRIVATE_KEY }}
  # ... other secrets
```

**Option 2: Manual Deployment with AWS Secrets Manager**

```bash
# Set AWS Secrets Manager flag
export USE_AWS_SECRETS=true
export AWS_SECRETS_PREFIX=horizon-hcm/production

# Run deployment
./scripts/deploy.sh production
```

**Option 3: Manual Deployment with Environment File**

```bash
# Ensure .env.production exists with all required secrets
./scripts/deploy.sh production
```

## Secrets Validation

The deployment scripts validate that all required secrets are present before deployment:

```bash
# Required secrets are checked automatically
./scripts/deploy.sh production

# Output:
# ✓ DATABASE_URL is set
# ✓ REDIS_HOST is set
# ✓ JWT_PRIVATE_KEY is set
# ✗ FCM_PROJECT_ID is not set
# Error: Missing required secrets
```

## Security Best Practices

### 1. Never Commit Secrets

- Add `.env*` to `.gitignore` (except `.env.example`)
- Use placeholder values in `.env.example`
- Review commits before pushing to ensure no secrets are included

### 2. Use Strong Secrets

```bash
# Generate strong random secrets
openssl rand -base64 32

# Generate RSA key pairs for JWT
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

### 3. Principle of Least Privilege

- Grant access only to secrets that are needed
- Use separate secrets for different environments
- Use IAM roles and policies to restrict access

### 4. Audit Secret Access

- Enable CloudTrail for AWS Secrets Manager
- Review access logs regularly
- Set up alerts for unauthorized access attempts

### 5. Encrypt Secrets at Rest

- AWS Secrets Manager encrypts secrets using AWS KMS
- GitHub Secrets are encrypted at rest
- Use encrypted environment variables in CI/CD

## Secrets Rotation

Regular rotation of secrets reduces the risk of compromise. See [SECRETS_ROTATION.md](./SECRETS_ROTATION.md) for detailed rotation procedures.

### Rotation Schedule

| Secret Type | Rotation Frequency | Automated |
|-------------|-------------------|-----------|
| Database passwords | 90 days | Yes (AWS) |
| API keys | 90 days | Manual |
| JWT keys | 180 days | Manual |
| Encryption keys | 365 days | Manual |
| Service account keys | 90 days | Manual |

## Troubleshooting

### Secret Not Found

```bash
# Check if secret exists in AWS Secrets Manager
aws secretsmanager list-secrets --query "SecretList[?Name=='horizon-hcm/production/database']"

# Check GitHub Secrets (via GitHub UI)
# Settings → Secrets and variables → Actions
```

### Permission Denied

```bash
# Check IAM permissions for AWS Secrets Manager
aws iam get-user
aws iam list-attached-user-policies --user-name YOUR_USERNAME

# Required permissions:
# - secretsmanager:GetSecretValue
# - secretsmanager:DescribeSecret
```

### Invalid Secret Format

```bash
# Secrets should be valid JSON for structured data
# Example:
{
  "username": "dbuser",
  "password": "securepassword",
  "host": "db.example.com",
  "port": "5432"
}

# Or plain text for simple values
```

## References

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
