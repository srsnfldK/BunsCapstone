
require("dotenv").config();

const express = require("express");
const path = require("path");
const db = require("./db");
const verifyToken = require("./authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// PantrySync homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Firebase login test page
app.get("/login-test.html", (req, res) => {
  res.sendFile(path.join(__dirname, "login-test.html"));
});

// Frontend ingredients page
app.get("/ingredients", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/ingredients.html"));
});

// Get ingredients from MySQL (Firebase login required)
async function getIngredients(req, res) {
  try {
    const [ingredients] = await db.query(
      `SELECT
        ingredient_id AS id,
        inventory_id,
        name,
        quantity,
        unit,
        reorder_level,
        description
       FROM ingredient
       ORDER BY ingredient_id`
    );

    res.json(ingredients);
  } catch (error) {
    console.error("Error loading ingredients:", error.message);
    res.status(500).json({
      error: "Unable to load ingredients."
    });
  }
}

// API route for ingredients
app.get("/api/ingredients", verifyToken, getIngredients);

// Keep the original API route for compatibility
app.get("/ingredients", verifyToken, getIngredients);

// Add an ingredient to MySQL (Firebase login required)
async function addIngredient(req, res) {
  const { name, quantity, unit, inventory_id = 1 } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    quantity < 0 ||
    typeof unit !== "string" ||
    !unit.trim() ||
    !Number.isInteger(inventory_id) ||
    inventory_id < 1
  ) {
    return res.status(400).json({
      error: "Valid name, quantity, unit, and inventory_id are required."
    });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO ingredient
       (inventory_id, name, quantity, unit, reorder_level)
       VALUES (?, ?, ?, ?, ?)`,
      [inventory_id, name.trim(), quantity, unit.trim(), 0]
    );

    res.status(201).json({
      id: result.insertId,
      inventory_id,
      name: name.trim(),
      quantity,
      unit: unit.trim(),
      reorder_level: 0
    });
  } catch (error) {
    console.error("Error adding ingredient:", error.message);

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "The specified inventory does not exist."
      });
    }

    res.status(500).json({
      error: "Unable to add ingredient."
    });
  }
}

app.post("/api/ingredients", verifyToken, addIngredient);

// Keep the original POST route for compatibility
app.post("/ingredients", verifyToken, addIngredient);

// Start backend
app.listen(PORT, () => {
  console.log(`PantrySync running at http://localhost:${PORT}`);
});

