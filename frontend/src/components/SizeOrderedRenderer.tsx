import React, { useMemo } from "react";
import type { SponsorEntry, SponsorDisplayType, CampaignType } from "~/types/campaign.types";
import TextSponsor from "./TextSponsor";
import LogoSponsor from "./LogoSponsor";
import LogoWithNameSponsor from "./LogoWithNameSponsor";

interface SizeOrderedRendererProps {
  sponsors: SponsorEntry[];
  sponsorDisplayType: SponsorDisplayType;
  campaignType?: CampaignType;
}

const SizeOrderedRenderer: React.FC<SizeOrderedRendererProps> = ({
  sponsors,
  sponsorDisplayType,
  campaignType,
}) => {
  // Determine if this should use simple list layout (no card backgrounds)
  // For fixed and positional pricing, use simple list
  const isSimpleList = campaignType === "fixed" || campaignType === "positional";

  // Filter and sort sponsors - memoized to prevent unnecessary re-renders
  const sortedSponsors = useMemo(() => {
    // Filter sponsors with approved logos (if logo type)
    // Only filter out unapproved logos when we're actually displaying logos
    const approvedSponsors = sponsors.filter((s) => {
      // If we're displaying logos (logo-only or both), filter out unapproved logos
      if (sponsorDisplayType !== "text-only") {
        if (s.sponsorType === "logo" && s.logoApprovalStatus !== "approved")
          return false;
      }
      return true;
    });

    // For fixed price campaigns, sort by position ID (numerical order - ascending)
    // For positional campaigns, sort by position ID (reverse order - highest price first)
    // For other campaigns, sort by display size (largest first)
    if (campaignType === "fixed") {
      return [...approvedSponsors].sort((a, b) => {
        const posA = parseInt(a.positionId || "0", 10);
        const posB = parseInt(b.positionId || "0", 10);
        return posA - posB;
      });
    } else if (campaignType === "positional") {
      return [...approvedSponsors].sort((a, b) => {
        const posA = parseInt(a.positionId || "0", 10);
        const posB = parseInt(b.positionId || "0", 10);
        return posB - posA; // Reverse order - highest position (highest price) first
      });
    } else {
      const sizeOrder = { xlarge: 4, large: 3, medium: 2, small: 1 };
      return [...approvedSponsors].sort(
        (a, b) => sizeOrder[b.displaySize] - sizeOrder[a.displaySize]
      );
    }
  }, [sponsors, campaignType, sponsorDisplayType]);

  if (sortedSponsors.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "clamp(24px, 6vw, 40px)",
          color: "#999",
          fontSize: "clamp(14px, 2.5vw, 16px)",
        }}
      >
        No sponsors yet. Be the first!
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "clamp(12px, 3vw, 20px)",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(12px, 3vw, 20px)",
        maxWidth: "600px", // Portrait mode - limit width
        minHeight: "800px", // Portrait mode - taller than wide
        margin: "0 auto", // Center the container
        backgroundColor: "#1a1a1a",
        borderRadius: "8px",
      }}
    >
      {sortedSponsors.map((sponsor) => {
        const isPending = sponsor.paymentStatus === "pending";

        // Determine what to render based on sponsor type and display type
        const shouldShowLogoWithName =
          sponsor.sponsorType === "logo" &&
          sponsor.logoUrl &&
          sponsorDisplayType === "both" &&
          sponsor.displayName;

        const shouldShowLogoOnly =
          sponsor.sponsorType === "logo" &&
          sponsor.logoUrl &&
          (sponsorDisplayType === "logo-only" ||
           (sponsorDisplayType === "both" && !sponsor.displayName));

        const shouldShowText =
          sponsorDisplayType === "text-only" ||
          (sponsorDisplayType === "both" && sponsor.sponsorType === "text") ||
          (sponsorDisplayType === "logo-only" && sponsor.sponsorType === "text");

        return (
          <div
            key={sponsor._id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(6px, 1.5vw, 8px)",
              padding: isSimpleList ? "clamp(6px, 1.5vw, 8px)" : "clamp(8px, 2vw, 12px)",
              border: isSimpleList ? "none" : "1px solid #3a3a3a",
              borderRadius: "8px",
              backgroundColor: isSimpleList ? "transparent" : "#2a2a2a",
              boxShadow: isSimpleList ? "none" : "0 2px 4px rgba(0,0,0,0.3)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isSimpleList) {
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSimpleList) {
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
            {shouldShowLogoWithName && (
              <LogoWithNameSponsor
                name={sponsor.name}
                displayName={sponsor.displayName!}
                logoUrl={sponsor.logoUrl!}
                logoWidth={sponsor.calculatedLogoWidth || 100}
                message={sponsor.message}
                isPending={isPending}
              />
            )}
            {shouldShowLogoOnly && (
              <LogoSponsor
                name={sponsor.name}
                logoUrl={sponsor.logoUrl!}
                logoWidth={sponsor.calculatedLogoWidth || 100}
                message={sponsor.message}
                isPending={isPending}
              />
            )}
            {shouldShowText && (
              <TextSponsor
                name={sponsor.name}
                fontSize={sponsor.calculatedFontSize || 16}
                message={sponsor.message}
                isPending={isPending}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SizeOrderedRenderer;

