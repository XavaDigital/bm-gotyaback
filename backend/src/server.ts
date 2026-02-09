import dotenv from "dotenv";

// Load environment variables FIRST before importing anything else
dotenv.config();

// Initialize Sentry for production error tracking
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    profilesSampleRate: 0.1, // 10% profiling
    integrations: [
      nodeProfilingIntegration(),
    ],
  });
  console.log('✅ Sentry initialized for production monitoring');
}

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
