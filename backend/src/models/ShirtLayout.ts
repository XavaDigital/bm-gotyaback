import mongoose from "mongoose";

const shirtLayoutSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Campaign",
    required: true,
  },

  // Layout type
  layoutType: {
    type: String,
    enum: ["grid", "flexible"],
    default: "grid",
  },

  // FOR GRID LAYOUTS (fixed, positional)
  rows: { type: Number }, // Optional - only for grid layouts (calculated from totalPositions / columns)
  columns: { type: Number }, // Optional - only for grid layouts
  totalPositions: { type: Number }, // Total number of sponsor positions
  arrangement: {
    type: String,
    enum: ["horizontal", "vertical"],
    default: "horizontal",
  }, // How positions are numbered: horizontal (row-first) or vertical (column-first)
  placements: [
    {
      positionId: String, // e.g., "R1C1", "R2C3"
      row: Number,
      col: Number,
      price: Number, // Calculated based on pricing strategy
      isTaken: { type: Boolean, default: false },
      sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: "SponsorEntry" },
    },
  ],

  // FOR FLEXIBLE LAYOUTS (pay-what-you-want)
  maxSponsors: { type: Number }, // Optional limit on number of sponsors
});

export const ShirtLayout = mongoose.model("ShirtLayout", shirtLayoutSchema);
