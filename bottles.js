// bottles.js - Clean Bottles Tab + Modal (localStorage only)

console.log('💊 bottles.js loaded');

if (!window.bottles) window.bottles = [];
if (!window.vendors) window.vendors = ["Amazon", "iHerb", "Vitacost", "iHerb", "PureFormulas"];

window.hideModal = hideModal;

let editingBottleId = null;
let currentIngredients = [];

// Render the entire Bottles tab
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
                <select id="bottle-sort-select" onchange="sortAndRenderBottles()" 
                        class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-3 text-sm">
                    <option value="name-asc">Name (A–Z)</option>
                    <option value="name-desc">Name (Z–A)</option>
                    <option value="vendor">Vendor (A–Z)</option>
                    <option value="ingredients-desc">Most Ingredients</option>
                </select>

                <button onclick="showAddBottleModal()" 
                        class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium transition-all active:scale-95">
                    + Add New Bottle
                </button>
                <button onclick="manageSafetyLimits()" 
                        class="px-8 py-4 border border-slate-300 dark:border-slate-600 rounded-3xl font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                    ⚠️ Safety Limits
                </button>
            </div>
        </div>

        <div id="bottle-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    `;

    // Default sort: Name A–Z
    window.currentBottleSort = 'name-asc';
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
                <p class="text-slate-500 dark:text-slate-400">No bottles yet.<br>Click "+ Add New Bottle" to start.</p>
            </div>`;
        return;
    }

    // Make a copy and sort it
    let sortedBottles = [...window.bottles];

    switch (window.currentBottleSort || 'name-asc') {
        case 'name-asc':
            sortedBottles.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'name-desc':
            sortedBottles.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;
        case 'vendor':
            sortedBottles.sort((a, b) => {
                const va = (a.vendor || '').toLowerCase();
                const vb = (b.vendor || '').toLowerCase();
                return va.localeCompare(vb);
            });
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
        div.className = "bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all group relative";
        
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="font-semibold text-xl mb-1">${bottle.name}</div>
                    ${bottle.vendor ? `<div class="text-emerald-600 text-sm mb-3">📍 ${bottle.vendor}</div>` : ''}
                    <div class="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 min-h-[3.5rem]">
                        ${preview || 'No ingredients listed'}
                    </div>
                    <div class="text-xs text-slate-400 mt-4">${bottle.ingredients ? bottle.ingredients.length : 0} ingredients</div>
                </div>
                
                <button onclick="event.stopImmediatePropagation(); deleteBottle('${bottle.id}');" 
                        class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950 transition-all">
                    ✕
                </button>
            </div>
        `;

        div.onclick = (e) => {
            if (!e.target.closest('button')) editBottle(bottle.id);
        };
        container.appendChild(div);
    });
}

// Modal Functions
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
            
            <button onclick="removeIngredient(${index})" 
                    class="text-red-500 hover:text-red-600 px-4 py-3 text-xl leading-none">✕</button>
        </div>
    `).join('');

    if (currentIngredients.length === 0) {
        ingredientsHTML = `<p class="text-slate-500 dark:text-slate-400 py-8 text-center border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl">No ingredients added yet. Click "+ Add Ingredient"</p>`;
    }

    const modalHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-2xl max-h-[92vh] overflow-auto shadow-2xl">
            <h3 class="text-2xl font-semibold mb-6">${editingBottleId ? 'Edit Bottle' : 'New Bottle'}</h3>
            
            <input id="bottle-name" type="text" value="${bottle ? bottle.name || '' : ''}" placeholder="Bottle / Product name *"
                   class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4 mb-6 text-lg">

            <div class="grid grid-cols-2 gap-6 mb-8">
                <div>
                    <label class="block text-sm text-slate-500 dark:text-slate-400 mb-2">Vendor</label>
                    <select id="bottle-vendor" class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4">
                        <option value="">No vendor / Other</option>
                        ${window.vendors.map(v => `<option value="${v}" ${bottle && bottle.vendor === v ? 'selected' : ''}>${v}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm text-slate-500 dark:text-slate-400 mb-2">Price</label>
                    <input id="bottle-price" type="text" value="${bottle ? bottle.price || '' : ''}" placeholder="$29.99"
                           class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4">
                </div>
            </div>

            <div class="mb-8">
                <label class="block text-sm text-slate-500 dark:text-slate-400 mb-2">Purchase URL</label>
                <input id="bottle-url" type="text" value="${bottle ? bottle.url || '' : ''}" placeholder="https://..."
                       class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4">
            </div>

            <div class="mb-8">
                <div class="flex justify-between items-center mb-4">
                    <span class="font-medium">Ingredients</span>
                    <button onclick="addIngredientRow()" 
                            class="px-6 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-2xl text-sm font-medium hover:bg-emerald-200">
                        + Add Ingredient
                    </button>
                </div>
                <div id="ingredients-list">
                    ${ingredientsHTML}
                </div>
            </div>

            <div class="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button onclick="hideBottleModal()" 
                        class="flex-1 py-4 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-3xl">Cancel</button>
                <button onclick="saveStructuredBottle()" 
                        class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-3xl">Save Bottle</button>
            </div>
        </div>
    `;

    createModal('bottle-modal', modalHTML);
}

function addIngredientRow() {
    currentIngredients.push({ name: '', dose: '', unit: 'mg' });
    showStructuredBottleModal(window.bottles.find(b => b.id === editingBottleId));
}

function updateIngredient(index, field, value) {
    if (currentIngredients[index]) {
        currentIngredients[index][field] = value;
    }
}

function removeIngredient(index) {
    currentIngredients.splice(index, 1);
    showStructuredBottleModal(window.bottles.find(b => b.id === editingBottleId));
}

function saveStructuredBottle() {
    const name = document.getElementById('bottle-name').value.trim();
    const vendor = document.getElementById('bottle-vendor').value || null;
    const price = document.getElementById('bottle-price').value.trim();
    const url = document.getElementById('bottle-url').value.trim();

    if (!name) {
        showToast("Please enter a bottle name", "error");
        return;
    }

    const ingredients = currentIngredients
        .filter(i => i.name && i.name.trim() !== '')
        .map(i => ({
            name: i.name.trim(),
            dose: i.dose || '',
            unit: i.unit || 'mg'
        }));

    if (ingredients.length === 0) {
        showToast("Add at least one ingredient", "error");
        return;
    }

    if (editingBottleId) {
        const bottle = window.bottles.find(b => b.id === editingBottleId);
        if (bottle) {
            bottle.name = name;
            bottle.ingredients = ingredients;
            bottle.vendor = vendor;
            bottle.price = price;
            bottle.url = url;
        }
    } else {
        window.bottles.push({
            id: 'bottle_' + Date.now(),
            name: name,
            ingredients: ingredients,
            vendor: vendor,
            price: price,
            url: url
        });
    }

    if (typeof saveAllData === 'function') saveAllData();
    
    hideBottleModal();                    // Close the modal on Save
    renderBottlesTab();                   // Refresh the list
    showToast(editingBottleId ? "Bottle updated successfully" : "New bottle added");
}

function hideBottleModal() {
    hideModal('bottle-modal');
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
}

function createModal(id, innerHTML) {
    let existing = document.getElementById(id);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = "fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4";
    overlay.innerHTML = innerHTML;
    document.body.appendChild(overlay);

    // Close on background click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hideBottleModal();
    });
}

// Simple vendor manager (placeholder - we can expand later)
function manageVendors() {
    showToast("Vendor management coming soon (you can edit vendors in bottles.js)");
}

// Global exports so app.js and other files can call them
window.renderBottlesTab = renderBottlesTab;
window.showAddBottleModal = showAddBottleModal;
window.editBottle = editBottle;

// Make showToast available globally (app.js already has one, this is backup)
if (typeof window.showToast !== 'function') {
    window.showToast = function(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:16px 24px;border-radius:9999px;color:white;z-index:9999;${type==='error' ? 'background:#ef4444' : 'background:#10b981'}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    };
}

// === SAFETY LIMITS MANAGEMENT (Fixed Close + Sorted) ===
if (!window.safetyLimits) {
    window.safetyLimits = {
        "vitamin d": { limit: 100, unit: "mcg" },
        "vitamin a": { limit: 3000, unit: "mcg" },
        "vitamin e": { limit: 1000, unit: "mg" },
        "calcium": { limit: 2500, unit: "mg" },
        "magnesium": { limit: 350, unit: "mg" },
        "zinc": { limit: 40, unit: "mg" },
        "iron": { limit: 45, unit: "mg" },
        "omega-3": { limit: 3000, unit: "mg" }
    };
}

function manageSafetyLimits() {
    const sortedKeys = Object.keys(window.safetyLimits).sort((a, b) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
    );

    const limitsListHTML = sortedKeys.map(key => {
        const limit = window.safetyLimits[key];
        return `
            <div class="flex gap-4 items-center bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl">
                <div class="flex-1 font-medium capitalize">${key}</div>
                <input type="number" value="${limit.limit}" 
                       class="w-28 text-center border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-4 py-3"
                       onchange="updateSafetyLimit('${key}', 'limit', this.value)">
                <select onchange="updateSafetyLimit('${key}', 'unit', this.value)" 
                        class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-4 py-3">
                    <option value="mg" ${limit.unit==='mg'?'selected':''}>mg</option>
                    <option value="mcg" ${limit.unit==='mcg'?'selected':''}>mcg</option>
                    <option value="IU" ${limit.unit==='IU'?'selected':''}>IU</option>
                    <option value="g" ${limit.unit==='g'?'selected':''}>g</option>
                </select>
                <button onclick="deleteSafetyLimit('${key}')" 
                        class="text-red-500 hover:text-red-600 px-3">✕</button>
            </div>`;
    }).join('');

    const html = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl" id="safety-modal-content">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-semibold">Manage Safety Limits</h3>
                <button onclick="autoAddIngredientsToLimits()" 
                        class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-2xl flex items-center gap-2">
                    <span>+</span> Auto-add from Bottles
                </button>
            </div>
            <p class="text-slate-500 dark:text-slate-400 mb-6">Daily upper limits • Sorted alphabetically</p>

            <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2" id="safety-limits-list">
                ${limitsListHTML || '<p class="text-slate-500 py-8 text-center">No limits defined yet.</p>'}
            </div>

            <div class="flex gap-4 pt-8 border-t border-slate-200 dark:border-slate-700 mt-8">
                <button id="close-safety-modal" 
                        class="flex-1 py-4 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-3xl">
                    Close
                </button>
            </div>
        </div>
    `;

    createModal('safety-modal', html);

    // Add event listener for Close button AFTER modal is created
    setTimeout(() => {
        const closeBtn = document.getElementById('close-safety-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => hideModal('safety-modal'));
        }
    }, 100);
}

// Keep these functions as they are (or make sure they exist):
function updateSafetyLimit(key, field, value) {
    const lowerKey = key.toLowerCase();
    if (!window.safetyLimits[lowerKey]) return;
    if (field === 'limit') window.safetyLimits[lowerKey].limit = parseFloat(value) || 0;
    if (field === 'unit') window.safetyLimits[lowerKey].unit = value;
    if (typeof saveAllData === 'function') saveAllData();
}

function deleteSafetyLimit(key) {
    if (confirm(`Delete safety limit for "${key}"?`)) {
        delete window.safetyLimits[key.toLowerCase()];
        saveAllData();
        hideModal('safety-modal');
        setTimeout(manageSafetyLimits, 100);
    }
}

function autoAddIngredientsToLimits() {
    let addedCount = 0;
    const existing = new Set(Object.keys(window.safetyLimits).map(k => k.toLowerCase()));

    window.bottles.forEach(bottle => {
        if (!bottle.ingredients) return;
        bottle.ingredients.forEach(ing => {
            const normName = normalizeNameForLimits(ing.name);
            if (!existing.has(normName)) {
                window.safetyLimits[normName] = { 
                    limit: 100, 
                    unit: ing.unit || 'mg' 
                };
                existing.add(normName);
                addedCount++;
            }
        });
    });

    if (addedCount > 0) {
        showToast(`Added ${addedCount} new ingredient${addedCount > 1 ? 's' : ''}`);
        saveAllData();
        hideModal('safety-modal');
        setTimeout(manageSafetyLimits, 300);
    } else {
        showToast("No new ingredients to add — all are already present");
    }
}

function normalizeNameForLimits(name) {
    return name.toLowerCase()
               .trim()
               .replace(/\s+/g, ' ')
               .replace(/ \(.*?\)/g, '')
               .replace(/ extract| root| leaf| complex| hydrochloride/gi, '');
}

function deleteBottle(bottleId) {
    if (confirm('Delete this bottle permanently? This cannot be undone.')) {
        window.bottles = window.bottles.filter(b => b.id !== bottleId);
        
        // Also clean up from shopping lists and weekly plan
        Object.keys(window.shoppingLists || {}).forEach(listName => {
            if (window.shoppingLists[listName]) {
                delete window.shoppingLists[listName][bottleId];
            }
        });
        
        Object.keys(window.weeklyPlan || {}).forEach(day => {
            if (window.weeklyPlan[day]) {
                delete window.weeklyPlan[day][bottleId];
            }
        });

        if (typeof saveAllData === 'function') saveAllData();
        renderBottlesTab();
        showToast('Bottle deleted');
    }
}

function sortAndRenderBottles() {
    const select = document.getElementById('bottle-sort-select');
    if (select) {
        window.currentBottleSort = select.value;
    }
    renderBottleList();
}


// Global functions
window.manageSafetyLimits = manageSafetyLimits;
window.updateSafetyLimit = updateSafetyLimit;
window.deleteSafetyLimit = deleteSafetyLimit;
window.deleteBottle = deleteBottle;
window.autoAddIngredientsToLimits = autoAddIngredientsToLimits;
window.hideModal = hideModal || function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.remove();
};
