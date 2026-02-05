import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '~/utils/auth-helpers'
import campaignService from '~/services/campaign.service'
import MyCampaigns from '~/pages/MyCampaigns'

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: async () => {
    await requireAuth()
  },
  loader: async () => {
    // Only run loader on client-side where localStorage/token is available
    if (typeof window === 'undefined') {
      return { campaigns: [] }
    }

    // Prefetch campaigns data on the client
    try {
      const campaigns = await campaignService.getMyCampaigns()
      return { campaigns }
    } catch (error) {
      console.error('Failed to load campaigns in loader:', error)
      return { campaigns: [] }
    }
  },
  component: MyCampaigns,
})

