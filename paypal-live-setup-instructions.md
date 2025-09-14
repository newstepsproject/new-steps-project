# 💰 PayPal Live Credentials Setup Instructions

## **Step 1: Update Environment File**

In your `env.production.template.new` file, update this line:

```bash
# CHANGE THIS:
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_live_client_id

# TO YOUR ACTUAL LIVE CLIENT ID:
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx
```

## **Step 2: Add PayPal Secret (if needed for backend)**

Add this new line to your environment file:

```bash
# Add this line:
PAYPAL_CLIENT_SECRET=EXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx
```

## **Step 3: Deploy Updated Configuration**

After updating the environment file:

```bash
# 1. Copy to production server
scp env.production.template.new ubuntu@your-server:/var/www/newsteps/.env.production

# 2. Restart PM2 to load new environment
ssh ubuntu@your-server "cd /var/www/newsteps && pm2 restart newsteps-production"
```

## **Step 4: Test Live PayPal Integration**

### **Test Checklist:**
- [ ] PayPal buttons load on checkout page
- [ ] Can initiate payment flow
- [ ] Can complete $5 test payment with real card
- [ ] Payment confirmation received
- [ ] Order processes correctly

### **Test Transaction:**
1. Go to https://newsteps.fit/shoes
2. Add a shoe to cart
3. Go to checkout (must be logged in)
4. Select "Standard Shipping" ($5 fee)
5. Complete PayPal payment with real payment method
6. Verify transaction appears in PayPal business account

## **Step 5: Monitor PayPal Dashboard**

After going live:
1. Check PayPal Business Dashboard for transactions
2. Monitor for any payment failures or disputes
3. Verify funds are depositing to your bank account
4. Set up PayPal notifications for important events

## **Important Notes:**
- Live PayPal processes real money - test carefully!
- Start with small test transactions ($5 shipping fees)
- Monitor the first few transactions closely
- Keep PayPal credentials secure and never commit to git


