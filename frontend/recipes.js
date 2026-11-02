// PantrySync Firebase imports (same versions as app.js)
import { initializeApp, getApps, getApp } from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import { maxBatches, shoppingList, shoppingListText } from "./stockTools.js";

// PantrySync Firebase configuration (same as app.js)
const firebaseConfig = {
    apiKey: "AIzaSyDMa6TXMIInBlf9w7HzI2Bc_sBMpj_bmp4",
    authDomain: "pantrysync-62d6b.firebaseapp.com",
    projectId: "pantrysync-62d6b",
    storageBucket: "pantrysync-62d6b.firebasestorage.app",
    messagingSenderId: "170861286787",
    appId: "1:170861286787:web:4fbd2e3f468a1817e8d2b6",
    measurementId: "G-XQL314QS46"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const recipeSelect = document.getElementById("recipe-select");
const batchesInput = document.getElementById("batches");
const form = document.getElementById("check-form");
const message = document.getElementById("result-message");
const table = document.getElementById("check-table");
const tableBody = document.getElementById("check-body");
const authStatus = document.getElementById("auth-status");
const maxBatchesText = document.getElementById("max-batches");
const shoppingSection = document.getElementById("shopping-list");
const shoppingItems = document.getElementById("shopping-items");
const copyButton = document.getElementById("copy-list");
const copyStatus = document.getElementById("copy-status");

let lastResult = null;

let currentUser = null;

// Send the Firebase login token with every request (if logged in)
async function apiGet(url) {
    const headers = {};

    if (currentUser) {
        headers.Authorization = "Bearer " + await currentUser.getIdToken();
    }

    const response = await fetch(url, { headers });
    const data = await response.json();

    if (response.status === 401) {
        throw new Error("Please log in to use the recipe stock check.");
    }

    if (!response.ok) {
        throw new Error(data.error || `HTTP error: ${response.status}`);
    }

    return data;
}

// Fill the dropdown with recipes from the database
async function loadRecipes() {
    try {
        const recipes = await apiGet("/api/recipes");
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
        showError(error.message);
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
        const data = await apiGet(
            `/api/recipes/${recipeId}/stock-check?batches=${encodeURIComponent(batches)}`
        );
        showResult(data);
    } catch (error) {
        console.error("Error checking stock:", error);
        showError(error.message);
    }
}

function showError(text) {
    table.hidden = true;
    maxBatchesText.hidden = true;
    shoppingSection.hidden = true;
    message.className = "message-short";
    message.textContent = text;
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
    lastResult = data;
    showMaxBatches(data);
    showShoppingList(data);

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

// Update the Login/Logout link and load recipes once we know who is logged in
onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    const authLink = document.getElementById("auth-link");

    if (authLink) {
        authLink.onclick = null;
        authLink.textContent = user ? "Logout" : "Login";
        authLink.href = user ? "#" : "/login.html";

        if (user) {
            authLink.onclick = async (event) => {
                event.preventDefault();
                await signOut(auth);
                window.location.href = "/login.html";
            };
        }
    }

    if (authStatus) {
        authStatus.textContent = user
            ? `Signed in as ${user.email}`
            : "Not logged in.";
    }

    message.textContent = "";
    message.className = "";
    await loadRecipes();
});

// "How many batches can I make?"
function showMaxBatches(data) {
    const result = maxBatches(data);

    if (!result) {
        maxBatchesText.hidden = true;
        return;
    }

    const names = result.limitedBy.join(" and ");
    const verb = result.limitedBy.length > 1 ? "run" : "runs";

    maxBatchesText.textContent = result.batches === 0
        ? `You can't make any batches right now. Not enough ${names}.`
        : `You can make up to ${result.batches} batch(es) with what's on hand. ` +
          `${names} ${verb} out first.`;
    maxBatchesText.hidden = false;
}

// List of what to buy, only shown when something is short
function showShoppingList(data) {
    const items = shoppingList(data);
    shoppingItems.replaceChildren();
    copyStatus.textContent = "";

    if (items.length === 0) {
        shoppingSection.hidden = true;
        return;
    }

    items.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.name}: ${item.amount} ${item.unit}`;
        shoppingItems.appendChild(li);
    });

    shoppingSection.hidden = false;
}

// Copy the shopping list so it can be pasted into a text or email
async function copyShoppingList() {
    if (!lastResult) {
        return;
    }

    const text = shoppingListText(lastResult);

    try {
        await navigator.clipboard.writeText(text);
        copyStatus.textContent = "Copied!";
    } catch (error) {
        console.error("Copy failed:", error);
        copyStatus.textContent = "Couldn't copy. Select the list and copy it by hand.";
    }
}

form.addEventListener("submit", checkStock);
copyButton.addEventListener("click", copyShoppingList);
