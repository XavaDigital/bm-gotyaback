import React from "react";
import type {
  ShirtLayout,
  SponsorEntry,
  SponsorDisplayType,
} from "~/types/campaign.types";
import LogoSponsor from "./LogoSponsor";
import LogoWithNameSponsor from "./LogoWithNameSponsor";
import TextSponsor from "./TextSponsor";

interface GridLayoutRendererProps {
  layout: ShirtLayout;
  sponsors: SponsorEntry[];
  sponsorDisplayType: SponsorDisplayType;
}

const GridLayoutRenderer: React.FC<GridLayoutRendererProps> = ({
  layout,
  sponsors,
  sponsorDisplayType,
}) => {
  // Create a map of positionId -> sponsor for quick lookup
  const sponsorMap = new Map<string, SponsorEntry>();
  sponsors.forEach((sponsor) => {
    if (sponsor.positionId && sponsor.paymentStatus === "paid") {
      // Convert positionId to string to ensure consistent comparison
      const positionKey = String(sponsor.positionId);
      sponsorMap.set(positionKey, sponsor);
    }
  });

  // Helper function to determine if a position should show "Reserved"
  // Reserved should only show when:
  // 1. The sponsor display type is "logo-only" or "both" (requires logo approval)
  // 2. AND there's a sponsor with a logo pending approval
  const shouldShowReserved = (sponsor: SponsorEntry | undefined): boolean => {
    if (!sponsor) return false;

    // For text-only campaigns, never show reserved (text sponsors don't need approval)
    if (sponsorDisplayType === "text-only") return false;

    // For logo-only or both, show reserved if sponsor has logo pending approval
    if (sponsorDisplayType === "logo-only" || sponsorDisplayType === "both") {
      return sponsor.sponsorType === "logo" && sponsor.logoApprovalStatus !== "approved";
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
        overflow: "hidden", // Prevent content from overflowing
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
          gap: "clamp(12px, 3vw, 24px)",
          alignContent: "start",
        }}
      >
        {layout.placements.map((position) => {
          // Convert positionId to string to ensure consistent comparison
          const positionKey = String(position.positionId);
          const sponsor = sponsorMap.get(positionKey);

          return (
            <div
              key={position.positionId}
              style={{
                backgroundColor: "transparent",
                border:
                  sponsor || position.isTaken
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
              {/* Position number badge - only show for empty and available positions */}
              {!sponsor && !position.isTaken && (
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
                  {/* Check if we should show "Reserved" for logo approval pending */}
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
                      {/* Show logo with name if sponsor has logo, displayName, and display type is 'both' */}
                      {sponsor.sponsorType === "logo" &&
                      sponsor.logoUrl &&
                      sponsor.logoApprovalStatus === "approved" &&
                      sponsorDisplayType === "both" &&
                      sponsor.displayName ? (
                        <LogoWithNameSponsor
                          name={sponsor.name}
                          displayName={sponsor.displayName}
                          logoUrl={sponsor.logoUrl}
                          message={sponsor.message}
                          isPending={sponsor.paymentStatus === "pending"}
                        />
                      ) : /* Show logo only if sponsor has logo and display type is logo-only or both (without displayName) */
                      sponsor.sponsorType === "logo" &&
                        sponsor.logoUrl &&
                        sponsor.logoApprovalStatus === "approved" &&
                        (sponsorDisplayType === "logo-only" ||
                          sponsorDisplayType === "both") ? (
                        <LogoSponsor
                          name={sponsor.name}
                          logoUrl={sponsor.logoUrl}
                          logoWidth={sponsor.calculatedLogoWidth || 100}
                          message={
                            sponsorDisplayType === "logo-only"
                              ? sponsor.message
                              : undefined
                          }
                          isPending={sponsor.paymentStatus === "pending"}
                        />
                      ) : null}

                      {/* Show text if display type allows it */}
                      {(sponsorDisplayType === "text-only" ||
                        (sponsorDisplayType === "both" &&
                          sponsor.sponsorType === "text") ||
                        (sponsorDisplayType === "logo-only" &&
                          sponsor.sponsorType === "text")) && (
                        <TextSponsor
                          name={sponsor.name}
                          fontSize={sponsor.calculatedFontSize || 16}
                          message={sponsor.message}
                          isPending={sponsor.paymentStatus === "pending"}
                        />
                      )}
                    </>
                  )}
                </>
              ) : position.isTaken ? (
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
};

export default GridLayoutRenderer;
