const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors(
  {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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

const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
