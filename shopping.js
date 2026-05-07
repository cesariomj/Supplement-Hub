// shopping.js - Clean & Polished Version

console.log('🛒 shopping.js loaded');

if (!window.shoppingLists) window.shoppingLists = {};
if (!window.currentShoppingListName) window.currentShoppingListName = "Monthly";

function renderShoppingTab() {
    const content = document.getElementById('shopping-content');
    if (!content) return;

    // Ensure default lists exist
    const defaultLists = ["Monthly", "Weekly", "Bi-weekly"];
    defaultLists.forEach(name => {
        if (!window.shoppingLists[name]) window.shoppingLists[name] = {};
    });

    const currentList = window.shoppingLists[window.currentShoppingListName] || {};
    const selectedCount = Object.keys(currentList).length;

    let html = `
        <div class="mb-8 flex justify-between items-center">
            <div>
                <h2 class="text-2xl font-semibold">Shopping Lists</h2>
                <p class="text-slate-500 dark:text-slate-400">${selectedCount} items in <span class="font-medium">"${window.currentShoppingListName}"</span></p>
            </div>
        </div>

        <div class="flex flex-wrap gap-4 mb-8 items-end">
            <div class="flex-1 min-w-[220px]">
                <label class="block text-sm text-slate-500 mb-1">Current List</label>
                <select id="shopping-list-select" onchange="switchShoppingList(this.value)" 
                        class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4 text-lg">
                    ${Object.keys(window.shoppingLists).sort().map(name => `
                        <option value="${name}" ${name === window.currentShoppingListName ? 'selected' : ''}>${name}</option>
                    `).join('')}
                </select>
            </div>

            <div class="min-w-[160px]">
                <label class="block text-sm text-slate-500 mb-1">Sort by</label>
                <select id="shopping-sort-select" onchange="renderShoppingTable()" 
                        class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4">
                    <option value="name">Name (A–Z)</option>
                    <option value="vendor">Vendor</option>
                </select>
            </div>

            <button onclick="addNewShoppingList()" 
                    class="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">+ New List</button>

            <button onclick="printShoppingList()" 
                    class="px-8 py-4 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl font-medium">🖨️ Print</button>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full bg-white dark:bg-slate-800 rounded-3xl overflow-hidden">
                <thead>
                    <tr class="bg-slate-100 dark:bg-slate-900">
                        <th class="px-6 py-5 w-10"></th>
                        <th class="px-6 py-5 text-left font-medium">Bottle Name</th>
                        <th class="px-6 py-5 text-left font-medium">Vendor</th>
                        <th class="px-6 py-5 text-left font-medium">Price</th>
                        <th class="px-6 py-5 text-left font-medium">Purchase URL</th>
                    </tr>
                </thead>
                <tbody id="shopping-table-body" class="divide-y dark:divide-slate-700"></tbody>
            </table>
        </div>
    `;

    content.innerHTML = html;
    renderShoppingTable();
}

function renderShoppingTable() {
    const tbody = document.getElementById('shopping-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (window.bottles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-12 text-center text-slate-500">No bottles yet. Go to the Bottles tab first.</td></tr>`;
        return;
    }

    const currentList = window.shoppingLists[window.currentShoppingListName] || {};
    const sortMode = document.getElementById('shopping-sort-select')?.value || 'name';

    let sortedBottles = [...window.bottles];

    if (sortMode === 'vendor') {
        sortedBottles.sort((a, b) => (a.vendor || '').localeCompare(b.vendor || ''));
    } else {
        sortedBottles.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    sortedBottles.forEach(bottle => {
        const isChecked = !!currentList[bottle.id];
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-50 dark:hover:bg-slate-700";
        row.innerHTML = `
            <td class="px-6 py-5">
                <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleShoppingItem('${bottle.id}', this.checked)">
            </td>
            <td class="px-6 py-5 font-medium">${bottle.name}</td>
            <td class="px-6 py-5 text-slate-500">${bottle.vendor || '-'}</td>
            <td class="px-6 py-5">
                <input type="text" value="${bottle.price || ''}" placeholder="$0.00" 
                       class="w-28 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-4 py-2 text-sm"
                       onchange="updateBottleField('${bottle.id}', 'price', this.value)">
            </td>
            <td class="px-6 py-5">
                ${bottle.url ? 
                    `<a href="${bottle.url}" target="_blank" class="inline-flex items-center gap-1 text-emerald-600 hover:underline">🔗 Open</a>` : 
                    `<span class="text-slate-400 text-sm">No URL</span>`
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Core Functions
function toggleShoppingItem(bottleId, checked) {
    if (!window.shoppingLists[window.currentShoppingListName]) {
        window.shoppingLists[window.currentShoppingListName] = {};
    }
    if (checked) {
        window.shoppingLists[window.currentShoppingListName][bottleId] = true;
    } else {
        delete window.shoppingLists[window.currentShoppingListName][bottleId];
    }
    saveAllData();
}

function updateBottleField(bottleId, field, value) {
    const bottle = window.bottles.find(b => b.id === bottleId);
    if (bottle) {
        bottle[field] = value.trim();
        saveAllData();
    }
}

function switchShoppingList(listName) {
    window.currentShoppingListName = listName;
    saveAllData();
    renderShoppingTable();
}

function addNewShoppingList() {
    const name = prompt("New shopping list name (e.g. Travel Kit):");
    if (!name || !name.trim()) return;

    const cleanName = name.trim();
    if (!window.shoppingLists[cleanName]) {
        window.shoppingLists[cleanName] = {};
        window.currentShoppingListName = cleanName;
        saveAllData();
        renderShoppingTab();
        showToast(`Created list: ${cleanName}`);
    }
}

function printShoppingList() {
    const listName = window.currentShoppingListName;
    const selectedIds = Object.keys(window.shoppingLists[listName] || {});

    if (selectedIds.length === 0) {
        showToast("No items selected", "error");
        return;
    }

    const selected = window.bottles
        .filter(b => selectedIds.includes(b.id))
        .sort((a, b) => a.name.localeCompare(b.name));

    let printHTML = `
        <html><head><title>${listName}</title>
        <style>body{font-family:Arial;margin:40px;} table{width:100%;border-collapse:collapse;} th,td{padding:12px;border:1px solid #ccc;}</style>
        </head><body>
        <h1>${listName} - ${window.currentProfile}</h1>
        <table><thead><tr><th>Bottle</th><th>Vendor</th><th>Price</th><th>URL</th></tr></thead><tbody>`;

    selected.forEach(b => {
        printHTML += `<tr><td>${b.name}</td><td>${b.vendor || '-'}</td><td>${b.price || '-'}</td><td>${b.url || '-'}</td></tr>`;
    });

    printHTML += `</tbody></table></body></html>`;

    const win = window.open('', '_blank');
    win.document.write(printHTML);
    win.document.close();
    win.print();
}

// Exports
window.renderShoppingTab = renderShoppingTab;
window.toggleShoppingItem = toggleShoppingItem;
window.updateBottleField = updateBottleField;
window.switchShoppingList = switchShoppingList;
window.addNewShoppingList = addNewShoppingList;
window.printShoppingList = printShoppingList;