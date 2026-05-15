// bottles.js - Clean List Only (with User Filtering + Red Stars)

console.log('💊 bottles.js loaded');

if (!window.bottles) window.bottles = [];

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

        <div class="flex gap-4 mb-6">
            <input id="bottle-search" type="text" placeholder="Search bottles or ingredients..." 
                   class="flex-1 border rounded-3xl px-5 py-4" onkeyup="if(event.key==='Enter') renderBottleList()">

            <select id="bottle-sort" onchange="renderBottleList()" 
                    class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-3xl px-5 py-4">
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
            </select>
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

    const searchTerm = (document.getElementById('bottle-search')?.value || '').toLowerCase().trim();
    const sortMode = document.getElementById('bottle-sort')?.value || 'name-asc';

    let filtered = window.bottles.filter(bottle => {
        // User filter
        if (window.currentProfile !== "General" && 
            (!bottle.users || !bottle.users.includes(window.currentProfile))) {
            return false;
        }

        // Search filter
        const nameMatch = bottle.name.toLowerCase().includes(searchTerm);
        const ingredientMatch = bottle.ingredients?.some(i => 
            i.name.toLowerCase().includes(searchTerm)
        );

        return nameMatch || ingredientMatch;
    });

    // Sorting
    if (sortMode === 'name-desc') {
        filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">
            No bottles found for ${window.currentProfile}.
        </div>`;
        return;
    }

    filtered.forEach(bottle => {
        const preview = bottle.ingredients 
            ? bottle.ingredients.slice(0, 3).map(i => i.name).join(' • ')
            : 'No ingredients';

        // Check for over-limit ingredients
        const hasOverLimit = bottle.ingredients?.some(ing => {
            const norm = normalizeName(ing.name);
            const limitData = window.safetyLimits[norm] || window.safetyLimits[ing.name];
            if (!limitData) return false;
            const dose = parseFloat(ing.dose) || 0;
            return limitData.limit === 0 || dose > limitData.limit;
        });

        const div = document.createElement('div');
        div.className = "bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer transition-all group relative";
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1" onclick="editBottle('${bottle.id}')">
                    <div class="flex items-center gap-2">
                        <div class="font-semibold text-xl">${bottle.name}</div>
                        ${hasOverLimit ? `<span class="text-red-500 text-xl leading-none" title="Contains ingredients over safety limits">★</span>` : ''}
                    </div>
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

function normalizeName(name) {
    return String(name).toLowerCase().trim().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '');
}

// ====================== HELPERS ======================
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