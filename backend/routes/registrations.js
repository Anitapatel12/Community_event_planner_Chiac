const express = require("express");
const zod = require("zod");
const prisma = require("../pool");

const router = express.Router();

const rsvpStatusSchema = zod.enum(["going", "maybe", "notgoing"]);

const registerSchema = zod.object({
  userId: zod.coerce.number().int().positive("User ID is required"),
  eventId: zod.coerce.number().int().positive("Event ID is required"),
  status: rsvpStatusSchema.optional().default("going"),
});

const unregisterSchema = zod.object({
  userId: zod.coerce.number().int().positive("User ID is required"),
  eventId: zod.coerce.number().int().positive("Event ID is required"),
});

router.get("/", (req, res) => {
  res.send("Registrations route working");
});

router.post("/register", async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body || {});
    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { userId, eventId, status } = validation.data;

    const [user, event] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      prisma.event.findUnique({ where: { id: eventId }, select: { id: true } }),
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const registration = await prisma.registration.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      update: { status },
      create: {
        userId,
        eventId,
        status,
      },
    });

    return res.status(200).json({
      message: "RSVP updated successfully",
      data: registration,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong while updating RSVP" });
  }
});

router.post("/unregister", async (req, res) => {
  try {
    const validation = unregisterSchema.safeParse(req.body || {});
    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { userId, eventId } = validation.data;

    await prisma.registration.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    return res.status(200).json({
      message: "Registration removed successfully",
    });
  } catch (error) {
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Registration not found" });
    }
    console.error(error);
    return res.status(500).json({ error: "Something went wrong while removing registration" });
  }
});

module.exports = router;
