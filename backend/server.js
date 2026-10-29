

require("dotenv").config();

const express = require("express");
const path = require("path");
const db = require("./db");
const verifyToken = require("./authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve Eric's frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// PantrySync homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Firebase login test page
app.get("/login-test.html", (req, res) => {
  res.sendFile(path.join(__dirname, "login-test.html"));
});

// Eric's ingredients webpage
app.get("/ingredients", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/ingredients.html"));
});

// Get ingredients from MySQL
// Firebase login required
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

// API route for viewing ingredients
app.get("/api/ingredients", verifyToken, getIngredients);

// Add a new ingredient to MySQL
// Firebase login required
async function addIngredient(req, res) {
  const {
    name,
    quantity,
    unit,
    description = null,
    reorder_level = 0,
    inventory_id = 1
  } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    quantity < 0 ||
    typeof unit !== "string" ||
    !unit.trim() ||
    typeof reorder_level !== "number" ||
    !Number.isFinite(reorder_level) ||
    reorder_level < 0 ||
    !Number.isInteger(inventory_id) ||
    inventory_id < 1
  ) {
    return res.status(400).json({
      error: "Valid ingredient information is required."
    });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO ingredient
       (inventory_id, name, quantity, unit, reorder_level, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        inventory_id,
        name.trim(),
        quantity,
        unit.trim(),
        reorder_level,
        description
      ]
    );

    res.status(201).json({
      id: result.insertId,
      inventory_id,
      name: name.trim(),
      quantity,
      unit: unit.trim(),
      reorder_level,
      description
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

// API route for adding ingredients
app.post("/api/ingredients", verifyToken, addIngredient);

// Add stock to an existing ingredient
// Firebase login required
async function addStock(req, res) {
  const ingredientId = Number(req.params.id);
  const { quantity_change, unit, notes = "" } = req.body;

  if (
    !Number.isInteger(ingredientId) ||
    ingredientId < 1 ||
    typeof quantity_change !== "number" ||
    !Number.isFinite(quantity_change) ||
    quantity_change <= 0 ||
    typeof unit !== "string" ||
    !unit.trim()
  ) {
    return res.status(400).json({
      error: "Invalid ingredient, quantity, or unit."
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [ingredients] = await connection.execute(
      `SELECT inventory_id, unit
       FROM ingredient
       WHERE ingredient_id = ?
       FOR UPDATE`,
      [ingredientId]
    );

    if (ingredients.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        error: "Ingredient not found."
      });
    }

    const ingredient = ingredients[0];

    // Unit must match the ingredient's existing unit
    if (ingredient.unit !== unit.trim()) {
      await connection.rollback();

      return res.status(400).json({
        error: `This ingredient uses ${ingredient.unit}.`
      });
    }

    // Update the ingredient quantity
    await connection.execute(
      `UPDATE ingredient
       SET quantity = quantity + ?
       WHERE ingredient_id = ?`,
      [quantity_change, ingredientId]
    );

    // Record the stock transaction
    await connection.execute(
      `INSERT INTO inventory_transaction
       (inventory_id, ingredient_id, user_id, type, quantity_change, notes)
       VALUES (?, ?, ?, 'add', ?, ?)`,
      [
        ingredient.inventory_id,
        ingredientId,
        1,
        quantity_change,
        notes
      ]
    );

    await connection.commit();

    res.json({
      message: "Stock added successfully.",
      ingredient_id: ingredientId,
      quantity_added: quantity_change
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Error adding stock:", error.message);

    res.status(500).json({
      error: "Unable to add stock."
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// API route for adding stock
app.post("/api/ingredients/:id/stock", verifyToken, addStock);

// Keep original POST route for compatibility
app.post("/ingredients", verifyToken, addIngredient);

// Start PantrySync backend
app.listen(PORT, () => {
  console.log(`PantrySync running at http://localhost:${PORT}`);
});

