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
            
            <!-- Vendor + Serving Info Row -->
            <div class="flex gap-4 mb-6">
                <!-- Vendor -->
                <div class="flex-1">
                    <select id="bottle-vendor" class="w-full border rounded-2xl px-5 py-4">
                        <option value="">Select Vendor</option>
                        ${window.vendors.map(v => `<option value="${v}" ${bottle?.vendor === v ? 'selected' : ''}>${v}</option>`).join('')}
                    </select>
                </div>

                <!-- Serving Unit -->
                <div class="w-44">
                    <input id="bottle-serving-unit" value="${bottle?.servingUnit || ''}" 
                        placeholder="Unit (capsule, scoop...)" 
                        class="w-full border rounded-2xl px-5 py-4">
                </div>

                <!-- Size -->
                <div class="w-28">
                    <input id="bottle-serving-size" value="${bottle?.servingSize || ''}" 
                        placeholder="Size" 
                        class="w-full border rounded-2xl px-5 py-4">
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

            <!-- Sticky Buttons -->
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
        addIngredientRow(); // start with one empty row
    }
}

// ====================== INGREDIENT ROWS ======================
function renderIngredientRows() {
    const container = document.getElementById('ingredients-list');
    if (!container) return;

    let html = '';
    currentIngredients.forEach((ing, index) => {
        html += `
            <div class="flex gap-3 mb-3 items-center">
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
                
                <button onclick="removeIngredient(${index})" class="text-red-500 hover:text-red-600 px-3">✕</button>
            </div>
        `;
    });
    container.innerHTML = html;
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

// ====================== SAVE & CLOSE ======================
window.saveStructuredBottle = function() {
    const name = document.getElementById('bottle-name').value.trim();
    if (!name) return showToast("Bottle name is required", "error");

    const bottleData = {
        id: editingBottleId || 'bottle-' + Date.now(),
        name: name,
        vendor: document.getElementById('bottle-vendor').value,
        servingUnit: document.getElementById('bottle-serving-unit').value.trim(),
        servingSize: document.getElementById('bottle-serving-size').value.trim(),
        url: document.getElementById('bottle-url').value.trim(),
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