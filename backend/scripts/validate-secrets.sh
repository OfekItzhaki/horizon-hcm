#!/bin/bash

# Horizon-HCM Secrets Validation Script
# Usage: ./scripts/validate-secrets.sh [environment]
# Example: ./scripts/validate-secrets.sh production

set -e

ENVIRONMENT=${1:-development}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "Horizon-HCM Secrets Validation"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

# Load environment configuration
if [ -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]; then
    echo "Loading environment configuration from .env.$ENVIRONMENT..."
    export $(cat "$PROJECT_DIR/.env.$ENVIRONMENT" | grep -v '^#' | xargs)
elif [ -f "$PROJECT_DIR/.env" ]; then
    echo "Loading environment configuration from .env..."
    export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
else
    echo "Warning: No environment file found"
fi

# Define required secrets by category
declare -A REQUIRED_SECRETS=(
    # Core Infrastructure
    ["DATABASE_URL"]="Database connection string"
    ["REDIS_HOST"]="Redis host"
    ["REDIS_PORT"]="Redis port"
    
    # Authentication
    ["JWT_PRIVATE_KEY"]="JWT private key for signing tokens"
    ["JWT_PUBLIC_KEY"]="JWT public key for verifying tokens"
)

declare -A RECOMMENDED_SECRETS=(
    # Push Notifications
    ["FCM_PROJECT_ID"]="Firebase Cloud Messaging project ID"
    ["FCM_PRIVATE_KEY"]="Firebase service account private key"
    ["FCM_CLIENT_EMAIL"]="Firebase service account email"
    
    # File Storage
    ["AWS_ACCESS_KEY_ID"]="AWS access key for S3"
    ["AWS_SECRET_ACCESS_KEY"]="AWS secret key for S3"
    ["AWS_S3_BUCKET"]="S3 bucket name"
    
    # Security
    ["ENCRYPTION_KEY"]="Application-level encryption key"
    ["HMAC_SECRET"]="HMAC secret for request signing"
    
    # Logging
    ["SEQ_SERVER_URL"]="Seq server URL for log aggregation"
)

# Validation counters
MISSING_REQUIRED=0
MISSING_RECOMMENDED=0
TOTAL_REQUIRED=${#REQUIRED_SECRETS[@]}
TOTAL_RECOMMENDED=${#RECOMMENDED_SECRETS[@]}

echo ""
echo "Validating required secrets..."
echo "----------------------------------------"

for secret in "${!REQUIRED_SECRETS[@]}"; do
    description="${REQUIRED_SECRETS[$secret]}"
    if [ -z "${!secret}" ]; then
        echo "✗ $secret - MISSING"
        echo "  Description: $description"
        MISSING_REQUIRED=$((MISSING_REQUIRED + 1))
    else
        # Mask the value for security
        value="${!secret}"
        if [ ${#value} -gt 20 ]; then
            masked="${value:0:10}...${value: -5}"
        else
            masked="***"
        fi
        echo "✓ $secret - SET ($masked)"
    fi
done

echo ""
echo "Validating recommended secrets..."
echo "----------------------------------------"

for secret in "${!RECOMMENDED_SECRETS[@]}"; do
    description="${RECOMMENDED_SECRETS[$secret]}"
    if [ -z "${!secret}" ]; then
        echo "⚠ $secret - MISSING (recommended)"
        echo "  Description: $description"
        MISSING_RECOMMENDED=$((MISSING_RECOMMENDED + 1))
    else
        value="${!secret}"
        if [ ${#value} -gt 20 ]; then
            masked="${value:0:10}...${value: -5}"
        else
            masked="***"
        fi
        echo "✓ $secret - SET ($masked)"
    fi
done

# Summary
echo ""
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo "Required secrets: $((TOTAL_REQUIRED - MISSING_REQUIRED))/$TOTAL_REQUIRED configured"
echo "Recommended secrets: $((TOTAL_RECOMMENDED - MISSING_RECOMMENDED))/$TOTAL_RECOMMENDED configured"

if [ $MISSING_REQUIRED -gt 0 ]; then
    echo ""
    echo "❌ VALIDATION FAILED"
    echo "Missing $MISSING_REQUIRED required secret(s)"
    echo ""
    echo "Please configure the missing secrets before deployment."
    echo "See docs/SECRETS_MANAGEMENT.md for details."
    exit 1
fi

if [ $MISSING_RECOMMENDED -gt 0 ]; then
    echo ""
    echo "⚠️  WARNING"
    echo "Missing $MISSING_RECOMMENDED recommended secret(s)"
    echo "Some features may not work correctly."
    echo ""
    echo "See docs/SECRETS_MANAGEMENT.md for details."
fi

echo ""
echo "✅ VALIDATION PASSED"
echo "All required secrets are configured."
echo ""

# Additional validation checks
echo "Running additional validation checks..."
echo "----------------------------------------"

# Check database connectivity
if [ -n "$DATABASE_URL" ]; then
    echo -n "Testing database connection... "
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            echo "✓ Connected"
        else
            echo "✗ Failed to connect"
            echo "  Please verify DATABASE_URL is correct"
        fi
    else
        echo "⚠ psql not found, skipping test"
    fi
fi

# Check Redis connectivity
if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
    echo -n "Testing Redis connection... "
    if command -v redis-cli &> /dev/null; then
        if [ -n "$REDIS_PASSWORD" ]; then
            if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping &> /dev/null; then
                echo "✓ Connected"
            else
                echo "✗ Failed to connect"
                echo "  Please verify REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD"
            fi
        else
            if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &> /dev/null; then
                echo "✓ Connected"
            else
                echo "✗ Failed to connect"
                echo "  Please verify REDIS_HOST and REDIS_PORT"
            fi
        fi
    else
        echo "⚠ redis-cli not found, skipping test"
    fi
fi

# Check JWT keys format
if [ -n "$JWT_PRIVATE_KEY" ]; then
    echo -n "Validating JWT private key format... "
    if echo "$JWT_PRIVATE_KEY" | grep -q "BEGIN.*PRIVATE KEY"; then
        echo "✓ Valid format"
    else
        echo "✗ Invalid format"
        echo "  JWT_PRIVATE_KEY should be a PEM-formatted RSA private key"
    fi
fi

if [ -n "$JWT_PUBLIC_KEY" ]; then
    echo -n "Validating JWT public key format... "
    if echo "$JWT_PUBLIC_KEY" | grep -q "BEGIN PUBLIC KEY"; then
        echo "✓ Valid format"
    else
        echo "✗ Invalid format"
        echo "  JWT_PUBLIC_KEY should be a PEM-formatted RSA public key"
    fi
fi

echo ""
echo "=========================================="
echo "Validation complete!"
echo "=========================================="
