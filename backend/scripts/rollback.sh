#!/bin/bash

# Horizon-HCM Rollback Script
# Usage: ./scripts/rollback.sh [environment] [version]
# Example: ./scripts/rollback.sh production v1.2.3

set -e

ENVIRONMENT=${1:-staging}
VERSION=${2}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "Horizon-HCM Rollback Script"
echo "Environment: $ENVIRONMENT"
echo "Version: ${VERSION:-latest}"
echo "=========================================="

if [ -z "$VERSION" ]; then
    echo "Error: Version parameter is required"
    echo "Usage: ./scripts/rollback.sh [environment] [version]"
    exit 1
fi

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

# Checkout specific version
echo ""
echo "Checking out version $VERSION..."
git fetch --all --tags
git checkout "tags/$VERSION"

# Build application
echo ""
echo "Building application..."
npm ci --legacy-peer-deps
npx prisma generate
npm run build

# Get current migration status
echo ""
echo "Checking database migration status..."
CURRENT_MIGRATION=$(npx prisma migrate status | grep "applied" | tail -1 | awk '{print $1}')
echo "Current migration: $CURRENT_MIGRATION"

# Rollback database migrations if needed
echo ""
read -p "Do you want to rollback database migrations? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Rolling back database migrations..."
    # Note: Prisma doesn't have built-in rollback, you need to handle this manually
    echo "Warning: Manual migration rollback required"
    echo "Please review and execute rollback SQL manually"
fi

# Stop current application
echo ""
echo "Stopping current application..."
pm2 stop horizon-hcm

# Start rolled-back version
echo ""
echo "Starting rolled-back version..."
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
    echo "Rollback failed!"
    exit 1
fi

# Save PM2 configuration
pm2 save

echo ""
echo "=========================================="
echo "Rollback completed successfully!"
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"
echo "Status: Running"
echo "=========================================="
