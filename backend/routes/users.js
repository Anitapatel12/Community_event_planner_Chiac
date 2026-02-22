const express = require("express");
const zod = require("zod");
const bcrypt = require("bcrypt");
const prisma = require("../pool");

const router = express.Router();

const USER_ROLE = "user";
const ADMIN_ROLE = "admin";

const usernameSchema = zod
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters long")
  .max(100, "Username must be at most 100 characters long")
  .regex(/^[A-Za-z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

const emailSchema = zod.string().trim().email("Invalid email address");

const passwordSchema = zod
  .string()
  .min(6, "Password must be at least 6 characters long");

const signupSchema = zod.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: zod.enum([USER_ROLE, ADMIN_ROLE]).optional().default(USER_ROLE),
  adminInviteKey: zod.string().optional(),
});

const signinSchema = zod.object({
  username: zod.string().trim().min(1, "Username is required"),
  password: zod.string().min(1, "Password is required"),
});

const recoverPasswordSchema = zod.object({
  username: usernameSchema,
  email: emailSchema,
  newPassword: passwordSchema,
});

function resolveUserRole(user) {
  const username = String(user?.name || "").toLowerCase();

  // Backward compatibility for previously created "admin" username accounts.
  if (username === "admin") {
    return ADMIN_ROLE;
  }

  return user?.role === ADMIN_ROLE ? ADMIN_ROLE : USER_ROLE;
}

router.get("/", (req, res) => {
  res.send("Users route working");
});

router.post("/signup", async (req, res) => {
  try {
    const validation = signupSchema.safeParse(req.body || {});
    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues.map((issue) => issue.message),
      });
    }

    const username = validation.data.username.trim();
    const email = validation.data.email.trim().toLowerCase();
    const password = validation.data.password;
    const requestedRole = validation.data.role || USER_ROLE;

    if (requestedRole === ADMIN_ROLE) {
      const configuredAdminInviteKey = String(process.env.ADMIN_INVITE_KEY || "").trim();
      const providedAdminInviteKey = String(validation.data.adminInviteKey || "").trim();

      if (!configuredAdminInviteKey) {
        return res.status(503).json({
          error: "Admin registration is not configured. Please contact the administrator.",
        });
      }

      if (!providedAdminInviteKey) {
        return res.status(400).json({
          error: "Admin invite key is required for admin registration",
        });
      }

      if (providedAdminInviteKey !== configuredAdminInviteKey) {
        return res.status(403).json({ error: "Invalid admin invite key" });
      }
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { name: { equals: username, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email) {
        return res.status(409).json({ error: "Email is already registered" });
      }
      return res.status(409).json({ error: "Username is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await prisma.user.create({
      data: {
        name: username,
        email,
        password: hashedPassword,
        role: requestedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: createdUser.id,
        username: createdUser.name,
        email: createdUser.email,
        role: resolveUserRole(createdUser),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong while signing up" });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const validation = signinSchema.safeParse(req.body || {});
    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues.map((issue) => issue.message),
      });
    }

    const username = validation.data.username.trim();
    const password = validation.data.password;

    // Prefer username-based login; if input looks like email, allow email fallback.
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: username, mode: "insensitive" } },
          { email: { equals: username, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Account not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    return res.status(200).json({
      message: "User signed in successfully",
      user: {
        id: user.id,
        username: user.name,
        email: user.email,
        role: resolveUserRole(user),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong while signing in" });
  }
});

router.post("/recover-password", async (req, res) => {
  try {
    const validation = recoverPasswordSchema.safeParse(req.body || {});
    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues.map((issue) => issue.message),
      });
    }

    const username = validation.data.username.trim();
    const email = validation.data.email.trim().toLowerCase();
    const newPassword = validation.data.newPassword;

    const user = await prisma.user.findFirst({
      where: {
        name: { equals: username, mode: "insensitive" },
        email: { equals: email, mode: "insensitive" },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "No account matched that username and email" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      message: "Password updated successfully. Please sign in with your new password.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong while recovering password" });
  }
});

module.exports = router;
