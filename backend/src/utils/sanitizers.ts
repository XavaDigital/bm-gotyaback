/**
 * Data sanitization utilities to filter sensitive information
 * before sending responses to the frontend
 */

/**
 * Sanitize user data for authenticated responses
 * Removes sensitive fields like password reset tokens
 */
export const sanitizeUser = (user: any) => {
  if (!user) return null;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizerProfile: user.organizerProfile,
    createdAt: user.createdAt,
  };
};

/**
 * Sanitize user data for public responses
 * Only includes publicly visible information
 */
export const sanitizeUserForPublic = (user: any) => {
  if (!user) return null;

  return {
    name: user.name,
    organizerProfile: user.organizerProfile,
  };
};

/**
 * Sanitize campaign data for public responses
 * Filters owner information to only include public data
 */
export const sanitizeCampaignForPublic = (campaign: any) => {
  if (!campaign) return null;

  const sanitized: any = {
    _id: campaign._id,
    title: campaign.title,
    slug: campaign.slug,
    shortDescription: campaign.shortDescription,
    description: campaign.description,
    headerImageUrl: campaign.headerImageUrl,
    garmentType: campaign.garmentType,
    campaignType: campaign.campaignType,
    sponsorDisplayType: campaign.sponsorDisplayType,
    pricingConfig: campaign.pricingConfig,
    layoutStyle: campaign.layoutStyle,
    currency: campaign.currency,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    isClosed: campaign.isClosed,
    enableStripePayments: campaign.enableStripePayments,
    allowOfflinePayments: campaign.allowOfflinePayments,
    createdAt: campaign.createdAt,
  };

  // Sanitize owner information if populated
  if (campaign.ownerId) {
    sanitized.owner = sanitizeUserForPublic(campaign.ownerId);
  }

  return sanitized;
};

/**
 * Sanitize sponsor data for public responses
 * Excludes contact information (email, phone)
 */
export const sanitizeSponsorForPublic = (sponsor: any) => {
  if (!sponsor) return null;

  return {
    _id: sponsor._id,
    name: sponsor.name,
    displayName: sponsor.displayName,
    amount: sponsor.amount,
    sponsorType: sponsor.sponsorType,
    logoUrl: sponsor.logoUrl,
    displaySize: sponsor.displaySize,
    calculatedFontSize: sponsor.calculatedFontSize,
    calculatedLogoWidth: sponsor.calculatedLogoWidth,
    message: sponsor.message,
    logoApprovalStatus: sponsor.logoApprovalStatus,
    createdAt: sponsor.createdAt,
    // Explicitly exclude: email, phone, paymentMethod, paymentStatus
  };
};

/**
 * Sanitize sponsor data for campaign owner responses
 * Includes contact information but not payment details
 */
export const sanitizeSponsorForOwner = (sponsor: any) => {
  if (!sponsor) return null;

  return {
    _id: sponsor._id,
    campaignId: sponsor.campaignId,
    positionId: sponsor.positionId,
    name: sponsor.name,
    displayName: sponsor.displayName,
    email: sponsor.email,
    phone: sponsor.phone,
    message: sponsor.message,
    amount: sponsor.amount,
    paymentMethod: sponsor.paymentMethod,
    paymentStatus: sponsor.paymentStatus,
    sponsorType: sponsor.sponsorType,
    logoUrl: sponsor.logoUrl,
    logoApprovalStatus: sponsor.logoApprovalStatus,
    logoRejectionReason: sponsor.logoRejectionReason,
    displaySize: sponsor.displaySize,
    calculatedFontSize: sponsor.calculatedFontSize,
    calculatedLogoWidth: sponsor.calculatedLogoWidth,
    createdAt: sponsor.createdAt,
    updatedAt: sponsor.updatedAt,
  };
};

/**
 * Sanitize array of items using the provided sanitizer function
 */
export const sanitizeArray = <T>(items: any[], sanitizer: (item: any) => T): T[] => {
  if (!Array.isArray(items)) return [];
  return items.map(sanitizer).filter(Boolean);
};

