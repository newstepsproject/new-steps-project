# UI Testing Guide for Shoe Inventory System

This document provides instructions for running UI tests on the shoe inventory system implementation. The UI tests verify that the web interface correctly implements the inventory logic requirements.

## Prerequisites

Before running the UI tests, ensure you have:

1. Node.js v16 or higher installed
2. MongoDB running and configured in your `.env` file
3. The application server running on http://localhost:3000
4. Admin user credentials available (for testing admin functionality)

## Setting Up Test Data

To set up test data for UI testing, run:

```bash
node scripts/setup-test-data.js
```

This will create several test donations with different statuses that can be used for UI testing.

## Running UI Tests

There are several options for running the UI tests:

### Option 1: Run UI Tests Only

```bash
node scripts/test-inventory-ui.js
```

This will run only the UI tests on the web interface.

### Option 2: Run All Tests (API and UI)

```bash
node scripts/run-all-tests.js
```

This comprehensive test runner will:
1. Set up test data
2. Run the API tests
3. Run the UI tests

The UI tests are marked as optional, so the test suite will not fail if the UI tests fail but the API tests pass.

## Configuration

By default, the UI tests will:
- Connect to http://localhost:3000
- Use admin@example.com / password123 as admin credentials

You can customize these settings by setting environment variables:

```bash
BASE_URL=https://your-site.example.com TEST_ADMIN_EMAIL=your-admin@example.com TEST_ADMIN_PASSWORD=your-password node scripts/test-inventory-ui.js
```

Or edit the configuration in the test scripts directly.

## Understanding the UI Tests

The UI tests verify the following requirements:

1. **Admin UI Changes** (Requirements #1-4)
   - Verify "Add Donation" button is removed from admin/shoe-donations
   - Verify "Add New Shoe" button still exists in admin/shoes
   - Verify source option exists in form
   - Verify default source is "offline"

2. **Donation Reference Format** (Requirement #9)
   - Verify reference numbers follow the DS-XXXX-YYYY format

3. **Reference Lookup** (Requirement #5)
   - Verify lookup form exists and functions

4. **Donation Processing** (Requirements #6, #7, #8)
   - Verify status remains until fully processed
   - Verify status changes to processed when all shoes are added
   - Verify correct statuses are used

5. **Inventory Integration** (Requirement #10)
   - Verify reference numbers are displayed in inventory

## Troubleshooting

If the UI tests fail, check:

1. Is the application server running?
2. Are the admin credentials correct?
3. Is test data correctly set up?
4. Is Puppeteer installed correctly?

For more detailed logs, you can modify the scripts to set `headless: false` in the Puppeteer configuration to see the browser in action during testing. 