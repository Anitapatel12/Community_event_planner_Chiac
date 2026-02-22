const express = require("express");
const cors = require("cors");
const path = require("path");
const prisma = require("./pool");

// Always load backend/.env even when server is started from repository root.
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
const frontendOrigin = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

// Middleware
app.use(
  cors({
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
  })
);
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
  res.send("Community Event Planner API is running");
});

function resolvePort(value) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) {
    return parsed;
  }
  return 5001;
}

function validateDatabaseUrl() {
  const rawDatabaseUrl = String(process.env.DATABASE_URL || "").trim();
  if (!rawDatabaseUrl) {
    throw new Error("DATABASE_URL is missing. Set it in backend/.env.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawDatabaseUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.");
  }

  if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol)) {
    throw new Error(`DATABASE_URL protocol must be postgres/postgresql, got "${parsedUrl.protocol}".`);
  }
}

async function startServer() {
  try {
    validateDatabaseUrl();
    await prisma.$connect();

    const port = resolvePort(process.env.PORT);
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error(`[startup] ${error.message}`);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
