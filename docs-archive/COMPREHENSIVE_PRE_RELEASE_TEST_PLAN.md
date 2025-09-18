# 🧪 COMPREHENSIVE PRE-RELEASE TEST PLAN
## New Steps Project - Production Readiness Validation

### 📋 **TEST OVERVIEW**
- **Scope**: Complete end-to-end testing of all core functions
- **Environments**: localhost dev → production
- **Coverage**: API level + Browser-based user interactions
- **Roles**: Visitor, Registered User, Admin
- **Workflows**: Complete lifecycles (shoe, user, donation, request)

---

## 🎯 **PHASE 1: API LEVEL TESTING**

### **1.1 Authentication APIs**
```bash
# User Registration
POST /api/auth/register
- Valid email/password registration
- Google OAuth registration
- Email verification flow
- Duplicate email handling
- Password complexity validation

# User Login
POST /api/auth/signin
- Email/password login
- Google OAuth login
- Invalid credentials handling
- Session management

# Password Reset
POST /api/auth/reset-password
- Password reset request
- Token validation
- New password setting
```

### **1.2 Donation APIs**
```bash
# Shoe Donations
POST /api/donations
- Anonymous shoe donation
- Authenticated user donation
- Required field validation
- Reference ID generation (DS-XXXX-YYYY)
- Email confirmation trigger

# Money Donations  
POST /api/donations/money
- Anonymous money donation
- Authenticated user donation
- Reference ID generation (DM-XXXX-YYYY)
- Amount validation
```

### **1.3 Inventory APIs**
```bash
# Public Shoe Listing
GET /api/shoes
- Available shoes only
- Search/filter functionality
- Pagination
- Sort by criteria

# Individual Shoe Details
GET /api/shoes/[id]
- Valid shoe ID (MongoDB ObjectId + numeric shoeId)
- Invalid ID handling
- Inventory count validation
```

### **1.4 Request APIs**
```bash
# Shoe Requests
POST /api/requests
- Authentication required
- Cart validation (max 2 shoes)
- Inventory availability check
- Shipping address validation
- Reference ID generation (REQ-XXXX-YYYY)
- Email confirmation trigger
```

### **1.5 Admin APIs**
```bash
# Admin Authentication
- Admin role verification
- Unauthorized access blocking

# Inventory Management
POST /api/admin/shoes
- Add shoe to inventory
- Online/offline donation linking
- Unique shoe ID generation (101, 102, 103...)
- Image upload handling

# Donation Management
PATCH /api/admin/shoe-donations
- Status updates (submitted → received → processed)
- Reference ID lookup
- Email notifications

# Request Management  
PATCH /api/admin/requests
- Status updates (submitted → approved → shipped → rejected)
- Shipping label generation
- Inventory updates on rejection
- Email notifications
```

---

## 🌐 **PHASE 2: BROWSER-BASED USER WORKFLOWS**

### **2.1 VISITOR WORKFLOWS**

#### **2.1.1 Browse & Explore**
- [ ] **Homepage Navigation**
  - Load homepage (/)
  - Verify hero image and mission statement
  - Test navigation menu
  - Check mobile responsiveness

- [ ] **About Page**
  - Load /about
  - Verify team member photos and bios
  - Check "our story" timeline
  - Verify contact information

- [ ] **Browse Shoes**
  - Load /shoes (no login required)
  - Test search and filter functionality
  - Test pagination
  - View individual shoe details
  - Verify shoe IDs are displayed

#### **2.1.2 Donation Workflows**
- [ ] **Shoe Donation (Anonymous)**
  - Navigate to /donate/shoes
  - Fill complete donation form
  - Submit without login
  - Verify reference ID generation (DS-XXXX-YYYY)
  - Check email confirmation sent

- [ ] **Money Donation (Anonymous)**
  - Navigate to /get-involved
  - Fill money donation form
  - Submit without login
  - Verify reference ID generation (DM-XXXX-YYYY)
  - Check email confirmation sent

- [ ] **Contact & Get Involved**
  - Submit contact form
  - Submit volunteer interest form
  - Submit partnership inquiry
  - Verify email confirmations

### **2.2 REGISTERED USER WORKFLOWS**

#### **2.2.1 Registration & Authentication**
- [ ] **Email Registration**
  - Register with email/password
  - Verify email confirmation sent
  - Complete email verification
  - Login with verified account

- [ ] **Google OAuth Registration**
  - Register with Google OAuth
  - Verify account creation
  - Test subsequent Google login

- [ ] **Password Management**
  - Request password reset
  - Verify reset email sent
  - Complete password reset
  - Login with new password

#### **2.2.2 Shoe Request Workflow**
- [ ] **Browse & Add to Cart**
  - Login as registered user
  - Browse available shoes
  - Add shoes to cart (test 2-shoe limit)
  - View cart contents

- [ ] **Checkout Process**
  - Navigate to /checkout
  - Fill shipping information
  - Choose shipping method (Standard $5 / Local Pickup)
  - Agree to shipping payment terms
  - Submit request
  - Verify reference ID generation (REQ-XXXX-YYYY)
  - Check confirmation email

- [ ] **Account Management**
  - View /account page
  - Check request history
  - Update profile information
  - View donation history (if any)

### **2.3 ADMIN WORKFLOWS**

#### **2.3.1 Admin Authentication**
- [ ] **Admin Login**
  - Login as admin@newsteps.fit
  - Verify admin dashboard access
  - Test admin navigation

#### **2.3.2 Donation Management**
- [ ] **Process Shoe Donations**
  - View /admin/shoe-donations
  - Find submitted donations
  - Update status: submitted → received → processed
  - Add admin notes
  - Verify email notifications sent

- [ ] **Process Money Donations**
  - View /admin/money-donations
  - Update donation statuses
  - Add admin notes
  - Verify status changes

#### **2.3.3 Inventory Management**
- [ ] **Add Shoes to Inventory**
  - Navigate to /admin/shoes/add
  - Test online donation linking (by reference ID)
  - Test offline donation entry
  - Upload shoe images
  - Verify unique shoe ID generation (101, 102, 103...)
  - Verify shoe appears in public /shoes

- [ ] **Manage Inventory**
  - View /admin/shoes
  - Search and filter shoes
  - Edit shoe details
  - Update shoe status
  - Delete shoes (test inventory updates)

#### **2.3.4 Request Management**
- [ ] **Process Shoe Requests**
  - View /admin/requests
  - Find submitted requests
  - Update status: submitted → approved
  - Generate shipping labels
  - Update status: approved → shipped
  - Verify email notifications sent
  - Test rejection workflow with inventory restoration

#### **2.3.5 User Management**
- [ ] **Manage Users**
  - View /admin/users
  - Promote user to admin role
  - Verify built-in admin user exists
  - Test user search and filtering

#### **2.3.6 Settings & Configuration**
- [ ] **Project Settings**
  - Update project officers
  - Upload team photos
  - Configure shipping fees ($5 default)
  - Update office address
  - Test social media links

#### **2.3.7 Admin Settings Validation**
- [ ] **Configurable Parameters Testing**
  - Change shipping fee in admin settings
  - Verify new fee appears in checkout
  - Change max shoes per request (2-shoe limit)
  - Verify cart enforces new limit
  - Update project office address
  - Verify address appears in shipping labels
  - Modify team member info
  - Verify changes appear on /about page
  - Test all configurable settings impact on public site

---

## 🔄 **PHASE 3: END-TO-END LIFECYCLE TESTING**

### **3.1 Complete Shoe Lifecycle**
```
Donation → Inventory → Request → Fulfillment
```

1. **Donation Phase**
   - [ ] User submits shoe donation (DS-SARA-1234)
   - [ ] Admin receives donation notification
   - [ ] Admin updates status to "received"
   - [ ] Admin updates status to "processed"

2. **Inventory Phase**
   - [ ] Admin adds donated shoes to inventory
   - [ ] Links to donation reference DS-SARA-1234
   - [ ] Shoes get unique IDs (101, 102)
   - [ ] Shoes appear on public /shoes page

3. **Request Phase**
   - [ ] User browses and finds shoes
   - [ ] User adds shoes to cart
   - [ ] User completes checkout (REQ-USER-5678)
   - [ ] Inventory count decreases
   - [ ] Admin receives request notification

4. **Fulfillment Phase**
   - [ ] Admin approves request
   - [ ] Admin generates shipping label
   - [ ] Admin marks as shipped
   - [ ] User receives shipping notification
   - [ ] Inventory updated to "shipped"

### **3.2 Complete User Lifecycle**
```
Visitor → Registration → Donation → Request → Account Management
```

1. **Discovery Phase**
   - [ ] Visit homepage as anonymous user
   - [ ] Browse shoes without account
   - [ ] Submit shoe donation anonymously

2. **Registration Phase**
   - [ ] Register for account (email or Google)
   - [ ] Verify email if needed
   - [ ] Complete profile

3. **Engagement Phase**
   - [ ] Make authenticated donation
   - [ ] Request shoes with shipping
   - [ ] View account history

4. **Admin Promotion**
   - [ ] Admin promotes user to admin role
   - [ ] User gains admin access
   - [ ] User can perform admin functions

---

## 📊 **PHASE 4: DATA INTEGRITY & EDGE CASES**

### **4.1 Data Validation**
- [ ] **Reference ID Uniqueness**
  - Generate multiple donations/requests
  - Verify no duplicate reference IDs
  - Test reference ID format consistency

- [ ] **Inventory Consistency**
  - Request shoes and verify inventory decreases
  - Reject requests and verify inventory restores
  - Test concurrent requests for same shoe

- [ ] **Email System**
  - Verify all email templates work
  - Test email delivery to different providers
  - Check email content accuracy

### **4.2 Email Notification System Testing**
- [ ] **Complete Email Flow Validation**
  - Shoe donation confirmation emails (DS-XXXX-YYYY)
  - Money donation confirmation emails (DM-XXXX-YYYY)
  - Shoe request confirmation emails (REQ-XXXX-YYYY)
  - Request status change emails (approved, shipped, rejected)
  - Donation status change emails (received, processed)
  - Volunteer/partnership inquiry confirmations
  - Password reset emails
  - Email verification emails
  - Admin notification emails

- [ ] **Email Content Verification**
  - Correct reference IDs in emails
  - Proper shoe details (ID, brand, sport, size)
  - Accurate status information
  - Professional formatting
  - Working links and contact info

### **4.3 Edge Cases**
- [ ] **Cart Limitations**
  - Try to add more than 2 shoes
  - Test cart persistence across sessions
  - Test cart with unavailable shoes

- [ ] **Authentication Edge Cases**
  - Expired sessions
  - Invalid tokens
  - Concurrent logins

- [ ] **Admin Operations**
  - Delete shoes with pending requests
  - Update donation status out of sequence
  - Process requests without shipping info

---

## 🚀 **PHASE 5: PRODUCTION ENVIRONMENT TESTING**

### **5.1 Production Deployment Verification**
- [ ] **Environment Setup**
  - Verify production database connection
  - Test S3 image storage
  - Verify Gmail SMTP configuration
  - Check Google OAuth production settings

- [ ] **Performance Testing**
  - Page load times on mobile
  - Image loading from S3
  - Database query performance
  - Concurrent user handling

### **5.2 Production Workflow Testing**
- [ ] **Repeat Core Workflows**
  - Complete shoe lifecycle on production
  - Test all user registration flows
  - Verify admin functions work
  - Test email delivery in production

### **5.3 Production Data Management**
- [ ] **Sample Data Creation**
  - Create test users
  - Add sample donations
  - Create sample inventory
  - Generate test requests

- [ ] **Data Cleanup Preparation**
  - Document all test data created
  - Prepare cleanup scripts
  - Verify admin user preservation

---

## 📋 **TEST EXECUTION CHECKLIST**

### **Pre-Test Setup**
- [ ] Backup current databases (dev & prod)
- [ ] Verify all environment variables
- [ ] Check email service configuration
- [ ] Prepare test data sets

### **Test Execution Order**
1. [ ] **Phase 1**: API Level Testing (localhost)
2. [ ] **Phase 2**: Browser Workflows (localhost)
3. [ ] **Phase 3**: End-to-End Lifecycles (localhost)
4. [ ] **Phase 4**: Data Integrity & Email Testing (localhost)
5. [ ] **Complete localhost validation** - All tests must pass before production
6. [ ] **Phase 5**: Production Testing (only after localhost success)
7. [ ] **Final Cleanup**: Production data cleanup

### **Critical Testing Rules**
- [ ] **Fix-First Policy**: When any issue is found, fix immediately on localhost and re-test before continuing
- [ ] **No Production Testing**: Until ALL localhost tests pass completely
- [ ] **Email Verification**: Every email notification must be tested and verified working
- [ ] **Admin Settings Impact**: Every configurable setting must be tested for public site impact

### **Success Criteria**
- [ ] All API endpoints return expected responses
- [ ] All user workflows complete successfully
- [ ] All email notifications are sent and received
- [ ] All admin functions work correctly
- [ ] No console errors or warnings
- [ ] Mobile responsiveness verified
- [ ] Performance meets expectations

### **Post-Test Actions**
- [ ] Document any issues found and fixed
- [ ] Clean production database of test data
- [ ] Preserve admin user (admin@newsteps.fit)
- [ ] Update production readiness status
- [ ] Create final deployment checklist

---

## 🎯 **AUTOMATED vs MANUAL TESTING**

### **Automated Testing (API & Basic Workflows)**
- API endpoint testing
- Database operations
- Basic form submissions
- Authentication flows

### **Manual Testing Required**
- Image upload functionality
- Email delivery verification
- Mobile device testing
- Cross-browser compatibility
- Payment flow testing (manual shipping coordination)
- Admin UI interactions
- Complex multi-step workflows

---

This comprehensive test plan ensures all core functions are thoroughly validated before production release. Each phase builds upon the previous one, creating confidence in the platform's reliability and user experience.
