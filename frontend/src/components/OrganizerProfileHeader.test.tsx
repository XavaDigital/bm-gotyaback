import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import OrganizerProfileHeader from './OrganizerProfileHeader';
import { renderWithProviders } from '~/test/testUtils';
import type { OrganizerProfile } from '~/types/campaign.types';

describe('OrganizerProfileHeader', () => {
  const createMockProfile = (overrides?: Partial<OrganizerProfile>): OrganizerProfile => ({
    displayName: 'Test Organizer',
    slug: 'test-organizer',
    bio: '<p>This is a test bio</p>',
    logoUrl: 'https://example.com/logo.png',
    coverImageUrl: 'https://example.com/cover.png',
    websiteUrl: 'https://example.com',
    socialLinks: {
      facebook: 'https://facebook.com/test',
      twitter: 'https://twitter.com/test',
      instagram: 'https://instagram.com/test',
    },
    ...overrides,
  });

  it('should render organizer display name', () => {
    const profile = createMockProfile({ displayName: 'Test Organizer' });

    renderWithProviders(<OrganizerProfileHeader profile={profile} />);

    expect(screen.getByText('Test Organizer')).toBeInTheDocument();
  });

  it('should render default name when displayName is not provided', () => {
    const profile = createMockProfile({ displayName: undefined });

    renderWithProviders(<OrganizerProfileHeader profile={profile} />);

    expect(screen.getByText('Organizer')).toBeInTheDocument();
  });

  it('should render cover image when provided', () => {
    const profile = createMockProfile({ coverImageUrl: 'https://example.com/cover.png' });

    const { container } = renderWithProviders(<OrganizerProfileHeader profile={profile} />);

    const coverImage = container.querySelector('[style*="background-image"]');
    expect(coverImage).toBeInTheDocument();
  });

  it('should not render cover image when not provided', () => {
    const profile = createMockProfile({ coverImageUrl: undefined });

    const { container } = renderWithProviders(<OrganizerProfileHeader profile={profile} />);

    const coverImage = container.querySelector('[style*="background-image"]');
    expect(coverImage).not.toBeInTheDocument();
  });

  it('should render logo avatar when logoUrl is provided', () => {
    const profile = createMockProfile({ logoUrl: 'https://example.com/logo.png' });

    const { container } = renderWithProviders(<OrganizerProfileHeader profile={profile} />);

    const avatar = container.querySelector('.ant-avatar img');
    expect(avatar).toBeInTheDocument();
  });

  it('should render initial avatar when logoUrl is not provided', () => {
    const profile = createMockProfile({ logoUrl: undefined, displayName: 'Test Organizer' });

    const { container } = renderWithProviders(<OrganizerProfileHeader profile={profile} />);

    const avatar = container.querySelector('.ant-avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveTextContent('T');
  });

  it('should render website link when provided', () => {
    const profile = createMockProfile({ websiteUrl: 'https://example.com' });

    renderWithProviders(<OrganizerProfileHeader profile={profile} />);

    const websiteLink = screen.getByText(/Website/);
    expect(websiteLink).toBeInTheDocument();
    expect(websiteLink.closest('a')).toHaveAttribute('href', 'https://example.com');
  });

  it('should render Facebook link when provided', () => {
    const profile = createMockProfile({
      socialLinks: { facebook: 'https://facebook.com/test' },
    });

    renderWithProviders(<OrganizerProfileHeader profile={profile} />);

    const facebookLink = screen.getByText(/Facebook/);
    expect(facebookLink).toBeInTheDocument();
    expect(facebookLink.closest('a')).toHaveAttribute('href', 'https://facebook.com/test');
  });

  it('should render Twitter link when provided', () => {
    const profile = createMockProfile({
      socialLinks: { twitter: 'https://twitter.com/test' },
    });

    renderWithProviders(<OrganizerProfileHeader profile={profile} />);

    const twitterLink = screen.getByText(/Twitter/);
    expect(twitterLink).toBeInTheDocument();
    expect(twitterLink.closest('a')).toHaveAttribute('href', 'https://twitter.com/test');
  });

  it('should render Instagram link when provided', () => {
    const profile = createMockProfile({
      socialLinks: { instagram: 'https://instagram.com/test' },
    });

    renderWithProviders(<OrganizerProfileHeader profile={profile} />);

    const instagramLink = screen.getByText(/Instagram/);
    expect(instagramLink).toBeInTheDocument();
    expect(instagramLink.closest('a')).toHaveAttribute('href', 'https://instagram.com/test');
  });

  it('should render bio when provided', () => {
    const profile = createMockProfile({ bio: '<p>This is a test bio</p>' });

    renderWithProviders(<OrganizerProfileHeader profile={profile} />);

    expect(screen.getByText('About')).toBeInTheDocument();
    const bioContainer = document.querySelector('.ql-editor');
    expect(bioContainer).toBeInTheDocument();
  });

  it('should not render bio section when bio is not provided', () => {
    const profile = createMockProfile({ bio: undefined });

    renderWithProviders(<OrganizerProfileHeader profile={profile} />);

    expect(screen.queryByText('About')).not.toBeInTheDocument();
  });

  it('should not render social links when not provided', () => {
    const profile = createMockProfile({ 
      socialLinks: undefined,
      websiteUrl: undefined 
    });

    renderWithProviders(<OrganizerProfileHeader profile={profile} />);

    expect(screen.queryByText(/Website/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Facebook/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Twitter/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Instagram/)).not.toBeInTheDocument();
  });
});

