import dotenv from "dotenv";

// Load environment variables FIRST before importing anything else
dotenv.config();

import { validateEnvironment } from "./utils/validateEnv";
validateEnvironment();

// Initialize Sentry for production error tracking
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,
    integrations: [
      nodeProfilingIntegration(),
    ],
  });
  console.log('✅ Sentry initialized for production monitoring');
} else if (process.env.NODE_ENV === 'production') {
  console.warn('⚠️  WARNING: SENTRY_DSN is not set. Errors will not be tracked in production.');
}

import app from "./app";
import connectDB from "./config/db";

connectDB();

// Use port 8080 for App Runner compatibility, fallback to 5000 for local dev
const PORT = parseInt(process.env.PORT || "8080", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
