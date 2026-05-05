// bottles.js - Complete & Stable Version with Unit Normalization

console.log('💊 bottles.js loaded');

if (!window.bottles) window.bottles = [];
if (!window.vendors) window.vendors = ["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"];

let editingBottleId = null;
let currentIngredients = [];

// ====================== UNIT NORMALIZATION ======================
function normalizeDose(dose, unit) {
    dose = parseFloat(dose) || 0;
    if (!unit) return { value: dose, unit: 'mg' };

    const u = unit.toLowerCase().trim();
    switch (u) {
        case 'g':
        case 'gram':
            return { value: dose * 1000, unit: 'mg' };
        case 'mcg':
        case 'µg':
        case 'microgram':
            return { value: dose / 1000, unit: 'mg' };
        case 'iu':
            return { value: dose, unit: 'IU' };
        default:
            return { value: dose, unit: u };
    }
}

// ====================== MAIN RENDER ======================
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

    renderBottleList();
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
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <h3 class="text-2xl font-semibold mb-6 flex-shrink-0">${editingBottleId ? 'Edit Bottle' : 'New Bottle'}</h3>
            
            <!-- Scrollable Content -->
            <div class="flex-1 overflow-y-auto pr-2">
                <input id="bottle-name" type="text" value="${bottle ? bottle.name || '' : ''}" placeholder="Bottle name *" class="w-full border rounded-2xl px-5 py-4 mb-6">

                <!-- Vendor -->
                <div class="mb-6">
                    <label class="block text-sm text-slate-500 mb-2">Vendor</label>
                    <select id="bottle-vendor" class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4">
                        <option value="">No Vendor</option>
                        ${window.vendors.map(v => `
                            <option value="${v}" ${bottle && bottle.vendor === v ? 'selected' : ''}>${v}</option>
                        `).join('')}
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-6 mb-6">
                    <input id="bottle-serving-unit" type="text" value="${bottle ? bottle.servingUnit || '' : ''}" placeholder="capsules, tablets..." class="border rounded-2xl px-5 py-4">
                    <input id="bottle-serving-size" type="text" value="${bottle ? bottle.servingSize || '' : ''}" placeholder="60 capsules" class="border rounded-2xl px-5 py-4">
                </div>

                <!-- Purchase URL -->
                <div class="mb-8">
                    <label class="block text-sm text-slate-500 mb-1">Purchase URL</label>
                    <div class="flex gap-3">
                        <input id="bottle-url" type="text" value="${bottle ? bottle.url || '' : ''}" placeholder="https://..." 
                               class="flex-1 border rounded-2xl px-5 py-4">
                        <button onclick="openBottleUrl()" 
                                class="px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-2xl font-medium">
                            🔗 Open
                        </button>
                    </div>
                </div>

                <!-- Ingredients -->
                <div class="mb-8">
                    <div class="flex justify-between mb-3">
                        <span class="font-medium">Ingredients</span>
                        <button onclick="addIngredientRow()" class="text-emerald-600 hover:text-emerald-700">+ Add Ingredient</button>
                    </div>
                    <div id="ingredients-list">${ingredientsHTML}</div>
                </div>
            </div>

            <!-- Sticky Footer Buttons -->
            <div class="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700 mt-6 flex-shrink-0">
                <button onclick="hideBottleModal()" 
                        class="flex-1 py-4 border border-slate-300 dark:border-slate-600 rounded-3xl font-medium">
                    Cancel
                </button>
                <button onclick="saveStructuredBottle()" 
                        class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">
                    Save Bottle
                </button>
            </div>
        </div>
    `;

    createModal('bottle-modal', modalHTML);
}

function saveStructuredBottle() {
    const name = document.getElementById('bottle-name').value.trim();
    if (!name) return alert("Please enter a bottle name");

    const newBottle = {
        id: editingBottleId || 'bottle_' + Date.now(),
        name: name,
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

function hideBottleModal() {
    const modal = document.getElementById('bottle-modal');
    if (modal) modal.remove();
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

// ====================== SAFETY LIMITS ======================
function manageSafetyLimits() {
    const sortedKeys = Object.keys(window.safetyLimits || {}).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    const limitsHTML = sortedKeys.map(key => {
        const limit = window.safetyLimits[key] || { limit: 100, unit: "mg" };
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
                <button onclick="deleteSafetyLimit('${key}')" class="text-red-500 hover:text-red-600 px-3">✕</button>
            </div>`;
    }).join('');

    const html = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <h3 class="text-2xl font-semibold mb-6">Manage Safety Limits</h3>
            
            <div class="mb-8 p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <div class="flex gap-3">
                    <input id="new-limit-name" type="text" placeholder="New ingredient (e.g. CoQ10)" 
                           class="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4">
                    <button onclick="addNewSafetyLimit()" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-medium">Add</button>
                </div>
            </div>

            <div class="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                ${limitsHTML || '<p class="text-slate-500 py-8 text-center">No limits yet. Add one above.</p>'}
            </div>

            <button onclick="hideModal('safety-modal')" class="w-full mt-8 py-4 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-3xl">Close</button>
        </div>
    `;

    createModal('safety-modal', html);
}

function addNewSafetyLimit() {
    const name = document.getElementById('new-limit-name').value.trim();
    if (!name) return showToast("Please enter a name", "error");

    const lower = name.toLowerCase();
    if (!window.safetyLimits) window.safetyLimits = {};
    if (!window.safetyLimits[lower]) {
        window.safetyLimits[lower] = { limit: 100, unit: "mg" };
        saveAllData();
        hideModal('safety-modal');
        setTimeout(manageSafetyLimits, 200);
        showToast(`Added ${name}`);
    }
}

function updateSafetyLimit(key, field, value) {
    const lower = key.toLowerCase();
    if (!window.safetyLimits[lower]) return;
    if (field === 'limit') window.safetyLimits[lower].limit = parseFloat(value) || 0;
    if (field === 'unit') window.safetyLimits[lower].unit = value;
    saveAllData();
}

function deleteSafetyLimit(key) {
    if (confirm(`Delete limit for "${key}"?`)) {
        delete window.safetyLimits[key.toLowerCase()];
        saveAllData();
        hideModal('safety-modal');
        setTimeout(manageSafetyLimits, 100);
    }
}

// ====================== MANAGE VENDORS ======================
function manageVendors() {
    const sorted = [...window.vendors].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    const html = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md">
            <h3 class="text-2xl font-semibold mb-6">Manage Vendors</h3>
            <input id="new-vendor" type="text" placeholder="New vendor name" class="w-full border rounded-2xl px-5 py-4 mb-4">
            <button onclick="addNewVendor()" class="w-full py-3 bg-emerald-600 text-white rounded-2xl mb-6">Add Vendor</button>
            <div class="space-y-2 max-h-80 overflow-y-auto">
                ${sorted.map(v => `
                    <div class="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl">
                        <span class="flex-1">${v}</span>
                        <button onclick="deleteVendorByName('${v}')" class="text-red-500 hover:text-red-600">Remove</button>
                    </div>
                `).join('')}
            </div>
            <button onclick="hideModal('vendor-modal')" class="w-full mt-8 py-4 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-3xl">Close</button>
        </div>
    `;

    createModal('vendor-modal', html);
}

function addNewVendor() {
    const name = document.getElementById('new-vendor').value.trim();
    if (name && !window.vendors.includes(name)) {
        window.vendors.push(name);
        hideModal('vendor-modal');
        setTimeout(manageVendors, 200);
        showToast(`Added ${name}`);
    }
}

function deleteVendorByName(name) {
    if (confirm(`Remove "${name}"?`)) {
        window.vendors = window.vendors.filter(v => v !== name);
        saveAllData();
        hideModal('vendor-modal');
        setTimeout(manageVendors, 200);
    }
}

// ====================== MODAL HELPERS ======================
function hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.remove();
}

function deleteBottle(bottleId) {
    if (confirm('Delete this bottle permanently?')) {
        window.bottles = window.bottles.filter(b => b.id !== bottleId);
        saveAllData();
        renderBottlesTab();
        showToast('Bottle deleted');
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:16px 24px;border-radius:9999px;color:white;font-weight:500;z-index:9999;${type==='error'?'background:#ef4444':'background:#10b981'};`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function openBottleUrl() {
    const url = document.getElementById('bottle-url').value.trim();
    if (url) {
        window.open(url, '_blank');
    } else {
        showToast("No URL entered", "error");
    }
}

// ====================== GLOBAL EXPORTS ======================
window.renderBottlesTab = renderBottlesTab;
window.showAddBottleModal = showAddBottleModal;
window.editBottle = editBottle;
window.deleteBottle = deleteBottle;
window.manageSafetyLimits = manageSafetyLimits;
window.manageVendors = manageVendors;
window.addNewVendor = addNewVendor;
window.deleteVendorByName = deleteVendorByName;
window.addNewSafetyLimit = addNewSafetyLimit;
window.updateSafetyLimit = updateSafetyLimit;
window.deleteSafetyLimit = deleteSafetyLimit;
window.saveAllData = saveAllData;
window.showToast = showToast;