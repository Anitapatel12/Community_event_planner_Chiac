const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import DB connection (this will auto-connect & log success/error)
const db = require("./config/db");

const app = express();

// Middleware
app.use(cors());
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

const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
