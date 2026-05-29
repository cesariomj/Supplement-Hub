// safety-limits.js - Clean & Complete

console.log('🛡️ safety-limits.js loaded');

let safetySearchTerm = '';
let safetySortMode = 'name-asc';

window.manageSafetyLimits = function() {
    const html = `
        <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
                <h2 class="text-2xl font-semibold">Daily Safety Limits</h2>
                <div class="flex gap-3">
                    <button onclick="importSafetyLimitsCSV()" class="px-5 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-3xl hover:bg-slate-100">📥 Import CSV</button>
                    <button onclick="cleanSafetyLimitsDuplicates();hideModal('safety-modal')" class="px-5 py-2.5 text-sm border border-red-300 text-red-600 rounded-3xl hover:bg-red-50">🧹 Clean Garbage</button>
                    <button onclick="hideModal('safety-modal')" class="text-3xl leading-none text-slate-400 hover:text-slate-600">×</button>
                </div>
            </div>
            
            <!-- Search and Sort -->
            <div class="p-6 border-b dark:border-slate-700 flex gap-4 bg-white dark:bg-slate-900 relative">
                <div class="relative flex-1">
                    <input id="safety-search" type="text" placeholder="Search ingredients..." 
                           class="w-full border rounded-3xl px-5 py-3 pr-12" 
                           onkeyup="safetySearchTerm = this.value.toLowerCase().trim(); filterSafetyLimits()">
                    <button onclick="clearSafetySearch()" 
                            class="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
                </div>
                
                <select id="safety-sort" onchange="safetySortMode = this.value; filterSafetyLimits()" 
                        class="border rounded-3xl px-5 py-3">
                    <option value="name-asc">A - Z</option>
                    <option value="name-desc">Z - A</option>
                </select>
            </div>
            
            <div class="flex-1 overflow-auto p-6" id="safety-limits-list"></div>
            
            <div class="p-6 border-t dark:border-slate-700 flex gap-3">
                <button onclick="addNewSafetyLimit()" class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">+ Add New Limit</button>
                <button onclick="hideModal('safety-modal')" class="flex-1 py-4 border rounded-3xl font-medium">Close</button>
            </div>
        </div>
    `;

    createModal('safety-modal', html);
    filterSafetyLimits();
};

function filterSafetyLimits() {
    const container = document.getElementById('safety-limits-list');
    if (!container) return;

    let items = Object.keys(window.safetyLimits || {}).map(key => {
        const item = window.safetyLimits[key];
        return {
            key: key,
            name: (item.ingredient || key || '').toString(),
            limit: parseFloat(item.limit) || 0,
            unit: item.unit || 'mg',
            cycle_on: parseInt(item.cycle_on) || 0,
            cycle_off: parseInt(item.cycle_off) || 0,
            notes: item.notes || ''
        };
    });

    if (safetySearchTerm) {
        items = items.filter(item => item.name.toLowerCase().includes(safetySearchTerm));
    }

    if (safetySortMode === 'name-desc') {
        items.sort((a, b) => b.name.localeCompare(a.name));
    } else {
        items.sort((a, b) => a.name.localeCompare(b.name));
    }

    let html = `<div class="grid grid-cols-1 gap-4">`;

    items.forEach(item => {
        html += `
            <div class="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                <div class="flex-1">
                    <div class="font-medium">${item.name}</div>
                    <div class="text-sm text-slate-500">
                        ${item.limit} ${item.unit}
                        ${item.cycle_on || item.cycle_off ? ` • Cycle: ${item.cycle_on} on / ${item.cycle_off} off` : ''}
                    </div>
                    ${item.notes ? `<div class="text-xs text-emerald-600 mt-1">${item.notes}</div>` : ''}
                </div>
                <div class="flex gap-2">
                    <button onclick="editSafetyLimit('${item.key}')" class="px-5 py-2 text-sm border rounded-3xl hover:bg-white">Edit</button>
                    <button onclick="deleteSafetyLimit('${item.key}')" class="px-5 py-2 text-sm text-red-600 hover:bg-red-50 rounded-3xl">Delete</button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html || `<div class="text-center py-12 text-slate-500">No safety limits found.</div>`;
};

// ==================== ADD / EDIT / DELETE ====================

window.addNewSafetyLimit = function() {
    const html = `
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full">
            <h3 class="text-xl font-semibold mb-6">Add New Daily Safety Limit</h3>
            <input id="new-ingredient" type="text" placeholder="Ingredient name" class="w-full border rounded-2xl px-5 py-4 mb-4">
            <div class="flex gap-4">
                <input id="new-limit" type="number" placeholder="Daily Limit (0 = No Known Limit)" class="flex-1 border rounded-2xl px-5 py-4">
                <select id="new-unit" class="border rounded-2xl px-5 py-4">
                    <option value="mg">mg</option>
                    <option value="g">g</option>
                    <option value="mcg">mcg</option>
                </select>
            </div>
            <div class="flex gap-4 mt-4">
                <input id="new-cycle-on" type="number" placeholder="Cycle On (weeks)" class="flex-1 border rounded-2xl px-5 py-4">
                <input id="new-cycle-off" type="number" placeholder="Cycle Off (weeks)" class="flex-1 border rounded-2xl px-5 py-4">
            </div>
            <textarea id="new-notes" placeholder="Notes (optional)" class="w-full border rounded-2xl px-5 py-4 mt-4 h-24"></textarea>
            
            <div class="flex gap-4 mt-8">
                <button onclick="hideModal('add-limit-modal')" class="flex-1 py-4 border rounded-3xl">Cancel</button>
                <button onclick="saveNewSafetyLimit()" class="flex-1 py-4 bg-emerald-600 text-white rounded-3xl">Save Limit</button>
            </div>
        </div>
    `;

    createModal('add-limit-modal', html);
};

window.saveNewSafetyLimit = function() {
    const ingredient = document.getElementById('new-ingredient').value.trim();
    const limit = parseFloat(document.getElementById('new-limit').value) || 0;
    const unit = document.getElementById('new-unit').value;
    const cycle_on = parseInt(document.getElementById('new-cycle-on').value) || 0;
    const cycle_off = parseInt(document.getElementById('new-cycle-off').value) || 0;
    const notes = document.getElementById('new-notes').value.trim();

    if (!ingredient) {
        showToast("Ingredient name is required", "error");
        return;
    }

    if (!window.safetyLimits) window.safetyLimits = {};

    window.safetyLimits[ingredient.toLowerCase()] = {
        ingredient: ingredient,
        limit: limit,
        unit: unit,
        cycle_on: cycle_on,
        cycle_off: cycle_off,
        notes: notes
    };

    saveAllData();
    hideModal('add-limit-modal');
    filterSafetyLimits();
    showToast("Safety limit added");
};

window.editSafetyLimit = function(key) {
    const item = window.safetyLimits[key];
    if (!item) return;

    const html = `
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full">
            <h3 class="text-xl font-semibold mb-6">Edit Daily Safety Limit</h3>
            
            <label class="block text-sm text-slate-500 mb-1">Ingredient Name</label>
            <input id="edit-ingredient" type="text" value="${item.ingredient || key}" class="w-full border rounded-2xl px-5 py-4 mb-4">

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm text-slate-500 mb-1">Daily Limit</label>
                    <input id="edit-limit" type="number" value="${item.limit}" class="w-full border rounded-2xl px-5 py-4">
                </div>
                <div>
                    <label class="block text-sm text-slate-500 mb-1">Unit</label>
                    <select id="edit-unit" class="w-full border rounded-2xl px-5 py-4">
                        <option value="mg" ${item.unit === 'mg' ? 'selected' : ''}>mg</option>
                        <option value="g" ${item.unit === 'g' ? 'selected' : ''}>g</option>
                        <option value="mcg" ${item.unit === 'mcg' ? 'selected' : ''}>mcg</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mt-4">
                <div>
                    <label class="block text-sm text-slate-500 mb-1">Cycle On (weeks)</label>
                    <input id="edit-cycle-on" type="number" value="${item.cycle_on || 0}" class="w-full border rounded-2xl px-5 py-4">
                </div>
                <div>
                    <label class="block text-sm text-slate-500 mb-1">Cycle Off (weeks)</label>
                    <input id="edit-cycle-off" type="number" value="${item.cycle_off || 0}" class="w-full border rounded-2xl px-5 py-4">
                </div>
            </div>

            <label class="block text-sm text-slate-500 mb-1 mt-4">Notes</label>
            <textarea id="edit-notes" placeholder="Notes (optional)" class="w-full border rounded-2xl px-5 py-4 h-24">${item.notes || ''}</textarea>
            
            <div class="flex gap-4 mt-8">
                <button onclick="hideModal('edit-limit-modal')" class="flex-1 py-4 border rounded-3xl font-medium">Cancel</button>
                <button onclick="saveEditedSafetyLimit('${key}')" class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">Update Limit</button>
            </div>
        </div>
    `;

    createModal('edit-limit-modal', html);
};

window.saveEditedSafetyLimit = function(oldKey) {
    const ingredient = document.getElementById('edit-ingredient').value.trim();
    const limit = parseFloat(document.getElementById('edit-limit').value) || 0;
    const unit = document.getElementById('edit-unit').value;
    const cycle_on = parseInt(document.getElementById('edit-cycle-on').value) || 0;
    const cycle_off = parseInt(document.getElementById('edit-cycle-off').value) || 0;
    const notes = document.getElementById('edit-notes').value.trim();

    if (!ingredient) {
        showToast("Ingredient name is required", "error");
        return;
    }

    if (ingredient.toLowerCase() !== oldKey) {
        delete window.safetyLimits[oldKey];
    }

    window.safetyLimits[ingredient.toLowerCase()] = {
        ingredient: ingredient,
        limit: limit,
        unit: unit,
        cycle_on: cycle_on,
        cycle_off: cycle_off,
        notes: notes
    };

    saveAllData();
    hideModal('edit-limit-modal');
    filterSafetyLimits();
    showToast("Safety limit updated");
};

window.deleteSafetyLimit = function(key) {
    if (confirm(`Delete safety limit for ${key}?`)) {
        delete window.safetyLimits[key];
        saveAllData();
        filterSafetyLimits();
        showToast("Safety limit deleted");
    }
};

window.cleanSafetyLimitsDuplicates = function() {
    if (!window.safetyLimits) {
        window.safetyLimits = {};
        showToast("No data to clean", "info");
        return;
    }

    const cleaned = {};
    let removed = 0;

    Object.keys(window.safetyLimits).forEach(key => {
        const item = window.safetyLimits[key];
        if (!item || typeof item !== 'object') {
            removed++;
            return;
        }

        const name = String(item.ingredient || key).trim();
        if (!name || name.length < 2 || /[^\w\s\-\(\)\.\/,%]/.test(name)) {
            removed++;
            return;
        }

        const norm = name.toLowerCase();
        if (!cleaned[norm]) {
            cleaned[norm] = {
                ingredient: name,
                limit: parseFloat(item.limit) || 0,
                unit: item.unit || 'mg',
                cycle_on: parseInt(item.cycle_on) || 0,
                cycle_off: parseInt(item.cycle_off) || 0,
                notes: item.notes || ''
            };
        }
    });

    window.safetyLimits = cleaned;
    saveAllData();
    showToast(`🧹 Removed ${removed} bad entries`, "success");
    filterSafetyLimits();
};

window.importSafetyLimitsCSV = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const csv = event.target.result;
                const lines = csv.trim().split('\n');
                
                if (!window.safetyLimits) window.safetyLimits = {};

                let importedCount = 0;

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const columns = line.split(',').map(s => s.trim());

                    const ingredient = columns[0];
                    const limit = parseFloat(columns[1]) || 0;
                    const unit = columns[2] || 'mg';
                    const cycle_on = parseInt(columns[3]) || 0;
                    const cycle_off = parseInt(columns[4]) || 0;
                    const notes = columns[5] || '';

                    if (ingredient) {
                        window.safetyLimits[ingredient.toLowerCase()] = {
                            ingredient: ingredient,
                            limit: limit,
                            unit: unit,
                            cycle_on: cycle_on,
                            cycle_off: cycle_off,
                            notes: notes
                        };
                        importedCount++;
                    }
                }

                saveAllData();
                filterSafetyLimits();
                showToast(`✅ Imported ${importedCount} safety limits successfully`);
            } catch (err) {
                console.error(err);
                showToast('❌ Error importing CSV', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
};

window.clearSafetySearch = function() {
    const searchInput = document.getElementById('safety-search');
    if (searchInput) {
        searchInput.value = '';
        safetySearchTerm = '';
        filterSafetyLimits();
    }
};

console.log('🛡️ safety-limits.js fully exported with cycle fields');