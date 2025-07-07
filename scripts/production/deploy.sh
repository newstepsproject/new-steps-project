#!/bin/bash

# NEW STEPS PROJECT - PRODUCTION DEPLOYMENT SCRIPT
# Automated deployment with health checks and rollback capability

set -euo pipefail

# Configuration
APP_NAME="newsteps-production"
APP_DIR="/var/www/newsteps"
BACKUP_DIR="/var/backups/newsteps/deployments"
HEALTH_CHECK_URL="http://localhost:3000/api/health"
MAX_HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Check if running as correct user
check_user() {
    if [ "$EUID" -eq 0 ]; then
        error "This script should not be run as root"
        exit 1
    fi
}

# Create backup before deployment
create_backup() {
    log "Creating deployment backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="${BACKUP_DIR}/pre-deploy-${timestamp}"
    
    mkdir -p "$backup_path"
    
    # Backup current application
    tar -czf "${backup_path}/application.tar.gz" -C "$APP_DIR" . \
        --exclude=node_modules \
        --exclude=.next \
        --exclude=logs \
        --exclude=backups
    
    # Backup PM2 process list
    pm2 dump > "${backup_path}/pm2-processes.json" 2>/dev/null || true
    
    success "Backup created: $backup_path"
    echo "$backup_path" > /tmp/newsteps_last_backup
}

# Pull latest code
pull_code() {
    log "Pulling latest code from repository..."
    
    cd "$APP_DIR"
    
    # Stash any local changes
    git stash push -m "Auto-stash before deployment $(date)" || true
    
    # Fetch latest changes
    git fetch origin
    
    # Get current commit for rollback
    local current_commit=$(git rev-parse HEAD)
    echo "$current_commit" > /tmp/newsteps_previous_commit
    
    # Pull latest changes
    git pull origin main
    
    local new_commit=$(git rev-parse HEAD)
    
    if [ "$current_commit" = "$new_commit" ]; then
        warning "No new commits to deploy"
    else
        success "Updated from $current_commit to $new_commit"
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    cd "$APP_DIR"
    
    # Check if package-lock.json changed
    if git diff --name-only HEAD~1..HEAD | grep -q package-lock.json; then
        log "package-lock.json changed, running clean install..."
        rm -rf node_modules
        npm ci
    else
        npm install
    fi
    
    success "Dependencies installed"
}

# Build application
build_application() {
    log "Building application..."
    
    cd "$APP_DIR"
    
    # Clear previous build
    rm -rf .next
    
    # Build application
    npm run build
    
    success "Application built successfully"
}

# Health check function
health_check() {
    local retries=0
    
    log "Performing health check..."
    
    while [ $retries -lt $MAX_HEALTH_CHECK_RETRIES ]; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
            success "Health check passed"
            return 0
        fi
        
        retries=$((retries + 1))
        log "Health check attempt $retries/$MAX_HEALTH_CHECK_RETRIES failed, retrying in ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    error "Health check failed after $MAX_HEALTH_CHECK_RETRIES attempts"
    return 1
}

# Restart application
restart_application() {
    log "Restarting application..."
    
    cd "$APP_DIR"
    
    # Stop existing processes
    pm2 stop "$APP_NAME" || true
    
    # Wait a moment
    sleep 2
    
    # Start application
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 process list
    pm2 save
    
    success "Application restarted"
}

# Rollback function
rollback() {
    error "Deployment failed, initiating rollback..."
    
    cd "$APP_DIR"
    
    # Get previous commit
    if [ -f /tmp/newsteps_previous_commit ]; then
        local previous_commit=$(cat /tmp/newsteps_previous_commit)
        log "Rolling back to commit: $previous_commit"
        
        git reset --hard "$previous_commit"
        
        # Restore backup if available
        if [ -f /tmp/newsteps_last_backup ]; then
            local backup_path=$(cat /tmp/newsteps_last_backup)
            if [ -f "${backup_path}/application.tar.gz" ]; then
                warning "Restoring from backup: $backup_path"
                tar -xzf "${backup_path}/application.tar.gz" -C "$APP_DIR"
            fi
        fi
        
        # Rebuild and restart
        npm install
        npm run build
        pm2 restart "$APP_NAME"
        
        warning "Rollback completed"
    else
        error "No previous commit found for rollback"
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    
    rm -f /tmp/newsteps_previous_commit
    rm -f /tmp/newsteps_last_backup
    
    # Clean up old deployment backups (keep last 10)
    if [ -d "$BACKUP_DIR" ]; then
        ls -1t "$BACKUP_DIR" | tail -n +11 | xargs -I {} rm -rf "${BACKUP_DIR}/{}" 2>/dev/null || true
    fi
    
    success "Cleanup completed"
}

# Main deployment function
deploy() {
    log "Starting deployment of New Steps Project..."
    log "=========================================="
    
    local start_time=$(date +%s)
    
    # Create deployment backup
    create_backup
    
    # Update code
    pull_code
    
    # Install dependencies
    install_dependencies
    
    # Build application
    build_application
    
    # Restart application
    restart_application
    
    # Wait for application to start
    sleep 10
    
    # Health check
    if ! health_check; then
        rollback
        exit 1
    fi
    
    # Calculate deployment time
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    success "Deployment completed successfully in ${duration}s"
    
    # Log deployment info
    log "Deployment Information:"
    log "  Commit: $(git rev-parse HEAD)"
    log "  Branch: $(git branch --show-current)"
    log "  Time: $(date)"
    log "  Duration: ${duration}s"
    
    # Cleanup
    cleanup
}

# Handle script interruption
trap 'error "Deployment interrupted"; rollback; exit 1' INT TERM

# Validate environment
validate_environment() {
    log "Validating environment..."
    
    # Check if we're in production
    if [ "${NODE_ENV:-}" != "production" ]; then
        error "NODE_ENV must be set to 'production'"
        exit 1
    fi
    
    # Check required directories
    if [ ! -d "$APP_DIR" ]; then
        error "Application directory not found: $APP_DIR"
        exit 1
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        error "PM2 is not installed"
        exit 1
    fi
    
    # Check if git repository
    cd "$APP_DIR"
    if [ ! -d ".git" ]; then
        error "Not a git repository: $APP_DIR"
        exit 1
    fi
    
    # Check if on main branch
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        warning "Not on main branch, currently on: $current_branch"
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Deployment cancelled"
            exit 0
        fi
    fi
    
    success "Environment validation passed"
}

# Show help
show_help() {
    echo "New Steps Project - Production Deployment Script"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --validate Validate environment only"
    echo "  -r, --rollback Rollback to previous deployment"
    echo "  -f, --force    Force deployment without confirmation"
    echo
    echo "Examples:"
    echo "  $0                    # Normal deployment"
    echo "  $0 --validate         # Check environment"
    echo "  $0 --rollback         # Rollback deployment"
}

# Parse command line arguments
FORCE_DEPLOY=false
VALIDATE_ONLY=false
ROLLBACK_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--validate)
            VALIDATE_ONLY=true
            shift
            ;;
        -r|--rollback)
            ROLLBACK_ONLY=true
            shift
            ;;
        -f|--force)
            FORCE_DEPLOY=true
            shift
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    # Check user
    check_user
    
    # Validate environment
    validate_environment
    
    if [ "$VALIDATE_ONLY" = true ]; then
        success "Environment validation completed"
        exit 0
    fi
    
    if [ "$ROLLBACK_ONLY" = true ]; then
        rollback
        exit 0
    fi
    
    # Confirm deployment unless forced
    if [ "$FORCE_DEPLOY" = false ]; then
        log "Ready to deploy New Steps Project to production"
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Execute deployment
    deploy
}

# Run main function
main "$@" 