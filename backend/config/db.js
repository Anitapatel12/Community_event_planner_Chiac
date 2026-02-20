const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // This forces Node to accept the Aiven certificate
  },
});

pool.connect()
  .then(() => console.log("PostgreSQL connected successfully 🚀"))
  .catch(err => console.error("Database connection error:", err.message));

module.exports = pool;