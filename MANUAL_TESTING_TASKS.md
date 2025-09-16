# Manual Testing Tasks - Localhost Validation

## 🎯 **CRITICAL MANUAL TESTS REQUIRED**

### **Task 1: Admin Login & Shoes Add Form Testing** (5-10 minutes)

#### **Prerequisites:**
- ✅ Admin user created: `admin@newsteps.fit` / `Admin123!`
- ✅ Admin shoes add form bug fixed (API endpoint corrected)
- ✅ Development server running: `STORAGE_PROVIDER=local npm run dev`

#### **Test Steps:**
1. **Admin Login Test**
   ```
   1. Open browser → http://localhost:3000/admin
   2. Should redirect to login page
   3. Enter credentials:
      - Email: admin@newsteps.fit
      - Password: Admin123!
   4. Click "Sign in"
   5. ✅ VERIFY: Redirected to admin dashboard
   ```

2. **Admin Shoes Add Form Test**
   ```
   1. Navigate to: http://localhost:3000/admin/shoes/add
   2. Fill donor information:
      - First Name: Test
      - Last Name: Admin
   3. Fill shoe information:
      - Brand: Nike (select from dropdown)
      - Model Name: Air Max Test
      - Gender: Men (select from dropdown)
      - Size: 10.5
      - Color: Black/White
      - Sport: Running (select from dropdown)
      - Condition: Good (select from dropdown)
      - Description: Test shoe added via fixed admin form
   4. Click submit button
   5. ✅ VERIFY: Success message appears
   6. ✅ VERIFY: Shoe appears in inventory with ID (e.g., 101, 102)
   ```

#### **Expected Results:**
- ✅ Admin login successful
- ✅ Form submits without "database operation failed" error
- ✅ Success toast message appears
- ✅ Shoe added to inventory with auto-generated ID

#### **If Tests Fail:**
- Check browser console for JavaScript errors
- Check terminal for server-side errors
- Verify admin user exists: `node tools/create_admin_user.js`

---

### **Task 2: High-Volume Test Data Import** (10-15 minutes)

#### **Prerequisites:**
- ✅ Test data files generated:
  - `test_data_shoes_20250916_114710.json` (100 shoes)
  - `test_data_donations_20250916_114710.json` (50 donations)
  - `test_data_money_donations_20250916_114710.json` (30 money donations)

#### **Import Process:**
1. **Via Admin Interface** (Recommended)
   ```
   1. Login as admin
   2. Navigate to each admin section:
      - /admin/shoes/add (add shoes one by one)
      - /admin/shoe-donations/add (add donations)
      - /admin/money-donations/add (add money donations)
   3. Use data from JSON files as reference
   ```

2. **Via Database Script** (Alternative)
   ```
   Create import script if manual entry too time-consuming:
   node tools/import_test_data.js
   ```

#### **Expected Results:**
- ✅ 100+ shoes in inventory
- ✅ 50+ shoe donations
- ✅ 30+ money donations
- ✅ Pagination controls appear on admin pages

---

### **Task 3: Pagination Testing** (5 minutes)

#### **Prerequisites:**
- ✅ High-volume test data imported (100+ items per category)

#### **Test Steps:**
1. **Admin Shoes Pagination**
   ```
   1. Navigate to: http://localhost:3000/admin/shoes
   2. ✅ VERIFY: Pagination controls visible
   3. ✅ VERIFY: Page navigation works (Next/Previous)
   4. ✅ VERIFY: Items per page limit working
   ```

2. **Admin Donations Pagination**
   ```
   1. Navigate to: http://localhost:3000/admin/shoe-donations
   2. ✅ VERIFY: Pagination controls visible
   3. ✅ VERIFY: Page navigation works
   ```

3. **Public Shoes Pagination**
   ```
   1. Navigate to: http://localhost:3000/shoes
   2. ✅ VERIFY: Pagination or infinite scroll works
   3. ✅ VERIFY: Performance acceptable with 100+ shoes
   ```

#### **Expected Results:**
- ✅ Pagination controls appear when >50 items
- ✅ Page navigation works smoothly
- ✅ Search and filtering work with large datasets
- ✅ Performance remains acceptable

---

## 📋 **TESTING CHECKLIST**

### **Before Production Deployment:**
- [ ] Task 1: Admin login and shoes add form working
- [ ] Task 2: High-volume test data imported
- [ ] Task 3: Pagination working with large datasets
- [ ] Visual validation: Red asterisks on required fields
- [ ] No console errors in browser
- [ ] No server errors in terminal

### **After Production Deployment:**
- [ ] Repeat all tests on production environment
- [ ] Verify production admin user exists
- [ ] Test production database operations
- [ ] Verify production pagination performance

---

## 🚨 **CRITICAL ISSUES TO WATCH FOR**

1. **"Database operation failed"** - Should be fixed with API endpoint correction
2. **Admin login failures** - Verify admin user exists with correct password
3. **Form field validation errors** - Check enum values (condition: 'good' not 'GOOD')
4. **Pagination not appearing** - Need 50+ items to trigger pagination
5. **Performance issues** - Monitor with 100+ items loaded

---

## 📞 **SUPPORT INFORMATION**

- **Admin Credentials**: `admin@newsteps.fit` / `Admin123!`
- **Database Reset**: `node tools/create_admin_user.js`
- **Test Data Location**: `test_data_*_20250916_114710.json` files
- **Development Server**: `STORAGE_PROVIDER=local npm run dev`
- **Production URL**: `https://newsteps.fit`

---

**Status**: Ready for manual testing
**Estimated Time**: 20-30 minutes total
**Priority**: High - Required before production deployment
