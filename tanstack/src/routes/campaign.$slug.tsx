import { createFileRoute } from '@tanstack/react-router'
import campaignService from '~/services/campaign.service'
import sponsorshipService from '~/services/sponsorship.service'
import PublicCampaign from '~/pages/PublicCampaign'

export const Route = createFileRoute('/campaign/$slug')({
  loader: async ({ params }) => {
    // Only run loader on client-side to avoid SSR issues
    if (typeof window === 'undefined') {
      return { campaign: null, sponsors: [], layout: null }
    }

    // Prefetch public campaign data
    try {
      const campaign = await campaignService.getPublicCampaign(params.slug)
      const [sponsors, layout] = await Promise.all([
        sponsorshipService.getPublicSponsors(campaign._id),
        campaignService.getLayout(campaign._id), // 404s handled by interceptor
      ])
      return { campaign, sponsors, layout }
    } catch (error) {
      console.error('Failed to load public campaign in loader:', error)
      return { campaign: null, sponsors: [], layout: null }
    }
  },
  component: PublicCampaign,
})

