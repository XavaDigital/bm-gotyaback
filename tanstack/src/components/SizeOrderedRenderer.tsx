import React from "react";
import type { SponsorEntry, SponsorDisplayType } from "~/types/campaign.types";
import TextSponsor from "./TextSponsor";
import LogoSponsor from "./LogoSponsor";

interface SizeOrderedRendererProps {
  sponsors: SponsorEntry[];
  sponsorDisplayType: SponsorDisplayType;
}

const SizeOrderedRenderer: React.FC<SizeOrderedRendererProps> = ({
  sponsors,
  sponsorDisplayType,
}) => {
  // Filter sponsors with approved logos (if logo type)
  const approvedSponsors = sponsors.filter((s) => {
    if (s.sponsorType === "logo" && s.logoApprovalStatus !== "approved")
      return false;
    return true;
  });

  // Sort sponsors by display size (largest first)
  const sizeOrder = { xlarge: 4, large: 3, medium: 2, small: 1 };
  const sortedSponsors = [...approvedSponsors].sort(
    (a, b) => sizeOrder[b.displaySize] - sizeOrder[a.displaySize]
  );

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
      }}
    >
      {sortedSponsors.map((sponsor) => {
        const isPending = sponsor.paymentStatus === "pending";

        // Determine what to render based on sponsor type and display type
        const shouldShowText =
          sponsorDisplayType === "text-only" ||
          sponsorDisplayType === "both" ||
          (sponsorDisplayType === "logo-only" && sponsor.sponsorType === "text");

        const shouldShowLogo =
          sponsor.sponsorType === "logo" &&
          sponsor.logoUrl &&
          (sponsorDisplayType === "logo-only" || sponsorDisplayType === "both");

        return (
          <div
            key={sponsor._id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(6px, 1.5vw, 8px)",
              padding: "clamp(8px, 2vw, 12px)",
              border: "1px solid #3a3a3a",
              borderRadius: "8px",
              backgroundColor: "#2a2a2a",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {shouldShowLogo && (
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
                message={!shouldShowLogo ? sponsor.message : undefined}
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

