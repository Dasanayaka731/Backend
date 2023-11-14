const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { format } = require("date-fns-tz");

const prisma = new PrismaClient();

router.post("/saveUser", async (req, res) => {
  console.log(req);
  const {
    username,
    password,
    role: { value: rolevalue },
  } = req.body;
  try {
    //const { username, password, role } = req.body;
    if (!username || !password || !rolevalue) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const result = await prisma.users.findUnique({
      where: { username: username },
    });
    if (result) {
      return res.status(400).json({ error: "User Already Exist" });
    }
    const encryptedPassword = bcrypt.hashSync(password, 10);
    // const createdAt = format(new Date(), "yyyy-MM-dd HH:mm:ss", {
    //   timeZone: "Asia/Colombo",
    // });
    const createdAt = format(new Date(), "yyyy-MM-dd HH:mm:ssXXX", {
      timeZone: "Asia/Colombo",
    });
    const user = await prisma.users.create({
      data: {
        username,
        password: encryptedPassword,
        role: rolevalue,
        status: "Active",
        createdAt: createdAt.toString(),
        updatedAt: createdAt.toString(),
      },
    });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
});

router.post("/saveAdmin", async (req, res) => {
  console.log(req);
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const result = await prisma.users.findUnique({
      where: { username: username },
    });
    if (result) {
      return res.status(400).json({ error: "User Already Exist" });
    }
    const encryptedPassword = bcrypt.hashSync(password, 10);
    const createdAt = format(new Date(), "yyyy-MM-dd HH:mm:ssXXX", {
      timeZone: "Asia/Colombo",
    });
    const user = await prisma.users.create({
      data: {
        username,
        password: encryptedPassword,
        role,
        status: "Active",
        createdAt: createdAt.toString(),
        updatedAt: createdAt.toString(),
      },
    });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
});

// User authentication route
router.post("/login", async (req, res) => {
  //console.log(req);
  try {
    const { username, password } = req.body;
    const user = await prisma.users.findUnique({
      where: { username: username },
    });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.json({ message: "Invalid credentials" });
    }
    if (user.status === "Inactive") {
      return res.json({ message: "Account Deactivated" });
    }
    //Set user data in the session
    req.session.user = {
      id: user.userID,
      username: user.username,
      role: user.role,
      status: user.status,
    };
    res.status(200).json({ message: "Success", data: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Logout route
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.status(200).json({ message: "Success" });
    }
  });
});

router.get("/me", (req, res) => {
  console.log(req.session);
  if (req.session && req.session.user) {
    return res.status(200).json(req.session.user);
  }
  return res.sendStatus(403);
});

// PUT route to update user status
router.put("/updateUserStatus/:userName", async (req, res) => {
  try {
    const { userName } = req.params;
    const { newStatus } = req.body;

    // Validate input
    if (!userName || !newStatus) {
      return res
        .status(400)
        .json({ error: "User ID and new status are required" });
    }

    // Update user status in the database
    const updatedUser = await prisma.users.update({
      where: { username: userName },
      data: { status: newStatus },
    });

    res.status(201).json({ message: "Update Success!", data: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET route to get all users
router.get("/allUsers", async (req, res) => {
  try {
    // Fetch all users from the database
    const allUsers = await prisma.users.findMany();
    if (!allUsers) {
      return res.json("No Users Found!");
    }
    res.json(allUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
