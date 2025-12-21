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
  // Filter sponsors with approved logos (if logo type)
  // Show both pending and paid sponsors
  const approvedSponsors = sponsors.filter((s) => {
    if (s.sponsorType === "logo" && s.logoApprovalStatus !== "approved")
      return false;
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
    const isPending = sponsor.paymentStatus === "pending";

    return (
      <div
        key={sponsor._id}
        style={{
          marginBottom: "12px",
          transition: "transform 0.2s",
          opacity: isPending ? 0.6 : 1,
          border: "1px solid #3a3a3a",
          borderRadius: "8px",
          padding: "16px 20px",
          backgroundColor: "#2a2a2a",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: sponsor.message ? "12px" : "0",
            paddingBottom: sponsor.message ? "12px" : "0",
            borderBottom: sponsor.message ? "1px solid #3a3a3a" : "none",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#ffffff",
            }}
          >
            {sponsor.name}
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#C8102E",
            }}
          >
            ${sponsor.amount}
          </div>
        </div>
        {sponsor.message && (
          <div
            style={{
              fontSize: "15px",
              fontStyle: "italic",
              color: "#cccccc",
            }}
          >
            {sponsor.message}
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

  // Full-width card list for all layout styles
  return <div>{sortedSponsors.map(renderSponsor)}</div>;
};

export default FlexibleLayoutRenderer;
