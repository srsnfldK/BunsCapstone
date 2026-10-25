//PantrySync Firebase imports
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// PantrySync Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyDMa6TXMIInBlf9w7HzI2Bc_sBMpj_bmp4",
      authDomain: "pantrysync-62d6b.firebaseapp.com",
      projectId: "pantrysync-62d6b",
      storageBucket: "pantrysync-62d6b.firebasestorage.app",
      messagingSenderId: "170861286787",
      appId: "1:170861286787:web:4fbd2e3f468a1817e8d2b6",
      measurementId: "G-XQL314QS46"
    };

//connecting and authenticating with firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

//function for loading backend ingredient data into frontend
async function loadIngredients(user) {
    const tableBody = document.getElementById("ingredients-body");

    if (!tableBody) {
        return;
    }

    //temp firebase token
    const token = await user.getIdToken();

    const response = await fetch("/api/ingredients", {
        headers: {
            Authorization: "Bearer " + token
        }
    });

    const ingredients = await response.json();

    if (!response.ok) {
        throw new Error(ingredients.error);
    }

    tableBody.replaceChildren();

    //ingredient dropdown for stock form
    const stockSelect = document.getElementById("stock-ingredient");

    if (stockSelect) {
        
        stockSelect.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select an ingredient";
        placeholder.disabled = true;
        placeholder.selected = true;

        stockSelect.appendChild(placeholder);

        // Add every database ingredient to the dropdown.
        ingredients.forEach((ingredient) => {
            const option = document.createElement("option");

            option.value = ingredient.id;
            option.textContent =
                `${ingredient.name} (${ingredient.quantity} ${ingredient.unit})`;

            stockSelect.appendChild(option);
        });
    }

    //creating row for each ingredient
    ingredients.forEach((ingredient) => {
        const row = document.createElement("tr");

        [
            ingredient.id,
            ingredient.name,
            ingredient.quantity,
            ingredient.unit
        ].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "";
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

//new ingredients function
const newIngredientForm = document.getElementById("new-ingredient-form");
if(newIngredientForm){

    newIngredientForm.addEventListener("submit", async (event) => {

        event.preventDefault();
        const messageElement = document.getElementById("new-ingredient-message");
        const user = auth.currentUser;

        if (!user) {
            messageElement.textContent = "You must be logged in to add an ingredient.";
            return;
        }

        //reading values entered in the form
        const name = document.getElementById("new-ingredient-name").value.trim();
        const quantity = Number(document.getElementById("new-stock-quantity").value);
        const unit = document.getElementById("new-ingredient-unit").value;

        //backend auth with firebase
        try{

            const token = await user.getIdToken();

            const response = await fetch("/api/ingredients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({ name, quantity, unit, inventory_id: 1 })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error);
            }

            messageElement.textContent = "Ingredient added successfully!";
            newIngredientForm.reset();
            await loadIngredients(user);

        }catch (error) {
            console.error("Error adding ingredient:", error);
            messageElement.textContent = error.message;
        }
    });

}

//Stock form handler
const stockForm = document.getElementById("add-stock-form");
if (stockForm) {
    stockForm.addEventListener("submit", async (event) => {

        event.preventDefault();
        const messageElement = document.getElementById("stock-message");
        const user = auth.currentUser;

        if (!user) {
            messageElement.textContent =
                "You must be logged in to edit inventory.";
            return;
        }

        // Read the selected ingredient and submitted values.
        const ingredientId = document.getElementById("stock-ingredient").value;
        const quantityChange = Number(document.getElementById("stock-quantity").value);
        const unit = document.getElementById("stock-unit").value;

        //backend auth with firebase
        try {

            const token = await user.getIdToken();

            // Sending the stock update to the backend.
            const response = await fetch(
                `/api/ingredients/${ingredientId}/stock`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token
                    },
                    body: JSON.stringify({quantity_change: quantityChange,unit})
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error);
            }

            messageElement.textContent = "Stock added successfully!";

            stockForm.reset();

            await loadIngredients(user);
        } catch (error) {
            console.error("Error adding stock:", error);
            messageElement.textContent = error.message;
        }
    });
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        console.log("No Firebase user is logged in.");
        return;
    }

    try {
        //will not load ingredients if user is not logged in, will throw error
        await loadIngredients(user);
    } catch (error) {
        console.error("Error loading ingredients:", error);

        const tableBody = document.getElementById("ingredients-body");

        if (tableBody) {
            tableBody.innerHTML =
                "<tr><td colspan='4'>Could not load ingredients.</td></tr>";
        }
    }
});


