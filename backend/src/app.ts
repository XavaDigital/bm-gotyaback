import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import campaignRoutes from "./routes/campaign.routes";
import sponsorshipRoutes from "./routes/sponsorship.routes";
import paymentRoutes from "./routes/payment.routes";
import userRoutes from "./routes/user.routes";
import publicRoutes from "./routes/public.routes";
import * as paymentController from "./controllers/payment.controller";

const app = express();

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"]
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api", sponsorshipRoutes);
app.use("/api/payment", paymentRoutes); // Other payment routes (not webhook)
app.use("/api/users", userRoutes);
app.use("/api/public", publicRoutes);

// Health check endpoints
app.get("/", (req, res) => {
  res.send("API is running");
});
app.get("/api", (req, res) => {
  res.send("API is running");
});

export default app;
