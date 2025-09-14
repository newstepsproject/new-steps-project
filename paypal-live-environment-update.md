# 💰 PayPal Live Environment Configuration

## **Environment Variables to Update**

Add these to your production environment file:

```bash
# PayPal Live Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_live_client_id_here
PAYPAL_CLIENT_SECRET=your_live_client_secret_here
PAYPAL_ENVIRONMENT=production

# Remove or comment out sandbox settings:
# NEXT_PUBLIC_PAYPAL_CLIENT_ID=sandbox_client_id_placeholder
```

## **Deployment Steps**

### **Step 1: Update Environment File**
```bash
# Edit your production environment file
# Replace sandbox credentials with live credentials
```

### **Step 2: Deploy to Production Server**
```bash
# SSH to your production server
ssh -i docs-local/newsteps-key.pem ubuntu@54.190.78.59

# Navigate to app directory
cd /var/www/newsteps

# Update environment file with new PayPal credentials
# Then restart PM2
pm2 restart newsteps-production
```

### **Step 3: Verify PayPal Integration**
```bash
# Test checklist:
1. Go to https://newsteps.fit/shoes
2. Add a shoe to cart
3. Go to checkout (must be logged in)
4. Select "Standard Shipping" ($5 fee)
5. Verify PayPal buttons load
6. Complete test payment with real payment method
7. Check PayPal business dashboard for transaction
```

## **Testing with Real Money**

⚠️ **IMPORTANT**: Live PayPal processes real transactions!

### **Safe Testing Strategy:**
```bash
1. Use your own payment method for testing
2. Start with $5 shipping fee test
3. Verify transaction appears in PayPal dashboard
4. Test both PayPal and Venmo options
5. Confirm funds deposit to your bank account
```

### **Success Indicators:**
- ✅ PayPal buttons load without errors
- ✅ Payment flow completes successfully
- ✅ $5 charge appears in PayPal business account
- ✅ User receives order confirmation
- ✅ No JavaScript errors in browser console

## **Monitoring & Maintenance**

### **PayPal Business Dashboard:**
- Monitor transactions daily
- Set up email notifications for payments
- Check for any disputes or chargebacks
- Verify automatic deposits to bank account

### **Application Monitoring:**
- Watch for PayPal API errors in logs
- Monitor checkout completion rates
- Check for any payment failures
- Ensure proper error handling for users


