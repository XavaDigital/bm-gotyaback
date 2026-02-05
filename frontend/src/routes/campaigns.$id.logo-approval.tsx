import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '~/utils/auth-helpers'
import sponsorshipService from '~/services/sponsorship.service'
import campaignService from '~/services/campaign.service'
import LogoApproval from '~/pages/LogoApproval'

export const Route = createFileRoute('/campaigns/$id/logo-approval')({
  beforeLoad: async () => {
    // Server-side authentication check
    await requireAuth()
  },
  loader: async ({ params }) => {
    // Only run loader on client-side where localStorage/token is available
    if (typeof window === 'undefined') {
      return { campaign: null, pendingLogos: [] }
    }

    // Prefetch campaign data and pending logos
    try {
      const [campaign, pendingLogos] = await Promise.all([
        campaignService.getCampaignById(params.id),
        sponsorshipService.getPendingLogos(params.id),
      ])
      return { campaign, pendingLogos }
    } catch (error) {
      console.error('Failed to load logo approval data in loader:', error)
      return { campaign: null, pendingLogos: [] }
    }
  },
  component: LogoApproval,
})

