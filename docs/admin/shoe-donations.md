# Shoe Donation Administration

This document explains how to manage shoe donations in the New Steps admin interface.

## Adding Shoes to Inventory

The "Add Shoes" feature allows administrators to add one or more pairs of shoes to the inventory. Every shoe in inventory must be associated with a donation (either online or offline).

### Unified Donation Flow

All inventory additions use the same workflow:

1. Select donation source (online or offline)
2. Enter donor information
3. Add shoe information
4. Submit the form

### Online vs Offline Donations

#### Online Donations
- Require a valid donation reference number (format: DS-XXXX-YYYY)
- Donor information is auto-filled when looking up the reference number
- Donor name and email are required
- Reference must be for a donation that has not already been processed or cancelled

#### Offline Donations
- No reference number required
- Only donor name is mandatory
- Email and phone are optional

### Multiple Shoe Entries

The form now supports adding multiple shoes in a single submission:

1. **Shared Properties**: Enter common information that applies to all shoes (brand, model, size, etc.)
2. **Individual Entries**: Each shoe entry has its own:
   - Quantity field (required)
   - Notes field (optional)
   
3. **Adding/Removing Entries**:
   - Click "Add Another Shoe" to add a new entry
   - Click "Remove" to delete an entry (first entry cannot be removed)
   - Up to 10 shoe entries can be added in a single form

### After Submission

After successful submission:
- All shoes are added to inventory
- A donation record is created or updated
- The system displays a table of added shoes with their inventory IDs
- These IDs can be used for physical tagging of shoes

## Tips and Best Practices

- **For Multiple Similar Shoes**: If you have multiple shoes of the same type but in different sizes, add them as separate entries in the same form.
- **For Very Different Shoes**: If you have shoes of completely different types, consider submitting them as separate donations.
- **Reference Lookup**: Always use the reference lookup for online donations to ensure accuracy.
- **Images**: Upload clear images of all shoes for better inventory management.
- **Notes**: Use the notes field to record any specific details about individual shoes that differ from the shared properties. 