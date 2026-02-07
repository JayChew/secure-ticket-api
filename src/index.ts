import { prisma } from "@/lib/prisma.js";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());

// Get all users
app.get("/", async (req, res) => {
  const userCount = await prisma.user.count();
  res.json(
    userCount == 0
      ? "No users have been added yet."
      : "Some users have been added to the database."
  );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
