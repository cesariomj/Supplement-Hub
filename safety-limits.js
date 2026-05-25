// safety-limits.js - Improved with Notes Field

console.log('🛡️ safety-limits.js loaded');

window.manageSafetyLimits = function() {
    const html = `
        <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b dark:border-slate-700 flex items-center justify-between">
                <h2 class="text-2xl font-semibold">Daily Safety Limits</h2>
                <div class="flex items-center gap-3">
                    <button onclick="importSafetyLimitsCSV()" 
                            class="px-5 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800">
                        📥 Import CSV
                    </button>
                    <button onclick="cleanSafetyLimitsDuplicates();hideModal('safety-modal')" 
                            class="px-5 py-2.5 text-sm border border-red-300 text-red-600 rounded-3xl hover:bg-red-50">
                        🧹 Clean Garbage
                    </button>
                    <button onclick="hideModal('safety-modal')" 
                            class="text-3xl leading-none text-slate-400 hover:text-slate-600">×</button>
                </div>
            </div>
            
            <div class="flex-1 overflow-auto p-6" id="safety-limits-list">
                <!-- Populated by filterSafetyLimits() -->
            </div>
            
            <div class="p-6 border-t dark:border-slate-700 flex gap-3">
                <button onclick="addNewSafetyLimit()" 
                        class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">
                    + Add New Limit
                </button>
                <button onclick="hideModal('safety-modal')" 
                        class="flex-1 py-4 border rounded-3xl font-medium">
                    Close
                </button>
            </div>
        </div>
    `;

    createModal('safety-modal', html);
    filterSafetyLimits();
};

function filterSafetyLimits() {
    const container = document.getElementById('safety-limits-list');
    if (!container) return;

    let html = `<div class="grid grid-cols-1 gap-4">`;

    Object.keys(window.safetyLimits || {}).forEach(key => {
        const item = window.safetyLimits[key];
        if (!item) return;

        html += `
            <div class="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                <div class="flex-1">
                    <div class="font-medium">${item.ingredient || key}</div>
                    <div class="text-sm text-slate-500">
                        ${item.limit} ${item.unit || 'mg'}
                        ${item.notes ? `<span class="ml-3 text-xs text-emerald-600">— ${item.notes}</span>` : ''}
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="editSafetyLimit('${key}')" 
                            class="px-5 py-2 text-sm border rounded-3xl hover:bg-white dark:hover:bg-slate-700">
                        Edit
                    </button>
                    <button onclick="deleteSafetyLimit('${key}')" 
                            class="px-5 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-3xl">
                        Delete
                    </button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html || `<div class="text-center py-12 text-slate-500">No safety limits defined yet.</div>`;
}

window.addNewSafetyLimit = function() {
    const html = `
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full">
            <h3 class="text-xl font-semibold mb-6">Add New Daily Safety Limit</h3>
            <input id="new-ingredient" type="text" placeholder="Ingredient name" class="w-full border rounded-2xl px-5 py-4 mb-4">
            <div class="flex gap-4">
                <input id="new-limit" type="number" placeholder="Limit" class="flex-1 border rounded-2xl px-5 py-4">
                <select id="new-unit" class="border rounded-2xl px-5 py-4">
                    <option value="mg">mg</option>
                    <option value="g">g</option>
                    <option value="mcg">mcg</option>
                </select>
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
    const limit = parseFloat(document.getElementById('new-limit').value);
    const unit = document.getElementById('new-unit').value;
    const notes = document.getElementById('new-notes').value.trim();

    if (!ingredient || isNaN(limit)) {
        showToast("Ingredient name and limit are required", "error");
        return;
    }

    if (!window.safetyLimits) window.safetyLimits = {};

    window.safetyLimits[ingredient.toLowerCase()] = {
        ingredient: ingredient,
        limit: limit,
        unit: unit,
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
            <input id="edit-ingredient" type="text" value="${item.ingredient || key}" class="w-full border rounded-2xl px-5 py-4 mb-4">
            <div class="flex gap-4">
                <input id="edit-limit" type="number" value="${item.limit}" class="flex-1 border rounded-2xl px-5 py-4">
                <select id="edit-unit" class="border rounded-2xl px-5 py-4">
                    <option value="mg" ${item.unit === 'mg' ? 'selected' : ''}>mg</option>
                    <option value="g" ${item.unit === 'g' ? 'selected' : ''}>g</option>
                    <option value="mcg" ${item.unit === 'mcg' ? 'selected' : ''}>mcg</option>
                </select>
            </div>
            <textarea id="edit-notes" placeholder="Notes (optional)" class="w-full border rounded-2xl px-5 py-4 mt-4 h-24">${item.notes || ''}</textarea>
            
            <div class="flex gap-4 mt-8">
                <button onclick="hideModal('edit-limit-modal')" class="flex-1 py-4 border rounded-3xl">Cancel</button>
                <button onclick="saveEditedSafetyLimit('${key}')" class="flex-1 py-4 bg-emerald-600 text-white rounded-3xl">Update Limit</button>
            </div>
        </div>
    `;

    createModal('edit-limit-modal', html);
};

window.saveEditedSafetyLimit = function(oldKey) {
    const ingredient = document.getElementById('edit-ingredient').value.trim();
    const limit = parseFloat(document.getElementById('edit-limit').value);
    const unit = document.getElementById('edit-unit').value;
    const notes = document.getElementById('edit-notes').value.trim();

    if (!ingredient || isNaN(limit)) {
        showToast("Ingredient name and limit are required", "error");
        return;
    }

    // Remove old key if name changed
    if (ingredient.toLowerCase() !== oldKey) {
        delete window.safetyLimits[oldKey];
    }

    window.safetyLimits[ingredient.toLowerCase()] = {
        ingredient: ingredient,
        limit: limit,
        unit: unit,
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

// Keep your existing cleanSafetyLimitsDuplicates and import functions

console.log('🛡️ safety-limits.js fully exported with Notes support');