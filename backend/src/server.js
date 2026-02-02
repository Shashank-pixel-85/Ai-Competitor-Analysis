require("dotenv").config();
const express = require("express");
const cors = require("cors");
const analysisRoutes = require("./routes/analysisRoutes");
const { logger } = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 5000;

/* -------------------------------------------
   FIXED CORS — Required for frontend works
--------------------------------------------*/
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

/* -------------------------------------------
   Middleware
--------------------------------------------*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------------------------------
   Request Logging
--------------------------------------------*/
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

/* -------------------------------------------
   API Routes
--------------------------------------------*/
app.use("/api", analysisRoutes);

/* -------------------------------------------
   Health Check
--------------------------------------------*/
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/* -------------------------------------------
   Error Handler
--------------------------------------------*/
app.use((err, req, res, next) => {
  logger.error("Server Error:", err);

  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal server error",
      stack:
        process.env.NODE_ENV === "development" ? err.stack : undefined,
    },
  });
});

/* -------------------------------------------
   404 Fallback
--------------------------------------------*/
app.use((req, res) => {
  res.status(404).json({
    error: { message: "Route not found" },
  });
});

/* -------------------------------------------
   Start Server
--------------------------------------------*/
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});
