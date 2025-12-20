import React from "react";
import type {
  ShirtLayout as ShirtLayoutType,
  Position,
  SponsorEntry,
} from "../types/campaign.types";

interface ShirtLayoutProps {
  layout: ShirtLayoutType;
  selectedPosition?: string;
  onPositionSelect?: (positionId: string, price: number) => void;
  readonly?: boolean;
  currency?: string;
  showPriceGradient?: boolean; // New prop for positional pricing visualization
  sponsors?: SponsorEntry[]; // New prop to display sponsor info
}

const ShirtLayout: React.FC<ShirtLayoutProps> = ({
  layout,
  selectedPosition,
  onPositionSelect,
  readonly = false,
  currency = "NZD",
  showPriceGradient = false,
  sponsors = [],
}) => {
  const handlePositionClick = (position: Position) => {
    if (readonly || position.isTaken) return;
    if (onPositionSelect) {
      onPositionSelect(position.positionId, position.price);
    }
  };

  // Get sponsor for a position
  const getSponsorForPosition = (
    positionId: string
  ): SponsorEntry | undefined => {
    return sponsors.find(
      (s) => s.positionId === positionId && s.paymentStatus === "paid"
    );
  };

  // Calculate min and max prices for gradient
  const getPriceRange = () => {
    if (layout.placements.length === 0) return { min: 0, max: 0 };
    const prices = layout.placements.map((p) => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  };

  // Get color based on price (for positional pricing gradient)
  const getPriceGradientColor = (price: number) => {
    const { min, max } = getPriceRange();
    if (min === max) return "#52c41a"; // All same price

    // Normalize price to 0-1 range
    const normalized = (price - min) / (max - min);

    // Color gradient from green (low) to red (high)
    // Green: rgb(82, 196, 26) -> Yellow: rgb(250, 219, 20) -> Red: rgb(245, 34, 45)
    if (normalized < 0.5) {
      // Green to Yellow
      const t = normalized * 2;
      const r = Math.round(82 + (250 - 82) * t);
      const g = Math.round(196 + (219 - 196) * t);
      const b = Math.round(26 - (26 - 20) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Yellow to Red
      const t = (normalized - 0.5) * 2;
      const r = Math.round(250 + (245 - 250) * t);
      const g = Math.round(219 - (219 - 34) * t);
      const b = Math.round(20 - (20 - 45) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const getPositionColor = (position: Position) => {
    if (position.positionId === selectedPosition) {
      return "#1890ff"; // Selected - blue
    }
    if (position.isTaken) {
      return "#d9d9d9"; // Taken - gray
    }
    if (showPriceGradient) {
      return getPriceGradientColor(position.price);
    }
    return "#52c41a"; // Available - green
  };

  const getPositionCursor = (position: Position) => {
    if (readonly) return "default";
    if (position.isTaken) return "not-allowed";
    return "pointer";
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
        gap: "8px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {layout.placements.map((position) => {
        const sponsor = getSponsorForPosition(position.positionId);

        return (
          <div
            key={position.positionId}
            onClick={() => handlePositionClick(position)}
            style={{
              backgroundColor: getPositionColor(position),
              border: "2px solid #fff",
              borderRadius: "4px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: getPositionCursor(position),
              transition: "all 0.3s",
              minHeight: "80px",
              opacity: position.isTaken && !readonly ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!readonly && !position.isTaken) {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Position ID - always show at top */}
            <div
              style={{
                color: "#fff",
                fontWeight: "bold",
                fontSize: "10px",
                marginBottom: "4px",
                opacity: 0.8,
              }}
            >
              {position.positionId}
            </div>

            {/* Sponsor content or price */}
            {sponsor ? (
              <>
                {/* Logo sponsor */}
                {sponsor.sponsorType === "logo" &&
                sponsor.logoUrl &&
                sponsor.logoApprovalStatus === "approved" ? (
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "50px",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  /* Text sponsor */
                  <>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: "600",
                        textAlign: "center",
                        wordBreak: "break-word",
                      }}
                    >
                      {sponsor.name}
                    </div>
                    {sponsor.message && (
                      <div
                        style={{
                          color: "#fff",
                          fontSize: "9px",
                          marginTop: "2px",
                          textAlign: "center",
                          opacity: 0.9,
                        }}
                      >
                        {sponsor.message}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              /* Empty position - show price */
              <div
                style={{ color: "#fff", fontSize: "14px", fontWeight: "600" }}
              >
                {currency} ${position.price}
              </div>
            )}

            {/* Status indicator */}
            {position.isTaken && !sponsor && (
              <div
                style={{ color: "#fff", fontSize: "10px", marginTop: "4px" }}
              >
                TAKEN
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ShirtLayout;
