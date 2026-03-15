#!/bin/bash

# Horizon-HCM Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Example: ./scripts/deploy.sh production

set -e

ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "Horizon-HCM Deployment Script"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

# Function to load secrets from AWS Secrets Manager
load_aws_secrets() {
    local secret_prefix=$1
    echo "Loading secrets from AWS Secrets Manager..."
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        echo "Warning: AWS CLI not found. Skipping AWS Secrets Manager."
        return 1
    fi
    
    # Load database secrets
    if aws secretsmanager get-secret-value --secret-id "$secret_prefix/database" &> /dev/null; then
        DB_SECRET=$(aws secretsmanager get-secret-value --secret-id "$secret_prefix/database" --query SecretString --output text)
        export DATABASE_URL=$(echo $DB_SECRET | jq -r '.url // "postgresql://\(.username):\(.password)@\(.host):\(.port)/\(.database)"')
        echo "✓ Database secrets loaded"
    fi
    
    # Load Redis secrets
    if aws secretsmanager get-secret-value --secret-id "$secret_prefix/redis" &> /dev/null; then
        REDIS_SECRET=$(aws secretsmanager get-secret-value --secret-id "$secret_prefix/redis" --query SecretString --output text)
        export REDIS_HOST=$(echo $REDIS_SECRET | jq -r '.host')
        export REDIS_PORT=$(echo $REDIS_SECRET | jq -r '.port')
        export REDIS_PASSWORD=$(echo $REDIS_SECRET | jq -r '.password // empty')
        echo "✓ Redis secrets loaded"
    fi
    
    # Load JWT keys
    if aws secretsmanager get-secret-value --secret-id "$secret_prefix/jwt-keys" &> /dev/null; then
        JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id "$secret_prefix/jwt-keys" --query SecretString --output text)
        export JWT_PRIVATE_KEY=$(echo $JWT_SECRET | jq -r '.private_key')
        export JWT_PUBLIC_KEY=$(echo $JWT_SECRET | jq -r '.public_key')
        echo "✓ JWT keys loaded"
    fi
    
    # Load FCM secrets
    if aws secretsmanager get-secret-value --secret-id "$secret_prefix/fcm" &> /dev/null; then
        FCM_SECRET=$(aws secretsmanager get-secret-value --secret-id "$secret_prefix/fcm" --query SecretString --output text)
        export FCM_PROJECT_ID=$(echo $FCM_SECRET | jq -r '.project_id')
        export FCM_PRIVATE_KEY=$(echo $FCM_SECRET | jq -r '.private_key')
        export FCM_CLIENT_EMAIL=$(echo $FCM_SECRET | jq -r '.client_email')
        echo "✓ FCM secrets loaded"
    fi
    
    # Load AWS credentials
    if aws secretsmanager get-secret-value --secret-id "$secret_prefix/aws-credentials" &> /dev/null; then
        AWS_SECRET=$(aws secretsmanager get-secret-value --secret-id "$secret_prefix/aws-credentials" --query SecretString --output text)
        export AWS_ACCESS_KEY_ID=$(echo $AWS_SECRET | jq -r '.access_key_id')
        export AWS_SECRET_ACCESS_KEY=$(echo $AWS_SECRET | jq -r '.secret_access_key')
        export AWS_REGION=$(echo $AWS_SECRET | jq -r '.region // "us-east-1"')
        echo "✓ AWS credentials loaded"
    fi
    
    return 0
}

# Load secrets based on priority
if [ "$USE_AWS_SECRETS" = "true" ]; then
    # Priority 1: AWS Secrets Manager
    AWS_SECRETS_PREFIX=${AWS_SECRETS_PREFIX:-"horizon-hcm/$ENVIRONMENT"}
    load_aws_secrets "$AWS_SECRETS_PREFIX"
elif [ -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]; then
    # Priority 2: Environment-specific file
    echo "Loading environment configuration from .env.$ENVIRONMENT..."
    export $(cat "$PROJECT_DIR/.env.$ENVIRONMENT" | grep -v '^#' | xargs)
else
    echo "Error: No secrets source found"
    echo "Either set USE_AWS_SECRETS=true or provide .env.$ENVIRONMENT file"
    exit 1
fi

# Pre-deployment checks
echo ""
echo "Running pre-deployment checks..."

# Check if required environment variables are set
REQUIRED_VARS=("DATABASE_URL" "REDIS_HOST" "JWT_PRIVATE_KEY" "JWT_PUBLIC_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
        echo "✗ $var is not set"
    else
        echo "✓ $var is set"
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo ""
    echo "Error: Missing required environment variables:"
    printf '  - %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Please ensure all required secrets are configured."
    echo "See docs/SECRETS_MANAGEMENT.md for details."
    exit 1
fi

# Check database connectivity
echo "Checking database connectivity..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "Error: Cannot connect to database"
    exit 1
fi
echo "✓ Database connection successful"

# Check Redis connectivity
echo "Checking Redis connectivity..."
if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
    echo "Error: Cannot connect to Redis"
    exit 1
fi
echo "✓ Redis connection successful"

# Build application
echo ""
echo "Building application..."
npm ci --legacy-peer-deps
npx prisma generate
npm run build

# Run database migrations
echo ""
echo "Running database migrations..."
npx prisma migrate deploy

# Stop old application (if running)
echo ""
echo "Stopping old application..."
if pm2 list | grep -q "horizon-hcm"; then
    pm2 stop horizon-hcm
    pm2 delete horizon-hcm
fi

# Start new application
echo ""
echo "Starting new application..."
pm2 start dist/main.js --name horizon-hcm \
    --instances 2 \
    --exec-mode cluster \
    --max-memory-restart 500M \
    --env $ENVIRONMENT

# Wait for application to start
echo ""
echo "Waiting for application to start..."
sleep 10

# Health check
echo ""
echo "Running health check..."
MAX_RETRIES=10
RETRY_COUNT=0
HEALTH_URL="http://localhost:$PORT/health"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
        echo "✓ Health check passed"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Health check failed. Retry $RETRY_COUNT/$MAX_RETRIES..."
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "Error: Health check failed after $MAX_RETRIES attempts"
    echo "Rolling back deployment..."
    pm2 stop horizon-hcm
    exit 1
fi

# Save PM2 configuration
pm2 save

echo ""
echo "=========================================="
echo "Deployment completed successfully!"
echo "Environment: $ENVIRONMENT"
echo "Application: horizon-hcm"
echo "Status: Running"
echo "=========================================="
