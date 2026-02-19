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

# Load environment-specific configuration
if [ -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]; then
    echo "Loading environment configuration..."
    export $(cat "$PROJECT_DIR/.env.$ENVIRONMENT" | grep -v '^#' | xargs)
else
    echo "Error: Environment file .env.$ENVIRONMENT not found"
    exit 1
fi

# Pre-deployment checks
echo ""
echo "Running pre-deployment checks..."

# Check if required environment variables are set
REQUIRED_VARS=("DATABASE_URL" "REDIS_HOST" "JWT_PRIVATE_KEY" "JWT_PUBLIC_KEY")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set"
        exit 1
    fi
done

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
