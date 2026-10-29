

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDMa6TXMIInBlf9w7HzI2Bc_sBMpj_bmp4",
    authDomain: "pantrysync-62d6b.firebaseapp.com",
    projectId: "pantrysync-62d6b",
    storageBucket: "pantrysync-62d6b.firebasestorage.app",
    messagingSenderId: "170861286787",
    appId: "1:170861286787:web:4fbd2e3f468a1817e8d2b6",
    measurementId: "G-XQL314QS46"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

let currentUser = null;

// Get a fresh Firebase token for protected API requests
async function authenticatedFetch(url, options = {}) {
    if (!currentUser) {
        throw new Error("Please log in first.");
    }

    const token = await currentUser.getIdToken();

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    });
}

// Display ingredients from MySQL
async function loadIngredients() {
    const tableBody = document.getElementById("ingredients-body");

    if (!tableBody) return;

    tableBody.innerHTML =
        '<tr><td colspan="4">Loading ingredients...</td></tr>';

    try {
        const response = await authenticatedFetch("/api/ingredients");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const ingredients = await response.json();
        tableBody.replaceChildren();

        if (ingredients.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="4">No ingredients yet.</td></tr>';
            return;
        }

        ingredients.forEach(ingredient => {
            const row = document.createElement("tr");

            [
                ingredient.id,
                ingredient.name,
                ingredient.quantity,
                ingredient.unit
            ].forEach(value => {
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

// Add a new ingredient to MySQL
async function addIngredient(event) {
    event.preventDefault();

    const form = document.getElementById("add-ingredient-form");
    const button = document.getElementById("add-button");
    const message = document.getElementById("add-message");

    const name = document.getElementById("ingredient-name").value.trim();
    const quantity = Number(
        document.getElementById("ingredient-quantity").value
    );
    const unit = document.getElementById("ingredient-unit").value;

    if (!name || !Number.isFinite(quantity) || quantity < 0 || !unit) {
        message.textContent = "Please enter valid ingredient information.";
        return;
    }

    button.disabled = true;
    message.textContent = "Adding ingredient...";

    try {
        const response = await authenticatedFetch("/api/ingredients", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                quantity,
                unit,
                inventory_id: 1
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error || `HTTP error: ${response.status}`
            );
        }

        message.textContent = "Ingredient added successfully!";
        form.reset();

        // Refresh the table automatically
        await loadIngredients();

    } catch (error) {
        console.error("Error adding ingredient:", error);
        message.textContent = `Could not add ingredient: ${error.message}`;
    } finally {
        button.disabled = false;
    }
}

// Handle Firebase login and logout
onAuthStateChanged(auth, async user => {
    currentUser = user;

    const status = document.getElementById("auth-status");
    const authLink = document.getElementById("auth-link");
    const tableBody = document.getElementById("ingredients-body");
    const addSection = document.getElementById("add-section");

    if (authLink) {
        authLink.onclick = null;

        if (user) {
            authLink.textContent = "Logout";
            authLink.href = "#";

            authLink.onclick = async event => {
                event.preventDefault();
                await signOut(auth);
                window.location.href = "/login.html";
            };
        } else {
            authLink.textContent = "Login";
            authLink.href = "/login.html";
        }
    }

    if (status) {
        status.textContent = user
            ? `Signed in as ${user.email}`
            : "Please log in to view ingredients.";
    }

    if (addSection) {
        addSection.hidden = !user;
    }

    if (!user) {
        if (tableBody) {
            tableBody.innerHTML =
                '<tr><td colspan="4">Please log in to view ingredients.</td></tr>';
        }
        return;
    }

    if (tableBody) {
        await loadIngredients();
    }
});

// Connect the Add Ingredient form
document.getElementById("add-ingredient-form")
    ?.addEventListener("submit", addIngredient);
