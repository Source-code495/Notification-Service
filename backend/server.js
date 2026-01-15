import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import preferenceRoutes from "./routes/preferenceRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";

import { startCampaignSchedulerCron } from "./jobs/campaignScheduler.js";


dotenv.config();

const app = express();

const allowedOrigins = (
  process.env.FRONTEND_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (curl, server-to-server, etc.)
    if (!origin) return callback(null, true);
    // Allow local dev on any port.
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);
app.use("/preferences", preferenceRoutes);
app.use("/campaigns", campaignRoutes);
app.use("/newsletters", newsletterRoutes);
app.use("/logs", logRoutes);
app.use("/analytics", analyticsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  const enable = String(process.env.ENABLE_CAMPAIGN_CRON ?? "true").toLowerCase();
  if (enable !== "false" && enable !== "0") {
    startCampaignSchedulerCron();
  } else {
    console.log("Campaign scheduler cron disabled (ENABLE_CAMPAIGN_CRON=false)");
  }
});
