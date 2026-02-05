import React, { useMemo } from "react";
import type { SponsorEntry, SponsorDisplayType } from "~/types/campaign.types";
import TextSponsor from "./TextSponsor";
import LogoSponsor from "./LogoSponsor";
import LogoWithNameSponsor from "./LogoWithNameSponsor";

interface AmountOrderedRendererProps {
  sponsors: SponsorEntry[];
  sponsorDisplayType: SponsorDisplayType;
}

interface PriceTier {
  label: string;
  minAmount: number;
  maxAmount: number | null;
  sponsors: SponsorEntry[];
  position: "top" | "center" | "bottom";
}

const AmountOrderedRenderer: React.FC<AmountOrderedRendererProps> = ({
  sponsors,
  sponsorDisplayType,
}) => {
  // Group sponsors into price tiers - memoized to prevent unnecessary re-renders
  const priceTiers = useMemo(() => {
    // Filter sponsors with approved logos (if logo type)
    const approvedSponsors = sponsors.filter((s) => {
      if (s.sponsorType === "logo" && s.logoApprovalStatus !== "approved")
        return false;
      return true;
    });

    if (approvedSponsors.length === 0) return [];

    // Get all unique amounts and sort them
    const amounts = [...new Set(approvedSponsors.map(s => s.amount))].sort((a, b) => b - a);

    // Create price ranges based on the distribution of amounts
    const tiers: PriceTier[] = [];

    if (amounts.length === 1) {
      // Only one price point - put in center
      tiers.push({
        label: `$${amounts[0]}`,
        minAmount: amounts[0],
        maxAmount: amounts[0],
        sponsors: approvedSponsors.filter(s => s.amount === amounts[0]),
        position: "center"
      });
    } else if (amounts.length === 2) {
      // Two price points - high in center, low at bottom
      tiers.push({
        label: `$${amounts[0]}`,
        minAmount: amounts[0],
        maxAmount: amounts[0],
        sponsors: approvedSponsors.filter(s => s.amount === amounts[0]),
        position: "center"
      });
      tiers.push({
        label: `$${amounts[1]}`,
        minAmount: amounts[1],
        maxAmount: amounts[1],
        sponsors: approvedSponsors.filter(s => s.amount === amounts[1]),
        position: "bottom"
      });
    } else {
      // Three or more price points - divide into thirds
      const third = Math.ceil(amounts.length / 3);

      // Top tier (medium-high prices)
      const topAmounts = amounts.slice(third, third * 2);
      if (topAmounts.length > 0) {
        tiers.push({
          label: topAmounts.length === 1 ? `$${topAmounts[0]}` : `$${topAmounts[topAmounts.length - 1]} - $${topAmounts[0]}`,
          minAmount: topAmounts[topAmounts.length - 1],
          maxAmount: topAmounts[0],
          sponsors: approvedSponsors.filter(s => topAmounts.includes(s.amount)),
          position: "top"
        });
      }

      // Center tier (highest prices)
      const centerAmounts = amounts.slice(0, third);
      tiers.push({
        label: centerAmounts.length === 1 ? `$${centerAmounts[0]}` : `$${centerAmounts[centerAmounts.length - 1]} - $${centerAmounts[0]}`,
        minAmount: centerAmounts[centerAmounts.length - 1],
        maxAmount: centerAmounts[0],
        sponsors: approvedSponsors.filter(s => centerAmounts.includes(s.amount)),
        position: "center"
      });

      // Bottom tier (lowest prices)
      const bottomAmounts = amounts.slice(third * 2);
      if (bottomAmounts.length > 0) {
        tiers.push({
          label: bottomAmounts.length === 1 ? `$${bottomAmounts[0]}` : `$${bottomAmounts[bottomAmounts.length - 1]} - $${bottomAmounts[0]}`,
          minAmount: bottomAmounts[bottomAmounts.length - 1],
          maxAmount: bottomAmounts[0],
          sponsors: approvedSponsors.filter(s => bottomAmounts.includes(s.amount)),
          position: "bottom"
        });
      }
    }

    // Sort tiers by position: top, center, bottom
    return tiers.sort((a, b) => {
      const order = { top: 0, center: 1, bottom: 2 };
      return order[a.position] - order[b.position];
    });
  }, [sponsors]);

  if (priceTiers.length === 0) {
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
        flexDirection: "column",
        gap: "clamp(40px, 8vw, 60px)", // Large gap between sections for obvious separation
        padding: "clamp(30px, 6vw, 50px) clamp(20px, 4vw, 40px)",
        maxWidth: "600px",
        minHeight: "800px",
        margin: "0 auto",
        backgroundColor: "#1a1a1a",
        borderRadius: "8px",
      }}
    >
      {priceTiers.map((tier, tierIndex) => (
        <div
          key={tierIndex}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "clamp(12px, 3vw, 16px)",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(16px, 3vw, 24px)",
            backgroundColor: "transparent",
            minHeight: "clamp(80px, 15vw, 120px)", // Ensure each section has minimum height
          }}
        >
          {tier.sponsors.map((sponsor) => {
            const isPending = sponsor.paymentStatus === "pending";

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
                  gap: "clamp(4px, 1vw, 6px)",
                  padding: "clamp(6px, 1.5vw, 8px)",
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
      ))}
    </div>
  );
};

export default AmountOrderedRenderer;

