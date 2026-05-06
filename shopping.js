// shopping.js - Polished Shopping Lists

console.log('🛒 shopping.js loaded');

if (!window.shoppingLists) window.shoppingLists = {};
if (!window.currentShoppingListName) window.currentShoppingListName = "Monthly";

const DEFAULT_LISTS = ["Mark's", "Lisa's", "Monthly", "Weekly", "Bi-weekly"];

function renderShoppingTab() {
    const content = document.getElementById('shopping-content');
    if (!content) return;

    // Ensure default lists exist for current profile
    const defaultLists = ["Monthly", "Weekly", "Bi-weekly"];
    defaultLists.forEach(name => {
        if (!window.shoppingLists[name]) {
            window.shoppingLists[name] = {};
        }
    });

    const currentList = window.shoppingLists[window.currentShoppingListName] || {};
    const selectedCount = Object.keys(currentList).length;

    // ... rest of your existing renderShoppingTab code stays the same ...
    let html = `
        <div class="mb-8">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-semibold mb-1">Shopping Lists</h2>
                    <p class="text-slate-500 dark:text-slate-400">${selectedCount} bottles selected in <span class="font-medium">"${window.currentShoppingListName}"</span></p>
                </div>
            </div>
        </div>

        <div class="flex flex-wrap gap-4 mb-8 items-end">
            <!-- List Selector -->
            <div class="flex-1 min-w-[220px]">
                <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">Current List</label>
                <select id="shopping-list-select" onchange="switchShoppingList(this.value)" 
                        class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4 text-lg">
                    ${Object.keys(window.shoppingLists).sort().map(name => `
                        <option value="${name}" ${name === window.currentShoppingListName ? 'selected' : ''}>${name}</option>
                    `).join('')}
                </select>
            </div>

            <!-- Sort -->
            <div class="min-w-[160px]">
                <label class="block text-sm text-slate-500 dark:text-slate-400 mb-1">Sort by</label>
                <select id="shopping-sort-select" onchange="renderShoppingTable()" 
                        class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4">
                    <option value="name">Name (A–Z)</option>
                    <option value="vendor">Vendor</option>
                </select>
            </div>

            <button onclick="addNewShoppingList()" 
                    class="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium whitespace-nowrap">
                + New List
            </button>

            <button onclick="printShoppingList()" 
                    class="px-8 py-4 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl font-medium whitespace-nowrap">
                🖨️ Print Current List
            </button>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full border-collapse bg-white dark:bg-slate-800 rounded-3xl overflow-hidden">
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
        tbody.innerHTML = `<tr><td colspan="5" class="p-12 text-center text-slate-500">No bottles added yet. Go to Bottles tab first.</td></tr>`;
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
        const price = bottle.price || '';
        const url = bottle.url || '';
        const vendor = bottle.vendor || '-';

        const row = document.createElement('tr');
        row.className = "hover:bg-slate-50 dark:hover:bg-slate-700";
        row.innerHTML = `
            <td class="px-6 py-5">
                <input type="checkbox" ${isChecked ? 'checked' : ''} 
                       onchange="toggleShoppingItem('${bottle.id}', this.checked)">
            </td>
            <td class="px-6 py-5 font-medium">${bottle.name}</td>
            <td class="px-6 py-5 text-slate-500">${vendor}</td>
            <td class="px-6 py-5">
                <input type="text" value="${price}" placeholder="$29.99" 
                       class="w-28 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-4 py-2 text-sm"
                       onchange="updateBottleField('${bottle.id}', 'price', this.value)">
            </td>
            <td class="px-6 py-5">
                ${url ? 
                    `<a href="${url}" target="_blank" 
                        class="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 hover:underline">
                        🔗 Open Link
                    </a>` : 
                    `<span class="text-slate-400 text-sm">No URL</span>`
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

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
        if (typeof saveAllData === 'function') saveAllData();
    }
}

function switchShoppingList(listName) {
    window.currentShoppingListName = listName;
    saveAllData();                    // ← Important
    renderShoppingTable();
}

function addNewShoppingList() {
    const name = prompt("Enter new shopping list name (e.g. 'Travel Kit'):");
    if (name && name.trim()) {
        const cleanName = name.trim();
        if (!window.shoppingLists[cleanName]) {
            window.shoppingLists[cleanName] = {};
            window.currentShoppingListName = cleanName;
            saveAllData();            // ← Important
            renderShoppingTab();
        }
    }
}

function printShoppingList() {
    const listName = window.currentShoppingListName;
    const selectedIds = Object.keys(window.shoppingLists[listName] || {});

    if (selectedIds.length === 0) {
        showToast("No items selected in this list", "error");
        return;
    }

    const selectedBottles = window.bottles
        .filter(b => selectedIds.includes(b.id))
        .sort((a, b) => a.name.localeCompare(b.name));

    let printHTML = `
        <html>
        <head>
            <title>${listName} Shopping List</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                h1 { text-align: center; margin-bottom: 40px; font-size: 28px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 12px 15px; text-align: left; border: 1px solid #ccc; }
                th { background-color: #f8f8f8; }
                .price { text-align: right; }
            </style>
        </head>
        <body>
            <h1>${listName} Shopping List</h1>
            <table>
                <thead>
                    <tr>
                        <th>Bottle Name</th>
                        <th>Vendor</th>
                        <th class="price">Price</th>
                        <th>Purchase URL</th>
                    </tr>
                </thead>
                <tbody>
    `;

    selectedBottles.forEach(bottle => {
        printHTML += `
            <tr>
                <td><strong>${bottle.name}</strong></td>
                <td>${bottle.vendor || '-'}</td>
                <td class="price">${bottle.price || '-'}</td>
                <td>${bottle.url ? `<a href="${bottle.url}" target="_blank">${bottle.url}</a>` : '-'}</td>
            </tr>
        `;
    });

    printHTML += `</tbody></table></body></html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
}

// Global exports
window.renderShoppingTab = renderShoppingTab;
window.toggleShoppingItem = toggleShoppingItem;
window.updateBottleField = updateBottleField;
window.switchShoppingList = switchShoppingList;
window.addNewShoppingList = addNewShoppingList;
window.printShoppingList = printShoppingList;