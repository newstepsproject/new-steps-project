# Admin Workflows Documentation

## Overview

This document provides comprehensive workflows for administrators managing the New Steps Project platform. These workflows ensure data integrity, efficient operations, and proper tracking of all donations and inventory.

## Table of Contents

1. [Donation Processing Workflows](#donation-processing-workflows)
2. [Inventory Management](#inventory-management)
3. [Request Processing](#request-processing)
4. [Reference ID Management](#reference-id-management)
5. [Data Schema Integrity](#data-schema-integrity)
6. [Common Troubleshooting](#common-troubleshooting)

---

## Donation Processing Workflows

### 1. Online Shoe Donation Processing

**Purpose**: Process donations submitted through the public website form.

**Workflow Steps**:

1. **Review Submission** (Admin Dashboard → Shoe Donations)
   - Check donation details and photos
   - Verify donor information is complete
   - Review donation description and item count

2. **Physical Inspection** (When shoes arrive)
   - Compare physical shoes to submitted photos
   - Assess actual condition vs. reported condition
   - Count and verify items

3. **Decision Making**
   ```
   ✅ APPROVE → Convert to inventory
   ❌ REJECT → Update status and notify donor
   🔄 PENDING → Request more information
   ```

4. **Status Updates**
   - **Submitted** → **Received** (when shoes physically arrive)
   - **Received** → **Processed** (when converted to inventory)
   - **Received** → **Cancelled** (if rejected)

5. **Inventory Conversion** (for approved donations)
   - Use "Convert to Inventory" button
   - Each shoe becomes individual inventory item
   - Automatic shoeId assignment (101, 102, 103...)
   - Donor information preserved in inventory records

### 2. Offline Shoe Donation Processing

**Purpose**: Process donations received through direct contact or physical drop-off.

**Workflow Steps**:

1. **Create Offline Donation** (Admin Dashboard → Shoe Donations → Add)
   - Select "Offline Donation" mode
   - Enter donor information (firstName/lastName required)
   - Email and phone are optional for offline donations
   - Add donation description

2. **Physical Processing**
   - Inspect and photograph shoes
   - Assess condition and usability
   - Count items

3. **Direct Inventory Addition**
   - Use "Add Shoes" (Admin Dashboard → Shoes → Add)
   - Enter detailed shoe information
   - Upload photos
   - Link to donation record via donor information

### 3. Money Donation Processing

**Purpose**: Process financial contributions submitted online.

**Workflow Steps**:

1. **Review Submission** (Admin Dashboard → Money Donations)
   - Check donation amount and donor information
   - Note special instructions or designations

2. **Check Processing**
   - Wait for physical check to arrive
   - Verify donation ID matches (DM-XXXX-YYYY format)
   - Confirm amount matches submission

3. **Status Updates**
   ```
   Submitted → Received → Processed
   ```

4. **Record Keeping**
   - Update status to "Received" when check arrives
   - Update to "Processed" when deposited
   - Send tax receipt to donor

---

## Inventory Management

### 1. Adding Individual Shoes

**Purpose**: Add shoes to inventory from approved donations or direct donations.

**Data Requirements**:
```
Required Fields:
- Brand, Model Name, Size
- Gender, Sport, Condition
- Color, Description
- Photos (minimum 1)

Optional Fields:
- Donor information (firstName/lastName)
- Special notes
- Acquisition source
```

**Workflow**:
1. Navigate to Admin Dashboard → Shoes → Add
2. Fill all required fields
3. Upload clear photos (front, side, sole)
4. Assign to appropriate categories
5. Save - automatic shoeId assignment

### 2. Inventory Status Management

**Shoe Status Flow**:
```
Available → Requested → Shipped → (End)
Available → Unavailable (damaged/lost)
```

**Status Definitions**:
- **Available**: Ready for requests
- **Requested**: Reserved for approved request
- **Shipped**: Sent to requestor
- **Unavailable**: Not available (damaged, lost, etc.)

### 3. Bulk Operations

**Converting Donations to Inventory**:
1. Go to donation details
2. Click "Convert to Inventory"
3. System creates individual shoe records
4. Preserves donor information
5. Updates donation status to "Processed"

---

## Request Processing

### 1. Online Request Processing

**Purpose**: Process shoe requests submitted through public checkout flow.

**Workflow Steps**:

1. **Initial Review** (Admin Dashboard → Requests)
   - Check request details and items
   - Verify shipping information (if applicable)
   - Confirm payment status for shipping fees

2. **Inventory Check**
   - Verify requested shoes are still available
   - Check condition and suitability
   - Confirm sizes match

3. **Decision Making**
   ```
   ✅ APPROVE → Reserve shoes and prepare shipping
   ❌ REJECT → Release shoes back to inventory, notify user
   ```

4. **Status Updates**
   - **Submitted** → **Approved** (when request is approved)
   - **Approved** → **Shipped** (when shoes are sent)
   - **Submitted** → **Rejected** (if request cannot be fulfilled)

5. **Shipping Process**
   - Print shipping labels (USPS format available)
   - Package shoes securely
   - Update status to "Shipped"
   - Send tracking information to user

### 2. Offline Request Processing

**Purpose**: Handle requests received through direct contact.

**Workflow Steps**:

1. **Create Offline Request** (Admin Dashboard → Requests → Add)
   - Enter requestor information
   - Select shoes from available inventory
   - Shipping information optional for pickup

2. **Processing**
   - Follow same approval workflow
   - Coordinate pickup or shipping arrangements
   - Update status accordingly

---

## Reference ID Management

### Understanding Reference ID Patterns

**Current Unified System**:
```
Donations:      DON-YYYYMMDD-XXXX
Money Donations: DM-XXXX-YYYY (name-based)
Requests:       REQ-YYYYMMDD-XXXX
Orders:         ORD-YYYYMMDD-XXXX
Volunteers:     VOL-YYYYMMDD-XXXX
Partnerships:   PAR-YYYYMMDD-XXXX
Contacts:       CON-YYYYMMDD-XXXX
```

**Legacy ID Migration**:
- Old formats are automatically migrated
- Original IDs preserved for reference
- All new records use unified system

**Best Practices**:
- Always use reference IDs in communications
- Include reference IDs in email correspondence
- Use reference IDs for tracking and support

---

## Data Schema Integrity

### 1. Online vs Offline Data Patterns

**Online Donations/Requests**:
```
- userId: MongoDB ObjectId (authenticated user)
- donorInfo: null or minimal (data comes from User model)
- isOffline: false
- Complete validation required
```

**Offline Donations/Requests**:
```
- userId: null
- donorInfo: Complete information (firstName, lastName, email, phone, address)
- isOffline: true
- Flexible validation for admin operations
```

### 2. Required vs Optional Fields

**Donation Model**:
```
Required: donationId, donationType, status
Conditional: userId OR donorInfo (not both)
Optional: donorInfo.email, donorInfo.phone (for offline)
```

**ShoeRequest Model**:
```
Required: requestId, items, status
Conditional: userId OR requestorInfo (not both)
Optional: shippingInfo (for offline/pickup requests)
```

### 3. Image Storage Strategy

**By Category**:
```
Shoe Inventory: S3 + CloudFront (permanent, high-traffic)
Donation Photos: Data URLs → S3 (temporary → permanent)
User Profiles: S3 + CloudFront (permanent, moderate traffic)
Static Content: Next.js static assets (build-time optimization)
```

**Migration Pattern**:
1. Form submissions use data URLs for previews
2. Admin approval converts to S3 storage
3. Inventory items always use S3 + CloudFront

---

## Common Troubleshooting

### 1. Validation Errors

**"ShippingInfo is required"**:
- Check if request is marked as offline
- Offline requests don't require shipping info
- Ensure isOffline flag is set correctly

**"DonorInfo validation failed"**:
- Verify firstName and lastName are provided
- Check email format if provided
- Ensure address is complete for online donations

### 2. Reference ID Issues

**Duplicate Reference IDs**:
- Run migration script to standardize formats
- Check for manual ID overrides
- Verify Counter model is working

**Invalid Reference ID Format**:
- Use validateReferenceId() function
- Check entity type matches ID format
- Migrate legacy IDs using migration script

### 3. Image Upload Problems

**Large File Sizes**:
- Check file size limits (2MB for inventory, 1MB for donations)
- Verify compression settings
- Ensure S3 bucket has sufficient space

**Failed S3 Uploads**:
- Check AWS credentials and permissions
- Verify S3 bucket configuration
- Test CloudFront distribution

### 4. Status Workflow Issues

**Stuck in "Submitted" Status**:
- Check if admin action is required
- Verify workflow permissions
- Look for validation errors in logs

**Inventory Not Updating**:
- Check if "Convert to Inventory" was used
- Verify shoe status transitions
- Ensure Counter model is generating IDs

---

## Best Practices Summary

### For Admins:

1. **Always use reference IDs** in communications and tracking
2. **Complete physical verification** before approving donations
3. **Update statuses promptly** to maintain data accuracy
4. **Use offline modes** for direct donations and requests
5. **Verify shipping information** before marking requests as shipped
6. **Maintain photo quality** for inventory items
7. **Check inventory availability** before approving requests

### For Data Integrity:

1. **Follow online vs offline patterns** consistently
2. **Use unified reference ID system** for all new records
3. **Migrate legacy data** using provided scripts
4. **Validate required fields** based on donation/request type
5. **Preserve donor information** when converting to inventory
6. **Use appropriate image storage** based on category
7. **Monitor status workflows** for proper transitions

### For System Maintenance:

1. **Run migration scripts** when updating ID formats
2. **Monitor S3 storage usage** and costs
3. **Check reference ID uniqueness** regularly
4. **Validate data schema compliance** periodically
5. **Update documentation** when workflows change
6. **Test admin workflows** after system updates
7. **Backup data** before major migrations

---

*This documentation is maintained as part of the New Steps Project admin system. Last updated: January 31, 2025* 