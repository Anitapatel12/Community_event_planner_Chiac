const express = require("express");
const router = express.Router();
const zod = require("zod");
const prisma = require("../pool");

const eventSchema = zod.object({
  title: zod.string().min(1, "Title is required"),

  description: zod.string().optional(),

  location: zod.string().optional(),

  eventDate: zod.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),

  eventTime: zod
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format"),

  creatorId: zod.number({
    required_error: "Creator ID is required",
  }),

  categoryId: zod.number().optional(),
});

// GET /api/events - List all events with optional search and filters
router.get("/", async (req, res) => {
  try {
    const { categoryId, date, search } = req.query;
    let filter = {};

    // Filter by Category
    if (categoryId) {
      filter.categoryId = parseInt(categoryId);
    }

    // Filter by Date
    if (date) {
      filter.eventDate = new Date(date);
    }

    // Search by Title or Description
    if (search) {
      filter.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const events = await prisma.event.findMany({
      where: filter,
      include: {
        category: true, // Includes category details if they exist
        creator: {
          select: { id: true, name: true, email: true }, // Include creator details
        },
      },
      orderBy: {
        eventDate: 'asc', // Show upcoming events first
      }
    });

    res.status(200).json({
      message: "Events fetched successfully",
      data: events,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong while fetching events" });
  }
});

router.post("/create", async (req, res) => {
  try {
    const validation = eventSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues.map(e => e.message),
      });
    }

    const { eventDate, eventTime, ...rest } = validation.data;

    const combinedDateTime = new Date(`${eventDate}T${eventTime}`);

    const newEvent = await prisma.event.create({
      data: {
        ...rest,
        eventDate : new Date(eventDate),
        eventTime: combinedDateTime, 
      },
    });

    res.status(201).json({
      message: "Event created successfully",
      data: newEvent,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/editEvent", async (req, res) => {
  try {
    const { id, creatorId, ...updateData } = req.body || {};

    if (!id || !creatorId) {
      return res.status(400).json({
        error: "Event ID and Creator ID are required",
      });
    }

    const validation = eventSchema.partial().safeParse(updateData);

    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues.map(e => e.message),
      });
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent || existingEvent.creatorId !== creatorId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const data = validation.data;

    let updatedFields = { ...data };

    // If eventDate provided
    if (data.eventDate) {
      updatedFields.eventDate = new Date(data.eventDate);
    }

    // If eventTime provided
    if (data.eventTime) {
      const baseDate = data.eventDate
        ? new Date(data.eventDate)
        : existingEvent.eventDate;

      updatedFields.eventTime = new Date(
        `${baseDate.toISOString().split("T")[0]}T${data.eventTime}`
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updatedFields,
    });

    res.json({
      message: "Event updated successfully",
      data: updatedEvent,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/deleteEvent", async (req, res) => {
  try {
    const { id, creatorId } = req.body || {}; 
    if (!id || !creatorId) {
      return res.status(400).json({ error: "Event ID and Creator ID are required" });
    }   
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if(!existingEvent || existingEvent.creatorId !== creatorId) {
      return res.status(403).json({ error: "Not authorized" });
    }   

    await prisma.event.delete({
      where: { id },
    }); 
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  } });

// GET /api/events/:id/attendees - View attendee list for a specific event
router.get("/:id/attendees", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid Event ID" });
    }

    // Find all registrations for this event and include the user details
    const attendees = await prisma.registration.findMany({
      where: { eventId: eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Map through the registrations to just return the user objects
    const attendeeList = attendees.map(registration => registration.user);

    res.status(200).json({
      message: "Attendees fetched successfully",
      data: attendeeList,
      totalAttendees: attendeeList.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong while fetching attendees" });
  }
});

module.exports = router;
