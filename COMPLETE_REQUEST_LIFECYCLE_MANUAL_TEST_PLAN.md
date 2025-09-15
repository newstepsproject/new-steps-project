# Complete Shoe Request Lifecycle Manual Test Plan

## 🎯 **CRITICAL GAP IDENTIFIED**
You're absolutely right! Our testing missed the **complete interactive cycle**:
1. **User requests shoes** → 2. **Admin processes request** → 3. **Inventory updates** → 4. **User gets emails** → 5. **Status changes affect public visibility**

## 📋 **MANUAL TEST PLAN: COMPLETE REQUEST LIFECYCLE**

### **PHASE 1: USER REQUEST CREATION**

#### **Test 1.1: User Registration and Login**
1. Open browser to `http://localhost:3000/register`
2. Register new user: `testuser@example.com` / `TestUser123!`
3. Verify email confirmation (if enabled)
4. Login with credentials
5. **✅ Expected**: User logged in, redirected to account page

#### **Test 1.2: Browse and Request Shoes**
1. Navigate to `/shoes`
2. **📊 Record**: Initial shoe count: `___ shoes available`
3. Select a shoe (record name: `_______________`)
4. Click "Add to Cart"
5. Go to `/cart`
6. **✅ Expected**: Shoe appears in cart
7. Click "Checkout"

#### **Test 1.3: Complete Checkout Process**
1. Fill shipping information
2. Select shipping method (Standard $5 or Pickup Free)
3. Complete payment (if required) or agree to manual payment
4. Submit request
5. **✅ Expected**: Request confirmation with ID (REQ-XXXXXXXX-XXXX)
6. **📧 Check**: User receives confirmation email
7. **📊 Record**: Request ID: `_______________`

---

### **PHASE 2: ADMIN SEES AND PROCESSES REQUEST**

#### **Test 2.1: Admin Login and Request Visibility**
1. Open new browser tab/incognito
2. Login as admin: `admin@newsteps.fit` / `Admin123!`
3. Navigate to `/admin/requests`
4. **✅ Expected**: Admin requests dashboard loads
5. **🔍 Verify**: Test request appears in list
6. **📊 Record**: Request visible: `Yes/No`, Status: `___________`

#### **Test 2.2: Admin Request Processing - APPROVE**
1. Click on test request to view details
2. **✅ Expected**: Request details show user info, shoe details, shipping info
3. Change status from "submitted" to "approved"
4. Add admin notes: "Test approval - lifecycle testing"
5. Save changes
6. **📧 Check**: User receives "request approved" email
7. **📊 Record**: Status changed to: `approved`

#### **Test 2.3: Inventory Impact After Approval**
1. Open new browser tab
2. Go to `/shoes` (public page)
3. **🔍 Verify**: Requested shoe no longer appears OR shows "unavailable"
4. **📊 Record**: Shoe count now: `___ shoes` (should be 1 less)
5. **✅ Expected**: Inventory reflects the approved request

---

### **PHASE 3: ADMIN STATUS CHANGES AND CONSEQUENCES**

#### **Test 3.1: Admin Changes Status to SHIPPED**
1. Back in admin panel, change request status to "shipped"
2. Add tracking info: "TEST123456789"
3. Add shipping notes: "Test shipment - lifecycle testing"
4. Save changes
5. **📧 Check**: User receives "request shipped" email with tracking
6. **📊 Record**: Status changed to: `shipped`

#### **Test 3.2: User Account Reflects Status Changes**
1. Back in user browser tab
2. Go to `/account`
3. **✅ Expected**: Request shows "shipped" status
4. **✅ Expected**: Tracking information visible
5. **📊 Record**: User sees status: `shipped`, Tracking: `TEST123456789`

---

### **PHASE 4: ADMIN REJECTION TESTING**

#### **Test 4.1: Create Second Request for Rejection Test**
1. As user, create another request for a different shoe
2. **📊 Record**: Second request ID: `_______________`
3. **📊 Record**: Second shoe name: `_______________`

#### **Test 4.2: Admin Rejects Request**
1. As admin, find second request
2. Change status to "rejected"
3. Add rejection reason: "Test rejection - shoe damaged during processing"
4. Save changes
5. **📧 Check**: User receives "request rejected" email with reason
6. **📊 Record**: Status changed to: `rejected`

#### **Test 4.3: Inventory Returns After Rejection**
1. Go to public `/shoes` page
2. **🔍 Verify**: Rejected shoe reappears in inventory
3. **📊 Record**: Shoe count increased back to original
4. **✅ Expected**: Rejected shoe available for new requests

---

### **PHASE 5: EMAIL NOTIFICATION VERIFICATION**

#### **Test 5.1: Email Content Verification**
For each email received, verify:

**Request Confirmation Email:**
- ✅ Contains request ID
- ✅ Contains shoe details (brand, model, size)
- ✅ Contains shipping information
- ✅ Contains next steps information

**Request Approved Email:**
- ✅ Contains request ID
- ✅ Contains estimated processing time
- ✅ Contains contact information

**Request Shipped Email:**
- ✅ Contains request ID
- ✅ Contains tracking information
- ✅ Contains delivery instructions

**Request Rejected Email:**
- ✅ Contains request ID
- ✅ Contains rejection reason
- ✅ Contains alternative options

#### **Test 5.2: Email Timing Verification**
- **📊 Record**: Time between status change and email receipt
- **✅ Expected**: Emails arrive within 2-5 minutes of status change

---

### **PHASE 6: COMPLETE CYCLE VERIFICATION**

#### **Test 6.1: Multiple User Scenario**
1. Create 3 different users
2. Each user requests different shoes
3. Admin processes all 3 with different outcomes:
   - User 1: Approve → Ship
   - User 2: Reject
   - User 3: Leave as submitted
4. **🔍 Verify**: Each user sees correct status in account
5. **🔍 Verify**: Public inventory reflects all changes correctly

#### **Test 6.2: Admin Dashboard Summary**
1. Check admin dashboard shows:
   - ✅ Total requests by status
   - ✅ Recent activity
   - ✅ Pending actions needed

---

## 📊 **TESTING RESULTS TEMPLATE**

### **CRITICAL WORKFLOW RESULTS:**

| Test Phase | Component | Status | Notes |
|------------|-----------|--------|-------|
| User Request Creation | Registration | ✅/❌ | |
| User Request Creation | Shoe Selection | ✅/❌ | |
| User Request Creation | Checkout Process | ✅/❌ | |
| User Request Creation | Email Confirmation | ✅/❌ | |
| Admin Visibility | Request Appears | ✅/❌ | |
| Admin Processing | Status Changes | ✅/❌ | |
| Inventory Impact | Shoe Availability | ✅/❌ | |
| Email Notifications | All Status Emails | ✅/❌ | |
| User Account | Status Visibility | ✅/❌ | |
| Rejection Cycle | Inventory Return | ✅/❌ | |

### **INVENTORY TRACKING:**

| Action | Before Count | After Count | Expected Change |
|--------|--------------|-------------|-----------------|
| Initial State | ___ shoes | - | Baseline |
| After Approval | ___ shoes | ___ shoes | -1 |
| After Rejection | ___ shoes | ___ shoes | +1 |
| Final State | ___ shoes | - | Should match initial |

### **EMAIL VERIFICATION:**

| Email Type | Received | Time Delay | Content Complete |
|------------|----------|------------|------------------|
| Request Confirmation | ✅/❌ | ___ min | ✅/❌ |
| Request Approved | ✅/❌ | ___ min | ✅/❌ |
| Request Shipped | ✅/❌ | ___ min | ✅/❌ |
| Request Rejected | ✅/❌ | ___ min | ✅/❌ |

## 🎯 **SUCCESS CRITERIA**

### **MUST PASS (Critical):**
- ✅ Users can create requests successfully
- ✅ Admin can see all requests
- ✅ Admin status changes trigger user emails
- ✅ Inventory updates correctly with request status
- ✅ Rejected requests return shoes to inventory

### **SHOULD PASS (Important):**
- ✅ Email content includes all required information
- ✅ User account shows current request status
- ✅ Admin dashboard provides good overview
- ✅ Multiple concurrent requests handled correctly

### **NICE TO HAVE (Enhancement):**
- ✅ Email delivery within 2 minutes
- ✅ Real-time status updates without refresh
- ✅ Admin notes visible to users
- ✅ Request history maintained

## 🚨 **CRITICAL ISSUES TO WATCH FOR:**

1. **Inventory Sync Issues**: Shoes not updating availability
2. **Email Delivery Failures**: Status changes not triggering emails
3. **Status Inconsistencies**: User sees different status than admin
4. **Request Visibility**: Admin cannot see user requests
5. **Rejection Problems**: Rejected shoes not returning to inventory

## 📝 **TESTING NOTES:**

**Tester**: _______________  
**Date**: _______________  
**Environment**: `http://localhost:3000`  
**Admin Credentials**: `admin@newsteps.fit` / `Admin123!`

**Overall Assessment**: _______________  
**Critical Issues Found**: _______________  
**Ready for Production**: ✅/❌  

---

## 🎉 **COMPLETION CHECKLIST**

- [ ] All 6 test phases completed
- [ ] Results template filled out
- [ ] Critical issues documented
- [ ] Email verification complete
- [ ] Inventory tracking verified
- [ ] Multiple user scenarios tested
- [ ] Production readiness assessment made

**This manual test plan covers the exact interactive workflows you mentioned - the complete cycle from user request through admin processing to inventory updates and email notifications.**
