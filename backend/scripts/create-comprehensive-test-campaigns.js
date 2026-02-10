/**
 * Script to create comprehensive test campaigns with all combinations
 * 
 * Creates campaigns for all combinations of:
 * - Campaign Types: fixed, positional, pay-what-you-want
 * - Layout Styles: word-cloud, size-ordered, amount-ordered (based on campaign type)
 * - Sponsor Display Types: text-only, logo-only, both
 * 
 * Total: 7 campaign type/layout combinations × 3 sponsor display types = 21 campaigns
 * Each campaign is seeded with 10 sponsors
 * 
 * Usage:
 *   node backend/scripts/create-comprehensive-test-campaigns.js <email>
 * 
 * Example:
 *   node backend/scripts/create-comprehensive-test-campaigns.js user@example.com
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const { Campaign } = require('../dist/models/Campaign');
const { User } = require('../dist/models/User');
const { ShirtLayout } = require('../dist/models/ShirtLayout');
const { SponsorEntry } = require('../dist/models/SponsorEntry');

// Valid campaign type and layout combinations
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

// Sponsor display types
const SPONSOR_DISPLAY_TYPES = ['text-only', 'logo-only', 'both'];

// Sample logo URLs for seeding (using real sponsor logos)
const sampleLogoUrls = [
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768546097400-h83iuq/attachment_125990042-1768546097401.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545854052-sjht05/discord-1768545854052.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545775448-35co8k/Lorraine-Tuhoe-Estore-06-600x450-1768545775449.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545984396-9jwqw/Hamilton-Hawks-Estore-1024x768-1768545984396.png",
    // Repeat logos to have more variety for seeding
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768546097400-h83iuq/attachment_125990042-1768546097401.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545854052-sjht05/discord-1768545854052.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545775448-35co8k/Lorraine-Tuhoe-Estore-06-600x450-1768545775449.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545984396-9jwqw/Hamilton-Hawks-Estore-1024x768-1768545984396.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768546097400-h83iuq/attachment_125990042-1768546097401.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545854052-sjht05/discord-1768545854052.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545775448-35co8k/Lorraine-Tuhoe-Estore-06-600x450-1768545775449.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545984396-9jwqw/Hamilton-Hawks-Estore-1024x768-1768545984396.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768546097400-h83iuq/attachment_125990042-1768546097401.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545854052-sjht05/discord-1768545854052.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545775448-35co8k/Lorraine-Tuhoe-Estore-06-600x450-1768545775449.png",
    "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545984396-9jwqw/Hamilton-Hawks-Estore-1024x768-1768545984396.png",
];

// Helper to format campaign type for display
const formatCampaignType = (type) => {
    return type.replace(/-/g, ' ');
};

// Helper to format sponsor display type for display
const formatSponsorDisplayType = (type) => {
    return type.replace(/-/g, ' ');
};

// Generate pricing config based on campaign type and layout style
const getPricingConfig = (campaignType, layoutStyle) => {
    switch (campaignType) {
        case 'fixed':
            return { fixedPrice: 50 };
        case 'positional':
            if (layoutStyle === 'amount-ordered') {
                // Sections layout
                return {
                    sections: {
                        top: { amount: 100, slots: 5 },
                        middle: { amount: 50, slots: 10 },
                        bottom: { amount: 25, slots: 15 }
                    }
                };
            } else {
                // Regular positional
                return { basePrice: 30, pricePerPosition: 5 };
            }
        case 'pay-what-you-want':
            return {
                minimumAmount: 10,
                suggestedAmounts: [20, 50, 100],
                sizeTiers: [
                    { size: 'small', minAmount: 10, maxAmount: 49, textFontSize: 12, logoWidth: 50 },
                    { size: 'medium', minAmount: 50, maxAmount: 99, textFontSize: 16, logoWidth: 75 },
                    { size: 'large', minAmount: 100, maxAmount: 199, textFontSize: 20, logoWidth: 100 },
                    { size: 'xlarge', minAmount: 200, maxAmount: null, textFontSize: 24, logoWidth: 150 }
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

// Generate appropriate descriptions based on combination
const getDescriptions = (campaignType, layoutStyle, sponsorDisplayType) => {
    const typeDesc = formatCampaignType(campaignType);
    const displayDesc = formatSponsorDisplayType(sponsorDisplayType);
    
    const shortDescription = `Test campaign: ${typeDesc} pricing with ${displayDesc} sponsor display`;
    
    let fullDescription = `<h2>Campaign Overview</h2>
<p>This is a comprehensive test campaign demonstrating <strong>${typeDesc}</strong> pricing strategy.</p>

<h3>Sponsor Display</h3>
<p>This campaign showcases sponsors using <strong>${displayDesc}</strong> display mode.</p>

<h3>Layout Style</h3>`;

    if (layoutStyle === 'word-cloud') {
        fullDescription += `<p>Sponsors are displayed in an attractive word cloud layout, with sizing based on contribution amount.</p>`;
    } else if (layoutStyle === 'size-ordered') {
        fullDescription += `<p>Sponsors are arranged in an ordered list, sorted by contribution size.</p>`;
    } else if (layoutStyle === 'amount-ordered') {
        if (campaignType === 'positional') {
            fullDescription += `<p>Sponsors are organized into premium sections (top, middle, bottom) based on their contribution tier.</p>`;
        } else {
            fullDescription += `<p>Sponsors are displayed in an ordered list based on contribution amount.</p>`;
        }
    }

    fullDescription += `\n<h3>How It Works</h3>`;
    
    if (campaignType === 'fixed') {
        fullDescription += `<p>All sponsor positions are available at a fixed price of $50 NZD.</p>`;
    } else if (campaignType === 'positional') {
        if (layoutStyle === 'amount-ordered') {
            fullDescription += `<p>Pricing varies by section: Top tier ($100), Middle tier ($50), Bottom tier ($25).</p>`;
        } else {
            fullDescription += `<p>Pricing increases based on position: starting at $30 plus $5 per position.</p>`;
        }
    } else if (campaignType === 'pay-what-you-want') {
        fullDescription += `<p>Sponsors can contribute any amount above the minimum of $10. Higher contributions result in larger display sizes.</p>`;
    }

    return { shortDescription, fullDescription };
};

// Create a single campaign
const createCampaign = async (userId, combination, sponsorDisplayType) => {
    const { campaignType, layoutStyle, displayName } = combination;
    const displayTypeShort = sponsorDisplayType.replace(/-only$/, '').replace('both', 'text+logo');
    const title = `test - ${formatCampaignType(campaignType)} - ${displayName} - ${displayTypeShort}`;
    const slug = generateSlug(title);

    const { shortDescription, fullDescription } = getDescriptions(campaignType, layoutStyle, sponsorDisplayType);

    const campaignData = {
        ownerId: userId,
        title,
        slug,
        shortDescription,
        description: fullDescription,
        garmentType: 'tshirt',
        campaignType,
        sponsorDisplayType,
        layoutStyle,
        pricingConfig: getPricingConfig(campaignType, layoutStyle),
        currency: 'NZD',
        enableStripePayments: false,
        allowOfflinePayments: true,
        isClosed: false
    };

    const campaign = await Campaign.create(campaignData);
    console.log(`✓ Created: ${title}`);
    console.log(`  ID: ${campaign._id}`);

    return campaign;
};

// Create layout for a campaign
const createLayout = async (campaign) => {
    const { campaignType, layoutStyle, _id: campaignId, pricingConfig } = campaign;

    if (campaignType === 'pay-what-you-want') {
        // Create flexible layout for pay-what-you-want
        const layout = await ShirtLayout.create({
            campaignId,
            layoutType: 'flexible',
            maxSponsors: 0, // unlimited
            placements: []
        });
        console.log(`  ✓ Created flexible layout`);
        return layout;
    } else if (campaignType === 'positional' && layoutStyle === 'amount-ordered') {
        // Create section-based layout
        const sections = pricingConfig.sections;
        const placements = [];
        let positionId = 1;

        // Top section
        for (let i = 0; i < sections.top.slots; i++) {
            placements.push({
                positionId: positionId.toString(),
                section: 'top',
                price: sections.top.amount,
                isTaken: false
            });
            positionId++;
        }

        // Middle section
        for (let i = 0; i < sections.middle.slots; i++) {
            placements.push({
                positionId: positionId.toString(),
                section: 'middle',
                price: sections.middle.amount,
                isTaken: false
            });
            positionId++;
        }

        // Bottom section
        for (let i = 0; i < sections.bottom.slots; i++) {
            placements.push({
                positionId: positionId.toString(),
                section: 'bottom',
                price: sections.bottom.amount,
                isTaken: false
            });
            positionId++;
        }

        const layout = await ShirtLayout.create({
            campaignId,
            layoutType: 'grid',
            totalPositions: placements.length,
            placements
        });

        console.log(`  ✓ Created section layout (${placements.length} positions)`);
        return layout;
    } else {
        // Create grid layout for fixed and regular positional
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

        console.log(`  ✓ Created grid layout (${totalPositions} positions)`);
        return layout;
    }
};

// Generate random sponsor data
const generateRandomSponsor = (campaignId, index, campaign, layout, availablePositions) => {
    const firstNames = [
        "John", "Jane", "Michael", "Sarah", "David", "Emily", "Chris", "Jessica",
        "Daniel", "Ashley", "Matthew", "Amanda", "James", "Melissa", "Robert",
        "Jennifer", "William", "Linda", "Richard", "Patricia", "Thomas", "Nancy"
    ];

    const lastNames = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
        "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
        "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"
    ];

    const companies = [
        "Tech Solutions", "Global Industries", "Creative Agency", "Consulting Group",
        "Digital Media", "Innovation Labs", "Marketing Pro", "Design Studio",
        "Software Systems", "Business Partners", "Enterprise Co", "Ventures Inc"
    ];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];

    // Randomly choose between person name and company name
    const usePerson = Math.random() > 0.5;
    const name = usePerson ? `${firstName} ${lastName}` : company;

    const email = `sponsor${index}@example.com`;
    const phone = `+64 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`;

    let amount;
    let positionId = null;
    let displaySize = 'medium';

    // Determine amount and position based on campaign type
    if (campaign.campaignType === 'fixed') {
        amount = campaign.pricingConfig.fixedPrice || 50;
        if (availablePositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * availablePositions.length);
            positionId = availablePositions[randomIndex].positionId;
            availablePositions.splice(randomIndex, 1);
        }
    } else if (campaign.campaignType === 'positional') {
        if (availablePositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * availablePositions.length);
            const position = availablePositions[randomIndex];
            positionId = position.positionId;
            amount = position.price;
            availablePositions.splice(randomIndex, 1);
        } else {
            amount = campaign.pricingConfig.basePrice || 30;
        }
    } else if (campaign.campaignType === 'pay-what-you-want') {
        // Random amount based on size tiers
        const rand = Math.random();
        if (rand < 0.1) {
            amount = Math.floor(Math.random() * 40 + 10); // small: 10-49
            displaySize = 'small';
        } else if (rand < 0.4) {
            amount = Math.floor(Math.random() * 50 + 50); // medium: 50-99
            displaySize = 'medium';
        } else if (rand < 0.8) {
            amount = Math.floor(Math.random() * 100 + 100); // large: 100-199
            displaySize = 'large';
        } else {
            amount = Math.floor(Math.random() * 300 + 200); // xlarge: 200-499
            displaySize = 'xlarge';
        }
    }

    // Determine sponsor type based on campaign's sponsorDisplayType
    let sponsorType = 'text';
    if (campaign.sponsorDisplayType === 'logo-only') {
        sponsorType = 'logo';
    } else if (campaign.sponsorDisplayType === 'both') {
        // For 'both', randomly assign text or logo
        sponsorType = Math.random() > 0.5 ? 'logo' : 'text';
    }

    // Calculate font size and logo width based on display size
    let calculatedFontSize = 16;
    let calculatedLogoWidth = 75;

    if (campaign.campaignType === 'pay-what-you-want' && campaign.pricingConfig.sizeTiers) {
        const tier = campaign.pricingConfig.sizeTiers.find(t => t.size === displaySize);
        if (tier) {
            calculatedFontSize = tier.textFontSize;
            calculatedLogoWidth = tier.logoWidth;
        }
    }

    // Generate logo URL if sponsor type is logo
    const logoUrl = sponsorType === 'logo'
        ? sampleLogoUrls[index % sampleLogoUrls.length]
        : undefined;

    // Generate displayName for logo sponsors when campaign display type is "both"
    let displayName = undefined;
    if (sponsorType === 'logo' && campaign.sponsorDisplayType === 'both') {
        displayName = name;
    }

    const sponsor = {
        campaignId,
        positionId,
        name,
        email,
        phone,
        message: `Thank you for this great initiative! - ${name}`,
        amount,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        sponsorType,
        logoApprovalStatus: 'approved',
        displaySize,
        calculatedFontSize,
        calculatedLogoWidth
    };

    // Add logo-specific fields
    if (sponsorType === 'logo') {
        sponsor.logoUrl = logoUrl;
        sponsor.calculatedLogoWidth = calculatedLogoWidth;
        if (displayName) {
            sponsor.displayName = displayName;
        }
    }

    return sponsor;
};

// Seed sponsors for a campaign
const seedSponsors = async (campaign, layout, numberOfSponsors = 10) => {
    const availablePositions = layout.placements ? [...layout.placements.filter(p => !p.isTaken)] : [];

    const sponsors = [];
    for (let i = 0; i < numberOfSponsors; i++) {
        sponsors.push(generateRandomSponsor(campaign._id, i + 1, campaign, layout, availablePositions));
    }

    const result = await SponsorEntry.insertMany(sponsors);

    // Update layout to mark positions as taken
    if (layout.layoutType === 'grid') {
        for (const sponsor of result) {
            if (sponsor.positionId) {
                const placement = layout.placements.find(p => p.positionId === sponsor.positionId);
                if (placement) {
                    placement.isTaken = true;
                    placement.sponsorId = sponsor._id;
                }
            }
        }
        await layout.save();
    }

    console.log(`  ✓ Seeded ${result.length} sponsors`);
    return result;
};

// Main function
const main = async () => {
    try {
        // Get email from command line arguments
        const email = process.argv[2];

        if (!email) {
            console.error('❌ Error: Email address is required');
            console.log('\nUsage: node backend/scripts/create-comprehensive-test-campaigns.js <email>');
            console.log('Example: node backend/scripts/create-comprehensive-test-campaigns.js user@example.com\n');
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
        console.log('Creating comprehensive test campaigns...\n');
        console.log(`Total campaigns to create: ${CAMPAIGN_COMBINATIONS.length} × ${SPONSOR_DISPLAY_TYPES.length} = ${CAMPAIGN_COMBINATIONS.length * SPONSOR_DISPLAY_TYPES.length}\n`);

        let createdCount = 0;
        let skippedCount = 0;
        const createdCampaigns = [];

        for (const combination of CAMPAIGN_COMBINATIONS) {
            for (const sponsorDisplayType of SPONSOR_DISPLAY_TYPES) {
                const { campaignType, displayName } = combination;
                const displayTypeShort = sponsorDisplayType.replace(/-only$/, '').replace('both', 'text+logo');

                try {
                    // Check if campaign already exists
                    const title = `test - ${formatCampaignType(campaignType)} - ${displayName} - ${displayTypeShort}`;
                    const slug = generateSlug(title);
                    const existing = await Campaign.findOne({ slug });

                    if (existing) {
                        console.log(`⊘ Skipped: ${title} (already exists)\n`);
                        skippedCount++;
                        continue;
                    }

                    // Create campaign
                    const campaign = await createCampaign(user._id, combination, sponsorDisplayType);

                    // Create layout
                    const layout = await createLayout(campaign);

                    // Seed sponsors
                    await seedSponsors(campaign, layout, 10);

                    createdCampaigns.push(campaign);
                    createdCount++;
                    console.log(''); // Empty line for readability
                } catch (error) {
                    console.error(`❌ Error creating campaign (${campaignType} - ${displayName} - ${sponsorDisplayType}):`, error.message);
                    console.log(''); // Empty line for readability
                }
            }
        }

        // Summary
        console.log('='.repeat(80));
        console.log('SUMMARY');
        console.log('='.repeat(80));
        console.log(`Created:  ${createdCount} campaigns (each with 10 sponsors)`);
        console.log(`Skipped:  ${skippedCount} campaigns (already exist)`);
        console.log(`Total:    ${CAMPAIGN_COMBINATIONS.length * SPONSOR_DISPLAY_TYPES.length} possible combinations`);
        console.log('='.repeat(80));

        if (createdCampaigns.length > 0) {
            console.log('\nCreated Campaigns:');
            console.log('-'.repeat(80));
            for (const campaign of createdCampaigns) {
                console.log(`  • ${campaign.title}`);
                console.log(`    ID: ${campaign._id}`);
                console.log(`    Type: ${campaign.campaignType} | Layout: ${campaign.layoutStyle} | Display: ${campaign.sponsorDisplayType}`);
            }
            console.log('-'.repeat(80));
        }

        console.log('\n✓ Database connection closed');
        await mongoose.connection.close();

    } catch (error) {
        console.error('❌ Fatal error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

// Run the script
main();


