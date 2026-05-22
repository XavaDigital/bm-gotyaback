import express from "express";
import cors from "cors";
import helmet from "helmet";
import * as Sentry from "@sentry/node";
import mongoSanitize from "express-mongo-sanitize";
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

// Trust proxy — required when behind a reverse proxy (AWS ALB, nginx, etc.) so Express
// reads X-Forwarded-For correctly. Set TRUST_PROXY to a specific IP/CIDR in production
// (e.g. the ALB's private IP range) for stricter control; defaults to 1 (single-hop).
app.set('trust proxy', process.env.TRUST_PROXY ?? 1);

// Request logging middleware
app.use(requestLogger);

// Build the imgSrc allowlist from known deployment origins rather than allowing all HTTPS.
const imgSrcOrigins: string[] = ["'self'", "data:"];
if (process.env.AWS_S3_SERVER_URL) imgSrcOrigins.push(process.env.AWS_S3_SERVER_URL);
if (process.env.CDN_URL) imgSrcOrigins.push(process.env.CDN_URL);
// Fallback: if no S3 URL is configured (e.g. local dev without S3), allow HTTPS so the
// app doesn't break — remove this line in production once AWS_S3_SERVER_URL is set.
if (!process.env.AWS_S3_SERVER_URL) imgSrcOrigins.push("https:");

// Security middleware - helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'"],
      scriptSrc: ["'self'"],
      imgSrc: imgSrcOrigins,
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for Stripe, etc.
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
}));

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

// NoSQL injection prevention — strip keys containing $ or . from user input
// Custom wrapper: express-mongo-sanitize reassigns req.query which is read-only in Express 5
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  // req.query is a getter in Express 5; sanitize mutates in-place so no reassignment needed
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

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
