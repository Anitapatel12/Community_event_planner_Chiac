const express = require("express");
const router = express.Router();
const zod = require("zod");
const bcrypt = require("bcrypt");
const prisma = require("../pool");


const userSchema = zod.object({
  name: zod.string().min(1, "Name is required"),
  email : zod.email("Invalid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters long"),
});

router.get("/", (req, res) => {
  res.send("Users route working 🚀");
});

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body || {};
  if(!name || !email || !password){
    return res.status(400).json({ error: "Name, email and password are required" });
  }
  const validation = userSchema.safeParse({ name, email, password });
  if(!validation.success){
    return res.status(400).json({ error: validation.error.errors.map(e => e.message) });
  }

  //validate if user already exists
  const userExists = await prisma.user.findUnique({
    where: {
      email: email
    }
  });
  if(userExists){
    return res.status(400).json({ error: "User with this email already exists" });
  }

  // Here you would normally save the user to the database
  const hashedPassword = await bcrypt.hash(password, 10);
  const addDatatoDb = await prisma.user.create({
    data: {
      name, 
      email,
      password: hashedPassword
    },
    include:{password: false} 
  });

  res.status(201).json({ message: "User registered successfully", data : addDatatoDb });
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body || {};
  if(!email || !password){
    return res.status(400).json({ error: "Email and password are required" });
  }
  const validation = userSchema.partial({ name: true }).safeParse({ email, password });
  if(!validation.success){
    return res.status(400).json({ error: validation.error.errors.map(e => e.message) });
  }
  const userExists = await prisma.user.findUnique({
    where: {
      email: email
    }
  });

  if(!userExists){
    return res.status(400).json({ error: "User with this email does not exist" });
  }

  const user = userExists;
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if(!isPasswordValid){
    return res.status(400).json({ error: "Invalid password" });
  }
  res.status(200).json({ message: "User signed in successfully", user: { id: user.id, name: user.name, email: user.email } });
});




module.exports = router;
