# 🚀 NEW STEPS PROJECT - PRODUCTION DEPLOYMENT GUIDE

## **Executive Summary**
Complete deployment guide for transitioning New Steps Project from development to production on AWS EC2 with separate database, PayPal integration, and AWS SES email service.

---

## **📋 PRE-DEPLOYMENT CHECKLIST**

### **✅ CURRENT STATUS (COMPLETED)**
- [x] **Comprehensive Testing**: 100% success rate (8/8 test suites)
- [x] **Critical Bug Fixes**: Money donation system, email handling, authentication
- [x] **Sample Data**: 11 test records across all data types
- [x] **Mobile Optimization**: Responsive design verified
- [x] **Security**: Authentication, access controls, error handling
- [x] **Performance**: All endpoints < 1000ms response time

---

## **🏗️ PRODUCTION ARCHITECTURE**

### **Current Development Setup**
```
Local Environment:
├── Next.js 14.1.0 (Frontend & Backend)
├── MongoDB (Development Database)
├── AWS SES (Sandbox Mode)
├── PayPal (Sandbox)
└── Local File Storage
```

### **Target Production Setup**
```
AWS Production Environment:
├── AWS EC2 Instance (Next.js Application)
├── MongoDB Atlas (Production Database)
├── AWS SES (Production Mode)
├── PayPal (Production Credentials)
├── AWS S3 (File Storage)
├── CloudWatch (Logging)
└── Route 53 (DNS - newsteps.fit)
```

---

## **🔧 STEP 1: AWS EC2 CONFIGURATION**

### **Recommended EC2 Instance**
- **Instance Type**: `t3.medium` (2 vCPU, 4 GB RAM)
- **Operating System**: Ubuntu 22.04 LTS
- **Storage**: 20 GB GP3 SSD
- **Security Group**: HTTP (80), HTTPS (443), SSH (22)

### **Required Software Installation**
```bash
# Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 for process management
sudo npm install -g pm2

# Nginx for reverse proxy
sudo apt update
sudo apt install nginx

# Certbot for SSL certificates
sudo apt install certbot python3-certbot-nginx

# Git for deployment
sudo apt install git
```

### **Environment Configuration**
```bash
# Create application directory
sudo mkdir -p /var/www/newsteps
sudo chown $USER:$USER /var/www/newsteps

# Clone repository
git clone <your-repo-url> /var/www/newsteps
cd /var/www/newsteps

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.production
```

---

## **🔧 STEP 2: DATABASE CONFIGURATION**

### **MongoDB Atlas Setup**
1. **Create MongoDB Atlas Account**: https://cloud.mongodb.com/
2. **Create Production Cluster**:
   - **Provider**: AWS
   - **Region**: US-West-2 (same as EC2)
   - **Tier**: M10 (Dedicated cluster)
3. **Database Security**:
   - Create database user with read/write access
   - Whitelist EC2 instance IP address
   - Enable authentication

### **Database Migration Strategy**
```bash
# Export development data (if needed)
mongodump --uri="mongodb://localhost:27017/newsteps" --out=./backup

# Import to production (selective)
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/newsteps" ./backup/newsteps
```

---

## **🔧 STEP 3: THIRD-PARTY SERVICE CONFIGURATION**

### **AWS SES Production Setup**
1. **Request Production Access**:
   - AWS Console → SES → Account Dashboard
   - Request increased sending limits
   - Verify domain: newsteps.fit

2. **Domain Verification**:
   - Add TXT record to Route 53
   - Verify DKIM records
   - Set up SPF record

3. **Email Configuration**:
   ```env
   # Production SES Settings
   AWS_SES_REGION=us-west-2
   AWS_ACCESS_KEY_ID=<production-key>
   AWS_SECRET_ACCESS_KEY=<production-secret>
   EMAIL_FROM=noreply@newsteps.fit
   ```

### **PayPal Production Setup**
1. **Create PayPal Business Account**
2. **Create Production App**:
   - Developer Dashboard → Create App
   - Select "Live" environment
   - Get Client ID and Secret

3. **PayPal Configuration**:
   ```env
   # Production PayPal Settings
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=<live-client-id>
   PAYPAL_CLIENT_SECRET=<live-client-secret>
   PAYPAL_ENVIRONMENT=production
   ```

---

## **🔧 STEP 4: APPLICATION DEPLOYMENT**

### **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/newsteps.fit
server {
    listen 80;
    server_name newsteps.fit www.newsteps.fit;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name newsteps.fit www.newsteps.fit;

    ssl_certificate /etc/letsencrypt/live/newsteps.fit/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/newsteps.fit/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **PM2 Ecosystem Configuration**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'newsteps-production',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/newsteps',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/newsteps-error.log',
    out_file: '/var/log/pm2/newsteps-out.log',
    log_file: '/var/log/pm2/newsteps-combined.log',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1G'
  }]
};
```

---

## **🔧 STEP 5: SSL CERTIFICATE SETUP**

```bash
# Generate SSL certificate
sudo certbot --nginx -d newsteps.fit -d www.newsteps.fit

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## **🔧 STEP 6: DOMAIN CONFIGURATION**

### **Route 53 DNS Records**
```
Type    Name                Value                   TTL
A       newsteps.fit        <EC2-IP-ADDRESS>       300
A       www.newsteps.fit    <EC2-IP-ADDRESS>       300
MX      newsteps.fit        10 mail.newsteps.fit   300
TXT     newsteps.fit        "v=spf1 include:amazonses.com ~all"
```

---

## **🔧 STEP 7: SECURITY CONFIGURATION**

### **Firewall Setup**
```bash
# Enable UFW firewall
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
```

### **Security Headers (Nginx)**
```nginx
# Add to server block
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## **🔧 STEP 8: MONITORING & LOGGING**

### **CloudWatch Setup**
1. **Install CloudWatch Agent**
2. **Configure Log Groups**:
   - `/var/log/newsteps/application.log`
   - `/var/log/nginx/access.log`
   - `/var/log/nginx/error.log`

### **Application Logging**
```javascript
// Add to app configuration
if (process.env.NODE_ENV === 'production') {
  const winston = require('winston');
  const CloudWatchTransport = require('winston-aws-cloudwatch');
  
  const logger = winston.createLogger({
    transports: [
      new CloudWatchTransport({
        logGroupName: 'newsteps-production',
        logStreamName: 'application-logs'
      })
    ]
  });
}
```

---

## **💰 ESTIMATED COSTS**

### **Monthly AWS Costs**
| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| **EC2 t3.medium** | 24/7 operation | ~$30 |
| **MongoDB Atlas M10** | Dedicated cluster | ~$57 |
| **Route 53** | Hosted zone + queries | ~$1 |
| **SES** | 1000 emails/month | ~$0.10 |
| **CloudWatch** | Basic monitoring | ~$5 |
| **Data Transfer** | Estimated usage | ~$10 |
| **Total** | | **~$103/month** |

### **One-time Costs**
- Domain registration (newsteps.fit): ~$12/year
- SSL certificate: Free (Let's Encrypt)

---

## **🚀 DEPLOYMENT TIMELINE**

### **Phase 1: Infrastructure (Day 1)**
- [ ] Set up AWS EC2 instance
- [ ] Configure MongoDB Atlas
- [ ] Set up domain and DNS

### **Phase 2: Application (Day 2)**
- [ ] Deploy application code
- [ ] Configure environment variables
- [ ] Set up SSL certificates

### **Phase 3: Services (Day 3)**
- [ ] Configure PayPal production
- [ ] Set up AWS SES production
- [ ] Configure monitoring

### **Phase 4: Testing (Day 4)**
- [ ] Run production tests
- [ ] Verify all functionality
- [ ] Performance testing

### **Phase 5: Go Live (Day 5)**
- [ ] Final DNS cutover
- [ ] Monitor launch
- [ ] Address any issues

---

## **📞 SUPPORT CONTACTS**

### **Critical Services**
- **AWS Support**: Business plan recommended ($100/month)
- **MongoDB Atlas**: Built-in support with M10 tier
- **PayPal Developer**: developer.paypal.com/support
- **Domain Registrar**: Based on your registrar

---

## **🔄 MAINTENANCE SCHEDULE**

### **Daily**
- Monitor application logs
- Check system resources
- Verify backup completion

### **Weekly**
- Update dependencies (if needed)
- Review performance metrics
- Check SSL certificate status

### **Monthly**
- Security updates
- Cost optimization review
- Performance analysis

---

## **⚠️ CRITICAL CONSIDERATIONS**

### **Data Protection**
- **GDPR Compliance**: User data handling
- **COPPA Compliance**: Youth athlete privacy
- **Data Retention**: Define deletion policies

### **Performance**
- **CDN**: Consider CloudFront for static assets
- **Database Optimization**: Indexing for search queries
- **Caching**: Redis for session management

### **Scalability**
- **Load Balancer**: For multiple EC2 instances
- **Auto Scaling**: For traffic spikes
- **Database Scaling**: MongoDB Atlas auto-scaling

---

**Next Steps**: Execute production scripts and deployment automation tools... 