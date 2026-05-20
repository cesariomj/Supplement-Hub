// safety-limits.js - Extracted & Clean

console.log('🛡️ safety-limits.js loaded');

window.manageSafetyLimits = function() {
    const html = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">Daily Safety Limits</h2>
            <div class="flex gap-3">
                <button onclick="importSafetyLimitsCSV()" class="px-5 py-2 text-sm border rounded-3xl hover:bg-slate-100">Import CSV</button>
                <button onclick="cleanSafetyLimits()" class="px-5 py-2 text-sm border border-red-300 text-red-600 rounded-3xl hover:bg-red-50">🧹 Clean Garbage</button>
                <button onclick="addNewSafetyLimit()" class="px-6 py-2 bg-emerald-600 text-white rounded-3xl">+ Add New</button>
            </div>
        </div>

            <input id="safety-search" type="text" placeholder="Search ingredients or notes..." 
                   class="w-full border rounded-3xl px-5 py-4 mb-6" onkeyup="filterSafetyLimits()">

            <div id="safety-list" class="flex-1 overflow-auto space-y-3 pr-2"></div>

            <div class="pt-6 border-t mt-auto">
                <button onclick="hideModal('safety-modal')" class="w-full py-4 border rounded-3xl font-medium">Close</button>
            </div>
        </div>
    `;

    createModal('safety-modal', html);
    setTimeout(filterSafetyLimits, 10);
};

// Keep all the other safety functions exactly as they are now (addNewSafetyLimit, saveSafetyLimit, filterSafetyLimits, deleteSafetyLimit, importSafetyLimitsCSV)
// ====================== SAFETY LIMITS MANAGEMENT ======================

// Add / Edit Form
window.addNewSafetyLimit = function(editingKey = null) {
    let item = editingKey ? window.safetyLimits[editingKey] : {};

    // Fallback if ingredient name is missing (common with old data)
    if (editingKey && (!item.ingredient || item.ingredient === '')) {
        item = {
            ...item,
            ingredient: editingKey.charAt(0).toUpperCase() + editingKey.slice(1)
        };
    }

    const html = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md">
            <h3 class="text-xl font-semibold mb-6">${editingKey ? 'Edit Safety Limit' : 'New Safety Limit'}</h3>
            
            <input id="sl-ingredient" type="text" value="${item.ingredient || ''}" 
                   placeholder="Ingredient name" class="w-full border rounded-2xl px-5 py-4 mb-4">

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <input id="sl-limit" type="number" value="${item.limit || ''}" 
                           placeholder="Limit" class="w-full border rounded-2xl px-5 py-4">
                </div>
                <div>
                    <select id="sl-unit" class="w-full border rounded-2xl px-5 py-4">
                        <option value="mg" ${item.unit === 'mg' ? 'selected' : ''}>mg</option>
                        <option value="g" ${item.unit === 'g' ? 'selected' : ''}>g</option>
                    </select>
                </div>
            </div>

            <textarea id="sl-notes" placeholder="Notes (optional)" 
                      class="w-full border rounded-3xl px-5 py-4 h-24">${item.notes || ''}</textarea>

            <div class="flex gap-3 mt-8">
                <button onclick="hideModal('safety-form-modal')" 
                        class="flex-1 py-4 border rounded-3xl">Cancel</button>
                <button onclick="saveSafetyLimit('${editingKey || ''}')" 
                        class="flex-1 py-4 bg-emerald-600 text-white rounded-3xl">
                    ${editingKey ? 'Update' : 'Save'}
                </button>
            </div>
        </div>
    `;

    createModal('safety-form-modal', html);
};

window.saveSafetyLimit = function(editingKey) {
    const name = document.getElementById('sl-ingredient').value.trim();
    if (!name) return showToast("Ingredient name required", "error");

    const key = name.toLowerCase();

    window.safetyLimits[key] = {
        ingredient: name,
        limit: parseFloat(document.getElementById('sl-limit').value) || 0,
        unit: document.getElementById('sl-unit').value,
        notes: document.getElementById('sl-notes').value.trim()
    };

    saveAllData();
    hideModal('safety-form-modal');
    filterSafetyLimits();
    showToast(editingKey ? "Updated" : "Added");
};

function filterSafetyLimits() {
    const term = (document.getElementById('safety-search')?.value || '').toLowerCase().trim();
    const container = document.getElementById('safety-list');
    if (!container) return;

    let html = '';

    Object.keys(window.safetyLimits || {}).sort().forEach(key => {
        const item = window.safetyLimits[key];
        const name = item.ingredient || key;

        if (term && !name.toLowerCase().includes(term) && !(item.notes || '').toLowerCase().includes(term)) return;

        html += `
            <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl group">
                <div>
                    <div class="font-medium">${name}</div>
                    <div class="text-sm text-slate-500">${item.limit} ${item.unit} ${item.notes ? '• ' + item.notes : ''}</div>
                </div>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100">
                    <button onclick="addNewSafetyLimit('${key}')" class="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-xl">Edit</button>
                    <button onclick="deleteSafetyLimit('${key}')" class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl">Delete</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html || `<div class="text-center py-12 text-slate-500">No safety limits found</div>`;
};

window.deleteSafetyLimit = function(key) {
    if (confirm(`Delete limit for "${window.safetyLimits[key]?.ingredient || key}"?`)) {
        delete window.safetyLimits[key];
        saveAllData();
        filterSafetyLimits();
        showToast("Deleted");
    }
};

// ====================== CSV IMPORT ======================
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
                const text = event.target.result;
                const rows = text.split('\n').map(row => row.trim()).filter(row => row);
                
                let importedCount = 0;
                
                // Skip header row if present
                const startRow = rows[0].toLowerCase().includes('ingredient') ? 1 : 0;

                for (let i = startRow; i < rows.length; i++) {
                    const columns = parseCSVLine(rows[i]);  // robust parser
                    
                    if (columns.length < 2) continue;
                    
                    const ingredient = columns[0].trim();
                    if (!ingredient) continue;

                    const limit = parseFloat(columns[1]) || 0;
                    const unit = (columns[2] || 'mg').trim();
                    const notes = columns[4] ? columns[4].trim() : '';

                    const key = ingredient.toLowerCase();

                    window.safetyLimits[key] = {
                        ingredient: ingredient,
                        limit: limit,
                        unit: unit,
                        notes: notes
                    };
                    importedCount++;
                }

                saveAllData();
                filterSafetyLimits();
                showToast(`✅ Imported ${importedCount} safety limits`);
            } catch (err) {
                console.error(err);
                showToast("❌ Failed to import CSV", "error");
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
};

// Simple robust CSV line parser (handles commas inside quotes)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// ====================== STRONG CLEANUP ======================
window.cleanSafetyLimits = function() {
    if (!confirm("This will remove ALL corrupted/garbage entries from Safety Limits. Continue?")) return;

    let cleaned = 0;
    const cleanLimits = {};

    Object.keys(window.safetyLimits).forEach(key => {
        const item = window.safetyLimits[key];
        const name = (item.ingredient || key || '').trim();

        // Remove obvious garbage
        if (!name || 
            name.length < 3 || 
            /�|�|�|�|�|�|�|�/.test(name) || 
            /PK|Index|Document|Tables/.test(name)) {
            cleaned++;
            return;
        }

        cleanLimits[key] = item;
    });

    window.safetyLimits = cleanLimits;
    saveAllData();
    filterSafetyLimits();
    showToast(`✅ Removed ${cleaned} corrupted entries`);
};


console.log('🛡️ safety-limits.js fully exported');