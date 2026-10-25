
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

// Adding stock to existing ingredient in SQL database (Firebase login required)
async function addStock(req, res){

    //reading ingredient ID
    const ingredientId = Number(req.params.id);
    const {quantity_change, unit, notes = ""} = req.body;

    //Validating input
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
      error: "Invalid ingredient, quantity, or unit provided."
    });
  }

  const connection = await db.getConnection();

  try{

    await connection.beginTransaction();

    //finds the ingredient
    const [ingredients] = await connection.execute(
      `SELECT inventory_id, unit
       FROM ingredient
       WHERE ingredient_id = ?
       FOR UPDATE`,
      [ingredientId]
    );

    //if ingredient isn't found
    if (ingredients.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        error: "Ingredient not found."
      });
    }

    const ingredient = ingredients[0];

    //TO BE CHANGED: add functionality for unit conversion
    //(current functionality) units must match
    if (ingredient.unit !== unit) {
      await connection.rollback();

      return res.status(400).json({
        error: `Incorrect unit.This ingredient uses ${ingredient.unit}.`
      });
    }

    //adding inputted stock
    await connection.execute(
      `UPDATE ingredient
       SET quantity = quantity + ?
       WHERE ingredient_id = ?`,
      [quantity_change, ingredientId]
    );

    //adding to transaction history
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

    //Saves quantity update to database
    await connection.commit();

    res.json({
        message: "Successfully added stock to ingredient.",
        ingredient_id: ingredientId,
        quantity_added: quantity_change
    });
  }catch(error){

    //Undos update if there is an error at any point of transaction
    await connection.rollback();
    console.error("Error adding stock:", error.message);
    rest.status(500).json({
        error: "An error occurred while adding stock."
    });

  }finally{
    connection.release()
  }
}

app.post("/api/ingredients", verifyToken, addIngredient);

//adding stock to ingredient
app.post("/api/ingredients/:id/stock", verifyToken, addStock);

// Keep the original POST route for compatibility
app.post("/ingredients", verifyToken, addIngredient);

// Start backend
app.listen(PORT, () => {
  console.log(`PantrySync running at http://localhost:${PORT}`);
});

