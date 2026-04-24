// bottles.js - Complete with Sort + Manage Vendors

console.log('💊 bottles.js loaded');

if (!window.bottles) window.bottles = [];
if (!window.vendors) window.vendors = ["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"];

let editingBottleId = null;
let currentIngredients = [];

// ====================== MAIN RENDER WITH SORT ======================
function renderBottlesTab() {
    const content = document.getElementById('bottles-content');
    if (!content) return;

    content.innerHTML = `
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-2xl font-semibold">Your Bottles</h2>
                <p class="text-slate-500 dark:text-slate-400">${window.bottles.length} bottles total</p>
            </div>
            
            <div class="flex items-center gap-4">
                <!-- Sort Dropdown -->
                <select id="bottle-sort-select" onchange="sortAndRenderBottles()" 
                        class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-3 text-sm">
                    <option value="name-asc">Name (A–Z)</option>
                    <option value="name-desc">Name (Z–A)</option>
                    <option value="vendor">Vendor (A–Z)</option>
                    <option value="ingredients-desc">Most Ingredients</option>
                </select>

                <button onclick="showAddBottleModal()" 
                        class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">
                    + Add New Bottle
                </button>
                <button onclick="manageSafetyLimits()" 
                        class="px-6 py-4 border border-slate-300 dark:border-slate-600 rounded-3xl font-medium">
                    ⚠️ Safety Limits
                </button>
                <button onclick="manageVendors()" 
                        class="px-6 py-4 border border-slate-300 dark:border-slate-600 rounded-3xl font-medium">
                    Manage Vendors
                </button>
            </div>
        </div>

        <div id="bottle-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    `;

    window.currentBottleSort = 'name-asc';
    renderBottleList();
}

function sortAndRenderBottles() {
    const select = document.getElementById('bottle-sort-select');
    if (select) window.currentBottleSort = select.value;
    renderBottleList();
}

function renderBottleList() {
    const container = document.getElementById('bottle-list');
    if (!container) return;
    container.innerHTML = '';

    if (window.bottles.length === 0) {
        container.innerHTML = `
            <div class="col-span-full bg-white dark:bg-slate-800 p-12 rounded-3xl text-center">
                <p class="text-2xl mb-2">💊</p>
                <p class="text-slate-500 dark:text-slate-400">No bottles yet.<br>Click "+ Add New Bottle"</p>
            </div>`;
        return;
    }

    let sortedBottles = [...window.bottles];

    switch (window.currentBottleSort || 'name-asc') {
        case 'name-asc':
            sortedBottles.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'name-desc':
            sortedBottles.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;
        case 'vendor':
            sortedBottles.sort((a, b) => (a.vendor || '').localeCompare(b.vendor || ''));
            break;
        case 'ingredients-desc':
            sortedBottles.sort((a, b) => {
                const ca = a.ingredients ? a.ingredients.length : 0;
                const cb = b.ingredients ? b.ingredients.length : 0;
                return cb - ca;
            });
            break;
    }

    sortedBottles.forEach(bottle => {
        const preview = bottle.ingredients 
            ? bottle.ingredients.slice(0, 4).map(i => `${i.name} ${i.dose}${i.unit}`).join(' • ')
            : '';

        const div = document.createElement('div');
        div.className = "bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer transition-all group relative";
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1" onclick="editBottle('${bottle.id}')">
                    <div class="font-semibold text-xl mb-1">${bottle.name}</div>
                    ${bottle.vendor ? `<div class="text-emerald-600 text-sm mb-2">📍 ${bottle.vendor}</div>` : ''}
                    ${bottle.servingUnit ? `<div class="text-xs text-slate-500">${bottle.servingUnit}</div>` : ''}
                    <div class="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">${preview || 'No ingredients listed'}</div>
                </div>
                <button onclick="event.stopImmediatePropagation(); deleteBottle('${bottle.id}');" 
                        class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950 transition-all">
                    ✕
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ====================== MODAL ======================
function showAddBottleModal() {
    editingBottleId = null;
    currentIngredients = [];
    showStructuredBottleModal();
}

function editBottle(id) {
    const bottle = window.bottles.find(b => b.id === id);
    if (!bottle) return;
    editingBottleId = id;
    currentIngredients = bottle.ingredients ? bottle.ingredients.map(i => ({...i})) : [];
    showStructuredBottleModal(bottle);
}

function showStructuredBottleModal(bottle = null) {
    if (editingBottleId && !bottle) {
        bottle = window.bottles.find(b => b.id === editingBottleId);
    }

    let ingredientsHTML = currentIngredients.map((ing, index) => `
        <div class="flex gap-3 mb-4 items-end bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl">
            <input type="text" value="${ing.name || ''}" placeholder="Ingredient name"
                   class="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-3 text-base"
                   onchange="updateIngredient(${index}, 'name', this.value)">
            <input type="text" value="${ing.dose || ''}" placeholder="Amount"
                   class="w-32 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-3 text-base"
                   onchange="updateIngredient(${index}, 'dose', this.value)">
            <select onchange="updateIngredient(${index}, 'unit', this.value)" 
                    class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-3">
                <option value="mg" ${ing.unit === 'mg' ? 'selected' : ''}>mg</option>
                <option value="mcg" ${ing.unit === 'mcg' ? 'selected' : ''}>mcg</option>
                <option value="IU" ${ing.unit === 'IU' ? 'selected' : ''}>IU</option>
                <option value="g" ${ing.unit === 'g' ? 'selected' : ''}>g</option>
            </select>
            <button onclick="removeIngredient(${index})" class="text-red-500 hover:text-red-600 px-4 py-3">✕</button>
        </div>
    `).join('');

    if (currentIngredients.length === 0) {
        ingredientsHTML = `<p class="text-slate-500 dark:text-slate-400 py-8 text-center border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl">No ingredients added yet. Click "+ Add Ingredient"</p>`;
    }

    const sortedVendors = [...window.vendors].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    const modalHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-2xl max-h-[92vh] overflow-auto shadow-2xl">
            <h3 class="text-2xl font-semibold mb-6">${editingBottleId ? 'Edit Bottle' : 'New Bottle'}</h3>
            
            <input id="bottle-name" type="text" value="${bottle ? bottle.name || '' : ''}" placeholder="Bottle name *" 
                   class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4 mb-6">

            <div class="grid grid-cols-2 gap-6 mb-6">
                <div>
                    <label class="block text-sm text-slate-500 mb-1">Vendor</label>
                    <select id="bottle-vendor" class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4">
                        <option value="">No vendor</option>
                        ${sortedVendors.map(v => `<option value="${v}" ${bottle && bottle.vendor === v ? 'selected' : ''}>${v}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm text-slate-500 mb-1">Price</label>
                    <input id="bottle-price" type="text" value="${bottle ? bottle.price || '' : ''}" placeholder="$29.99" 
                           class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4">
                </div>
            </div>

            <div class="mb-8">
                <label class="block text-sm text-slate-500 mb-1">Serving Unit (per dose)</label>
                <input id="bottle-serving-unit" type="text" value="${bottle ? bottle.servingUnit || '' : ''}" 
                       placeholder="capsules, tablets, scoops, drops..." 
                       class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4">
            </div>

            <div class="mb-8">
                <label class="block text-sm text-slate-500 mb-1">Purchase URL</label>
                <input id="bottle-url" type="text" value="${bottle ? bottle.url || '' : ''}" placeholder="https://..." 
                       class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4">
            </div>

            <div class="mb-8">
                <div class="flex justify-between mb-3">
                    <span class="font-medium">Ingredients</span>
                    <button onclick="addIngredientRow()" class="text-emerald-600 hover:text-emerald-700">+ Add Ingredient</button>
                </div>
                <div id="ingredients-list">${ingredientsHTML}</div>
            </div>

            <div class="flex gap-4">
                <button onclick="hideBottleModal()" 
                        class="flex-1 py-4 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-3xl">Cancel</button>
                <button onclick="saveStructuredBottle()" 
                        class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-3xl">Save Bottle</button>
            </div>
        </div>
    `;

    createModal('bottle-modal', modalHTML);
}

// ... (rest of the functions remain the same - saveStructuredBottle, addIngredientRow, etc.)

// Keep all the other functions (saveStructuredBottle, addIngredientRow, etc.) as they are in your current file.

function saveStructuredBottle() {
    const name = document.getElementById('bottle-name').value.trim();
    if (!name) return showToast("Please enter a bottle name", "error");

    const ingredients = currentIngredients.filter(i => i.name && i.name.trim() !== '');

    const newBottle = {
        id: editingBottleId || 'bottle_' + Date.now(),
        name: name,
        vendor: document.getElementById('bottle-vendor').value || null,
        price: document.getElementById('bottle-price').value.trim(),
        url: document.getElementById('bottle-url').value.trim(),
        servingUnit: document.getElementById('bottle-serving-unit').value.trim(),
        ingredients: ingredients
    };

    if (editingBottleId) {
        const index = window.bottles.findIndex(b => b.id === editingBottleId);
        if (index !== -1) window.bottles[index] = newBottle;
    } else {
        window.bottles.push(newBottle);
    }

    saveAllData();
    hideBottleModal();
    renderBottlesTab();
    showToast(editingBottleId ? "Bottle updated" : "Bottle added");
}

// (Keep the rest of your helper functions: addIngredientRow, updateIngredient, removeIngredient, hideBottleModal, createModal, deleteBottle, manageSafetyLimits, manageVendors, etc.)

// Global exports
window.renderBottlesTab = renderBottlesTab;
window.showAddBottleModal = showAddBottleModal;
window.editBottle = editBottle;
window.deleteBottle = deleteBottle;
window.manageSafetyLimits = manageSafetyLimits;
window.manageVendors = manageVendors;