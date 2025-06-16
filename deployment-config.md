# Deployment Configuration for New Steps Project

## Server Setup (EC2)
- Node.js version: 18.x LTS
- PM2 for process management
- Nginx for reverse proxy

## CI/CD Pipeline
- GitHub Actions workflow
- Main branch -> production deployment
- Development branch -> staging deployment

## Deployment Steps
1. Build Next.js application
2. Upload static assets to S3/CloudFront
3. Deploy server code to EC2
4. Update Nginx configuration
5. Restart PM2 processes

## Nginx Configuration Template
```nginx
server {
    listen 80;
    server_name newsteps.fit www.newsteps.fit;
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name newsteps.fit www.newsteps.fit;

    ssl_certificate /etc/letsencrypt/live/newsteps.fit/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/newsteps.fit/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name admin.newsteps.fit;
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name admin.newsteps.fit;

    ssl_certificate /etc/letsencrypt/live/newsteps.fit/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/newsteps.fit/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## PM2 Configuration
```json
{
  "apps": [
    {
      "name": "newsteps-main",
      "script": "npm",
      "args": "start",
      "cwd": "/path/to/newsteps-app",
      "instances": "max",
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      }
    },
    {
      "name": "newsteps-admin",
      "script": "npm",
      "args": "run start:admin",
      "cwd": "/path/to/newsteps-app",
      "instances": 1,
      "env": {
        "NODE_ENV": "production",
        "PORT": 3001
      }
    }
  ]
}
```

## Backup Strategy
- Database: Daily automated backups via MongoDB Atlas
- EC2: Weekly AMI snapshots
- S3: Versioning enabled
- Configuration: Stored in GitHub private repository 