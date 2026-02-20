const express = require("express");
const router = express.Router();
const zod = require("zod");
const prisma = require("../pool");

router.get("/", (req, res) => {
  res.send("Registrations route working 🚀");
});

router.post("/register", async (req, res) => {
  try {
    const { userId, eventId } = req.body || {};

    if (!userId || !eventId) {
      return res.status(400).json({
        error: "User ID and Event ID are required",
      });
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

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
      update: {}, // do nothing if already exists
      create: {
        userId,
        eventId,
      },
    });

    res.status(201).json({
      message: "Registration successful",
      data: registration,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});


router.post("/unregister", async (req, res) => {
  try {
    const { userId, eventId } = req.body || {};

    if (!userId || !eventId) {
      return res.status(400).json({
        error: "User ID and Event ID are required",
      });
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const registration = await prisma.registration.delete({
     where: {
        userId_eventId: {
          userId, 
          eventId,
        },
      },
    });


    res.status(201).json({
      message: "Unregistration successful",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});




module.exports = router;
