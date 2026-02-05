/**
 * Script to make a user an admin
 * Usage: node scripts/make-user-admin.js <email>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import User model
const { User } = require('../dist/models/User');

async function makeUserAdmin(email) {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Find user by email
    console.log(`Looking for user with email: ${email}...`);
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`✗ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.name} (ID: ${user._id})`);
    console.log(`  Current role: ${user.role}\n`);

    // Check if already admin
    if (user.role === 'admin') {
      console.log('✓ User is already an admin!');
      process.exit(0);
    }

    // Update role to admin
    user.role = 'admin';
    await user.save();

    console.log('✓ Successfully updated user role to admin!');
    console.log(`\n✓ ${user.name} (${user.email}) is now an admin.\n`);

    // Close connection
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/make-user-admin.js <email>');
  console.error('Example: node scripts/make-user-admin.js user@example.com');
  process.exit(1);
}

makeUserAdmin(email);

