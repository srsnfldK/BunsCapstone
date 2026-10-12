
const express = require("express");
const app = express();

app.use(express.json());

const PORT = 3000;

// Sample inventory data
let ingredients = [
  { id: 1, name: "Flour", quantity: 25, unit: "lbs" },
  { id: 2, name: "Sugar", quantity: 10, unit: "lbs" },
  { id: 3, name: "Eggs", quantity: 36, unit: "count" }
];

// Home page
app.get("/", (req, res) => {
  res.send("PantrySync Backend is Running!");
});

// View ingredients
app.get("/ingredients", (req, res) => {
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
