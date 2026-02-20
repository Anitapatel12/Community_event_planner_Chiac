require('dotenv').config(); // This line is crucial!
const fs = require('fs');
const pool = require('./config/db');

const schema = fs.readFileSync('./database/schema.sql', 'utf8');

pool.query(schema)
  .then(() => {
    console.log("Database tables created successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Error creating tables:", err.message);
    process.exit(1);
  });