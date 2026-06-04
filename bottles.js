// bottles.js - Complete & Stable (Merged)

console.log('💊 bottles.js loaded');

if (!window.bottles) window.bottles = [];
if (!window.vendors) window.vendors = ["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"];

let editingBottleId = null;
let currentIngredients = [];

// ====================== MAIN RENDER ======================
// ====================== MAIN RENDER ======================
function renderBottlesTab() {
    const content = document.getElementById('bottles-content');
    if (!content) return;

    let visibleCount = window.bottles.length;

    if (window.currentProfile && window.currentProfile !== "Shared") {
        visibleCount = window.bottles.filter(bottle => {
            if (!bottle.users || !Array.isArray(bottle.users)) return true; // Show unassigned bottles
            return bottle.users.includes(window.currentProfile);
        }).length;
    }

    content.innerHTML = `
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-2xl font-semibold">Your Bottles</h2>
                <p class="text-slate-500 dark:text-slate-400">
                    ${visibleCount} bottles for <span class="font-medium">${window.currentProfile || 'All'}</span>
                </p>
            </div>
            <div class="flex gap-3">
                <button onclick="showAddBottleModal()" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">+ Add New Bottle</button>
                <button onclick="manageSafetyLimits()" class="px-6 py-4 border border-slate-300 dark:border-slate-600 rounded-3xl font-medium">⚠️ Daily Safety Limits</button>
                <button onclick="manageVendors()" class="px-6 py-4 border border-slate-300 dark:border-slate-600 rounded-3xl font-medium">🏪 Manage Vendors</button>
            </div>
        </div>
        
        <div id="bottle-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    `;

    renderBottleList();
}

// ====================== RENDER BOTTLE LIST ======================
function renderBottleList() {
    const container = document.getElementById('bottle-list');
    if (!container) return;
    container.innerHTML = '';

    let filtered = [...window.bottles];

    // Filter by current user
    if (window.currentProfile && window.currentProfile !== "Shared") {
        filtered = filtered.filter(bottle => {
            if (!bottle.users || !Array.isArray(bottle.users) || bottle.users.length === 0) {
                return true; // Show bottles with no user assignment
            }
            return bottle.users.includes(window.currentProfile);
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">
            No bottles assigned to ${window.currentProfile || 'this user'}.
        </div>`;
        return;
    }

    filtered.forEach(bottle => {
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
                    ${bottle.users && bottle.users.length ? `<div class="text-xs text-slate-500 mb-2">👥 ${bottle.users.join(', ')}</div>` : ''}
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

// ====================== MODALS ======================
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
            </select>
            <button onclick="removeIngredient(${i})" class="text-red-500">✕</button>
        </div>
    `).join('');

    if (currentIngredients.length === 0) {
        ingredientsHTML = `<p class="text-slate-500 py-8 text-center">No ingredients yet. Click "+ Add Ingredient"</p>`;
    }

    const users = bottle?.users || [];
    const allUsers = ["Mark", "Lisa", "Shared"];

    const modalHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div class="p-8 border-b dark:border-slate-700">
                <h3 class="text-2xl font-semibold">${editingBottleId ? 'Edit Bottle' : 'New Bottle'}</h3>
            </div>

            <div class="flex-1 overflow-y-auto p-8 space-y-6">
                <input id="bottle-name" type="text" value="${bottle ? bottle.name || '' : ''}" 
                       placeholder="Bottle name *" class="w-full border rounded-2xl px-5 py-4">

                <!-- Vendor -->
                <div>
                    <label class="block text-sm text-slate-500 mb-2">Vendor</label>
                    <select id="bottle-vendor" class="w-full border rounded-2xl px-5 py-4">
                        <option value="">Select Vendor...</option>
                        ${window.vendors.map(v => `
                            <option value="${v}" ${bottle && bottle.vendor === v ? 'selected' : ''}>${v}</option>
                        `).join('')}
                    </select>
                </div>

                <!-- Serving Unit / Size -->
                <div>
                    <label class="block text-sm text-slate-500 mb-2">Serving Unit / Size</label>
                    <input id="bottle-serving-unit" type="text" value="${bottle ? (bottle.servingUnit || '') + (bottle.servingSize ? ' • ' + bottle.servingSize : '') : ''}" 
                           placeholder="60 capsules, 120 tablets, etc." class="w-full border rounded-2xl px-5 py-4">
                </div>

                <!-- Users Multi-Select -->
                <div>
                    <label class="block text-sm text-slate-500 mb-2">Who takes this supplement?</label>
                    <div class="grid grid-cols-3 gap-3">
                        ${allUsers.map(user => `
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" value="${user}" 
                                       ${users.includes(user) ? 'checked' : ''} 
                                       class="w-5 h-5 accent-emerald-600">
                                <span>${user}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Purchase URL -->
                <div>
                    <label class="block text-sm text-slate-500 mb-2">Purchase URL (optional)</label>
                    <div class="flex gap-3">
                        <input id="bottle-url" type="text" value="${bottle ? bottle.url || '' : ''}" placeholder="https://..." 
                               class="flex-1 border rounded-2xl px-5 py-4">
                        ${bottle && bottle.url ? `
                            <a href="${bottle.url}" target="_blank" class="px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-2xl flex items-center">↗</a>
                        ` : ''}
                    </div>
                </div>

                <!-- Ingredients -->
                <div>
                    <div class="flex justify-between mb-3">
                        <span class="font-medium">Ingredients</span>
                        <button onclick="addIngredientRow()" class="text-emerald-600 hover:text-emerald-700">+ Add Ingredient</button>
                    </div>
                    <div id="ingredients-list" class="max-h-[280px] overflow-y-auto pr-2">
                        ${ingredientsHTML}
                    </div>
                </div>
            </div>

            <div class="p-8 border-t dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-3xl">
                <div class="flex gap-4">
                    <button onclick="hideBottleModal()" class="flex-1 py-4 border rounded-3xl font-medium">Cancel</button>
                    <button onclick="saveStructuredBottle()" class="flex-1 py-4 bg-emerald-600 text-white rounded-3xl font-medium">Save Bottle</button>
                </div>
            </div>
        </div>
    `;

    createModal('bottle-modal', modalHTML);
}

function saveStructuredBottle() {
    const name = document.getElementById('bottle-name').value.trim();
    if (!name) return alert("Please enter a bottle name");

    // Get selected users
    const selectedUsers = Array.from(document.querySelectorAll('#bottle-modal input[type="checkbox"]:checked'))
                              .map(cb => cb.value);

    const newBottle = {
        id: editingBottleId || 'bottle_' + Date.now(),
        name: name,
        vendor: document.getElementById('bottle-vendor').value || null,
        servingUnit: document.getElementById('bottle-serving-unit').value.trim(),
        url: document.getElementById('bottle-url').value.trim(),
        users: selectedUsers,
        ingredients: currentIngredients
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

// ====================== SAFETY LIMITS MODAL ======================
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
            <h3 class="text-2xl font-semibold mb-6">Manage Daily Safety Limits</h3>
            
            <div class="mb-8 p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <div class="flex gap-3">
                    <input id="new-limit-name" type="text" placeholder="New ingredient (e.g. CoQ10, Vitamin D)" 
                           class="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-4">
                    <button onclick="addNewSafetyLimit()" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-medium">Add Limit</button>
                </div>
            </div>

            <div class="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                ${limitsHTML || '<p class="text-slate-500 py-8 text-center">No safety limits set yet. Add one above.</p>'}
            </div>

            <button onclick="hideModal('safety-modal')" class="w-full mt-8 py-4 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-3xl">Close</button>
        </div>
    `;

    createModal('safety-modal', html);
}

function addNewSafetyLimit() {
    const name = document.getElementById('new-limit-name').value.trim();
    if (!name) return alert("Please enter an ingredient name");

    const lower = name.toLowerCase();
    if (!window.safetyLimits) window.safetyLimits = {};
    if (!window.safetyLimits[lower]) {
        window.safetyLimits[lower] = { limit: 100, unit: "mg" };
        saveAllData();
        hideModal('safety-modal');
        setTimeout(manageSafetyLimits, 200);
        showToast(`Added safety limit for ${name}`);
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
    if (confirm(`Delete safety limit for "${key}"?`)) {
        delete window.safetyLimits[key.toLowerCase()];
        saveAllData();
        hideModal('safety-modal');
        setTimeout(manageSafetyLimits, 100);
    }
}

function hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.remove();
}

// ====================== MANAGE VENDORS ======================
function manageVendors() {
    const sorted = [...window.vendors].sort((a, b) => a.localeCompare(b));

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

// Delete Bottle Function
window.deleteBottle = function(id) {
    if (confirm('Delete this bottle permanently?')) {
        window.bottles = window.bottles.filter(b => b.id !== id);
        saveAllData();
        renderBottlesTab();
        showToast('Bottle deleted');
    }
};

// ====================== GLOBAL EXPORTS ======================
console.log('💊 bottles.js - FORCING global exports...');

window.renderBottlesTab = renderBottlesTab;
window.renderBottleList = renderBottleList;
window.showAddBottleModal = showAddBottleModal;
window.editBottle = editBottle;
window.showStructuredBottleModal = showStructuredBottleModal;
window.saveStructuredBottle = saveStructuredBottle;
window.addIngredientRow = addIngredientRow;
window.updateIngredient = updateIngredient;
window.removeIngredient = removeIngredient;
window.hideBottleModal = hideBottleModal;
window.createModal = createModal;
window.manageSafetyLimits = manageSafetyLimits;
window.manageVendors = manageVendors;
window.deleteBottle = deleteBottle;
window.saveAllData = saveAllData;

console.log('✅ bottles.js - All functions exported');