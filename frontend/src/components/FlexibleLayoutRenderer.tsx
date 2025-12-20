import React from "react";
import type { SponsorEntry, LayoutStyle } from "../types/campaign.types";

interface FlexibleLayoutRendererProps {
  sponsors: SponsorEntry[];
  layoutStyle: LayoutStyle;
  sponsorDisplayType: "text-only" | "logo-only" | "both";
}

const FlexibleLayoutRenderer: React.FC<FlexibleLayoutRendererProps> = ({
  sponsors,
  layoutStyle,
  sponsorDisplayType,
}) => {
  // Filter only paid sponsors with approved logos (if logo type)
  const approvedSponsors = sponsors.filter((s) => {
    if (s.paymentStatus !== "paid") return false;
    if (s.sponsorType === "logo" && s.logoApprovalStatus !== "approved") return false;
    return true;
  });

  // Sort sponsors based on layout style
  const sortedSponsors = [...approvedSponsors].sort((a, b) => {
    if (layoutStyle === "size-ordered") {
      // Largest first (by display size)
      const sizeOrder = { xlarge: 4, large: 3, medium: 2, small: 1 };
      return sizeOrder[b.displaySize] - sizeOrder[a.displaySize];
    } else if (layoutStyle === "amount-ordered") {
      // Highest payers first
      return b.amount - a.amount;
    }
    // For word-cloud, keep original order (or randomize)
    return 0;
  });

  // Render sponsor based on type
  const renderSponsor = (sponsor: SponsorEntry) => {
    const fontSize = sponsor.calculatedFontSize || 16;
    const logoWidth = sponsor.calculatedLogoWidth || 80;

    return (
      <div
        key={sponsor._id}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          margin: layoutStyle === "word-cloud" ? "8px" : "12px",
          padding: "8px",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {sponsor.sponsorType === "logo" && sponsor.logoUrl ? (
          <img
            src={sponsor.logoUrl}
            alt={sponsor.name}
            style={{
              width: logoWidth,
              height: "auto",
              objectFit: "contain",
              maxHeight: logoWidth,
            }}
            title={`${sponsor.name} - $${sponsor.amount}`}
          />
        ) : (
          <div
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: "600",
              color: "#333",
              textAlign: "center",
            }}
            title={sponsor.message || `${sponsor.name} - $${sponsor.amount}`}
          >
            {sponsor.name}
          </div>
        )}
      </div>
    );
  };

  if (sortedSponsors.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
        No sponsors yet. Be the first!
      </div>
    );
  }

  // Different layouts based on style
  if (layoutStyle === "word-cloud") {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          minHeight: 200,
        }}
      >
        {sortedSponsors.map(renderSponsor)}
      </div>
    );
  }

  // Size-ordered or amount-ordered (grid layout)
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 16,
        padding: 20,
      }}
    >
      {sortedSponsors.map((sponsor) => {
        const fontSize = sponsor.calculatedFontSize || 16;
        const logoWidth = sponsor.calculatedLogoWidth || 80;

        return (
          <div
            key={sponsor._id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              border: "1px solid #e8e8e8",
              borderRadius: 8,
              background: "#fafafa",
              minHeight: 120,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {sponsor.sponsorType === "logo" && sponsor.logoUrl ? (
              <img
                src={sponsor.logoUrl}
                alt={sponsor.name}
                style={{
                  width: logoWidth,
                  height: "auto",
                  objectFit: "contain",
                  maxHeight: logoWidth,
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: `${fontSize}px`,
                  fontWeight: "600",
                  color: "#333",
                  textAlign: "center",
                  wordBreak: "break-word",
                }}
              >
                {sponsor.name}
              </div>
            )}
            {sponsor.message && sponsorDisplayType !== "logo-only" && (
              <div
                style={{
                  fontSize: 12,
                  color: "#666",
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                {sponsor.message}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FlexibleLayoutRenderer;

