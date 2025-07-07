#!/bin/bash

# NEW STEPS PROJECT - CRON JOBS SETUP
# Sets up automated backup, log management, and monitoring tasks

set -euo pipefail

APP_DIR="/var/www/newsteps"
SCRIPTS_DIR="$APP_DIR/scripts/production"
LOG_DIR="/var/log/newsteps"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create log directories
create_log_directories() {
    log "Creating log directories..."
    
    sudo mkdir -p /var/log/newsteps
    sudo mkdir -p /var/log/newsteps/backups
    sudo mkdir -p /var/log/newsteps/monitoring
    sudo mkdir -p /var/log/newsteps/cron
    
    # Set proper permissions
    sudo chown -R $USER:$USER /var/log/newsteps
    sudo chmod -R 755 /var/log/newsteps
    
    success "Log directories created"
}

# Setup backup cron job
setup_backup_cron() {
    log "Setting up daily backup cron job..."
    
    # Create backup script wrapper
    cat > /tmp/daily-backup-cron.sh << 'EOF'
#!/bin/bash
# Daily backup cron wrapper

LOG_FILE="/var/log/newsteps/cron/daily-backup-$(date +%Y%m%d).log"
SCRIPTS_DIR="/var/www/newsteps/scripts/production"

echo "===== DAILY BACKUP STARTED: $(date) =====" >> "$LOG_FILE"

cd "$SCRIPTS_DIR"
node daily-backup.js backup --upload >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "===== DAILY BACKUP COMPLETED: $(date) =====" >> "$LOG_FILE"
else
    echo "===== DAILY BACKUP FAILED: $(date) =====" >> "$LOG_FILE"
fi
EOF
    
    sudo mv /tmp/daily-backup-cron.sh /usr/local/bin/daily-backup-cron.sh
    sudo chmod +x /usr/local/bin/daily-backup-cron.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null || echo "") | grep -v "daily-backup-cron" | {
        cat
        echo "0 2 * * * /usr/local/bin/daily-backup-cron.sh # Daily backup at 2 AM"
    } | crontab -
    
    success "Daily backup cron job configured (2:00 AM daily)"
}

# Setup log management cron job
setup_log_management_cron() {
    log "Setting up log management cron job..."
    
    # Create log management script wrapper
    cat > /tmp/log-management-cron.sh << 'EOF'
#!/bin/bash
# Log management cron wrapper

LOG_FILE="/var/log/newsteps/cron/log-management-$(date +%Y%m%d).log"
SCRIPTS_DIR="/var/www/newsteps/scripts/production"

echo "===== LOG MANAGEMENT STARTED: $(date) =====" >> "$LOG_FILE"

cd "$SCRIPTS_DIR"

# Download and analyze logs weekly
if [ $(date +%u) -eq 1 ]; then
    echo "Weekly log download and analysis..." >> "$LOG_FILE"
    node log-manager.js download --upload >> "$LOG_FILE" 2>&1
fi

# Cleanup old logs daily
echo "Daily log cleanup..." >> "$LOG_FILE"
node log-manager.js cleanup >> "$LOG_FILE" 2>&1

echo "===== LOG MANAGEMENT COMPLETED: $(date) =====" >> "$LOG_FILE"
EOF
    
    sudo mv /tmp/log-management-cron.sh /usr/local/bin/log-management-cron.sh
    sudo chmod +x /usr/local/bin/log-management-cron.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null || echo "") | grep -v "log-management-cron" | {
        cat
        echo "30 3 * * * /usr/local/bin/log-management-cron.sh # Log management at 3:30 AM daily"
    } | crontab -
    
    success "Log management cron job configured (3:30 AM daily)"
}

# Setup health monitoring cron job
setup_health_monitoring_cron() {
    log "Setting up health monitoring cron job..."
    
    # Create health monitoring script
    cat > /tmp/health-monitoring-cron.sh << 'EOF'
#!/bin/bash
# Health monitoring cron wrapper

LOG_FILE="/var/log/newsteps/monitoring/health-check-$(date +%Y%m%d).log"
HEALTH_URL="http://localhost:3000/api/health"
ALERT_EMAIL="admin@newsteps.fit"

# Check application health
if ! curl -f -s "$HEALTH_URL" > /dev/null; then
    echo "$(date): HEALTH CHECK FAILED - Application not responding" >> "$LOG_FILE"
    
    # Try to restart PM2 application
    echo "$(date): Attempting to restart application..." >> "$LOG_FILE"
    pm2 restart newsteps-production >> "$LOG_FILE" 2>&1
    
    # Wait and check again
    sleep 30
    if ! curl -f -s "$HEALTH_URL" > /dev/null; then
        echo "$(date): CRITICAL - Application still not responding after restart" >> "$LOG_FILE"
        
        # Send alert email (if mail is configured)
        if command -v mail &> /dev/null; then
            echo "New Steps Project application is down and could not be restarted automatically. Please check the server immediately." | \
                mail -s "CRITICAL: New Steps Project Down" "$ALERT_EMAIL"
        fi
    else
        echo "$(date): Application successfully restarted" >> "$LOG_FILE"
    fi
else
    echo "$(date): Health check passed" >> "$LOG_FILE"
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "$(date): WARNING - Disk usage is ${DISK_USAGE}%" >> "$LOG_FILE"
    
    if command -v mail &> /dev/null; then
        echo "Server disk usage is at ${DISK_USAGE}%. Please clean up disk space." | \
            mail -s "WARNING: High Disk Usage on New Steps Server" "$ALERT_EMAIL"
    fi
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    echo "$(date): WARNING - Memory usage is ${MEMORY_USAGE}%" >> "$LOG_FILE"
    
    if command -v mail &> /dev/null; then
        echo "Server memory usage is at ${MEMORY_USAGE}%. Application may need optimization." | \
            mail -s "WARNING: High Memory Usage on New Steps Server" "$ALERT_EMAIL"
    fi
fi

# Check PM2 processes
PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="newsteps-production") | .pm2_env.status' 2>/dev/null || echo "unknown")
if [ "$PM2_STATUS" != "online" ]; then
    echo "$(date): WARNING - PM2 process status is $PM2_STATUS" >> "$LOG_FILE"
fi
EOF
    
    sudo mv /tmp/health-monitoring-cron.sh /usr/local/bin/health-monitoring-cron.sh
    sudo chmod +x /usr/local/bin/health-monitoring-cron.sh
    
    # Add to crontab (every 5 minutes)
    (crontab -l 2>/dev/null || echo "") | grep -v "health-monitoring-cron" | {
        cat
        echo "*/5 * * * * /usr/local/bin/health-monitoring-cron.sh # Health monitoring every 5 minutes"
    } | crontab -
    
    success "Health monitoring cron job configured (every 5 minutes)"
}

# Setup SSL certificate renewal
setup_ssl_renewal_cron() {
    log "Setting up SSL certificate renewal cron job..."
    
    # Create SSL renewal script
    cat > /tmp/ssl-renewal-cron.sh << 'EOF'
#!/bin/bash
# SSL renewal cron wrapper

LOG_FILE="/var/log/newsteps/cron/ssl-renewal-$(date +%Y%m%d).log"

echo "===== SSL RENEWAL CHECK STARTED: $(date) =====" >> "$LOG_FILE"

# Attempt certificate renewal
certbot renew --quiet >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "SSL certificate renewal check completed successfully" >> "$LOG_FILE"
    
    # Reload nginx to use new certificates
    sudo systemctl reload nginx >> "$LOG_FILE" 2>&1
else
    echo "SSL certificate renewal check failed" >> "$LOG_FILE"
fi

echo "===== SSL RENEWAL CHECK COMPLETED: $(date) =====" >> "$LOG_FILE"
EOF
    
    sudo mv /tmp/ssl-renewal-cron.sh /usr/local/bin/ssl-renewal-cron.sh
    sudo chmod +x /usr/local/bin/ssl-renewal-cron.sh
    
    # Add to crontab (twice daily)
    (crontab -l 2>/dev/null || echo "") | grep -v "ssl-renewal-cron" | {
        cat
        echo "0 12,24 * * * /usr/local/bin/ssl-renewal-cron.sh # SSL renewal check twice daily"
    } | crontab -
    
    success "SSL renewal cron job configured (12:00 PM and 12:00 AM daily)"
}

# Setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    # Create logrotate configuration
    sudo tee /etc/logrotate.d/newsteps << 'EOF'
# New Steps Project log rotation
/var/log/newsteps/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        # Restart rsyslog if needed
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}

/var/log/newsteps/*/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
}

/var/log/pm2/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        # Signal PM2 to reopen log files
        pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}
EOF
    
    success "Log rotation configured"
}

# Setup system updates cron job
setup_system_updates_cron() {
    log "Setting up system updates cron job..."
    
    # Create system updates script
    cat > /tmp/system-updates-cron.sh << 'EOF'
#!/bin/bash
# System updates cron wrapper

LOG_FILE="/var/log/newsteps/cron/system-updates-$(date +%Y%m%d).log"

echo "===== SYSTEM UPDATES STARTED: $(date) =====" >> "$LOG_FILE"

# Update package list
apt update >> "$LOG_FILE" 2>&1

# Check for available updates
UPDATES=$(apt list --upgradable 2>/dev/null | grep -c upgradable || echo "0")

if [ "$UPDATES" -gt 0 ]; then
    echo "$(date): $UPDATES package updates available" >> "$LOG_FILE"
    
    # Install security updates only
    unattended-upgrade >> "$LOG_FILE" 2>&1
    
    # Log completion
    echo "$(date): Security updates completed" >> "$LOG_FILE"
else
    echo "$(date): No updates available" >> "$LOG_FILE"
fi

echo "===== SYSTEM UPDATES COMPLETED: $(date) =====" >> "$LOG_FILE"
EOF
    
    sudo mv /tmp/system-updates-cron.sh /usr/local/bin/system-updates-cron.sh
    sudo chmod +x /usr/local/bin/system-updates-cron.sh
    
    # Add to crontab (weekly on Sunday)
    (crontab -l 2>/dev/null || echo "") | grep -v "system-updates-cron" | {
        cat
        echo "0 4 * * 0 /usr/local/bin/system-updates-cron.sh # System updates weekly on Sunday at 4 AM"
    } | crontab -
    
    success "System updates cron job configured (Sunday 4:00 AM weekly)"
}

# Display current crontab
show_crontab() {
    log "Current crontab configuration:"
    echo "================================"
    crontab -l || echo "No crontab entries found"
    echo "================================"
}

# Main setup function
main() {
    log "Setting up New Steps Project cron jobs..."
    log "========================================"
    
    # Check if running as correct user
    if [ "$EUID" -eq 0 ]; then
        error "This script should not be run as root"
        exit 1
    fi
    
    # Create necessary directories
    create_log_directories
    
    # Setup all cron jobs
    setup_backup_cron
    setup_log_management_cron
    setup_health_monitoring_cron
    setup_ssl_renewal_cron
    setup_system_updates_cron
    
    # Setup log rotation
    setup_log_rotation
    
    # Show final configuration
    show_crontab
    
    success "All cron jobs configured successfully!"
    
    log "Cron job summary:"
    log "  - Daily backup: 2:00 AM"
    log "  - Log management: 3:30 AM"
    log "  - Health monitoring: Every 5 minutes"
    log "  - SSL renewal: 12:00 PM and 12:00 AM"
    log "  - System updates: Sunday 4:00 AM"
    log "  - Log rotation: Daily via logrotate"
    
    warning "Important notes:"
    warning "  - Make sure scripts are executable: chmod +x $SCRIPTS_DIR/*.js"
    warning "  - Configure email alerts by installing mailutils: sudo apt install mailutils"
    warning "  - Monitor cron logs in /var/log/newsteps/cron/"
    warning "  - Test scripts manually before relying on automation"
}

# Show help
show_help() {
    echo "New Steps Project - Cron Jobs Setup Script"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -s, --show     Show current crontab only"
    echo
    echo "This script sets up the following cron jobs:"
    echo "  - Daily backups (database + application)"
    echo "  - Log management and cleanup"
    echo "  - Health monitoring and alerts"
    echo "  - SSL certificate renewal"
    echo "  - System security updates"
    echo "  - Log rotation configuration"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -s|--show)
        show_crontab
        exit 0
        ;;
    *)
        main
        ;;
esac 