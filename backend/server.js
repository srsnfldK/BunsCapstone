
require("dotenv").config();

const express = require("express");
const path = require("path");
// Use demo data when MySQL is not available (USE_DEMO_DATA=true in .env)
const db = process.env.USE_DEMO_DATA === "true" ? require("./demoDb") : require("./db");
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

// ---------- Recipe stock check ----------

// Frontend recipes page
app.get("/recipes", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/recipes.html"));
});

// List all recipes (for the dropdown)
app.get("/api/recipes", async (req, res) => {
  try {
    const [recipes] = await db.query(
      `SELECT recipe_id AS id, name, description, servings
       FROM recipe
       ORDER BY name`
    );

    res.json(recipes);
  } catch (error) {
    console.error("Error loading recipes:", error.message);
    res.status(500).json({ error: "Unable to load recipes." });
  }
});

// Check if there is enough stock to make a recipe
// Example: GET /api/recipes/1/stock-check?batches=3
app.get("/api/recipes/:id/stock-check", async (req, res) => {
  const recipeId = Number(req.params.id);
  const batches = Number(req.query.batches ?? 1);

  if (!Number.isInteger(recipeId) || recipeId < 1) {
    return res.status(400).json({ error: "Recipe id must be a positive whole number." });
  }

  if (!Number.isFinite(batches) || batches <= 0) {
    return res.status(400).json({ error: "Batches must be a number greater than 0." });
  }

  try {
    // 1. Make sure the recipe exists
    const [recipes] = await db.execute(
      "SELECT recipe_id AS id, name, servings FROM recipe WHERE recipe_id = ?",
      [recipeId]
    );

    if (recipes.length === 0) {
      return res.status(404).json({ error: "Recipe not found." });
    }

    // 2. Get what the recipe needs and what is in stock
    const [rows] = await db.execute(
      `SELECT i.ingredient_id AS id,
              i.name,
              ri.quantity AS per_batch,
              ri.unit,
              i.quantity AS on_hand
       FROM recipe_ingredient ri
       JOIN ingredient i ON i.ingredient_id = ri.ingredient_id
       WHERE ri.recipe_id = ?
       ORDER BY i.name`,
      [recipeId]
    );

    // 3. Compare needed vs on hand for each ingredient
    const round = (n) => Math.round(n * 100) / 100;

    const ingredients = rows.map((row) => {
      const needed = round(Number(row.per_batch) * batches);
      const onHand = Number(row.on_hand);
      const shortBy = round(Math.max(0, needed - onHand));

      return {
        id: row.id,
        name: row.name,
        unit: row.unit,
        needed,
        on_hand: onHand,
        short_by: shortBy,
        enough: shortBy === 0
      };
    });

    const missing = ingredients.filter((item) => !item.enough);

    res.json({
      recipe: recipes[0],
      batches,
      can_make: missing.length === 0,
      missing_count: missing.length,
      ingredients
    });
  } catch (error) {
    console.error("Error checking recipe stock:", error.message);
    res.status(500).json({ error: "Unable to check recipe stock." });
  }
});



// Start backend
app.listen(PORT, () => {
  console.log(`PantrySync running at http://localhost:${PORT}`);
});

