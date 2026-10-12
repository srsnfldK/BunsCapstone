const recipeSelect = document.getElementById("recipe-select");
const batchesInput = document.getElementById("batches");
const form = document.getElementById("check-form");
const message = document.getElementById("result-message");
const table = document.getElementById("check-table");
const tableBody = document.getElementById("check-body");

// Fill the dropdown with recipes from the database
async function loadRecipes() {
    try {
        const response = await fetch("/api/recipes");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const recipes = await response.json();
        recipeSelect.replaceChildren();

        recipes.forEach(recipe => {
            const option = document.createElement("option");
            option.value = recipe.id;
            option.textContent = recipe.name;
            recipeSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading recipes:", error);
        recipeSelect.innerHTML = '<option value="">Could not load recipes</option>';
    }
}

// Ask the backend if there is enough stock
async function checkStock(event) {
    event.preventDefault();

    const recipeId = recipeSelect.value;
    const batches = batchesInput.value;

    if (!recipeId) {
        return;
    }

    try {
        const response = await fetch(
            `/api/recipes/${recipeId}/stock-check?batches=${encodeURIComponent(batches)}`
        );
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error: ${response.status}`);
        }

        showResult(data);
    } catch (error) {
        console.error("Error checking stock:", error);
        table.hidden = true;
        message.className = "message-short";
        message.textContent = error.message;
    }
}

// Show the result table and the summary message
function showResult(data) {
    tableBody.replaceChildren();

    data.ingredients.forEach(item => {
        const row = document.createElement("tr");
        const status = item.enough
            ? "Enough"
            : `Short by ${item.short_by} ${item.unit}`;

        const values = [
            item.name,
            `${item.needed} ${item.unit}`,
            `${item.on_hand} ${item.unit}`,
            status
        ];

        values.forEach((value, index) => {
            const cell = document.createElement("td");
            cell.textContent = value;

            if (index === 3) {
                cell.className = item.enough ? "status-ok" : "status-short";
            }

            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });

    table.hidden = false;

    if (data.can_make) {
        message.className = "message-ok";
        message.textContent =
            `You have everything to make ${data.batches} batch(es) of ${data.recipe.name}.`;
    } else {
        message.className = "message-short";
        message.textContent =
            `Not enough stock: ${data.missing_count} ingredient(s) short for ` +
            `${data.batches} batch(es) of ${data.recipe.name}.`;
    }
}

form.addEventListener("submit", checkStock);
loadRecipes();
