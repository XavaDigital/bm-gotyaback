/**
 * Script to clean up (delete) all test campaigns
 * 
 * This script removes all campaigns that start with "test -" from the database,
 * along with their associated layouts.
 * 
 * Usage:
 *   node backend/scripts/cleanup-test-campaigns.js [--confirm]
 * 
 * Example:
 *   node backend/scripts/cleanup-test-campaigns.js --confirm
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const { Campaign } = require('../dist/models/Campaign');
const { ShirtLayout } = require('../dist/models/ShirtLayout');

// Main function
const main = async () => {
    try {
        // Check for confirmation flag
        const confirmed = process.argv.includes('--confirm');
        
        if (!confirmed) {
            console.log('⚠️  WARNING: This will delete all test campaigns!');
            console.log('\nThis script will remove all campaigns with titles starting with "test -"');
            console.log('and their associated layouts from the database.\n');
            console.log('To proceed, run the script with the --confirm flag:');
            console.log('  node backend/scripts/cleanup-test-campaigns.js --confirm\n');
            process.exit(0);
        }

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/fundraising-platform';
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB\n');

        // Find all test campaigns
        console.log('Finding test campaigns...');
        const testCampaigns = await Campaign.find({ 
            title: { $regex: /^test - /i } 
        });

        if (testCampaigns.length === 0) {
            console.log('No test campaigns found.');
            await mongoose.connection.close();
            return;
        }

        console.log(`Found ${testCampaigns.length} test campaigns:\n`);
        testCampaigns.forEach((campaign, index) => {
            console.log(`  ${index + 1}. ${campaign.title} (ID: ${campaign._id})`);
        });

        // Get campaign IDs
        const campaignIds = testCampaigns.map(c => c._id);

        // Delete associated layouts
        console.log('\nDeleting associated layouts...');
        const layoutResult = await ShirtLayout.deleteMany({ 
            campaignId: { $in: campaignIds } 
        });
        console.log(`✓ Deleted ${layoutResult.deletedCount} layouts`);

        // Delete campaigns
        console.log('\nDeleting campaigns...');
        const campaignResult = await Campaign.deleteMany({ 
            title: { $regex: /^test - /i } 
        });
        console.log(`✓ Deleted ${campaignResult.deletedCount} campaigns`);

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('Cleanup Summary:');
        console.log(`  Campaigns deleted: ${campaignResult.deletedCount}`);
        console.log(`  Layouts deleted: ${layoutResult.deletedCount}`);
        console.log('='.repeat(60) + '\n');

        // Close connection
        await mongoose.connection.close();
        console.log('✓ Database connection closed');
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
};

// Run the script
main();

