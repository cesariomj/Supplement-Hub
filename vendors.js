// vendors.js - Extracted & Clean

console.log('🏪 vendors.js loaded');

window.manageVendors = function() {
    const html = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-xl max-h-[90vh] flex flex-col">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold">Manage Vendors</h2>
                <button onclick="addNewVendor()" 
                        class="px-6 py-2 bg-emerald-600 text-white rounded-3xl">+ Add New Vendor</button>
            </div>

            <input id="vendor-search" type="text" placeholder="Search vendors..." 
                   class="w-full border rounded-3xl px-5 py-4 mb-6" onkeyup="filterVendors()">

            <div id="vendor-list" class="flex-1 overflow-auto space-y-3 pr-2"></div>

            <div class="pt-6 border-t mt-auto">
                <button onclick="hideModal('vendors-modal')" 
                        class="w-full py-4 border rounded-3xl font-medium">Close</button>
            </div>
        </div>
    `;

    createModal('vendors-modal', html);
    setTimeout(filterVendors, 10);
};

// Add / Edit
window.addNewVendor = function(editingName = null) {
    const html = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md">
            <h3 class="text-xl font-semibold mb-6">${editingName ? 'Edit' : 'New'} Vendor</h3>
            <input id="vendor-name" type="text" value="${editingName || ''}" 
                   placeholder="Vendor name" class="w-full border rounded-2xl px-5 py-4 mb-6">
            
            <div class="flex gap-3">
                <button onclick="hideModal('vendor-form-modal')" class="flex-1 py-4 border rounded-3xl">Cancel</button>
                <button onclick="saveVendor('${editingName || ''}')" class="flex-1 py-4 bg-emerald-600 text-white rounded-3xl">
                    ${editingName ? 'Update' : 'Add'}
                </button>
            </div>
        </div>
    `;
    createModal('vendor-form-modal', html);
};

window.saveVendor = function(editingName) {
    const name = document.getElementById('vendor-name').value.trim();
    if (!name) return showToast("Vendor name required", "error");

    if (!window.vendors.includes(name)) {
        window.vendors.push(name);
        window.vendors.sort();
    }

    saveAllData();
    hideModal('vendor-form-modal');
    filterVendors();
    showToast(editingName ? "Vendor updated" : "Vendor added");
};

function filterVendors() {
    const term = (document.getElementById('vendor-search')?.value || '').toLowerCase().trim();
    const container = document.getElementById('vendor-list');
    if (!container) return;

    let html = '';
    window.vendors.forEach(v => {
        if (term && !v.toLowerCase().includes(term)) return;

        html += `
            <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl group">
                <div class="font-medium">${v}</div>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100">
                    <button onclick="addNewVendor('${v}')" class="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-xl text-sm">Edit</button>
                    <button onclick="deleteVendor('${v}')" class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm">Delete</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html || `<div class="text-center py-12 text-slate-500">No vendors found</div>`;
};

window.deleteVendor = function(name) {
    if (confirm(`Delete "${name}"?`)) {
        window.vendors = window.vendors.filter(v => v !== name);
        saveAllData();
        filterVendors();
        showToast("Vendor deleted");
    }
};

console.log('🏪 vendors.js fully exported');