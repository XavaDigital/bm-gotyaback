import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { Campaign, SponsorEntry, User } from '~/types/campaign.types';

/**
 * Create a new QueryClient for testing
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

/**
 * Custom render function with providers
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
};

/**
 * Mock navigate function for TanStack Router
 */
export const mockNavigate = vi.fn();

/**
 * Mock router hooks
 */
export const mockUseNavigate = () => mockNavigate;
export const mockUseParams = (params: Record<string, string> = {}) => params;
export const mockUseSearch = (search: Record<string, any> = {}) => search;

/**
 * Create a mock user
 */
export const createMockUser = (overrides?: Partial<User>): User => ({
  _id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock campaign
 */
export const createMockCampaign = (overrides?: Partial<Campaign>): Campaign => ({
  _id: 'campaign-123',
  title: 'Test Campaign',
  slug: 'test-campaign',
  description: 'Test campaign description',
  ownerId: 'user-123',
  campaignType: 'fixed',
  garmentType: 'tshirt',
  isClosed: false,
  pricingConfig: {
    fixedPrice: 25,
  },
  enableStripePayments: false,
  allowOfflinePayments: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock sponsor entry
 */
export const createMockSponsor = (overrides?: Partial<SponsorEntry>): SponsorEntry => ({
  _id: 'sponsor-123',
  campaignId: 'campaign-123',
  name: 'Test Sponsor',
  displayName: 'Test Sponsor',
  email: 'sponsor@example.com',
  phone: '1234567890',
  amount: 25,
  sponsorType: 'text',
  paymentStatus: 'paid',
  paymentMethod: 'cash',
  logoApprovalStatus: 'approved',
  displaySize: 'medium',
  calculatedFontSize: 16,
  calculatedLogoWidth: 100,
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Wait for async operations
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock API response
 */
export const mockApiResponse = <T,>(data: T, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

/**
 * Mock API error
 */
export const mockApiError = (message: string, status = 400) => ({
  response: {
    data: { message },
    status,
    statusText: 'Bad Request',
    headers: {},
    config: {} as any,
  },
  message,
  isAxiosError: true,
});

/**
 * Setup localStorage with auth token
 */
export const setupAuthToken = (token = 'test-token') => {
  localStorage.setItem('token', token);
};

/**
 * Clear localStorage
 */
export const clearAuth = () => {
  localStorage.clear();
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

