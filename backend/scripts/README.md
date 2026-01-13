# Backend Scripts

This directory contains utility and migration scripts for the fundraising platform.

## 📋 Available Scripts

### 🧪 Test Campaign Management

#### Create Test Campaigns
**File:** `create-test-campaigns.js`

Creates test campaigns with all combinations of campaign types and layout styles.

```bash
# Quick start
npm run build
node scripts/create-test-campaigns.js your-email@example.com
```

**Creates 12 campaigns:**
- 3 campaign types × 4 layout styles
- Naming: `test - {type} - {layout}`
- Example: `test - pay what you want - cloud`

📖 **Documentation:** See `QUICK_START.md` or `README_TEST_CAMPAIGNS.md`

---

#### Cleanup Test Campaigns
**File:** `cleanup-test-campaigns.js`

Removes all test campaigns and their layouts from the database.

```bash
# Preview what will be deleted
node scripts/cleanup-test-campaigns.js

# Actually delete (requires --confirm flag)
node scripts/cleanup-test-campaigns.js --confirm
```

**Safety features:**
- Requires `--confirm` flag to prevent accidents
- Shows preview of what will be deleted
- Only removes campaigns starting with "test -"

---

### 🔄 Database Migrations

#### Campaign Payment Settings Migration
**File:** `migrate-campaign-payment-settings.js`

Adds `enableStripePayments` field to existing campaigns.

```bash
# Conservative approach (recommended)
node scripts/migrate-campaign-payment-settings.js

# Preserve existing behavior
node scripts/migrate-campaign-payment-settings.js --preserve-behavior
```

📖 **Documentation:** See `README_MIGRATION.md`

---

## 🚀 Quick Reference

### Before Running Any Script

1. **Ensure MongoDB is running**
   ```bash
   # Check if MongoDB is accessible
   mongosh
   ```

2. **Build the backend** (for TypeScript scripts)
   ```bash
   cd backend
   npm run build
   ```

3. **Check your environment variables**
   ```bash
   # Make sure .env file exists with:
   # MONGODB_URI=mongodb://localhost:27017/fundraising-platform
   ```

### Common Tasks

**Create test data for development:**
```bash
node scripts/create-test-campaigns.js dev@example.com
```

**Clean up test data:**
```bash
node scripts/cleanup-test-campaigns.js --confirm
```

**Migrate database after schema changes:**
```bash
node scripts/migrate-campaign-payment-settings.js
```

---

## 📁 File Structure

```
backend/scripts/
├── README.md                              # This file
├── QUICK_START.md                         # Quick guide for test campaigns
├── README_TEST_CAMPAIGNS.md               # Detailed test campaign docs
├── README_MIGRATION.md                    # Migration documentation
├── create-test-campaigns.js               # Create test campaigns
├── cleanup-test-campaigns.js              # Remove test campaigns
└── migrate-campaign-payment-settings.js   # Payment settings migration
```

---

## ⚠️ Important Notes

### Test Campaign Scripts
- Test campaigns are identified by titles starting with `test -`
- Campaigns include proper pricing configs and layouts
- Safe to run multiple times (skips existing campaigns)
- Use cleanup script to remove all test data

### Migration Scripts
- **Always backup your database first!**
- Test on development/staging before production
- Read the specific migration README for details
- Some migrations are irreversible

### General Best Practices
- Run scripts from the `backend` directory
- Check script output for errors
- Keep backups before running migrations
- Test in development environment first

---

## 🆘 Troubleshooting

### "Cannot find module" error
```bash
# Make sure backend is built
cd backend
npm run build
```

### "Connection refused" error
```bash
# Make sure MongoDB is running
# Check MONGODB_URI in .env
```

### "User not found" error
```bash
# For create-test-campaigns.js:
# Make sure the user exists (register through the app)
```

### Script hangs or doesn't exit
```bash
# Press Ctrl+C to force exit
# Check MongoDB connection
# Check for syntax errors in script
```

---

## 📝 Creating New Scripts

When creating new scripts:

1. **Use the existing patterns:**
   - Import models from `../dist/models/`
   - Load environment with `dotenv`
   - Connect to MongoDB properly
   - Close connection when done

2. **Add error handling:**
   - Try/catch blocks
   - Meaningful error messages
   - Proper exit codes

3. **Document your script:**
   - Add header comment with usage
   - Update this README
   - Create detailed docs if needed

4. **Example template:**
   ```javascript
   const mongoose = require('mongoose');
   const path = require('path');
   require('dotenv').config({ path: path.join(__dirname, '../.env') });
   
   const main = async () => {
       try {
           await mongoose.connect(process.env.MONGODB_URI);
           // Your code here
           await mongoose.connection.close();
       } catch (error) {
           console.error('Error:', error);
           process.exit(1);
       }
   };
   
   main();
   ```

---

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Node.js Documentation](https://nodejs.org/docs/)

