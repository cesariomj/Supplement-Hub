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
};

function showStructuredBottleModal(bottle = null) {
    const modalHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] flex flex-col">
            <h2 class="text-2xl font-semibold mb-6">${editingBottleId ? 'Edit Bottle' : 'New Bottle'}</h2>
            
            <input id="bottle-name" value="${bottle?.name || ''}" placeholder="Bottle Name" class="w-full border rounded-2xl px-5 py-4 mb-4 text-lg font-medium">

            <!-- Multi-User Selection -->
            <div class="mb-6">
                <label class="block text-sm text-slate-500 mb-2">Associated Users (select all that apply)</label>
                <div class="flex flex-wrap gap-2" id="user-select">
                    ${window.profiles.map(profile => `
                        <label class="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-2xl cursor-pointer">
                            <input type="checkbox" value="${profile}" 
                                   ${bottle?.users?.includes(profile) || (!bottle && profile === window.currentProfile) ? 'checked' : ''}>
                            <span>${profile}</span>
                        </label>
                    `).join('')}
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4 mb-6">
                <div class="col-span-7">
                    <select id="bottle-vendor" class="w-full border rounded-2xl px-5 py-4">
                        <option value="">Select Vendor</option>
                        ${window.vendors.map(v => `<option value="${v}" ${bottle?.vendor === v ? 'selected' : ''}>${v}</option>`).join('')}
                    </select>
                </div>
                <div class="col-span-3">
                    <input id="bottle-serving-unit" value="${bottle?.servingUnit || ''}" placeholder="Unit" class="w-full border rounded-2xl px-5 py-4">
                </div>
                <div class="col-span-2">
                    <input id="bottle-serving-size" value="${bottle?.servingSize || ''}" placeholder="Size" class="w-full border rounded-2xl px-5 py-4">
                </div>
            </div>

            <div class="flex gap-3 mb-6">
                <input id="bottle-url" value="${bottle?.url || ''}" placeholder="Purchase URL (optional)" class="flex-1 border rounded-2xl px-5 py-4">
                <button onclick="openBottleUrl()" class="px-6 py-4 bg-slate-100 dark:bg-slate-700 rounded-2xl">🔗 Open</button>
            </div>

            <div class="flex justify-between mb-3">
                <span class="font-medium">Ingredients</span>
                <button onclick="addIngredientRow()" class="text-emerald-600 hover:text-emerald-700">+ Add Ingredient</button>
            </div>

            <div id="ingredients-list" class="flex-1 overflow-auto border rounded-3xl p-4 bg-slate-50 dark:bg-slate-900 min-h-[250px]"></div>

            <div class="flex gap-4 pt-6 border-t mt-6">
                <button onclick="hideBottleModal()" class="flex-1 py-4 border rounded-3xl font-medium">Cancel</button>
                <button onclick="saveStructuredBottle()" class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">Save Bottle</button>
            </div>
        </div>
    `;

    createModal('bottle-modal', modalHTML);
    
    if (currentIngredients.length > 0) {
        renderIngredientRows();
    } else {
        addIngredientRow();
    }
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
    const name = document.getElementById('bottle-name').value.trim();
    if (!name) return showToast("Bottle name is required", "error");

    // Get selected users from checkboxes
    const selectedUsers = Array.from(document.querySelectorAll('#user-select input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    // Fallback: at least current user
    if (selectedUsers.length === 0) {
        selectedUsers.push(window.currentProfile);
    }

    const bottleData = {
        id: editingBottleId || 'bottle-' + Date.now(),
        name: name,
        vendor: document.getElementById('bottle-vendor').value,
        servingUnit: document.getElementById('bottle-serving-unit').value.trim(),
        servingSize: document.getElementById('bottle-serving-size').value.trim(),
        url: document.getElementById('bottle-url').value.trim(),
        users: selectedUsers,                    // ← Multi-user support
        ingredients: currentIngredients.filter(i => i.name.trim() !== '')
    };

    if (editingBottleId) {
        const index = window.bottles.findIndex(b => b.id === editingBottleId);
        if (index !== -1) window.bottles[index] = bottleData;
    } else {
        window.bottles.push(bottleData);
    }

    saveAllData();
    hideBottleModal();
    renderBottlesTab();
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