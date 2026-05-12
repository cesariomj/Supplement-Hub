// bottles.js - COMPLETE & CLEAN VERSION

console.log('💊 bottles.js loaded');

if (!window.bottles) window.bottles = [];
if (!window.vendors) window.vendors = ["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"];

let editingBottleId = null;
let currentIngredients = [];

/* function updateFilterButtons() {
    ['all', 'over', 'close'].forEach(mode => {
        const btn = document.getElementById(`filter-${mode}`);
        if (btn) {
            btn.classList.toggle('bg-slate-800', overLimitsFilter === mode);
            btn.classList.toggle('text-white', overLimitsFilter === mode);
            btn.classList.toggle('bg-slate-100', overLimitsFilter !== mode);
            btn.classList.toggle('dark:bg-slate-700', overLimitsFilter !== mode);
        }
    });
} */


// ====================== UNIT NORMALIZATION ======================
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

// ====================== RENDER BOTTLES TAB ======================
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

        <!-- Search & Filter -->
        <div class="flex gap-4 mb-6">
            <div class="relative flex-1">
                <input id="bottle-search" type="text" placeholder="Search bottles or ingredients..." 
                       class="w-full border rounded-3xl px-5 py-4 focus:outline-none focus:border-emerald-500 pr-12"
                       onkeyup="if(event.key==='Enter') renderBottleList()">
                <button onclick="clearBottleSearch()" 
                        class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            
            <select id="vendor-filter" onchange="renderBottleList()" 
                    class="border rounded-3xl px-5 py-4 focus:outline-none">
                <option value="">All Vendors</option>
                ${window.vendors.map(v => `<option value="${v}">${v}</option>`).join('')}
            </select>
        </div>

        <div id="bottle-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    `;

    setTimeout(renderBottleList, 10);
}

// New helper function
window.clearBottleSearch = function() {
    const searchInput = document.getElementById('bottle-search');
    if (searchInput) {
        searchInput.value = '';
        renderBottleList();
        searchInput.focus();
    }
};

function renderBottleList() {
    const container = document.getElementById('bottle-list');
    if (!container) return;
    container.innerHTML = '';

    const searchTerm = (document.getElementById('bottle-search')?.value || '').toLowerCase().trim();
    const vendorFilter = document.getElementById('vendor-filter')?.value || '';

    let filtered = window.bottles;

    if (searchTerm) {
        filtered = filtered.filter(b => 
            b.name.toLowerCase().includes(searchTerm) ||
            (b.ingredients && b.ingredients.some(i => i.name.toLowerCase().includes(searchTerm)))
        );
    }
    if (vendorFilter) {
        filtered = filtered.filter(b => b.vendor === vendorFilter);
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">No bottles found.</div>`;
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

// ====================== BOTTLE MODAL ======================
window.showAddBottleModal = function() {
    editingBottleId = null;
    currentIngredients = [];
    showStructuredBottleModal();
};

window.editBottle = function(id) {
    const bottle = window.bottles.find(b => b.id === id);
    if (!bottle) return;
    
    editingBottleId = id;
    currentIngredients = bottle.ingredients ? [...bottle.ingredients] : [];
    showStructuredBottleModal(bottle);
};

function showStructuredBottleModal(bottle = null) {
    const ingredientsHTML = currentIngredients.map((ing, index) => `
        <div class="flex gap-3 items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl">
            <input value="${ing.name}" onchange="updateIngredient(${index}, 'name', this.value)" 
                   class="flex-1 border rounded-xl px-4 py-3" placeholder="Ingredient name">
            <input value="${ing.dose}" type="number" onchange="updateIngredient(${index}, 'dose', this.value)" 
                   class="w-24 border rounded-xl px-4 py-3" placeholder="Dose">
            <input value="${ing.unit}" onchange="updateIngredient(${index}, 'unit', this.value)" 
                   class="w-20 border rounded-xl px-4 py-3" placeholder="Unit">
            <button onclick="removeIngredient(${index})" class="text-red-500 hover:text-red-600 px-3">✕</button>
        </div>
    `).join('');

    const modalHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-2xl max-h-[92vh] flex flex-col">
            <h2 class="text-3xl font-semibold mb-8">${editingBottleId ? 'Edit Bottle' : 'New Bottle'}</h2>
            
            <div class="flex-1 overflow-y-auto pr-2 space-y-8">
                <div>
                    <label class="block text-sm text-slate-500 mb-2">Bottle Name</label>
                    <input id="bottle-name" value="${bottle ? bottle.name : ''}" 
                           class="w-full border rounded-2xl px-6 py-5 text-lg" placeholder="e.g. Amino Acid Synergy">
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm text-slate-500 mb-2">Vendor</label>
                        <select id="bottle-vendor" class="w-full border rounded-2xl px-6 py-5">
                            <option value="">Select Vendor</option>
                            ${window.vendors.map(v => `<option value="${v}" ${bottle && bottle.vendor === v ? 'selected' : ''}>${v}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-slate-500 mb-2">Serving Unit</label>
                        <input id="bottle-serving-unit" value="${bottle ? bottle.servingUnit || '' : ''}" 
                               class="w-full border rounded-2xl px-6 py-5" placeholder="e.g. capsules, scoops">
                    </div>
                </div>

                <div>
                    <label class="block text-sm text-slate-500 mb-2">Purchase URL (optional)</label>
                    <div class="flex gap-3">
                        <input id="bottle-url" type="text" value="${bottle ? bottle.url || '' : ''}" 
                               class="flex-1 border rounded-2xl px-6 py-5" placeholder="https://...">
                        <button onclick="openBottleUrl()" class="px-8 py-5 border rounded-2xl hover:bg-slate-100">🔗 Open</button>
                    </div>
                </div>

                <div>
                    <div class="flex justify-between mb-4">
                        <span class="font-medium">Ingredients</span>
                        <button onclick="addIngredientRow()" class="text-emerald-600 hover:text-emerald-700 font-medium">+ Add Ingredient</button>
                    </div>
                    <div id="ingredients-list" class="space-y-4">${ingredientsHTML || '<p class="text-slate-400 py-8 text-center">No ingredients added yet.</p>'}</div>
                </div>
            </div>

            <!-- Sticky Buttons -->
            <div class="flex gap-4 pt-8 border-t mt-8 flex-shrink-0">
                <button onclick="hideBottleModal()" class="flex-1 py-5 border rounded-3xl font-medium">Cancel</button>
                <button onclick="saveStructuredBottle()" class="flex-1 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">Save Bottle</button>
            </div>
        </div>
    `;

    createModal('bottle-modal', modalHTML);
}

// ====================== INGREDIENT HELPERS ======================
window.addIngredientRow = function() {
    currentIngredients.push({ name: '', dose: '', unit: 'mg' });
    showStructuredBottleModal(window.bottles.find(b => b.id === editingBottleId));
};

window.updateIngredient = function(index, field, value) {
    if (currentIngredients[index]) currentIngredients[index][field] = value;
};

window.removeIngredient = function(index) {
    currentIngredients.splice(index, 1);
    showStructuredBottleModal(window.bottles.find(b => b.id === editingBottleId));
};

// ====================== SAVE & DELETE ======================
window.saveStructuredBottle = function() {
    const name = document.getElementById('bottle-name').value.trim();
    if (!name) {
        showToast("Bottle name is required", "error");
        return;
    }

    const bottleData = {
        id: editingBottleId || 'bottle-' + Date.now(),
        name: name,
        vendor: document.getElementById('bottle-vendor').value,
        servingUnit: document.getElementById('bottle-serving-unit').value.trim(),
        url: document.getElementById('bottle-url').value.trim(),
        ingredients: currentIngredients
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

window.deleteBottle = function(id) {
    if (confirm('Delete this bottle permanently?')) {
        window.bottles = window.bottles.filter(b => b.id !== id);
        saveAllData();
        renderBottlesTab();
        showToast('Bottle deleted');
    }
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

// Safe call to Over Limits (now in overlimits.js)
if (typeof window.renderOverLimitsTab === 'function') {
    window.renderOverLimitsTab();
} else {
    console.warn('⚠️ renderOverLimitsTab not ready yet');
}

// ====================== GLOBAL EXPORTS ======================
window.renderBottlesTab = renderBottlesTab;
window.showAddBottleModal = showAddBottleModal;
window.editBottle = editBottle;
window.deleteBottle = deleteBottle;
window.saveStructuredBottle = saveStructuredBottle;
window.hideBottleModal = hideBottleModal;
window.addIngredientRow = addIngredientRow;
window.updateIngredient = updateIngredient;
window.removeIngredient = removeIngredient;
window.openBottleUrl = openBottleUrl;

// === SAFE Over Limits Call (Fixed) ===
if (typeof window.renderOverLimitsTab === 'function') {
    window.renderOverLimitsTab();
} else {
    console.warn('⚠️ renderOverLimitsTab is not available (expected in overlimits.js)');
    // Fallback message
    const content = document.getElementById('overlimits-content') || document.getElementById('overlaps-content');
    if (content) {
        content.innerHTML = `
            <div class="text-center py-20 text-amber-600">
                Over Limits module is loading...<br>
                <small class="text-slate-400">If this persists, hard refresh again.</small>
            </div>
        `;
    }
}
/* window.setOverLimitsFilter = setOverLimitsFilter;
 */
console.log('💊 bottles.js fully exported');