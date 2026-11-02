// Extra tools for the Recipe Stock Check page.
// These only use the stock check result the page already has,
// so they don't call the backend, the database or Firebase.

// How many whole batches can be made with what is on hand?
// Returns { batches, limitedBy: [names] } or null if the recipe has no ingredients.
// limitedBy lists every ingredient that runs out first (there can be a tie).
export function maxBatches(data) {
    let best = null;

    data.ingredients.forEach(item => {
        const perBatch = item.needed / data.batches;

        if (!(perBatch > 0)) {
            return; // ingredient with no amount can't limit the recipe
        }

        // Small extra amount avoids rounding errors like 9.9999999 -> 9
        const possible = Math.floor(item.on_hand / perBatch + 1e-9);

        if (best === null || possible < best.batches) {
            best = { batches: possible, limitedBy: [item.name] };
        } else if (possible === best.batches) {
            best.limitedBy.push(item.name);
        }
    });

    return best;
}

// The items that are short and how much more is needed
export function shoppingList(data) {
    return data.ingredients
        .filter(item => !item.enough)
        .map(item => ({
            name: item.name,
            amount: item.short_by,
            unit: item.unit
        }));
}

// The shopping list as plain text, ready to paste into a text or email
export function shoppingListText(data) {
    const lines = shoppingList(data).map(
        item => `- ${item.name}: ${item.amount} ${item.unit}`
    );

    return `Shopping list for ${data.batches} batch(es) of ${data.recipe.name}:\n` +
        lines.join("\n");
}
