# PayPal Live Setup Guide

## Current Status
- PayPal Developer Account: ✅ walterzhang10@gmail.com
- Password: ✅ Lemontree95758
- Sandbox Working: ✅ Tested

## Step-by-Step PayPal Live Setup

### 1. Verify Business Account Status
1. Go to: https://www.paypal.com/
2. Sign in with: walterzhang10@gmail.com / Lemontree95758
3. Check account type in top-right corner
4. **Required**: Must be "Business" account (not Personal)
5. If Personal: Upgrade to Business account first

### 2. Complete Business Information
- Business Name: "New Steps Project" or your preferred name
- Business Type: Non-profit or appropriate category
- Business Address: Your business address
- Tax ID: If required for your jurisdiction

### 3. Create Live Application
1. Go to: https://developer.paypal.com/
2. Sign in with same credentials
3. Navigate to: "My Apps & Credentials"
4. **IMPORTANT**: Switch to "Live" tab (not Sandbox)
5. Click "Create App"
6. Fill out:
   - App Name: "New Steps Project Live"
   - Merchant: Select your business account
   - Features: Check "Accept Payments"

### 4. Get Live Credentials
After creating the app:
- Copy **Client ID** (starts with 'A', ~80 characters)
- Copy **Secret** (starts with 'E', ~80 characters)
- **CRITICAL**: Keep these secure - they process real money!

### 5. Environment Update
Replace in production .env.production:
```
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_live_client_id_here
PAYPAL_CLIENT_SECRET=your_live_secret_here
PAYPAL_ENVIRONMENT=live
```

### 6. Test with $5 Payment
- Go to https://newsteps.fit/checkout
- Add shoes requiring shipping
- Complete $5 real payment
- Verify money appears in PayPal account

## Important Notes
- Live credentials process REAL money
- Start with small test payments
- Monitor PayPal dashboard for transactions
- Keep credentials secure and never commit to git


