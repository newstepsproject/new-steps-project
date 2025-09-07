/**
 * PM2 ECOSYSTEM CONFIGURATION
 * Production process management for New Steps Project
 * OPTIMIZED FOR t3.small (2 vCPU, 2GB RAM)
 */

module.exports = {
  apps: [
    {
      name: 'newsteps-production',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/newsteps',
      instances: 1,  // Can use 2 with t3.small, but 1 is safer for start
      exec_mode: 'fork',  // Start with fork, can change to cluster later
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_TELEMETRY_DISABLED: 1
      },
      
      // Logging configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/newsteps-error.log',
      out_file: '/var/log/pm2/newsteps-out.log',
      log_file: '/var/log/pm2/newsteps-combined.log',
      
      // Performance settings optimized for t3.small
      max_memory_restart: '800M',  // Increased from 400M to 800M
      node_args: '--max-old-space-size=1024',
      
      // Restart settings
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Monitoring
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.next', '.git'],
      
      // Health check
      health_check_url: 'http://localhost:3000/api/health',
      health_check_grace_period: 3000,
      
      // Process management
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Auto restart on file changes (disable in production)
      watch_delay: 1000,
      
      // Graceful shutdown
      shutdown_with_message: true,
      
      // Custom environment variables for production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_TELEMETRY_DISABLED: 1,
        // Storage configuration
        STORAGE_PROVIDER: 's3',
        S3_REGION: 'us-west-2',
        S3_BUCKET: 'newsteps-images',
        S3_PREFIX: 'images',
        S3_PUBLIC_URL: 'https://cdn.newsteps.fit'
      }
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['newsteps.fit'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/newsteps.git',
      path: '/var/www/newsteps',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    }
  }
}; 