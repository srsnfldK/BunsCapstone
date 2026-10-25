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
