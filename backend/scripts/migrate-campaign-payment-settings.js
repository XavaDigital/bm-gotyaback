/**
 * Migration Script: Add enableStripePayments field to existing campaigns
 * 
 * This script adds the new `enableStripePayments` field to all existing campaigns.
 * 
 * Two migration strategies are available:
 * 1. Conservative (default): Set all campaigns to enableStripePayments: false
 *    - Safer default, campaign owners must explicitly enable Stripe
 * 2. Preserve behavior: Set to true only if Stripe is configured
 *    - Maintains current functionality for existing campaigns
 * 
 * Usage:
 *   node backend/scripts/migrate-campaign-payment-settings.js [--preserve-behavior]
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Get migration strategy from command line args
const preserveBehavior = process.argv.includes('--preserve-behavior');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fundraising-platform';

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const Campaign = mongoose.model('Campaign', new mongoose.Schema({}, { strict: false }));

        // Check if Stripe is configured
        const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
        console.log(`Stripe configured: ${stripeConfigured}`);

        // Determine the value for enableStripePayments
        let enableStripePayments;
        if (preserveBehavior) {
            enableStripePayments = stripeConfigured;
            console.log('\nUsing PRESERVE BEHAVIOR strategy');
            console.log(`Setting enableStripePayments to: ${enableStripePayments}`);
        } else {
            enableStripePayments = false;
            console.log('\nUsing CONSERVATIVE strategy');
            console.log('Setting enableStripePayments to: false');
        }

        // Count campaigns that need migration
        const campaignsToMigrate = await Campaign.countDocuments({
            enableStripePayments: { $exists: false }
        });

        console.log(`\nFound ${campaignsToMigrate} campaigns to migrate`);

        if (campaignsToMigrate === 0) {
            console.log('No campaigns need migration. Exiting.');
            await mongoose.disconnect();
            return;
        }

        // Perform migration
        console.log('\nStarting migration...');
        const result = await Campaign.updateMany(
            { enableStripePayments: { $exists: false } },
            { 
                $set: { 
                    enableStripePayments: enableStripePayments,
                    // Also ensure allowOfflinePayments has a default value
                    allowOfflinePayments: true
                } 
            }
        );

        console.log(`\nMigration complete!`);
        console.log(`Modified ${result.modifiedCount} campaigns`);

        // Verify migration
        const verifyCount = await Campaign.countDocuments({
            enableStripePayments: { $exists: true }
        });
        console.log(`\nVerification: ${verifyCount} campaigns now have enableStripePayments field`);

        // Show sample of migrated campaigns
        const samples = await Campaign.find({}, { 
            title: 1, 
            enableStripePayments: 1, 
            allowOfflinePayments: 1 
        }).limit(5);
        
        console.log('\nSample of migrated campaigns:');
        samples.forEach(campaign => {
            console.log(`  - ${campaign.title}`);
            console.log(`    enableStripePayments: ${campaign.enableStripePayments}`);
            console.log(`    allowOfflinePayments: ${campaign.allowOfflinePayments}`);
        });

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        console.log('Migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run migration
migrate();

