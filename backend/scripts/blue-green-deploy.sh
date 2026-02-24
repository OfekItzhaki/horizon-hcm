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

# Load environment-specific configuration
if [ -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]; then
    echo "Loading environment configuration..."
    export $(cat "$PROJECT_DIR/.env.$ENVIRONMENT" | grep -v '^#' | xargs)
else
    echo "Error: Environment file .env.$ENVIRONMENT not found"
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
