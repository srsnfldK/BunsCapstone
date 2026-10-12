// Demo database for running without MySQL.
// Turn it on with USE_DEMO_DATA=true in backend/.env.
// The data matches database/testdata.sql. It only supports the recipe
// stock check queries. Everything else should use the real MySQL database.

const ingredients = [
  { ingredient_id: 1, name: "Flour TEST", unit: "kg", quantity: "20.00" },
  { ingredient_id: 2, name: "Sugar TEST", unit: "kg", quantity: "20.00" },
  { ingredient_id: 3, name: "Butter TEST", unit: "g", quantity: "1000.00" },
  { ingredient_id: 4, name: "Eggs TEST", unit: "count", quantity: "20.00" }
];

const recipes = [
  { recipe_id: 1, name: "Blueberry Muffins TEST", description: "TEST - Blueberry muffin recipe", servings: 16 },
  { recipe_id: 2, name: "Chocolate Cake TEST", description: "TEST - Chocolate recipe test", servings: 1 }
];

const recipeIngredients = [
  { recipe_id: 1, ingredient_id: 1, quantity: "0.50", unit: "kg" },
  { recipe_id: 1, ingredient_id: 2, quantity: "0.25", unit: "kg" },
  { recipe_id: 1, ingredient_id: 3, quantity: "100.00", unit: "g" },
  { recipe_id: 1, ingredient_id: 4, quantity: "2.00", unit: "count" },
  { recipe_id: 2, ingredient_id: 1, quantity: "0.40", unit: "kg" }
];

// Works like the mysql2 pool: returns [rows]
async function execute(sql, params = []) {
  // What a recipe needs vs what is in stock
  if (sql.includes("FROM recipe_ingredient ri")) {
    const rows = recipeIngredients
      .filter((ri) => ri.recipe_id === Number(params[0]))
      .map((ri) => {
        const ingredient = ingredients.find((i) => i.ingredient_id === ri.ingredient_id);
        return {
          id: ingredient.ingredient_id,
          name: ingredient.name,
          per_batch: ri.quantity,
          unit: ri.unit,
          on_hand: ingredient.quantity
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    return [rows];
  }

  // One recipe by id
  if (sql.includes("FROM recipe WHERE recipe_id = ?")) {
    const recipe = recipes.find((r) => r.recipe_id === Number(params[0]));
    return [recipe ? [{ id: recipe.recipe_id, name: recipe.name, servings: recipe.servings }] : []];
  }

  // All recipes (for the dropdown)
  if (sql.includes("FROM recipe")) {
    const rows = recipes
      .map((r) => ({ id: r.recipe_id, name: r.name, description: r.description, servings: r.servings }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return [rows];
  }

  throw new Error("This query is not supported in demo mode. Use the real MySQL database.");
}

module.exports = { execute, query: execute };
