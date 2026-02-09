import express from "express";
import cors from "cors";
import helmet from "helmet";
import * as Sentry from "@sentry/node";
// import mongoSanitize from "express-mongo-sanitize"; // Removed due to compatibility issues
import authRoutes from "./routes/auth.routes";
import campaignRoutes from "./routes/campaign.routes";
import sponsorshipRoutes from "./routes/sponsorship.routes";
import paymentRoutes from "./routes/payment.routes";
import userRoutes from "./routes/user.routes";
import publicRoutes from "./routes/public.routes";
import adminRoutes from "./routes/admin.routes";
import healthRoutes from "./routes/health.routes";
import * as paymentController from "./controllers/payment.controller";
import { apiLimiter } from "./middleware/rateLimiter.middleware";
import { errorHandler, notFoundHandler, requestLogger } from "./middleware/errorHandler.middleware";

const app = express();

// Trust proxy - required when behind a reverse proxy (nginx, AWS ALB, etc.)
// This allows Express to correctly read X-Forwarded-* headers for client IP, protocol, etc.
app.set('trust proxy', 1);

// Request logging middleware
app.use(requestLogger);

// Security middleware - helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for Stripe, etc.
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
}));

// MongoDB injection prevention is handled by express-validator in validation middleware
// express-mongo-sanitize was removed due to compatibility issues with the current Express version

// CORS configuration
const isProduction = process.env.NODE_ENV === 'production';

// In production, only allow the configured frontend URL
// In development, also allow localhost origins for local testing
const allowedOrigins: string[] = isProduction
  ? [process.env.FRONTEND_URL].filter((url): url is string => Boolean(url)) // Only production frontend URL
  : [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000"
    ].filter((url): url is string => Boolean(url)); // Development: allow localhost + configured URL

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.) only in development
      if (!origin && !isProduction) return callback(null, true);

      if (origin && allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// IMPORTANT: Webhook must be mounted BEFORE express.json() to receive raw body
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

// JSON parsing for all other routes
app.use(express.json());

// Health check routes (no rate limiting for health checks)
app.use(healthRoutes);

// Apply general rate limiting to all API routes
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api", sponsorshipRoutes);
app.use("/api/payment", paymentRoutes); // Other payment routes (not webhook)
app.use("/api/users", userRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);

// Simple status endpoints
app.get("/", (req, res) => {
  res.send("API is running");
});
app.get("/api", (req, res) => {
  res.send("API is running");
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Sentry error handler - must be before custom error handler
// This captures errors and sends them to Sentry in production
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  app.use((err: any, req: any, res: any, next: any) => {
    Sentry.captureException(err);
    next(err);
  });
}

// Error handling middleware - must be last
app.use(errorHandler);

export default app;
