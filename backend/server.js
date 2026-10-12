
const express = require("express");
const path = require("path");
const pool = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Firebase Authentication
const verifyToken = require("./authMiddleware");

app.use(express.json());

// Serve frontend files from the frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

//Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
// Serve the Firebase login test page
app.get("/login-test.html", (req, res) => {
  res.sendFile(path.join(__dirname, "login-test.html"));
});

const PORT = 3000;

// Sample inventory data
let ingredients = [
  { id: 1, name: "Flour", quantity: 25, unit: "lbs" },
  { id: 2, name: "Sugar", quantity: 10, unit: "lbs" },
  { id: 3, name: "Eggs", quantity: 36, unit: "count" }
];

// View ingredients
app.get("/ingredients", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/ingredients.html"));
});

app.get("/api/ingredients", (req, res) => {
// Home page
app.get("/", (req, res) => {
  res.send("PantrySync Backend is Running!");
});

// View ingredients (Firebase login required)
app.get("/ingredients", verifyToken, (req, res) => {
  res.json(ingredients);
});

// Add a new ingredient
app.post("/ingredients", (req, res) => {
  const { name, quantity, unit } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    quantity < 0 ||
    typeof unit !== "string" ||
    !unit.trim()
  ) {
    return res.status(400).json({
      error: "Valid name, quantity, and unit are required."
    });
  }

  const ingredient = {
    id: Math.max(0, ...ingredients.map(i => i.id)) + 1,
    name: name.trim(),
    quantity,
    unit: unit.trim()
  };

  ingredients.push(ingredient);
  res.status(201).json(ingredient);
});

// Start server
app.listen(PORT, () => {
  console.log(`PantrySync running at http://localhost:${PORT}`);
});

