// bottle-modal.js - Complete Modal + Ingredient Logic

console.log('🧪 bottle-modal.js loaded');

let editingBottleId = null;
let currentIngredients = [];

// ====================== MAIN MODAL ======================
window.showAddBottleModal = function() {
    editingBottleId = null;
    currentIngredients = [];
    showStructuredBottleModal();
};

window.editBottle = function(id) {
    const bottle = window.bottles.find(b => b.id === id);
    if (!bottle) return showToast("Bottle not found", "error");

    editingBottleId = id;
    currentIngredients = JSON.parse(JSON.stringify(bottle.ingredients || []));
    showStructuredBottleModal(bottle);

    // After saving or closing the edit modal
    if (window.lastActiveTab === 'shopping') {
        setTimeout(() => {
            switchTab(3);           // Switch back to Shopping tab (index 3)
            window.lastActiveTab = null;
        }, 300);
}
};

function showStructuredBottleModal(bottle = null) {
    editingBottleId = bottle ? bottle.id : null;
    currentIngredients = bottle && bottle.ingredients ? JSON.parse(JSON.stringify(bottle.ingredients)) : [];

    const ingredientsHTML = currentIngredients.map((ing, index) => `
        <div class="flex gap-3 items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
            <input type="text" value="${ing.name || ''}" 
                   onchange="updateIngredient(${index}, 'name', this.value)"
                   class="flex-1 border rounded-2xl px-4 py-3" placeholder="Ingredient name">
            
            <input type="number" value="${ing.dose || ''}" 
                   onchange="updateIngredient(${index}, 'dose', this.value)"
                   class="w-24 border rounded-2xl px-4 py-3 text-center" placeholder="Dose">
            
            <select onchange="updateIngredient(${index}, 'unit', this.value)" 
                    class="border rounded-2xl px-4 py-3">
                <option value="mg" ${ing.unit === 'mg' ? 'selected' : ''}>mg</option>
                <option value="g" ${ing.unit === 'g' ? 'selected' : ''}>g</option>
                <option value="mcg" ${ing.unit === 'mcg' ? 'selected' : ''}>mcg</option>
                <option value="IU" ${ing.unit === 'IU' ? 'selected' : ''}>IU</option>
            </select>
            
            <button onclick="removeIngredient(${index})" 
                    class="text-red-500 hover:text-red-600 px-3 py-2">✕</button>
        </div>
    `).join('');

    const modalHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div class="p-6 border-b dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-t-3xl">
                <h2 class="text-2xl font-semibold">${bottle ? 'Edit Bottle' : 'New Bottle'}</h2>
                <button onclick="hideBottleModal()" class="text-3xl leading-none text-slate-400 hover:text-slate-600">×</button>
            </div>

            <div class="flex-1 overflow-auto p-6 space-y-6">
                <div>
                    <label class="block text-sm text-slate-500 mb-2">Bottle Name</label>
                    <input id="bottle-name" type="text" value="${bottle ? bottle.name || '' : ''}" 
                           class="w-full border rounded-3xl px-5 py-4 text-lg" placeholder="Bottle name">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm text-slate-500 mb-2">Vendor</label>
                        <select id="bottle-vendor" class="w-full border rounded-3xl px-5 py-4">
                            <option value="">Select Vendor</option>
                            ${window.vendors ? window.vendors.map(v => `
                                <option value="${v}" ${bottle && bottle.vendor === v ? 'selected' : ''}>${v}</option>
                            `).join('') : ''}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-slate-500 mb-2">Serving Unit</label>
                        <input id="bottle-serving-unit" type="text" value="${bottle ? bottle.servingUnit || '' : ''}" 
                               class="w-full border rounded-3xl px-5 py-4">
                    </div>
                </div>

                <div>
                    <label class="block text-sm text-slate-500 mb-2">Purchase URL</label>
                    <div class="flex gap-3">
                        <input id="bottle-url" type="text" value="${bottle ? bottle.url || '' : ''}" 
                               placeholder="https://" class="flex-1 border rounded-3xl px-5 py-4">
                        <button onclick="openBottleUrl()" class="px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-3xl">🔗 Open</button>
                    </div>
                </div>

                <div>
                    <div class="flex justify-between mb-4">
                        <span class="font-medium">Ingredients</span>
                        <button onclick="addIngredientRow()" class="text-emerald-600 hover:text-emerald-700 font-medium">+ Add Ingredient</button>
                    </div>
                    <div id="ingredients-list" class="space-y-3">
                        ${ingredientsHTML || '<div class="text-slate-500 text-center py-8">No ingredients yet. Click "+ Add Ingredient"</div>'}
                    </div>
                </div>
            </div>

            <!-- Sticky Buttons -->
            <div class="p-6 border-t dark:border-slate-700 bg-white dark:bg-slate-900 rounded-b-3xl flex gap-4 flex-shrink-0">
                <button onclick="hideBottleModal()" class="flex-1 py-4 border border-slate-300 dark:border-slate-600 rounded-3xl font-medium">Cancel</button>
                <button onclick="saveStructuredBottle()" class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">Save Bottle</button>
            </div>
        </div>
    `;

    createModal('bottle-modal', modalHTML);
}

// ====================== INGREDIENT ROWS ======================
function renderIngredientRows() {
    const container = document.getElementById('ingredients-list');
    if (!container) return;

    let html = '';

    currentIngredients.forEach((ing, index) => {
        if (!ing?.name) return;

        // Check if this ingredient is over limit for current user
        const norm = normalizeName(ing.name);
        const limitData = window.safetyLimits[norm] || window.safetyLimits[ing.name];
        
        const dose = parseFloat(ing.dose) || 0;
        const isOverLimit = limitData && (limitData.limit === 0 || dose > limitData.limit);

        html += `
            <div class="flex gap-3 mb-3 items-center bg-white dark:bg-slate-800 p-3 rounded-2xl border ${isOverLimit ? 'border-red-300' : 'border-transparent'}">
                <input type="text" value="${ing.name || ''}" placeholder="Ingredient name" 
                       onchange="updateIngredient(${index}, 'name', this.value)" 
                       class="flex-1 border rounded-2xl px-4 py-3">

                <input type="number" value="${ing.dose || ''}" placeholder="Dose" 
                       onchange="updateIngredient(${index}, 'dose', this.value)" 
                       class="w-24 border rounded-2xl px-4 py-3">

                <select onchange="updateIngredient(${index}, 'unit', this.value)" class="border rounded-2xl px-4 py-3">
                    <option value="mg" ${ing.unit === 'mg' ? 'selected' : ''}>mg</option>
                    <option value="g" ${ing.unit === 'g' ? 'selected' : ''}>g</option>
                    <option value="mcg" ${ing.unit === 'mcg' ? 'selected' : ''}>mcg</option>
                </select>

                ${isOverLimit ? `<span class="text-red-500 text-xl">★</span>` : ''}

                <button onclick="removeIngredient(${index})" class="text-red-500 hover:text-red-600 px-3">✕</button>
            </div>
        `;
    });

    container.innerHTML = html || '<div class="text-slate-400 italic p-4">No ingredients added yet.</div>';
}

window.addIngredientRow = function() {
    currentIngredients.push({ name: '', dose: '', unit: 'mg' });
    renderIngredientRows();
};

window.updateIngredient = function(index, field, value) {
    if (!currentIngredients[index]) return;
    currentIngredients[index][field] = value;
};

window.removeIngredient = function(index) {
    currentIngredients.splice(index, 1);
    renderIngredientRows();
};

function normalizeName(name) {
    return String(name).toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '')
        .replace(/\s+/g, '');
}

// ====================== SAVE & CLOSE ======================
window.saveStructuredBottle = function() {
    const name = document.getElementById('bottle-name')?.value.trim();
    if (!name) {
        showToast("Bottle name is required", "error");
        return;
    }

    const bottleData = {
        id: editingBottleId || 'bottle-' + Date.now(),
        name: name,
        vendor: document.getElementById('bottle-vendor')?.value.trim() || '',
        servingUnit: document.getElementById('bottle-serving-unit')?.value.trim() || '',
        url: document.getElementById('bottle-url')?.value.trim() || '',
        ingredients: currentIngredients || [],
        users: []   // Will be fixed below
    };

    // Preserve or assign users
    if (editingBottleId) {
        const existing = window.bottles.find(b => b.id === editingBottleId);
        bottleData.users = existing && existing.users ? [...existing.users] : [window.currentProfile || "General"];
    } else {
        bottleData.users = [window.currentProfile || "General"];
    }

    // Save
    if (editingBottleId) {
        const index = window.bottles.findIndex(b => b.id === editingBottleId);
        if (index !== -1) window.bottles[index] = bottleData;
    } else {
        window.bottles.push(bottleData);
    }

    saveAllData();
    hideBottleModal();
    renderBottlesTab();        // Full re-render
    showToast(editingBottleId ? 'Bottle updated' : 'New bottle added');
};

window.hideBottleModal = function() {
    const modal = document.getElementById('bottle-modal');
    if (modal) modal.remove();
};

window.openBottleUrl = function() {
    const url = document.getElementById('bottle-url').value.trim();
    if (url) window.open(url, '_blank');
    else showToast("No URL entered", "error");
};

console.log('🧪 bottle-modal.js fully exported');