import jwt from 'jsonwebtoken';
import { vi } from 'vitest';
import { User } from '../models/User';
import { Campaign } from '../models/Campaign';
import { SponsorEntry } from '../models/SponsorEntry';
import type { Request } from 'express';

/**
 * Create a test user
 */
export const createTestUser = async (overrides?: any) => {
  const defaultUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    passwordHash: '$2a$10$test.hash.for.testing.only',
    role: 'user',
    ...overrides,
  };
  
  const user = await User.create(defaultUser);
  return user;
};

/**
 * Create a test admin user
 */
export const createTestAdmin = async (overrides?: any) => {
  return createTestUser({ role: 'admin', ...overrides });
};

/**
 * Generate a JWT token for testing
 */
export const generateTestToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: '1h',
  });
};

/**
 * Create a test campaign
 */
export const createTestCampaign = async (ownerId: string, overrides?: any) => {
  const defaultCampaign = {
    title: `Test Campaign ${Date.now()}`,
    slug: `test-campaign-${Date.now()}`,
    description: 'Test campaign description',
    ownerId,
    campaignType: 'fixed',
    garmentType: 'tshirt',
    isClosed: false,
    pricingConfig: {
      fixedPrice: 25,
    },
    enableStripePayments: false,
    allowOfflinePayments: true,
    ...overrides,
  };

  const campaign = await Campaign.create(defaultCampaign);
  return campaign;
};

/**
 * Create a test sponsor entry
 */
export const createTestSponsor = async (campaignId: string, overrides?: any) => {
  const defaultSponsor = {
    campaignId,
    name: `Test Sponsor ${Date.now()}`,
    displayName: `Test Sponsor ${Date.now()}`,
    email: `sponsor-${Date.now()}@example.com`,
    amount: 25,
    sponsorType: 'text',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    ...overrides,
  };

  const sponsor = await SponsorEntry.create(defaultSponsor);
  return sponsor;
};

/**
 * Mock Express request object
 */
export const mockRequest = (overrides?: Partial<Request>): Partial<Request> => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    get: vi.fn((header: string) => {
      if (header === 'user-agent') return 'test-user-agent';
      return undefined;
    }),
    ...overrides,
  };
};

/**
 * Mock Express response object
 */
export const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.sendStatus = vi.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock Express next function
 */
export const mockNext = () => vi.fn();

/**
 * Wait for async operations
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Clean up test data
 */
export const cleanupTestData = async () => {
  await User.deleteMany({});
  await Campaign.deleteMany({});
  await SponsorEntry.deleteMany({});
};

