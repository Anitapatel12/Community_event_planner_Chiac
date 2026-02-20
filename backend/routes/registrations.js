const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// RSVP to an event
router.post("/", async (req, res) => {
  try {
    const { user_id, event_id, status } = req.body; // status: 'going', 'maybe', 'notgoing'

    // This uses PostgreSQL's UPSERT to either create a new RSVP or update an existing one 
    // (since user_id and event_id form a UNIQUE constraint in schema.sql)
    const rsvp = await pool.query(
      `INSERT INTO registrations (user_id, event_id, status) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, event_id) 
       DO UPDATE SET status = $3 RETURNING *`,
      [user_id, event_id, status]
    );
    res.json(rsvp.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// GET attendee list for an event
router.get("/:eventId/attendees", async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Join registrations with users table to get attendee names
    const attendees = await pool.query(
      `SELECT u.name, u.email, r.status, r.registered_at 
       FROM registrations r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.event_id = $1`,
      [eventId]
    );
    res.json(attendees.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;