import React, { useEffect, useRef, useState, useMemo } from "react";
import type { SponsorEntry, SponsorDisplayType } from "~/types/campaign.types";
import TextSponsor from "./TextSponsor";
import LogoSponsor from "./LogoSponsor";
import LogoWithNameSponsor from "./LogoWithNameSponsor";

/**
 * WordCloudRenderer - Hybrid implementation
 *
 * - Text-only mode: Uses wordcloud2.js library for professional word cloud rendering
 * - Logo-only & both modes: Uses custom spiral placement algorithm with improved tight packing
 *
 * NOTE: The original custom implementation for all modes is preserved in
 * WordCloudRenderer.legacy.tsx in case we want to revert to custom text rendering
 */

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [positionedSponsors, setPositionedSponsors] = useState<
    PositionedSponsor[]
  >([]);

  // Filter sponsors with approved logos (if logo type) - memoized to prevent infinite loops
  // Only filter out unapproved logos when we're actually displaying logos
  const approvedSponsors = useMemo(() => {
    return sponsors.filter((s) => {
      // If we're displaying logos (logo-only or both), filter out unapproved logos
      if (sponsorDisplayType !== "text-only") {
        if (s.sponsorType === "logo" && s.logoApprovalStatus !== "approved")
          return false;
      }
      return true;
    });
  }, [sponsors, sponsorDisplayType]);

  // Use wordcloud2.js for text-only mode
  const isTextOnlyMode = sponsorDisplayType === "text-only";

  // Effect for wordcloud2.js (text-only mode)
  useEffect(() => {
    if (!isTextOnlyMode || approvedSponsors.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!container) return;

    // Dynamically import wordcloud only in the browser
    let isMounted = true;

    const loadWordCloud = async () => {
      try {
        // @ts-ignore - wordcloud doesn't have types
        const WordCloud = (await import("wordcloud")).default;

        if (!isMounted || !canvasRef.current) return;

        // Set canvas size
        const width = 600;
        const height = Math.max(800, approvedSponsors.length * 60);
        canvas.width = width;
        canvas.height = height;

        // Prepare word list for wordcloud2.js
        const wordList = approvedSponsors.map((sponsor) => {
          const fontSize = sponsor.calculatedFontSize || 16;
          return [sponsor.name, fontSize];
        });

        // Generate word cloud
        WordCloud(canvas, {
          list: wordList,
          gridSize: 8, // Smaller grid for tighter packing
          weightFactor: 1,
          fontFamily: "Arial, sans-serif",
          fontWeight: "600",
          color: () => {
            // Random colors for variety
            const colors = ["#ffffff", "#e0e0e0", "#c0c0c0", "#a0a0a0"];
            return colors[Math.floor(Math.random() * colors.length)];
          },
          rotateRatio: 0.3, // 30% chance of rotation
          rotationSteps: 2, // Only 0 or 90 degrees
          backgroundColor: "transparent",
          drawOutOfBound: false,
          shrinkToFit: true,
          minSize: 12,
          // Add click handler for interactivity
          click: (item: any) => {
            // Find the sponsor by name
            const sponsor = approvedSponsors.find((s) => s.name === item[0]);
            if (sponsor?.message) {
              alert(sponsor.message); // Simple alert for now, can be improved
            }
          },
        });
      } catch (error) {
        console.error("Failed to load wordcloud library:", error);
      }
    };

    loadWordCloud();

    // Cleanup
    return () => {
      isMounted = false;
      // Note: WordCloud.stop() is not available in cleanup since it's dynamically imported
    };
  }, [isTextOnlyMode, approvedSponsors]);

  // Effect for custom implementation (logo-only and both modes)
  useEffect(() => {
    if (isTextOnlyMode || approvedSponsors.length === 0 || !containerRef.current) return;

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

      // Determine what will be shown for this sponsor
      const isLogoSponsor = sponsor.sponsorType === "logo" && sponsor.logoUrl;
      const hasDisplayName = !!sponsor.displayName;

      const willShowLogoWithName =
        isLogoSponsor &&
        sponsorDisplayType === "both" &&
        hasDisplayName;

      const willShowLogoOnly =
        isLogoSponsor &&
        (sponsorDisplayType === "logo-only" ||
         (sponsorDisplayType === "both" && !hasDisplayName));

      const willShowTextOnly =
        sponsorDisplayType === "text-only" ||
        (sponsorDisplayType === "both" && sponsor.sponsorType === "text") ||
        (sponsorDisplayType === "logo-only" && sponsor.sponsorType === "text");

      // Calculate width and height based on what will actually be displayed
      // IMPROVED: Reduced padding for tighter packing
      let width: number;
      let height: number;

      if (willShowLogoWithName) {
        // Logo with name underneath: use logo width, add heights
        const logoWidth = sponsor.calculatedLogoWidth || 100;
        const logoHeight = logoWidth * 0.8; // More accurate logo height
        const textHeight = 12 * 1.2 * 2; // fontSize * lineHeight * max 2 lines
        width = Math.max(logoWidth + 16, 60); // REDUCED padding from 40 to 16
        height = logoHeight + textHeight + 12; // REDUCED gap from 20 to 12
      } else if (willShowLogoOnly) {
        // Logo only
        const logoWidth = sponsor.calculatedLogoWidth || 100;
        width = logoWidth + 16; // REDUCED padding from 30 to 16
        height = logoWidth * 0.8 + 16; // More accurate height
      } else {
        // Text only
        const nameLength = sponsor.name.length;
        width = Math.max(baseSize * nameLength * 0.6, baseSize * 3);
        height = baseSize * 1.5;
      }

      let placed = false;
      let attempts = 0;
      const maxAttempts = 2000; // INCREASED from 1000 for better placement

      // Start with smaller radius for tighter cloud
      const startRadius = index === 0 ? 0 : 5; // REDUCED from 10 to 5

      // Try to find a non-colliding position using spiral search
      while (!placed && attempts < maxAttempts) {
        const angle = attempts * 0.4; // REDUCED from 0.5 for tighter spiral
        const radius = startRadius + attempts * 4; // REDUCED from 8 to 4 for tighter spacing

        // Add some randomness to avoid perfect spirals
        const randomOffset = Math.sin(attempts * 0.7) * 8; // REDUCED from 15 to 8

        // Compress vertically (0.6x) to create more horizontal cloud shape
        const x = centerX + (radius + randomOffset) * Math.cos(angle) - width / 2;
        const y = centerY + (radius + randomOffset) * Math.sin(angle) * 0.6 - height / 2;

        // Ensure within bounds with padding
        const boundedX = Math.max(10, Math.min(x, containerWidth - width - 10)); // REDUCED from 20 to 10
        const boundedY = Math.max(20, Math.min(y, containerHeight - height - 20)); // REDUCED from 40 to 20

        // Check for collisions with already placed sponsors
        let hasCollision = false;
        const collisionPadding = 6; // REDUCED from 12 to 6 for tighter packing
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
              collisionPadding
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
          x: Math.max(10, Math.min(x, containerWidth - width - 10)),
          y: Math.max(20, Math.min(y, containerHeight - height - 20)),
          width,
          height,
        });
      }
    });

    setPositionedSponsors(positioned);
  }, [isTextOnlyMode, approvedSponsors, sponsorDisplayType]);

  if (approvedSponsors.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
        No sponsors yet. Be the first!
      </div>
    );
  }

  // Render wordcloud2.js canvas for text-only mode
  if (isTextOnlyMode) {
    return (
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "600px",
          minHeight: "800px",
          margin: "0 auto",
          backgroundColor: "#1a1a1a",
          borderRadius: "8px",
          overflow: "hidden",
          padding: "40px 20px",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: "100%",
            height: "auto",
          }}
        />
      </div>
    );
  }

  // Render custom implementation for logo-only and both modes
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
              position: "absolute",
              left: `${sponsor.x}px`,
              top: `${sponsor.y}px`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px", // REDUCED from 4px to 2px
              padding: "4px", // REDUCED from 8px to 4px
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

export default WordCloudRenderer;

