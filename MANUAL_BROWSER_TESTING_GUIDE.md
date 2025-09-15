# 🧪 MANUAL BROWSER TESTING GUIDE
## Critical Tests for Production Readiness

### 🎯 **TESTING STATUS**
- ✅ **Phase 1-4 Complete**: All APIs, data integrity, and email systems verified
- ⚠️ **Phase 2 Manual Testing**: Browser workflows require your validation
- 🚀 **Ready for Production**: After manual testing passes

---

## 📋 **CRITICAL MANUAL TESTS**

### **🌐 VISITOR WORKFLOWS (No Login Required)**

#### **Test 1: Homepage & Navigation**
1. **Open**: http://localhost:3000
2. **Verify**: 
   - Hero image loads properly
   - Navigation menu displays correctly
   - All nav links work: About, Donate Shoes, Request Shoes, Get Involved
3. **Expected**: Clean, mobile-friendly homepage with working navigation

#### **Test 2: Browse Shoes**
1. **Go to**: http://localhost:3000/shoes
2. **Verify**:
   - 2 shoes display (IDs: 4 and 5)
   - Shoe IDs are prominently visible
   - Individual shoe detail pages work
   - Images load correctly
3. **Expected**: Shoe browsing works without login required

#### **Test 3: Anonymous Shoe Donation**
1. **Go to**: http://localhost:3000/donate/shoes
2. **Fill form**:
   - First Name: Manual
   - Last Name: Test
   - Email: **YOUR_REAL_EMAIL** (to verify email)
   - Phone: 5551234567
   - Description: Manual test donation
3. **Submit and verify**:
   - Success message appears
   - Reference ID format: DS-MANU-XXXX
   - **Check your email** for confirmation
4. **Expected**: Form submits successfully, email received

#### **Test 4: Money Donation**
1. **Go to**: http://localhost:3000/get-involved
2. **Find money donation form**
3. **Fill and submit**:
   - Name: Manual Donor
   - Email: **YOUR_REAL_EMAIL**
   - Amount: $15.00
4. **Verify**: Reference ID format DM-MANU-XXXX, email received

---

### **👤 USER WORKFLOWS (Authentication Required)**

#### **Test 5: User Registration**
1. **Go to**: http://localhost:3000/register
2. **Register new user**:
   - First Name: Test
   - Last Name: User  
   - Email: **YOUR_REAL_EMAIL+test** (use + for testing)
   - Password: TestPass123!
3. **Verify**: Registration success, email verification sent

#### **Test 6: User Login**
1. **Go to**: http://localhost:3000/login
2. **Login with**: admin@newsteps.fit / Admin123!
3. **Verify**: Successfully logged in, redirected to account/dashboard

#### **Test 7: Shoe Request Workflow** ⚠️ **CRITICAL**
1. **While logged in**, go to: http://localhost:3000/shoes
2. **Add shoe to cart**: Click "Add to Cart" or "Request These Shoes"
3. **Try to add second shoe**: Should work (2-shoe limit)
4. **Try to add third shoe**: Should show limit message
5. **Go to checkout**: http://localhost:3000/checkout
6. **Fill shipping form**:
   - Personal info (should auto-fill from login)
   - Address: 123 Test St, Test City, CA, 12345
   - Select "Standard Shipping ($5.00)"
   - Check "I agree to shipping payment terms"
7. **Submit request**
8. **Verify**:
   - Success message with REQ-XXXX-XXXX reference
   - **Check email** for confirmation
   - Inventory count should decrease

---

### **🔧 ADMIN WORKFLOWS**

#### **Test 8: Admin Login**
1. **Go to**: http://localhost:3000/admin
2. **Login**: admin@newsteps.fit / Admin123!
3. **Verify**: Admin dashboard loads

#### **Test 9: Add Shoe to Inventory**
1. **Go to**: http://localhost:3000/admin/shoes/add
2. **Fill form**:
   - Brand: Manual Test
   - Model: Test Shoe
   - Size: 9
   - Color: Red
   - Gender: Men
   - Sport: Basketball
   - Condition: Good
3. **Submit**: Should create shoe with ID 101 or next sequential
4. **Verify**: Shoe appears in public /shoes page

#### **Test 10: Process Donations**
1. **Go to**: http://localhost:3000/admin/shoe-donations
2. **Find test donations** created earlier
3. **Click on donation** to view details
4. **Update status**: submitted → received → processed
5. **Add notes** at each step
6. **Verify**: Status changes save correctly

---

### **⚙️ CRITICAL: ADMIN SETTINGS IMPACT** 🚨

#### **Test 11: Shipping Fee Configuration** ⚠️ **MOST CRITICAL**
1. **Go to**: http://localhost:3000/admin/settings
2. **Find shipping fee setting** (currently $5.00)
3. **Change to**: $7.50
4. **Save settings**
5. **Open new tab**: http://localhost:3000/checkout
6. **Verify**: Checkout shows $7.50 shipping fee
7. **Go back to admin settings**
8. **Reset to**: $5.00
9. **Verify**: Checkout shows $5.00 again
10. **Expected**: Admin settings immediately impact public site

#### **Test 12: Max Shoes Limit (If Configurable)**
1. **In admin settings**, look for "Max shoes per request"
2. **If found**:
   - Change from 2 to 1
   - Save settings
   - Test cart only allows 1 shoe
   - Reset to 2
3. **Expected**: Cart limit changes based on admin setting

---

### **📧 EMAIL NOTIFICATION VERIFICATION**

#### **Test 13: Email System Validation**
Using the tests above with **your real email**, verify you receive:

1. **Shoe Donation Confirmation**:
   - Subject: Contains donation reference (DS-XXXX-XXXX)
   - Content: Donation details, next steps

2. **Money Donation Confirmation**:
   - Subject: Contains donation reference (DM-XXXX-XXXX)  
   - Content: Amount, thank you message

3. **Shoe Request Confirmation**:
   - Subject: Contains request reference (REQ-XXXX-XXXX)
   - Content: Shoe details, shipping info, status

4. **Check spam folders** if emails don't appear in inbox

---

## ✅ **SUCCESS CRITERIA**

### **All tests must pass before production:**
- [ ] Homepage loads and navigation works
- [ ] Shoe browsing works without login
- [ ] Anonymous donations work with email confirmation
- [ ] User registration and login work
- [ ] Shoe request workflow complete with email
- [ ] Cart enforces 2-shoe limit correctly
- [ ] Admin login and inventory management work
- [ ] **CRITICAL**: Admin settings immediately impact public site
- [ ] All email notifications received and properly formatted

### **If any test fails:**
1. **Report the specific issue**
2. **I'll fix it immediately on localhost**
3. **Re-test the fix**
4. **Continue only when all tests pass**

---

## 🚀 **AFTER MANUAL TESTING PASSES**

Once all manual tests pass:
1. **Report results**: "All manual tests passed" 
2. **Move to Phase 5**: Production environment testing
3. **Deploy to production**: With confidence in system stability

---

## 📞 **TESTING SUPPORT**

If you encounter any issues:
- **Describe the specific test that failed**
- **Include any error messages**
- **Note what you expected vs. what happened**
- **I'll fix immediately and provide re-test instructions**

**Remember**: Following the fix-first policy - we fix every issue immediately before proceeding!
