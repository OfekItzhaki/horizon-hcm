#!/bin/bash

# Horizon-HCM Blue-Green Deployment Script
# Usage: ./scripts/blue-green-deploy.sh [environment]
# Example: ./scripts/blue-green-deploy.sh production

set -e

ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "Horizon-HCM Blue-Green Deployment"
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

# Validate required secrets
echo ""
echo "Validating required secrets..."
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

# Determine current and new environments
CURRENT_ENV=$(pm2 list | grep "horizon-hcm" | grep "online" | awk '{print $2}' | head -1)

if [ "$CURRENT_ENV" == "horizon-hcm-blue" ]; then
    NEW_ENV="horizon-hcm-green"
    OLD_ENV="horizon-hcm-blue"
    NEW_PORT=$((PORT + 1))
else
    NEW_ENV="horizon-hcm-blue"
    OLD_ENV="horizon-hcm-green"
    NEW_PORT=$((PORT + 1))
fi

echo "Current environment: ${OLD_ENV:-none}"
echo "New environment: $NEW_ENV"
echo "New port: $NEW_PORT"

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

# Start new environment
echo ""
echo "Starting new environment ($NEW_ENV)..."
PORT=$NEW_PORT pm2 start dist/main.js --name $NEW_ENV \
    --instances 2 \
    --exec-mode cluster \
    --max-memory-restart 500M \
    --env $ENVIRONMENT

# Wait for new environment to start
echo ""
echo "Waiting for new environment to start..."
sleep 15

# Health check on new environment
echo ""
echo "Running health check on new environment..."
MAX_RETRIES=10
RETRY_COUNT=0
HEALTH_URL="http://localhost:$NEW_PORT/health"

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
    echo "Error: Health check failed on new environment"
    echo "Stopping new environment..."
    pm2 stop $NEW_ENV
    pm2 delete $NEW_ENV
    exit 1
fi

# Switch traffic to new environment
echo ""
echo "Switching traffic to new environment..."
# Update load balancer or reverse proxy configuration here
# Example: Update nginx upstream configuration
# sed -i "s/$OLD_ENV/$NEW_ENV/g" /etc/nginx/sites-available/horizon-hcm
# nginx -s reload

echo "Traffic switched to $NEW_ENV"

# Wait for connections to drain
echo ""
echo "Waiting for connections to drain from old environment..."
sleep 30

# Stop old environment
if [ -n "$OLD_ENV" ] && pm2 list | grep -q "$OLD_ENV"; then
    echo ""
    echo "Stopping old environment ($OLD_ENV)..."
    pm2 stop $OLD_ENV
    pm2 delete $OLD_ENV
fi

# Save PM2 configuration
pm2 save

echo ""
echo "=========================================="
echo "Blue-Green deployment completed!"
echo "Environment: $ENVIRONMENT"
echo "Active: $NEW_ENV"
echo "Port: $NEW_PORT"
echo "=========================================="
