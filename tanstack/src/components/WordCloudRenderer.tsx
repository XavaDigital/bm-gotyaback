import React, { useEffect, useRef, useState, useMemo } from "react";
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

  // Filter sponsors with approved logos (if logo type) - memoized to prevent infinite loops
  const approvedSponsors = useMemo(() => {
    return sponsors.filter((s) => {
      if (s.sponsorType === "logo" && s.logoApprovalStatus !== "approved")
        return false;
      return true;
    });
  }, [sponsors]);

  useEffect(() => {
    if (approvedSponsors.length === 0 || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth || 600;
    const containerHeight = Math.max(800, approvedSponsors.length * 60); // Portrait: taller

    // Helper function to check if two rectangles overlap
    const checkCollision = (
      x1: number,
      y1: number,
      w1: number,
      h1: number,
      x2: number,
      y2: number,
      w2: number,
      h2: number,
      padding: number = 10
    ): boolean => {
      return !(
        x1 + w1 + padding < x2 ||
        x2 + w2 + padding < x1 ||
        y1 + h1 + padding < y2 ||
        y2 + h2 + padding < y1
      );
    };

    // Spiral placement algorithm with collision detection
    const positioned: PositionedSponsor[] = [];
    // Center the cloud horizontally
    const centerX = containerWidth / 2;

    // Check if sponsors have varying sizes (pay-what-you-want or positional with tiers)
    const sizes = approvedSponsors.map(s => s.calculatedFontSize || s.calculatedLogoWidth || 20);
    const hasVaryingSizes = Math.max(...sizes) - Math.min(...sizes) > 5;
    const maxSize = Math.max(...sizes);

    // Adjust center Y based on whether we have varying sizes
    // For varying sizes (especially large ones), position center higher to accommodate larger items
    let centerYPercent = 0.31; // Default for uniform sizes
    if (hasVaryingSizes) {
      // For varying sizes, adjust based on max size
      // Larger max sizes need more room, so position center higher
      if (maxSize >= 24) {
        centerYPercent = 0.35; // More space for large items
      } else if (maxSize >= 20) {
        centerYPercent = 0.33;
      }
    }
    const centerY = containerHeight * centerYPercent;

    // Sort sponsors by size (largest first) for better packing
    const sortedSponsors = [...approvedSponsors].sort((a, b) => {
      const sizeA = a.calculatedFontSize || a.calculatedLogoWidth || 20;
      const sizeB = b.calculatedFontSize || b.calculatedLogoWidth || 20;
      return sizeB - sizeA;
    });

    sortedSponsors.forEach((sponsor, index) => {
      // Calculate size based on amount or display size
      const baseSize =
        sponsor.calculatedFontSize || sponsor.calculatedLogoWidth || 20;

      // More accurate width estimation based on name length
      const nameLength = sponsor.name.length;
      const width = Math.max(baseSize * nameLength * 0.6, baseSize * 3);
      const height = baseSize * 1.5;

      let placed = false;
      let attempts = 0;
      const maxAttempts = 1000;

      // Start with smaller radius for tighter cloud
      const startRadius = index === 0 ? 0 : 10;

      // Try to find a non-colliding position using spiral search
      while (!placed && attempts < maxAttempts) {
        const angle = attempts * 0.5; // Moderate spiral speed
        const radius = startRadius + attempts * 8; // Tighter spacing for cloud effect

        // Add some randomness to avoid perfect spirals
        const randomOffset = Math.sin(attempts * 0.7) * 15;

        // Compress vertically (0.6x) to create more horizontal cloud shape
        const x = centerX + (radius + randomOffset) * Math.cos(angle) - width / 2;
        const y = centerY + (radius + randomOffset) * Math.sin(angle) * 0.6 - height / 2;

        // Ensure within bounds with padding
        const boundedX = Math.max(20, Math.min(x, containerWidth - width - 20));
        const boundedY = Math.max(40, Math.min(y, containerHeight - height - 40));

        // Check for collisions with already placed sponsors
        let hasCollision = false;
        for (const existing of positioned) {
          if (
            checkCollision(
              boundedX,
              boundedY,
              width,
              height,
              existing.x,
              existing.y,
              existing.width,
              existing.height,
              12 // Moderate padding for cloud density
            )
          ) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) {
          positioned.push({
            ...sponsor,
            x: boundedX,
            y: boundedY,
            width,
            height,
          });
          placed = true;
        }

        attempts++;
      }

      // Fallback: if we couldn't find a spot, place it anyway (shouldn't happen often)
      if (!placed) {
        const angle = index * 0.7;
        const radius = 50 + index * 20;
        const x = centerX + radius * Math.cos(angle) - width / 2;
        const y = centerY + radius * Math.sin(angle) * 0.6 - height / 2;

        positioned.push({
          ...sponsor,
          x: Math.max(20, Math.min(x, containerWidth - width - 20)),
          y: Math.max(40, Math.min(y, containerHeight - height - 40)),
          width,
          height,
        });
      }
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
        maxWidth: "600px", // Portrait mode - limit width
        minHeight: "800px", // Portrait mode - taller than wide
        margin: "0 auto", // Center the container
        backgroundColor: "#1a1a1a",
        borderRadius: "8px",
        overflow: "hidden",
        padding: "40px 20px", // Add padding top/bottom and left/right
        boxSizing: "border-box",
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

