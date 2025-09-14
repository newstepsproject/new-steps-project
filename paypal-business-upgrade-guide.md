# PayPal Business Account Upgrade Guide

## Quick Business Upgrade (5 minutes)

### Step 1: Upgrade to Business Account
1. Go to: https://www.paypal.com/
2. Sign in: walterzhang10@gmail.com / Lemontree95758
3. Click profile icon (top right) → "Account Settings"
4. Look for "Upgrade to Business Account" or "Business Profile"
5. Fill out business information:
   - **Business Name**: New Steps Project
   - **Business Type**: Non-profit Organization
   - **Business Category**: Community/Social Services
   - **Business Address**: Your address
   - **Phone**: Your phone number
   - **Website**: https://newsteps.fit

### Step 2: Create Live Application
1. Go to: https://developer.paypal.com/
2. Sign in with same credentials
3. Navigate to: "My Apps & Credentials"
4. **CRITICAL**: Click "Live" tab (not Sandbox)
5. Click "Create App"
6. Fill out:
   - **App Name**: New Steps Project Live
   - **Merchant**: Select your business account
   - **Features**: ✅ Accept Payments
   - **Advanced Options**: Leave default

### Step 3: Get Live Credentials
After app creation:
- **Client ID**: Copy the long string starting with 'A'
- **Secret**: Copy the long string starting with 'E'
- **Save both securely** - these process real money!

### Step 4: Verify Credentials Format
- Client ID: ~80 characters, starts with 'A'
- Secret: ~80 characters, starts with 'E'
- Both should be different from your sandbox credentials

## Business Information Template

```
Business Name: New Steps Project
Business Type: Non-profit Organization  
Industry: Community & Social Services
Website: https://newsteps.fit
Description: Connecting youth with quality athletic shoes to support their sports participation and dreams
Monthly Volume: $500-2000 (estimated)
Average Transaction: $5-15 (shipping fees)
```

## Important Notes
- Business upgrade is usually instant
- Live app creation requires business account
- Keep credentials secure (never commit to git)
- Test with small amounts first ($5)
- Monitor PayPal dashboard for transactions


