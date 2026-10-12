console.log("app.js is running!");
async function loadIngredients() {
    const tableBody = document.getElementById("ingredients-body");

    if (!tableBody) {
        console.error("Could not find ingredients-body in HTML.");
        return;
    }

    try {
        const response = await fetch("/api/ingredients");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const ingredients = await response.json();
        console.log("Ingredients received:", ingredients);

        tableBody.replaceChildren();

        ingredients.forEach(ingredient => {
            const row = document.createElement("tr");

            [ingredient.id, ingredient.name,
             ingredient.quantity, ingredient.unit].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading ingredients:", error);
        tableBody.innerHTML =
            '<tr><td colspan="4">Could not load ingredients.</td></tr>';
    }
}

document.addEventListener("DOMContentLoaded", loadIngredients);
