import React, { useEffect, useRef, useState } from "react";
import type { SponsorEntry, SponsorDisplayType } from "~/types/campaign.types";
import TextSponsor from "./TextSponsor";
import LogoSponsor from "./LogoSponsor";

interface WordCloudRendererProps {
  sponsors: SponsorEntry[];
  sponsorDisplayType: SponsorDisplayType;
}

interface PositionedSponsor extends SponsorEntry {
  x: number;
  y: number;
  width: number;
  height: number;
}

const WordCloudRenderer: React.FC<WordCloudRendererProps> = ({
  sponsors,
  sponsorDisplayType,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positionedSponsors, setPositionedSponsors] = useState<
    PositionedSponsor[]
  >([]);

  // Filter sponsors with approved logos (if logo type)
  const approvedSponsors = sponsors.filter((s) => {
    if (s.sponsorType === "logo" && s.logoApprovalStatus !== "approved")
      return false;
    return true;
  });

  useEffect(() => {
    if (approvedSponsors.length === 0 || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth || 800;
    const containerHeight = Math.max(600, approvedSponsors.length * 50);

    // Simple spiral placement algorithm
    const positioned: PositionedSponsor[] = [];
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    approvedSponsors.forEach((sponsor, index) => {
      // Calculate size based on amount or display size
      const baseSize =
        sponsor.calculatedFontSize || sponsor.calculatedLogoWidth || 20;
      const width = baseSize * 3; // Approximate width
      const height = baseSize * 1.5; // Approximate height

      // Spiral positioning
      const angle = index * 0.5;
      const radius = 20 + index * 15;
      const x = centerX + radius * Math.cos(angle) - width / 2;
      const y = centerY + radius * Math.sin(angle) - height / 2;

      positioned.push({
        ...sponsor,
        x: Math.max(0, Math.min(x, containerWidth - width)),
        y: Math.max(0, Math.min(y, containerHeight - height)),
        width,
        height,
      });
    });

    setPositionedSponsors(positioned);
  }, [approvedSponsors]);

  if (approvedSponsors.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
        No sponsors yet. Be the first!
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "600px",
        backgroundColor: "#1a1a1a",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {positionedSponsors.map((sponsor) => {
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
              position: "absolute",
              left: `${sponsor.x}px`,
              top: `${sponsor.y}px`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "8px",
              transition: "transform 0.2s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.zIndex = "10";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.zIndex = "1";
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

export default WordCloudRenderer;

