const express = require("express");
const zod = require("zod");
const prisma = require("../pool");

const router = express.Router();

const USER_ROLE = "user";
const ADMIN_ROLE = "admin";

const eventInclude = {
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  registrations: {
    select: {
      status: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
};

const eventCreateSchema = zod.object({
  title: zod.string().trim().min(1, "Title is required"),
  description: zod.string().trim().optional(),
  location: zod.string().trim().optional(),
  eventDate: zod.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  eventTime: zod
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format"),
  creatorId: zod.coerce.number().int().positive("Creator ID is required"),
  category: zod.string().trim().min(1).max(100).optional(),
  maxAttendees: zod.union([zod.null(), zod.coerce.number().int().nonnegative()]).optional(),
});

const eventEditSchema = zod.object({
  id: zod.coerce.number().int().positive("Event ID is required"),
  creatorId: zod.coerce.number().int().positive("Creator ID is required"),
  requesterRole: zod.enum([USER_ROLE, ADMIN_ROLE]).optional().default(USER_ROLE),
  title: zod.string().trim().min(1).optional(),
  description: zod.string().trim().optional(),
  location: zod.string().trim().optional(),
  eventDate: zod.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  eventTime: zod
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  category: zod.string().trim().min(1).max(100).optional(),
  maxAttendees: zod.union([zod.null(), zod.coerce.number().int().nonnegative()]).optional(),
});

const eventDeleteSchema = zod.object({
  id: zod.coerce.number().int().positive("Event ID is required"),
  creatorId: zod.coerce.number().int().positive("Creator ID is required"),
  requesterRole: zod.enum([USER_ROLE, ADMIN_ROLE]).optional().default(USER_ROLE),
});

async function resolveCategoryId(categoryName) {
  if (!categoryName) return null;

  const trimmed = String(categoryName).trim();
  if (!trimmed) return null;

  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: trimmed,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  if (existingCategory) {
    return existingCategory.id;
  }

  const createdCategory = await prisma.category.create({
    data: { name: trimmed },
    select: { id: true },
  });

  return createdCategory.id;
}

function toEventTimeDate(eventDate, eventTime) {
  return new Date(`${eventDate}T${eventTime}:00`);
}

// GET /api/events - list all events with optional search and filters
router.get("/", async (req, res) => {
  try {
    const { categoryId, category, date, search } = req.query;
    const where = {};

    if (categoryId) {
      const parsedCategoryId = Number.parseInt(categoryId, 10);
      if (!Number.isNaN(parsedCategoryId)) {
        where.categoryId = parsedCategoryId;
      }
    }

    if (category) {
      where.category = {
        name: {
          equals: String(category).trim(),
          mode: "insensitive",
        },
      };
    }

    if (date) {
      where.eventDate = new Date(String(date));
    }

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
        { location: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: eventInclude,
      orderBy: [{ eventDate: "asc" }, { eventTime: "asc" }],
    });

    return res.status(200).json({
      message: "Events fetched successfully",
      data: events,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong while fetching events" });
  }
});

// POST /api/events/create - create event
router.post("/create", async (req, res) => {
  try {
    const validation = eventCreateSchema.safeParse(req.body || {});
    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues.map((issue) => issue.message),
      });
    }

    const {
      title,
      description,
      location,
      eventDate,
      eventTime,
      creatorId,
      category,
      maxAttendees,
    } = validation.data;

    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true },
    });

    if (!creator) {
      return res.status(404).json({ error: "Creator not found" });
    }

    const categoryId = await resolveCategoryId(category);

    const newEvent = await prisma.event.create({
      data: {
        title,
        description: description || "",
        location: location || "",
        eventDate: new Date(eventDate),
        eventTime: toEventTimeDate(eventDate, eventTime),
        creatorId,
        categoryId,
        maxAttendees: maxAttendees ?? null,
      },
      include: eventInclude,
    });

    return res.status(201).json({
      message: "Event created successfully",
      data: newEvent,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong while creating event" });
  }
});

// POST /api/events/editEvent - update event
router.post("/editEvent", async (req, res) => {
  try {
    const validation = eventEditSchema.safeParse(req.body || {});
    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues.map((issue) => issue.message),
      });
    }

    const {
      id,
      creatorId,
      requesterRole,
      title,
      description,
      location,
      eventDate,
      eventTime,
      category,
      maxAttendees,
    } = validation.data;

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        creatorId: true,
        eventDate: true,
      },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    const canEdit = requesterRole === ADMIN_ROLE || existingEvent.creatorId === creatorId;
    if (!canEdit) {
      return res.status(403).json({ error: "Not authorized to edit this event" });
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (eventDate !== undefined) updateData.eventDate = new Date(eventDate);
    if (maxAttendees !== undefined) updateData.maxAttendees = maxAttendees;

    if (category !== undefined) {
      updateData.categoryId = await resolveCategoryId(category);
    }

    if (eventTime !== undefined) {
      const baseDate = eventDate || existingEvent.eventDate.toISOString().split("T")[0];
      updateData.eventTime = toEventTimeDate(baseDate, eventTime);
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: eventInclude,
    });

    return res.status(200).json({
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong while updating event" });
  }
});

// DELETE /api/events/deleteEvent - delete event
router.delete("/deleteEvent", async (req, res) => {
  try {
    const validation = eventDeleteSchema.safeParse(req.body || {});
    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { id, creatorId, requesterRole } = validation.data;

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        creatorId: true,
      },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    const canDelete = requesterRole === ADMIN_ROLE || existingEvent.creatorId === creatorId;
    if (!canDelete) {
      return res.status(403).json({ error: "Not authorized to delete this event" });
    }

    await prisma.event.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong while deleting event" });
  }
});

// GET /api/events/:id/attendees - view attendee list for a specific event
router.get("/:id/attendees", async (req, res) => {
  try {
    const eventId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const attendees = await prisma.registration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        registeredAt: "asc",
      },
    });

    const attendeeList = attendees.map((registration) => ({
      id: registration.user.id,
      name: registration.user.name,
      email: registration.user.email,
      status: registration.status,
    }));

    return res.status(200).json({
      message: "Attendees fetched successfully",
      data: attendeeList,
      totalAttendees: attendeeList.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong while fetching attendees" });
  }
});

module.exports = router;
