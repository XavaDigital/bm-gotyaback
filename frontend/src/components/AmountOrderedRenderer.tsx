import React, { useMemo } from "react";
import type {
  SponsorEntry,
  SponsorDisplayType,
  ShirtLayout,
} from "~/types/campaign.types";
import TextSponsor from "./TextSponsor";
import LogoSponsor from "./LogoSponsor";
import LogoWithNameSponsor from "./LogoWithNameSponsor";

interface AmountOrderedRendererProps {
  sponsors: SponsorEntry[];
  sponsorDisplayType: SponsorDisplayType;
  layout?: ShirtLayout; // Optional layout for grid-based display
  campaignType?: string; // To determine if this is PWYW
}

const AmountOrderedRenderer: React.FC<AmountOrderedRendererProps> = ({
  sponsors,
  sponsorDisplayType,
  layout,
  campaignType,
}) => {
  // Check if this is a grid-based layout (PWYW + ordered with layout)
  const isGridBased =
    layout &&
    layout.layoutType === "grid" &&
    campaignType === "pay-what-you-want";

  // Sort sponsors by amount (highest first) - memoized to prevent unnecessary re-renders
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

    // Sort by amount (highest first)
    return approvedSponsors.sort((a, b) => b.amount - a.amount);
  }, [sponsors, sponsorDisplayType]);

  if (sortedSponsors.length === 0 && !isGridBased) {
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

  // For grid-based layout (PWYW + ordered), use 3 columns (portrait orientation for garments)
  // For section-based layout (Positional + section), use dynamic columns
  const columns = isGridBased
    ? 3
    : Math.min(4, Math.ceil(Math.sqrt(sortedSponsors.length)));

  // For grid-based layout, create position map and render with empty positions
  if (isGridBased && layout) {
    // Create a map of positionId -> sponsor (sorted by amount, highest first)
    const positionSponsorMap = new Map<number, SponsorEntry>();
    sortedSponsors.forEach((sponsor, index) => {
      // Assign sponsors to positions based on their rank (1st highest = position 1, etc.)
      const positionId = index + 1;
      if (positionId <= layout.placements.length) {
        positionSponsorMap.set(positionId, sponsor);
      }
    });

    // Helper function to determine if should show "Reserved"
    const shouldShowReserved = (sponsor: SponsorEntry | undefined): boolean => {
      if (!sponsor) return false;
      if (sponsorDisplayType === "text-only") return false;
      if (sponsorDisplayType === "logo-only" || sponsorDisplayType === "both") {
        return (
          sponsor.sponsorType === "logo" &&
          sponsor.logoApprovalStatus !== "approved"
        );
      }
      return false;
    };

    return (
      <div
        style={{
          backgroundColor: "#1a1a1a",
          padding: "clamp(24px, 5vw, 48px)",
          borderRadius: "16px",
          maxWidth: "min(500px, 100%)",
          margin: "0 auto",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: "clamp(12px, 3vw, 24px)",
            alignContent: "start",
          }}
        >
          {layout.placements.map((position) => {
            // Convert positionId to number if it's a string
            const posId =
              typeof position.positionId === "string"
                ? parseInt(position.positionId, 10)
                : position.positionId;
            const sponsor = positionSponsorMap.get(posId);

            return (
              <div
                key={position.positionId}
                style={{
                  backgroundColor: "transparent",
                  border: sponsor
                    ? "none"
                    : "1px dashed rgba(255, 255, 255, 0.3)",
                  borderRadius: "4px",
                  padding: "clamp(8px, 2vw, 16px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "clamp(80px, 15vw, 120px)",
                  maxHeight: "clamp(100px, 20vw, 150px)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Position number badge - show rank for filled positions, position number for empty */}
                {!sponsor && (
                  <div
                    style={{
                      position: "absolute",
                      top: "4px",
                      left: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: "bold",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    #{position.positionId}
                  </div>
                )}

                {sponsor ? (
                  <>
                    {shouldShowReserved(sponsor) ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          width: "100%",
                          color: "rgba(255, 255, 255, 0.5)",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "16px", marginBottom: "4px" }}>
                          🔒
                        </div>
                        <div
                          style={{
                            fontSize: "clamp(10px, 2vw, 12px)",
                            fontStyle: "italic",
                            lineHeight: "1.2",
                          }}
                        >
                          Reserved
                        </div>
                      </div>
                    ) : (
                      <>
                        {sponsor.sponsorType === "logo" &&
                        sponsor.logoUrl &&
                        sponsor.logoApprovalStatus === "approved" &&
                        sponsorDisplayType === "both" &&
                        sponsor.displayName ? (
                          <LogoWithNameSponsor
                            name={sponsor.name}
                            displayName={sponsor.displayName}
                            logoUrl={sponsor.logoUrl}
                            logoWidth={sponsor.calculatedLogoWidth || 100}
                            message={sponsor.message}
                            isPending={sponsor.paymentStatus === "pending"}
                          />
                        ) : sponsor.sponsorType === "logo" &&
                          sponsor.logoUrl &&
                          sponsor.logoApprovalStatus === "approved" &&
                          (sponsorDisplayType === "logo-only" ||
                            (sponsorDisplayType === "both" &&
                              !sponsor.displayName)) ? (
                          <LogoSponsor
                            name={sponsor.name}
                            logoUrl={sponsor.logoUrl}
                            logoWidth={sponsor.calculatedLogoWidth || 100}
                            message={sponsor.message}
                            isPending={sponsor.paymentStatus === "pending"}
                          />
                        ) : sponsorDisplayType === "text-only" ||
                          (sponsorDisplayType === "both" &&
                            sponsor.sponsorType === "text") ||
                          (sponsorDisplayType === "logo-only" &&
                            sponsor.sponsorType === "text") ? (
                          <TextSponsor
                            name={sponsor.name}
                            fontSize={sponsor.calculatedFontSize || 16}
                            message={sponsor.message}
                            isPending={sponsor.paymentStatus === "pending"}
                          />
                        ) : null}
                      </>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      color: "rgba(255, 255, 255, 0.4)",
                      fontSize: "clamp(11px, 2.5vw, 13px)",
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    Available
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Section-based layout (Positional + section) - original implementation
  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        padding: "clamp(24px, 5vw, 48px)",
        borderRadius: "16px",
        maxWidth: "min(500px, 100%)",
        margin: "0 auto",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "clamp(12px, 3vw, 24px)",
          alignContent: "start",
        }}
      >
        {sortedSponsors.map((sponsor, index) => {
          const isPending = sponsor.paymentStatus === "pending";

          // Helper function to determine if should show "Reserved"
          const shouldShowReserved = (): boolean => {
            if (sponsorDisplayType === "text-only") return false;
            if (
              sponsorDisplayType === "logo-only" ||
              sponsorDisplayType === "both"
            ) {
              return (
                sponsor.sponsorType === "logo" &&
                sponsor.logoApprovalStatus !== "approved"
              );
            }
            return false;
          };

          const shouldShowLogoWithName =
            sponsor.sponsorType === "logo" &&
            sponsor.logoUrl &&
            sponsor.logoApprovalStatus === "approved" &&
            sponsorDisplayType === "both" &&
            sponsor.displayName;

          const shouldShowLogoOnly =
            sponsor.sponsorType === "logo" &&
            sponsor.logoUrl &&
            sponsor.logoApprovalStatus === "approved" &&
            (sponsorDisplayType === "logo-only" ||
              (sponsorDisplayType === "both" && !sponsor.displayName));

          const shouldShowText =
            sponsorDisplayType === "text-only" ||
            (sponsorDisplayType === "both" && sponsor.sponsorType === "text") ||
            (sponsorDisplayType === "logo-only" &&
              sponsor.sponsorType === "text");

          return (
            <div
              key={sponsor._id}
              style={{
                backgroundColor: "transparent",
                border: "2px solid #3a3a3a",
                borderRadius: "12px",
                padding: "clamp(12px, 3vw, 20px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "clamp(80px, 18vw, 120px)",
                position: "relative",
                transition: "all 0.2s ease",
              }}
            >
              {/* Rank badge - show position number */}
              <div
                style={{
                  position: "absolute",
                  top: "clamp(4px, 1vw, 8px)",
                  left: "clamp(4px, 1vw, 8px)",
                  backgroundColor: "#ffd700",
                  color: "#000",
                  borderRadius: "50%",
                  width: "clamp(20px, 5vw, 28px)",
                  height: "clamp(20px, 5vw, 28px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "clamp(10px, 2.5vw, 14px)",
                  fontWeight: "bold",
                }}
              >
                {index + 1}
              </div>

              {shouldShowReserved() ? (
                <div
                  style={{
                    fontSize: "clamp(12px, 3vw, 16px)",
                    color: "#999",
                    textAlign: "center",
                  }}
                >
                  🔒 Reserved
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AmountOrderedRenderer;
