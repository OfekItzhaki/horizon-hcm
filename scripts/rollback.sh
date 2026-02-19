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

# Load environment-specific configuration
if [ -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]; then
    echo "Loading environment configuration..."
    export $(cat "$PROJECT_DIR/.env.$ENVIRONMENT" | grep -v '^#' | xargs)
else
    echo "Error: Environment file .env.$ENVIRONMENT not found"
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
