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


router.get("/", (req, res) => {
  res.send("Events route working 🚀");
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


module.exports = router;
