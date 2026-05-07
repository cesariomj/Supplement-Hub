// bottles.js - FINAL CLEAN VERSION

console.log('💊 bottles.js loaded');

if (!window.bottles) window.bottles = [];
if (!window.vendors) window.vendors = ["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"];

let editingBottleId = null;
let currentIngredients = [];

// ====================== HELPERS ======================
function normalizeDose(dose, unit) {
    dose = parseFloat(dose) || 0;
    if (!unit) return { value: dose, unit: 'mg' };
    switch (unit.toLowerCase()) {
        case 'g': case 'gram': return { value: dose * 1000, unit: 'mg' };
        case 'mcg': case 'µg': return { value: dose / 1000, unit: 'mg' };
        case 'iu': return { value: dose, unit: 'IU' };
        default: return { value: dose, unit: unit };
    }
}

function createModal(id, html) {
    let old = document.getElementById(id);
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = "fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4";
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
}

function hideBottleModal() {
    const modal = document.getElementById('bottle-modal');
    if (modal) modal.remove();
}

// ====================== RENDER ======================
function renderBottlesTab() {
    const content = document.getElementById('bottles-content');
    if (!content) return;

    content.innerHTML = `
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-2xl font-semibold">Your Bottles</h2>
                <p class="text-slate-500 dark:text-slate-400">${window.bottles.length} bottles total</p>
            </div>
            <div class="flex gap-3">
                <button onclick="showAddBottleModal()" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">+ Add New Bottle</button>
                <button onclick="manageSafetyLimits()" class="px-6 py-4 border border-slate-300 dark:border-slate-600 rounded-3xl font-medium">⚠️ Safety Limits</button>
                <button onclick="manageVendors()" class="px-6 py-4 border border-slate-300 dark:border-slate-600 rounded-3xl font-medium">Manage Vendors</button>
            </div>
        </div>
        <div id="bottle-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    `;

    setTimeout(renderBottleList, 50);
}

function renderBottleList() {
    const container = document.getElementById('bottle-list');
    if (!container) return;
    container.innerHTML = '';

    if (window.bottles.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">No bottles yet. Click "+ Add New Bottle"</div>`;
        return;
    }

    window.bottles.forEach(bottle => {
        const preview = bottle.ingredients 
            ? bottle.ingredients.slice(0, 4).map(i => `${i.name} ${i.dose}${i.unit}`).join(' • ')
            : 'No ingredients listed';

        const div = document.createElement('div');
        div.className = "bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer transition-all group relative";
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1" onclick="editBottle('${bottle.id}')">
                    <div class="font-semibold text-xl mb-1">${bottle.name}</div>
                    ${bottle.vendor ? `<div class="text-emerald-600 text-sm mb-1">📍 ${bottle.vendor}</div>` : ''}
                    ${bottle.servingUnit ? `<div class="text-xs text-slate-500 mb-2">${bottle.servingUnit} • ${bottle.servingSize || ''}</div>` : ''}
                    <div class="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">${preview}</div>
                </div>
                <button onclick="event.stopImmediatePropagation(); deleteBottle('${bottle.id}');" 
                        class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950 transition-all text-xl">
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
    if (editingBottleId && !bottle) bottle = window.bottles.find(b => b.id === editingBottleId);

    let ingredientsHTML = currentIngredients.map((ing, i) => `
        <div class="flex gap-3 mb-4 items-end bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl">
            <input type="text" value="${ing.name || ''}" placeholder="Ingredient name" class="flex-1 border rounded-2xl px-5 py-3" onchange="updateIngredient(${i}, 'name', this.value)">
            <input type="text" value="${ing.dose || ''}" placeholder="Dose" class="w-28 border rounded-2xl px-5 py-3" onchange="updateIngredient(${i}, 'dose', this.value)">
            <select onchange="updateIngredient(${i}, 'unit', this.value)" class="border rounded-2xl px-5 py-3">
                <option value="mg" ${ing.unit === 'mg' ? 'selected' : ''}>mg</option>
                <option value="mcg" ${ing.unit === 'mcg' ? 'selected' : ''}>mcg</option>
                <option value="g" ${ing.unit === 'g' ? 'selected' : ''}>g</option>
                <option value="IU" ${ing.unit === 'IU' ? 'selected' : ''}>IU</option>
            </select>
            <button onclick="removeIngredient(${i})" class="text-red-500">✕</button>
        </div>
    `).join('');

    if (currentIngredients.length === 0) {
        ingredientsHTML = `<p class="text-slate-500 py-8 text-center">No ingredients yet. Click "+ Add Ingredient"</p>`;
    }

    const modalHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative">
            <h3 class="text-2xl font-semibold mb-6">${editingBottleId ? 'Edit Bottle' : 'New Bottle'}</h3>
            
            <div class="flex-1 overflow-y-auto pr-2 pb-24">
                <input id="bottle-name" type="text" value="${bottle?.name || ''}" placeholder="Bottle name *" class="w-full border rounded-2xl px-5 py-4 mb-6">

                <div class="mb-6">
                    <label class="block text-sm text-slate-500 mb-2">Vendor</label>
                    <select id="bottle-vendor" class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4">
                        <option value="">No Vendor</option>
                        ${window.vendors.map(v => `<option value="${v}" ${bottle?.vendor === v ? 'selected' : ''}>${v}</option>`).join('')}
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-6 mb-6">
                    <input id="bottle-serving-unit" type="text" value="${bottle?.servingUnit || ''}" placeholder="capsules, tablets..." class="border rounded-2xl px-5 py-4">
                    <input id="bottle-serving-size" type="text" value="${bottle?.servingSize || ''}" placeholder="60 capsules" class="border rounded-2xl px-5 py-4">
                </div>

                <div class="mb-8">
                    <label class="block text-sm text-slate-500 mb-1">Purchase URL</label>
                    <div class="flex gap-3">
                        <input id="bottle-url" type="text" value="${bottle?.url || ''}" placeholder="https://..." class="flex-1 border rounded-2xl px-5 py-4">
                        <button onclick="openBottleUrl()" class="px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-2xl">🔗 Open</button>
                    </div>
                </div>

                <div class="mb-8">
                    <div class="flex justify-between mb-3">
                        <span class="font-medium">Ingredients</span>
                    </div>
                    <div id="ingredients-list">${ingredientsHTML}</div>
                </div>
            </div>

            <!-- Sticky Footer -->
            <div class="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700 mt-auto flex-shrink-0">
                <button onclick="hideBottleModal()" class="flex-1 py-4 border rounded-3xl font-medium">Cancel</button>
                <button onclick="saveStructuredBottle()" class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">Save Bottle</button>
            </div>

            <!-- Floating Add -->
            <button onclick="addIngredientRow()" 
                    class="absolute bottom-28 right-8 bg-emerald-600 hover:bg-emerald-700 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-3xl z-10 transition-all active:scale-95">
                +
            </button>
        </div>
    `;

    createModal('bottle-modal', modalHTML);
}

// ====================== CORE FUNCTIONS ======================
function saveStructuredBottle() {
    const name = document.getElementById('bottle-name').value.trim();
    if (!name) return alert("Please enter a bottle name");

    const vendor = document.getElementById('bottle-vendor').value.trim() || null;

    const newBottle = {
        id: editingBottleId || 'bottle_' + Date.now(),
        name: name,
        vendor: vendor,
        servingUnit: document.getElementById('bottle-serving-unit').value.trim(),
        servingSize: document.getElementById('bottle-serving-size').value.trim(),
        url: document.getElementById('bottle-url').value.trim(),
        ingredients: currentIngredients.map(ing => {
            const norm = normalizeDose(ing.dose, ing.unit);
            return {
                name: ing.name.trim(),
                dose: norm.value,
                unit: norm.unit,
                originalDose: ing.dose,
                originalUnit: ing.unit || ''
            };
        })
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
    showToast(editingBottleId ? "Bottle updated" : "New bottle added");
}

function addIngredientRow() {
    currentIngredients.push({ name: '', dose: '', unit: 'mg' });
    showStructuredBottleModal();
}

function updateIngredient(index, field, value) {
    if (currentIngredients[index]) currentIngredients[index][field] = value;
}

function removeIngredient(index) {
    currentIngredients.splice(index, 1);
    showStructuredBottleModal();
}

function openBottleUrl() {
    const url = document.getElementById('bottle-url').value.trim();
    if (url) window.open(url, '_blank');
    else showToast("No URL entered", "error");
}

function deleteBottle(bottleId) {
    if (confirm('Delete this bottle permanently?')) {
        window.bottles = window.bottles.filter(b => b.id !== bottleId);
        saveAllData();
        renderBottlesTab();
        showToast('Bottle deleted');
    }
}

// Placeholders
function manageSafetyLimits() { showToast("Safety Limits - coming soon"); }
function manageVendors() { showToast("Manage Vendors - coming soon"); }

// ====================== GLOBAL EXPORTS ======================
window.renderBottlesTab = renderBottlesTab;
window.showAddBottleModal = showAddBottleModal;
window.editBottle = editBottle;
window.deleteBottle = deleteBottle;
window.manageSafetyLimits = manageSafetyLimits;
window.manageVendors = manageVendors;
window.hideBottleModal = hideBottleModal;
window.addIngredientRow = addIngredientRow;
window.updateIngredient = updateIngredient;
window.removeIngredient = removeIngredient;
window.openBottleUrl = openBottleUrl;
window.createModal = createModal;