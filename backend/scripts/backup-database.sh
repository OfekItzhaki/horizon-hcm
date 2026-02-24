#!/bin/bash

# Database Backup Script for Horizon-HCM
# Creates a backup of the PostgreSQL database and uploads to S3

set -e  # Exit on error

# Configuration
DATE=$(date +%Y-%m-%d-%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_FILE="$BACKUP_DIR/horizon-hcm-$DATE.sql"
S3_BUCKET="${S3_BUCKET:-horizon-hcm-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log_info "Starting database backup..."
log_info "Backup file: $BACKUP_FILE"

# Create backup
if pg_dump "$DATABASE_URL" > "$BACKUP_FILE"; then
    log_info "Database dump completed successfully"
else
    log_error "Database dump failed"
    exit 1
fi

# Compress backup
log_info "Compressing backup..."
if gzip "$BACKUP_FILE"; then
    log_info "Backup compressed: $BACKUP_FILE.gz"
else
    log_error "Compression failed"
    exit 1
fi

# Get file size
FILE_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
log_info "Backup size: $FILE_SIZE"

# Upload to S3 (if AWS CLI is available)
if command -v aws &> /dev/null; then
    log_info "Uploading to S3..."
    if aws s3 cp "$BACKUP_FILE.gz" "s3://$S3_BUCKET/"; then
        log_info "Backup uploaded to S3: s3://$S3_BUCKET/$(basename $BACKUP_FILE.gz)"
    else
        log_warn "S3 upload failed, but local backup is available"
    fi
else
    log_warn "AWS CLI not found, skipping S3 upload"
fi

# Clean up old backups
log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "horizon-hcm-*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
log_info "Deleted $DELETED_COUNT old backup(s)"

# Create weekly backup (every Sunday)
if [ "$(date +%u)" -eq 7 ]; then
    WEEKLY_BACKUP="$BACKUP_DIR/weekly/horizon-hcm-weekly-$DATE.sql.gz"
    mkdir -p "$BACKUP_DIR/weekly"
    cp "$BACKUP_FILE.gz" "$WEEKLY_BACKUP"
    log_info "Weekly backup created: $WEEKLY_BACKUP"
fi

# Create monthly backup (first day of month)
if [ "$(date +%d)" -eq 01 ]; then
    MONTHLY_BACKUP="$BACKUP_DIR/monthly/horizon-hcm-monthly-$DATE.sql.gz"
    mkdir -p "$BACKUP_DIR/monthly"
    cp "$BACKUP_FILE.gz" "$MONTHLY_BACKUP"
    log_info "Monthly backup created: $MONTHLY_BACKUP"
fi

log_info "Backup completed successfully!"
log_info "Backup location: $BACKUP_FILE.gz"

# Exit successfully
exit 0
