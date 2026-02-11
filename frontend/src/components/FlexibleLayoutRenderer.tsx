import React from "react";
import type { SponsorEntry, LayoutStyle, CampaignType, ShirtLayout } from "~/types/campaign.types";
import SizeOrderedRenderer from "./SizeOrderedRenderer";
import AmountOrderedRenderer from "./AmountOrderedRenderer";
import WordCloudRenderer from "./WordCloudRenderer";

interface FlexibleLayoutRendererProps {
  sponsors: SponsorEntry[];
  layoutStyle: LayoutStyle;
  sponsorDisplayType: "text-only" | "logo-only" | "both";
  campaignType?: CampaignType; // Optional for backward compatibility
  layout?: ShirtLayout; // Optional layout for grid-based display (PWYW + ordered)
}

const FlexibleLayoutRenderer: React.FC<FlexibleLayoutRendererProps> = ({
  sponsors,
  layoutStyle,
  sponsorDisplayType,
  campaignType,
  layout,
}) => {
  // Delegate to specific renderer based on layout style
  switch (layoutStyle) {
    case "size-ordered":
      return (
        <SizeOrderedRenderer
          sponsors={sponsors}
          sponsorDisplayType={sponsorDisplayType}
          campaignType={campaignType}
        />
      );
    case "amount-ordered":
      return (
        <AmountOrderedRenderer
          sponsors={sponsors}
          sponsorDisplayType={sponsorDisplayType}
          layout={layout}
          campaignType={campaignType}
        />
      );
    case "word-cloud":
      return (
        <WordCloudRenderer
          sponsors={sponsors}
          sponsorDisplayType={sponsorDisplayType}
        />
      );
    case "grid":
    default:
      // Fallback to a simple list for grid (though grid should use GridLayoutRenderer)
      return (
        <AmountOrderedRenderer
          sponsors={sponsors}
          sponsorDisplayType={sponsorDisplayType}
          layout={layout}
          campaignType={campaignType}
        />
      );
  }
};

export default FlexibleLayoutRenderer;
