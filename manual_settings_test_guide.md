# Manual Admin Settings Testing Guide

## 🔍 **Bugs Found So Far**
1. ✅ **Admin Settings API Protection**: Working correctly (redirects to login)
2. ✅ **Public Settings Integration**: Working on all public pages
3. ⚠️ **Authentication Issue**: Need to test admin login manually

## 📋 **Manual Testing Steps**

### Step 1: Admin Login Test
1. Open browser to: `http://localhost:3000/admin`
2. Should redirect to: `http://localhost:3000/login?callbackUrl=%2Fadmin`
3. Login with: `admin@newsteps.fit` / `Admin123!`
4. Should redirect to admin dashboard

### Step 2: Admin Settings Page Test
1. Navigate to: `http://localhost:3000/admin/settings`
2. Check all 5 tabs load:
   - **General**: Project info, contact details
   - **Team**: Project officers/staff
   - **Story**: Timeline/history
   - **Social**: Social media links
   - **System**: Technical settings

### Step 3: Settings Functionality Tests

#### **General Settings Tab**
- [ ] Project Email field
- [ ] Project Phone field  
- [ ] Office Address fields (street, city, state, zip, country)
- [ ] Save button works
- [ ] Changes reflect on public pages

#### **System Settings Tab**
- [ ] Shipping Fee field (should be $5 default)
- [ ] Max Shoes Per Request (should be 2 default)
- [ ] Save button works
- [ ] Changes reflect in checkout process

#### **Team Settings Tab**
- [ ] Add new team member
- [ ] Edit existing team member
- [ ] Remove team member (except founder)
- [ ] Photo upload works
- [ ] Changes reflect on About page

#### **Story Settings Tab**
- [ ] Add timeline item
- [ ] Edit timeline item
- [ ] Remove timeline item
- [ ] Reorder timeline items
- [ ] Changes reflect on About page

#### **Social Settings Tab**
- [ ] Instagram URL field
- [ ] Facebook URL field
- [ ] Twitter URL field
- [ ] LinkedIn URL field
- [ ] YouTube URL field
- [ ] Changes reflect on public pages

### Step 4: Public Page Impact Tests

After making changes in admin settings, verify they appear on:

1. **Homepage** (`http://localhost:3000/`)
   - [ ] Contact email in footer
   - [ ] Phone number in footer
   - [ ] Social media links
   - [ ] Address information

2. **About Page** (`http://localhost:3000/about`)
   - [ ] Team members section
   - [ ] Our story timeline
   - [ ] Contact information
   - [ ] Office address

3. **Contact Page** (`http://localhost:3000/contact`)
   - [ ] Contact email
   - [ ] Phone number
   - [ ] Office address
   - [ ] Social media links

4. **Checkout Page** (`http://localhost:3000/checkout`)
   - [ ] Shipping fee amount
   - [ ] Max shoes per request validation

### Step 5: Settings Validation Tests

Try to save invalid data and verify proper error handling:

1. **Invalid Email Formats**
   - [ ] "invalid-email" should be rejected
   - [ ] Empty email should be handled properly

2. **Invalid Numeric Values**
   - [ ] Negative shipping fee should be rejected
   - [ ] Zero max shoes should be rejected

3. **Required Fields**
   - [ ] Empty address fields should be rejected
   - [ ] Empty team member names should be rejected

### Step 6: Settings Persistence Tests

1. **Save and Reload**
   - [ ] Make changes and save
   - [ ] Refresh admin settings page
   - [ ] Verify changes are still there

2. **Cross-Session Persistence**
   - [ ] Make changes and save
   - [ ] Logout and login again
   - [ ] Verify changes persist

## 🐛 **Common Issues to Look For**

1. **UI/UX Issues**
   - [ ] Form fields not saving
   - [ ] Validation errors not showing
   - [ ] Loading states not working
   - [ ] Mobile responsiveness issues

2. **Data Issues**
   - [ ] Settings not persisting to database
   - [ ] Default values not loading
   - [ ] Null/undefined values causing errors

3. **Integration Issues**
   - [ ] Changes not reflecting on public pages
   - [ ] API endpoints returning stale data
   - [ ] Caching issues preventing updates

4. **Security Issues**
   - [ ] Unauthorized access to admin endpoints
   - [ ] XSS vulnerabilities in form inputs
   - [ ] CSRF protection working

## 📊 **Expected Results**

### **Default Settings Values**
```json
{
  "maxShoesPerRequest": 2,
  "shippingFee": 5,
  "projectEmail": "newstepsfit@gmail.com", 
  "projectPhone": "(916) 582-7090"
}
```

### **Default Office Address**
- Street: TBD
- City: Sacramento
- State: CA
- ZIP: 95814
- Country: USA

## 🔧 **If Issues Found**

Document each issue with:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Error messages (if any)**
5. **Browser console errors**
6. **Network request details**

## 📝 **Testing Checklist Summary**

- [ ] Admin login works
- [ ] All 5 settings tabs load
- [ ] General settings save and reflect on public pages
- [ ] System settings affect checkout behavior
- [ ] Team settings update About page
- [ ] Story settings update About page timeline
- [ ] Social settings update social links
- [ ] Validation prevents invalid data
- [ ] Settings persist across sessions
- [ ] No console errors during testing
