import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '~/utils/auth-helpers'
import campaignService from '~/services/campaign.service'
import sponsorshipService from '~/services/sponsorship.service'
import CampaignDetail from '~/pages/CampaignDetail'

export const Route = createFileRoute('/campaigns/$id')({
  beforeLoad: async () => {
    // Server-side authentication check
    await requireAuth()
  },
  loader: async ({ params }) => {
    // Only run loader on client-side where localStorage/token is available
    if (typeof window === 'undefined') {
      return { campaign: null, sponsors: [], layout: null }
    }

    // Prefetch campaign data
    try {
      const [campaign, sponsors, layout] = await Promise.all([
        campaignService.getCampaignById(params.id),
        sponsorshipService.getSponsors(params.id),
        campaignService.getLayout(params.id), // 404s handled by interceptor
      ])
      return { campaign, sponsors, layout }
    } catch (error) {
      console.error('Failed to load campaign in loader:', error)
      return { campaign: null, sponsors: [], layout: null }
    }
  },
  component: CampaignDetail,
})

