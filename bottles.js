// bottles.js - Clean List Only

console.log('💊 bottles.js loaded');

if (!window.bottles) window.bottles = [];

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

        <div class="flex gap-4 mb-6">
            <input id="bottle-search" type="text" placeholder="Search bottles or ingredients..." 
                   class="flex-1 border rounded-3xl px-5 py-4" onkeyup="if(event.key==='Enter') renderBottleList()">
            <button onclick="clearBottleSearch()" class="px-6 py-4 border rounded-3xl hover:bg-slate-100">Clear</button>
        </div>

        <div id="bottle-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    `;

    renderBottleList();
}

function renderBottleList() {
    const container = document.getElementById('bottle-list');
    if (!container) return;
    container.innerHTML = '';

    const searchTerm = (document.getElementById('bottle-search')?.value || '').toLowerCase().trim();

    const filtered = window.bottles.filter(b => 
        b.name.toLowerCase().includes(searchTerm) ||
        b.ingredients?.some(i => i.name.toLowerCase().includes(searchTerm))
    );

    if (filtered.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">No bottles found.</div>`;
        return;
    }

    filtered.forEach(bottle => {
        const preview = bottle.ingredients 
            ? bottle.ingredients.slice(0, 3).map(i => i.name).join(' • ')
            : 'No ingredients';

        const div = document.createElement('div');
        div.className = "bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer transition-all group relative";
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1" onclick="editBottle('${bottle.id}')">
                    <div class="font-semibold text-xl mb-1">${bottle.name}</div>
                    ${bottle.vendor ? `<div class="text-emerald-600 text-sm mb-1">📍 ${bottle.vendor}</div>` : ''}
                    ${bottle.servingUnit ? `<div class="text-xs text-slate-500">${bottle.servingUnit} • ${bottle.servingSize || ''}</div>` : ''}
                    <div class="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mt-2">${preview}</div>
                </div>
                
                <button onclick="event.stopImmediatePropagation(); deleteBottle('${bottle.id}');" 
                        class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950 text-xl">
                    ✕
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

window.clearBottleSearch = function() {
    const input = document.getElementById('bottle-search');
    if (input) {
        input.value = '';
        renderBottleList();
    }
};

window.deleteBottle = function(id) {
    if (confirm('Delete this bottle permanently?')) {
        window.bottles = window.bottles.filter(b => b.id !== id);
        saveAllData();
        renderBottlesTab();
        showToast('Bottle deleted');
    }
};

// ====================== EXPORTS ======================
window.renderBottlesTab = renderBottlesTab;
window.renderBottleList = renderBottleList;
window.deleteBottle = deleteBottle;
window.clearBottleSearch = clearBottleSearch;

console.log('💊 bottles.js - CLEAN & FINAL');