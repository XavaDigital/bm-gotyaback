import { createFileRoute } from "@tanstack/react-router";
import campaignService from "~/services/campaign.service";
import ThankYouPage from "~/pages/ThankYouPage";

export const Route = createFileRoute("/campaign/$slug/thank-you")({
  loader: async ({ params }) => {
    // Only run loader on client-side to avoid SSR issues
    if (typeof window === "undefined") {
      return { campaign: null };
    }

    // Fetch campaign data for the thank you page
    try {
      const campaign = await campaignService.getPublicCampaign(params.slug);
      return { campaign };
    } catch (error) {
      console.error("Failed to load campaign for thank you page:", error);
      return { campaign: null };
    }
  },
  component: ThankYouPage,
});
