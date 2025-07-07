/**
 * PM2 ECOSYSTEM CONFIGURATION
 * Production process management for New Steps Project
 */

module.exports = {
  apps: [
    {
      name: 'newsteps-production',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/newsteps',
      instances: 2,
      exec_mode: 'cluster',
      
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
      
      // Performance settings
      max_memory_restart: '1G',
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
        // Add other production-specific variables here
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