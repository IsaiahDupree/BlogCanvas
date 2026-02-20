#!/bin/bash
# BlogCanvas Database Backup Cron Job
# VENDOR-WC-106: Daily automated backups
#
# Add to crontab:
#   0 2 * * * /path/to/blogcanvas/scripts/backup-cron.sh >> /var/log/blogcanvas-backup.log 2>&1

set -e

# Change to project directory
cd "$(dirname "$0")/.."

# Load environment
export NODE_ENV=production
source .env.production.local 2>/dev/null || true

# Run backup script
echo "[$(date)] Starting database backup..."
npm run db:backup -- --env=production --retention=30

# Check exit code
if [ $? -eq 0 ]; then
    echo "[$(date)] Backup completed successfully"
else
    echo "[$(date)] Backup failed!"
    # Send alert (integrate with your monitoring system)
    # curl -X POST https://your-monitoring-service.com/alert \
    #   -d "message=BlogCanvas backup failed"
    exit 1
fi

# Upload to S3 (optional)
if [ "$UPLOAD_TO_S3" = "true" ]; then
    echo "[$(date)] Uploading to S3..."
    aws s3 sync backups/ s3://$S3_BACKUP_BUCKET/blogcanvas/ \
        --exclude "*" --include "*.sql.gz" \
        --storage-class STANDARD_IA
fi

echo "[$(date)] Backup process completed"
