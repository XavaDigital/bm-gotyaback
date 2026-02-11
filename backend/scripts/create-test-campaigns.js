/**
 * Script to create test campaigns with different type and layout combinations
 * 
 * This script creates campaigns for all combinations of:
 * - Campaign Types: fixed, positional, pay-what-you-want
 * - Layout Styles: grid, size-ordered, amount-ordered, word-cloud
 * 
 * Naming convention: 'test - {campaignType} - {layoutStyle}'
 * Example: 'test - pay what you want - cloud'
 * 
 * Usage:
 *   node backend/scripts/create-test-campaigns.js <email>
 * 
 * Example:
 *   node backend/scripts/create-test-campaigns.js user@example.com
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const { Campaign } = require('../dist/models/Campaign');
const { User } = require('../dist/models/User');
const { ShirtLayout } = require('../dist/models/ShirtLayout');

// Valid campaign type and layout combinations based on UI
// Database values: word-cloud, size-ordered, amount-ordered
const CAMPAIGN_COMBINATIONS = [
    // Fixed Price: Word Cloud, List (size-ordered)
    { campaignType: 'fixed', layoutStyle: 'word-cloud', displayName: 'cloud' },
    { campaignType: 'fixed', layoutStyle: 'size-ordered', displayName: 'list' },

    // Positional Pricing: Ordered (size-ordered), Sections (amount-ordered), Cloud (word-cloud)
    { campaignType: 'positional', layoutStyle: 'size-ordered', displayName: 'ordered' },
    { campaignType: 'positional', layoutStyle: 'amount-ordered', displayName: 'sections' },
    { campaignType: 'positional', layoutStyle: 'word-cloud', displayName: 'cloud' },

    // Pay What You Want: Ordered List (amount-ordered), Word Cloud
    { campaignType: 'pay-what-you-want', layoutStyle: 'amount-ordered', displayName: 'ordered list' },
    { campaignType: 'pay-what-you-want', layoutStyle: 'word-cloud', displayName: 'cloud' },
];

// Helper to format campaign type for display
const formatCampaignType = (type) => {
    return type.replace(/-/g, ' ');
};

// Helper to get display name from combination
const getDisplayName = (combination) => {
    return combination.displayName;
};

// Generate pricing config based on campaign type
const getPricingConfig = (campaignType) => {
    switch (campaignType) {
        case 'fixed':
            return { fixedPrice: 50 };
        case 'positional':
            return { basePrice: 30, pricePerPosition: 5 };
        case 'pay-what-you-want':
            return {
                minimumAmount: 10,
                suggestedAmounts: [20, 50, 100],
                sizeTiers: [
                    { size: 'small', minAmount: 10, maxAmount: 49, textFontSize: 12, logoWidth: 80 },
                    { size: 'medium', minAmount: 50, maxAmount: 99, textFontSize: 16, logoWidth: 110 },
                    { size: 'large', minAmount: 100, maxAmount: 199, textFontSize: 20, logoWidth: 140 },
                    { size: 'xlarge', minAmount: 200, maxAmount: null, textFontSize: 24, logoWidth: 180 }
                ]
            };
        default:
            return {};
    }
};

// Generate unique slug
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

// Create a single campaign
const createCampaign = async (userId, combination) => {
    const { campaignType, layoutStyle, displayName } = combination;
    const title = `test - ${formatCampaignType(campaignType)} - ${displayName}`;
    const slug = generateSlug(title);

    const campaignData = {
        ownerId: userId,
        title,
        slug,
        shortDescription: `Test campaign for ${formatCampaignType(campaignType)} pricing with ${displayName} layout`,
        description: `This is a test campaign created to demonstrate ${formatCampaignType(campaignType)} pricing strategy with ${displayName} layout style.`,
        garmentType: 'tshirt',
        campaignType,
        sponsorDisplayType: 'text-only',
        layoutStyle,
        pricingConfig: getPricingConfig(campaignType),
        currency: 'NZD',
        enableStripePayments: false,
        allowOfflinePayments: true,
        isClosed: false
    };

    const campaign = await Campaign.create(campaignData);
    console.log(`✓ Created: ${title} (ID: ${campaign._id})`);

    return campaign;
};

// Create layout for a campaign
const createLayout = async (campaign) => {
    const { campaignType, layoutStyle, _id: campaignId, pricingConfig } = campaign;

    // Check if this is PWYW + amount-ordered (grid layout)
    if (campaignType === 'pay-what-you-want' && layoutStyle === 'amount-ordered') {
        // Create grid layout for PWYW + amount-ordered (portrait orientation)
        // Positions are assigned dynamically based on amount during rendering
        const maxSponsors = 20; // Maximum number of sponsors
        const columns = 3; // Portrait orientation for garments
        const rows = Math.ceil(maxSponsors / columns);

        const layout = await ShirtLayout.create({
            campaignId,
            layoutType: 'grid',
            rows,
            columns,
            maxSponsors,
            totalPositions: maxSponsors,
            arrangement: 'horizontal',
            placements: [] // No fixed placements - positions assigned dynamically by amount
        });

        console.log(`  ✓ Created grid layout (${maxSponsors} max sponsors, ${columns} columns) for PWYW + amount-ordered campaign ${campaignId}`);
        return layout;
    } else if (campaignType === 'pay-what-you-want') {
        // Create flexible layout for other PWYW layouts (word-cloud)
        const layout = await ShirtLayout.create({
            campaignId,
            layoutType: 'flexible',
            maxSponsors: 0, // unlimited
            placements: []
        });
        console.log(`  ✓ Created flexible layout for campaign ${campaignId}`);
        return layout;
    } else {
        // Create grid layout for fixed and positional
        const totalPositions = 20;
        const columns = 4;
        const rows = Math.ceil(totalPositions / columns);

        // Generate positions
        const placements = [];
        for (let i = 1; i <= totalPositions; i++) {
            const row = Math.floor((i - 1) / columns);
            const col = (i - 1) % columns;

            let price = 0;
            if (campaignType === 'fixed') {
                price = pricingConfig.fixedPrice || 50;
            } else if (campaignType === 'positional') {
                price = (pricingConfig.basePrice || 30) + (i * (pricingConfig.pricePerPosition || 5));
            }

            placements.push({
                positionId: i.toString(),
                row,
                col,
                price,
                isTaken: false
            });
        }

        const layout = await ShirtLayout.create({
            campaignId,
            layoutType: 'grid',
            rows,
            columns,
            totalPositions,
            arrangement: 'horizontal',
            placements
        });

        console.log(`  ✓ Created grid layout (${totalPositions} positions) for campaign ${campaignId}`);
        return layout;
    }
};

// Main function
const main = async () => {
    try {
        // Get email from command line arguments
        const email = process.argv[2];

        if (!email) {
            console.error('❌ Error: Email address is required');
            console.log('\nUsage: node backend/scripts/create-test-campaigns.js <email>');
            console.log('Example: node backend/scripts/create-test-campaigns.js user@example.com\n');
            process.exit(1);
        }

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/fundraising-platform';
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB\n');

        // Find user by email
        console.log(`Looking for user with email: ${email}...`);
        const user = await User.findOne({ email });

        if (!user) {
            console.error(`❌ Error: User with email "${email}" not found`);
            console.log('\nPlease make sure the user exists in the database.');
            console.log('You can create a user by registering through the application.\n');
            process.exit(1);
        }

        console.log(`✓ Found user: ${user.name} (ID: ${user._id})\n`);

        // Create campaigns for all combinations
        console.log('Creating test campaigns...\n');
        let createdCount = 0;
        let skippedCount = 0;

        for (const combination of CAMPAIGN_COMBINATIONS) {
            const { campaignType, displayName } = combination;
            try {
                // Check if campaign already exists
                const title = `test - ${formatCampaignType(campaignType)} - ${displayName}`;
                const slug = generateSlug(title);
                const existing = await Campaign.findOne({ slug });

                if (existing) {
                    console.log(`⊘ Skipped: ${title} (already exists)`);
                    skippedCount++;
                    continue;
                }

                // Create campaign
                const campaign = await createCampaign(user._id, combination);

                // Create layout
                await createLayout(campaign);

                createdCount++;
            } catch (error) {
                console.error(`❌ Error creating campaign (${campaignType} - ${displayName}):`, error.message);
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('Summary:');
        console.log(`  Created: ${createdCount} campaigns`);
        console.log(`  Skipped: ${skippedCount} campaigns (already exist)`);
        console.log(`  Total combinations: ${CAMPAIGN_COMBINATIONS.length}`);
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

