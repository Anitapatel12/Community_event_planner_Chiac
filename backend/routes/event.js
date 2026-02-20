const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// CREATE an event
router.post("/", async (req, res) => {
  try {
    const { title, description, location, event_date, event_time, category_id, creator_id } = req.body;
    const newEvent = await pool.query(
      "INSERT INTO events (title, description, location, event_date, event_time, category_id, creator_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [title, description, location, event_date, event_time, category_id, creator_id]
    );
    res.json(newEvent.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// READ (Search & Filter) events
router.get("/", async (req, res) => {
  try {
    const { search, category_id, date } = req.query;
    
    // Base query linking events with their categories
    let query = "SELECT e.*, c.name as category_name FROM events e LEFT JOIN categories c ON e.category_id = c.id WHERE 1=1";
    let queryParams = [];
    let paramIndex = 1;

    // Filter by Search (Title)
    if (search) {
      query += ` AND e.title ILIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    // Filter by Category
    if (category_id) {
      query += ` AND e.category_id = $${paramIndex}`;
      queryParams.push(category_id);
      paramIndex++;
    }
    // Filter by Date
    if (date) {
      query += ` AND e.event_date = $${paramIndex}`;
      queryParams.push(date);
      paramIndex++;
    }

    const events = await pool.query(query, queryParams);
    res.json(events.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// UPDATE an event (with creator permission check)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, event_date, event_time, category_id, user_id } = req.body; // user_id is the person trying to edit

    // Check permissions
    const eventCheck = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    if (eventCheck.rows.length === 0) return res.status(404).json({ error: "Event not found" });
    if (eventCheck.rows[0].creator_id !== parseInt(user_id)) {
      return res.status(403).json({ error: "You do not have permission to edit this event" });
    }

    const updateEvent = await pool.query(
      "UPDATE events SET title = $1, description = $2, location = $3, event_date = $4, event_time = $5, category_id = $6 WHERE id = $7 RETURNING *",
      [title, description, location, event_date, event_time, category_id, id]
    );
    res.json(updateEvent.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// DELETE an event (with creator permission check)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body; // In a production app, use JWT tokens instead of req.body

    // Check permissions
    const eventCheck = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    if (eventCheck.rows.length === 0) return res.status(404).json({ error: "Event not found" });
    if (eventCheck.rows[0].creator_id !== parseInt(user_id)) {
      return res.status(403).json({ error: "You do not have permission to delete this event" });
    }

    await pool.query("DELETE FROM events WHERE id = $1", [id]);
    res.json({ message: "Event deleted successfully!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;