# Secrets Management Quick Reference

## Quick Start

### Local Development

```bash
# 1. Copy the example file
cp .env.example .env

# 2. Generate JWT keys
npm run generate:keys

# 3. Update .env with your local values
# Edit DATABASE_URL, REDIS_HOST, etc.

# 4. Validate secrets
./scripts/validate-secrets.sh development

# 5. Start the application
npm run start:dev
```

### Production Deployment

#### Option 1: Using GitHub Secrets (CI/CD)

```bash
# 1. Add secrets to GitHub repository
# Go to: Settings → Secrets and variables → Actions

# 2. Add required secrets:
DATABASE_URL_PRODUCTION
REDIS_HOST
REDIS_PORT
JWT_PRIVATE_KEY
JWT_PUBLIC_KEY
# ... (see full list in SECRETS_MANAGEMENT.md)

# 3. Push to main branch
git push origin main

# GitHub Actions will automatically deploy with secrets
```

#### Option 2: Using AWS Secrets Manager

```bash
# 1. Create secrets in AWS Secrets Manager
aws secretsmanager create-secret \
    --name horizon-hcm/production/database \
    --secret-string '{"url":"postgresql://user:pass@host:5432/db"}'

# 2. Deploy with AWS Secrets Manager flag
export USE_AWS_SECRETS=true
export AWS_SECRETS_PREFIX=horizon-hcm/production
./scripts/deploy.sh production
```

#### Option 3: Using Environment File

```bash
# 1. Create .env.production file on server
# Copy from .env.example and fill in production values

# 2. Deploy
./scripts/deploy.sh production
```

## Required Secrets

### Minimum Required (Core Functionality)

| Secret | Description | How to Generate |
|--------|-------------|-----------------|
| `DATABASE_URL` | PostgreSQL connection string | Provided by database host |
| `REDIS_HOST` | Redis server hostname | Provided by Redis host |
| `REDIS_PORT` | Redis server port | Usually 6379 |
| `JWT_PRIVATE_KEY` | RSA private key for JWT | `npm run generate:keys` |
| `JWT_PUBLIC_KEY` | RSA public key for JWT | `npm run generate:keys` |

### Recommended (Full Functionality)

| Secret | Description | Required For |
|--------|-------------|--------------|
| `FCM_PROJECT_ID` | Firebase project ID | Push notifications (Android) |
| `FCM_PRIVATE_KEY` | Firebase service account key | Push notifications (Android) |
| `FCM_CLIENT_EMAIL` | Firebase service account email | Push notifications (Android) |
| `APNS_KEY_ID` | Apple Push key ID | Push notifications (iOS) |
| `APNS_TEAM_ID` | Apple Developer Team ID | Push notifications (iOS) |
| `APNS_PRIVATE_KEY` | Apple Push private key | Push notifications (iOS) |
| `AWS_ACCESS_KEY_ID` | AWS access key | File storage (S3) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | File storage (S3) |
| `AWS_S3_BUCKET` | S3 bucket name | File storage (S3) |
| `ENCRYPTION_KEY` | App encryption key | Data encryption |
| `HMAC_SECRET` | HMAC signing secret | Request signing |
| `SEQ_SERVER_URL` | Seq server URL | Log aggregation |
| `SEQ_API_KEY` | Seq API key | Log aggregation |

## Common Commands

### Validate Secrets

```bash
# Validate development secrets
./scripts/validate-secrets.sh development

# Validate production secrets
./scripts/validate-secrets.sh production
```

### Generate Keys

```bash
# Generate JWT keys
npm run generate:keys

# Generate random secret (32 bytes)
openssl rand -base64 32

# Generate RSA key pair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

### AWS Secrets Manager

```bash
# Create secret
aws secretsmanager create-secret \
    --name horizon-hcm/production/database \
    --secret-string '{"url":"postgresql://..."}'

# Get secret
aws secretsmanager get-secret-value \
    --secret-id horizon-hcm/production/database

# Update secret
aws secretsmanager update-secret \
    --secret-id horizon-hcm/production/database \
    --secret-string '{"url":"postgresql://..."}'

# List secrets
aws secretsmanager list-secrets
```

### Deployment with Secrets

```bash
# Deploy with environment file
./scripts/deploy.sh production

# Deploy with AWS Secrets Manager
USE_AWS_SECRETS=true AWS_SECRETS_PREFIX=horizon-hcm/production ./scripts/deploy.sh production

# Blue-green deployment
USE_AWS_SECRETS=true ./scripts/blue-green-deploy.sh production

# Rollback
./scripts/rollback.sh production v1.2.3
```

## Secret Formats

### Database URL

```
postgresql://username:password@host:port/database?schema=public&sslmode=require
```

### JWT Keys (PEM Format)

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----
```

### Firebase Service Account

```json
{
  "project_id": "your-project-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk@your-project.iam.gserviceaccount.com"
}
```

### AWS Credentials

```
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

## Troubleshooting

### "Missing required secrets" Error

```bash
# Run validation to see which secrets are missing
./scripts/validate-secrets.sh production

# Check environment file exists
ls -la .env.production

# Verify secrets are exported
echo $DATABASE_URL
```

### "Cannot connect to database" Error

```bash
# Test database connection manually
psql "$DATABASE_URL" -c "SELECT 1;"

# Check if DATABASE_URL format is correct
echo $DATABASE_URL
# Should be: postgresql://user:pass@host:port/db
```

### "Cannot connect to Redis" Error

```bash
# Test Redis connection manually
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping

# If password is required
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
```

### "Invalid JWT key format" Error

```bash
# Check if key contains proper headers
echo $JWT_PRIVATE_KEY | grep "BEGIN.*PRIVATE KEY"

# Regenerate keys if needed
npm run generate:keys
```

## Security Checklist

- [ ] Never commit `.env` files to version control
- [ ] Use strong, randomly generated secrets
- [ ] Rotate secrets regularly (see SECRETS_ROTATION.md)
- [ ] Use separate secrets for each environment
- [ ] Enable encryption at rest for secret storage
- [ ] Restrict access to secrets using IAM policies
- [ ] Monitor secret access logs
- [ ] Use HTTPS for all API communications
- [ ] Enable database SSL connections in production

## Getting Help

- **Full Documentation**: See [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md)
- **Rotation Guide**: See [SECRETS_ROTATION.md](./SECRETS_ROTATION.md)
- **Environment Variables**: See [.env.example](../.env.example)

## Emergency Contacts

If secrets are compromised:

1. **Immediately rotate** the compromised secret
2. **Review logs** for unauthorized access
3. **Notify security team**
4. **Document the incident**

See [SECRETS_ROTATION.md](./SECRETS_ROTATION.md) for emergency rotation procedures.
