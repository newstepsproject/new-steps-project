# AWS Configuration for New Steps Project

## Domain Information
- Primary Domain: newsteps.fit
- Admin Domain: admin.newsteps.fit
- Hosted Zone ID: Z08182023JKXSRPOWZGY2
- DNS Provider: AWS Route 53
- Domain Registrar: Namecheap

## SSL Certificates
- Certificate ARN: arn:aws:acm:us-west-2:356677661999:certificate/1a181e2a-2af0-491a-b1ee-01646ebcb18a
- Domains covered: newsteps.fit, *.newsteps.fit
- Expiration date: May 28, 2026

## S3 Buckets
- Images Bucket: newsteps-images
- Region: us-west-2
- CloudFront Distribution ID: ED0ASQ8H0CK59
- CloudFront Domain: d38dol7vzd8qs4.cloudfront.net

## EC2 Instance
- Instance ID: i-05486d2a225e8f305
- Public IP: 54.190.78.59
- Instance Type: t2.micro
- SSH Key Name: newsteps-key
- Region: us-west-2

## Load Balancer (if applicable)
- Load Balancer Name: newsteps-alb
- DNS Name: [Your ALB DNS Name]
- Target Group: newsteps-app-targets

## Security Groups
- Web Server Security Group ID: sg-026ad4184f2af36a1
- Load Balancer Security Group ID: [Your LB Security Group ID]