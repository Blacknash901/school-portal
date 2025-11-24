#!/bin/bash
#
# EC2 Monitoring Stack - S3 Backup Script
# Backs up Prometheus and Grafana data to S3
#
# Usage: ./backup.sh
# Schedule with cron: 0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1

set -e

# Configuration
BACKUP_DIR="/mnt/ebs/backups"
S3_BUCKET="${S3_BUCKET:-monitoring-backups}"
PROMETHEUS_DATA="/mnt/ebs/prometheus"
GRAFANA_DATA="/mnt/ebs/grafana"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="monitoring-backup-${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    log_warn "Running without root privileges. Some files might not be accessible."
fi

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

log_info "Starting backup process..."

# Create temporary directory for this backup
TEMP_BACKUP_DIR="${BACKUP_DIR}/${BACKUP_NAME}"
mkdir -p "${TEMP_BACKUP_DIR}"

# Backup Prometheus data
if [ -d "${PROMETHEUS_DATA}" ]; then
    log_info "Backing up Prometheus data..."
    tar -czf "${TEMP_BACKUP_DIR}/prometheus-data.tar.gz" \
        -C "${PROMETHEUS_DATA}" \
        --exclude='*.tmp' \
        --exclude='queries.active' \
        . || {
        log_error "Failed to backup Prometheus data"
        exit 1
    }
    log_info "Prometheus backup completed ($(du -h ${TEMP_BACKUP_DIR}/prometheus-data.tar.gz | cut -f1))"
else
    log_warn "Prometheus data directory not found: ${PROMETHEUS_DATA}"
fi

# Backup Grafana data
if [ -d "${GRAFANA_DATA}" ]; then
    log_info "Backing up Grafana data..."
    tar -czf "${TEMP_BACKUP_DIR}/grafana-data.tar.gz" \
        -C "${GRAFANA_DATA}" \
        --exclude='*.db-shm' \
        --exclude='*.db-wal' \
        . || {
        log_error "Failed to backup Grafana data"
        exit 1
    }
    log_info "Grafana backup completed ($(du -h ${TEMP_BACKUP_DIR}/grafana-data.tar.gz | cut -f1))"
else
    log_warn "Grafana data directory not found: ${GRAFANA_DATA}"
fi

# Create metadata file
log_info "Creating backup metadata..."
cat > "${TEMP_BACKUP_DIR}/metadata.json" <<EOF
{
  "backup_name": "${BACKUP_NAME}",
  "timestamp": "${TIMESTAMP}",
  "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "hostname": "$(hostname)",
  "prometheus_data": "$([ -f ${TEMP_BACKUP_DIR}/prometheus-data.tar.gz ] && echo 'yes' || echo 'no')",
  "grafana_data": "$([ -f ${TEMP_BACKUP_DIR}/grafana-data.tar.gz ] && echo 'yes' || echo 'no')",
  "prometheus_size": "$([ -f ${TEMP_BACKUP_DIR}/prometheus-data.tar.gz ] && du -b ${TEMP_BACKUP_DIR}/prometheus-data.tar.gz | cut -f1 || echo 0)",
  "grafana_size": "$([ -f ${TEMP_BACKUP_DIR}/grafana-data.tar.gz ] && du -b ${TEMP_BACKUP_DIR}/grafana-data.tar.gz | cut -f1 || echo 0)"
}
EOF

# Create final compressed backup
log_info "Creating final backup archive..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
log_info "Final backup created: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"

# Upload to S3
log_info "Uploading backup to S3: s3://${S3_BUCKET}/${BACKUP_NAME}.tar.gz"
aws s3 cp "${BACKUP_NAME}.tar.gz" "s3://${S3_BUCKET}/${BACKUP_NAME}.tar.gz" \
    --storage-class STANDARD_IA \
    --metadata "backup-date=$(date -u +%Y-%m-%dT%H:%M:%SZ),hostname=$(hostname)" || {
    log_error "Failed to upload backup to S3"
    exit 1
}
log_info "Backup uploaded successfully"

# Clean up temporary directory
log_info "Cleaning up temporary files..."
rm -rf "${TEMP_BACKUP_DIR}"

# Clean up old local backups (keep last 7 days)
log_info "Cleaning up old local backups..."
find "${BACKUP_DIR}" -name "monitoring-backup-*.tar.gz" -type f -mtime +7 -delete
LOCAL_BACKUPS=$(find "${BACKUP_DIR}" -name "monitoring-backup-*.tar.gz" -type f | wc -l)
log_info "Local backups remaining: ${LOCAL_BACKUPS}"

# Clean up old S3 backups
log_info "Cleaning up old S3 backups (older than ${RETENTION_DAYS} days)..."
CUTOFF_DATE=$(date -u -d "${RETENTION_DAYS} days ago" +%Y-%m-%d 2>/dev/null || date -u -v-${RETENTION_DAYS}d +%Y-%m-%d)

aws s3 ls "s3://${S3_BUCKET}/" | while read -r line; do
    BACKUP_FILE=$(echo "$line" | awk '{print $4}')
    if [[ $BACKUP_FILE == monitoring-backup-*.tar.gz ]]; then
        BACKUP_DATE=$(echo "$BACKUP_FILE" | grep -oP '\d{8}' | head -1)
        if [ ! -z "$BACKUP_DATE" ]; then
            FORMATTED_DATE="${BACKUP_DATE:0:4}-${BACKUP_DATE:4:2}-${BACKUP_DATE:6:2}"
            if [[ "$FORMATTED_DATE" < "$CUTOFF_DATE" ]]; then
                log_info "Deleting old backup: ${BACKUP_FILE}"
                aws s3 rm "s3://${S3_BUCKET}/${BACKUP_FILE}"
            fi
        fi
    fi
done

S3_BACKUPS=$(aws s3 ls "s3://${S3_BUCKET}/" | grep -c "monitoring-backup-" || echo 0)
log_info "S3 backups remaining: ${S3_BACKUPS}"

# Generate backup report
log_info "Generating backup report..."
cat > "${BACKUP_DIR}/last-backup-report.txt" <<EOF
===========================================
MONITORING STACK BACKUP REPORT
===========================================

Backup Name: ${BACKUP_NAME}
Date: $(date)
Status: SUCCESS

Backup Details:
- Prometheus Data: $([ -f ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz ] && echo 'Included' || echo 'Skipped')
- Grafana Data: $([ -f ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz ] && echo 'Included' || echo 'Skipped')
- Backup Size: ${BACKUP_SIZE}
- S3 Location: s3://${S3_BUCKET}/${BACKUP_NAME}.tar.gz

Retention:
- Local Retention: 7 days
- S3 Retention: ${RETENTION_DAYS} days
- Local Backups Count: ${LOCAL_BACKUPS}
- S3 Backups Count: ${S3_BACKUPS}

===========================================
EOF

log_info "Backup completed successfully!"
log_info "Backup location: s3://${S3_BUCKET}/${BACKUP_NAME}.tar.gz"
log_info "Local copy: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

exit 0
