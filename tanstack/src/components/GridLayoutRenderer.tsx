import React from "react";
import type { ShirtLayout, SponsorEntry, SponsorDisplayType } from "~/types/campaign.types";
import LogoSponsor from "./LogoSponsor";
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
      sponsorMap.set(sponsor.positionId, sponsor);
    }
  });

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        padding: "clamp(24px, 5vw, 48px)",
        borderRadius: "16px",
        maxWidth: "min(500px, 100%)",
        margin: "0 auto",
        width: "100%",
        aspectRatio: "3 / 4", // Portrait orientation
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
          gap: "clamp(12px, 3vw, 24px)",
          height: "100%",
          alignContent: "start",
        }}
      >
        {layout.placements.map((position) => {
          const sponsor = sponsorMap.get(position.positionId);

          return (
            <div
              key={position.positionId}
              style={{
                backgroundColor: "transparent",
                border: sponsor ? "none" : "1px dashed rgba(255, 255, 255, 0.3)",
                borderRadius: "4px",
                padding: "clamp(8px, 2vw, 16px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "clamp(80px, 15vw, 120px)",
                position: "relative",
              }}
            >
              {/* Position number badge - only show for empty positions */}
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
                {/* Show logo if sponsor has logo and display type allows it */}
                {sponsor.sponsorType === "logo" &&
                sponsor.logoUrl &&
                sponsor.logoApprovalStatus === "approved" &&
                (sponsorDisplayType === "logo-only" || sponsorDisplayType === "both") ? (
                  <LogoSponsor
                    name={sponsor.name}
                    logoUrl={sponsor.logoUrl}
                    logoWidth={sponsor.calculatedLogoWidth || 100}
                    message={sponsorDisplayType === "logo-only" ? sponsor.message : undefined}
                    isPending={sponsor.paymentStatus === "pending"}
                  />
                ) : null}

                {/* Show text if display type allows it */}
                {(sponsorDisplayType === "text-only" ||
                  sponsorDisplayType === "both" ||
                  (sponsorDisplayType === "logo-only" && sponsor.sponsorType === "text")) && (
                  <TextSponsor
                    name={sponsor.name}
                    fontSize={sponsor.calculatedFontSize || 16}
                    message={
                      sponsorDisplayType === "logo-only" && sponsor.sponsorType === "logo"
                        ? undefined
                        : sponsor.message
                    }
                    isPending={sponsor.paymentStatus === "pending"}
                  />
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
};

export default GridLayoutRenderer;

