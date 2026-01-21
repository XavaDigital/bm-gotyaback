import mongoose from "mongoose";
import dotenv from "dotenv";
import { Campaign } from "../src/models/Campaign";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/bm-gotyaback";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(5);

    console.log("Recent Campaigns:");
    campaigns.forEach((c) => {
      console.log(`ID: ${c._id}`);
      console.log(`Title: ${c.title}`);
      console.log(`Type: ${c.campaignType}`);
      console.log(`Layout: ${c.layoutStyle}`);
      console.log("Pricing Config:", JSON.stringify(c.pricingConfig, null, 2));
      console.log("-----------------------------------");
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
