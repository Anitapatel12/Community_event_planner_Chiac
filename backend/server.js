const express = require("express");
const cors = require("cors");
const path = require("path");

// Always load backend/.env even when server is started from repository root.
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
const frontendOrigin = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

// Middleware
app.use(cors(
  {
    origin(origin, callback) {
      const normalizedOrigin = origin ? origin.replace(/\/$/, "") : "";
      const isLocalhostOrigin =
        /^https?:\/\/localhost:\d+$/.test(normalizedOrigin) ||
        /^https?:\/\/127\.0\.0\.1:\d+$/.test(normalizedOrigin);

      if (!origin || normalizedOrigin === frontendOrigin || isLocalhostOrigin) {
        callback(null, true);
        return;
      }
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  }
)); // add CORS middleware to allow cross-origin requests from the frontend
app.use(express.json());

// Import Routes
const userRoutes = require("./routes/users");
const eventRoutes = require("./routes/event");
const registrationRoutes = require("./routes/registrations");

// Use Routes
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Community Event Planner API is running 🚀");
});

const PORT = Number(process.env.PORT) || 5001;

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
