import dotenv from "dotenv";

// Load environment variables FIRST before importing anything else
dotenv.config();

// Validate environment variables before starting the server
// NOTE: Commented out for development - uncomment for production
// import { validateEnvironment } from "./utils/validateEnv";
// validateEnvironment();

import app from "./app";
import connectDB from "./config/db";

connectDB();

// Use port 8080 for App Runner compatibility, fallback to 5000 for local dev
const PORT = parseInt(process.env.PORT || "8080", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
