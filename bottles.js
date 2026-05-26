// bottles.js - Clean List Only (with User Filtering + Red Stars)

console.log('💊 bottles.js loaded');

if (!window.bottles) window.bottles = [];

// Check if a bottle has any ingredient over its daily safety limit
function hasOverLimitIngredient(bottle) {
    if (!bottle?.ingredients || !window.safetyLimits) return false;

    return bottle.ingredients.some(ing => {
        if (!ing?.name) return false;
        const normName = normalizeName(ing.name);
        const limitData = window.safetyLimits[normName] || window.safetyLimits[ing.name];
        
        if (!limitData || !limitData.limit) return false;
        
        const dailyDose = parseFloat(ing.dose) || 0;
        return dailyDose > parseFloat(limitData.limit);
    });
}

// ====================== RENDER BOTTLES TAB ======================
function renderBottlesTab() {
    const content = document.getElementById('bottles-content');
    if (!content) return;

    let visibleCount = window.bottles.length;

    if (window.currentProfile !== "General") {
        visibleCount = window.bottles.filter(bottle => 
            bottle.users && Array.isArray(bottle.users) && bottle.users.includes(window.currentProfile)
        ).length;
    }

    content.innerHTML = `
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-2xl font-semibold">Your Bottles</h2>
                <p class="text-slate-500 dark:text-slate-400">
                    ${visibleCount} bottles total • ${window.currentProfile}
                </p>
            </div>
            <div class="flex gap-3">
                <button onclick="showAddBottleModal()" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">+ Add New Bottle</button>
                <button onclick="manageSafetyLimits()" class="px-6 py-4 border border-slate-300 dark:border-slate-600 rounded-3xl font-medium">⚠️ Daily Safety Limits</button>
                <button onclick="manageVendors()" class="px-6 py-4 border border-slate-300 dark:border-slate-600 rounded-3xl font-medium">🏪 Manage Vendors</button>
            </div>
        </div>
        
        <div class="flex gap-4 mb-6">
            <input id="bottle-search" type="text" placeholder="Search bottles or ingredients..." 
                   class="flex-1 border rounded-3xl px-5 py-4" onkeyup="if(event.key==='Enter') renderBottleList()">
            <select id="vendor-filter" onchange="renderBottleList()" class="border rounded-3xl px-5 py-4">
                <option value="">All Vendors</option>
                ${window.vendors ? window.vendors.map(v => `<option value="${v}">${v}</option>`).join('') : ''}
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

    let filteredBottles = window.bottles || [];

    // Filter by current user
    if (window.currentProfile !== "General") {
        filteredBottles = filteredBottles.filter(bottle => 
            bottle.users && Array.isArray(bottle.users) && bottle.users.includes(window.currentProfile)
        );
    }

    // Search filter
    const searchTerm = document.getElementById('bottle-search')?.value.toLowerCase().trim();
    if (searchTerm) {
        filteredBottles = filteredBottles.filter(bottle => 
            bottle.name.toLowerCase().includes(searchTerm) ||
            (bottle.ingredients && bottle.ingredients.some(i => 
                i.name.toLowerCase().includes(searchTerm)))
        );
    }

    if (filteredBottles.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">No bottles found for ${window.currentProfile}.</div>`;
        return;
    }

    filteredBottles.forEach(bottle => {
        const preview = bottle.ingredients 
            ? bottle.ingredients.slice(0, 4).map(i => `${i.name} ${i.dose}${i.unit}`).join(' • ')
            : 'No ingredients listed';

        const isOver = hasOverLimitIngredient(bottle);
        const overStar = isOver ? `<span class="text-red-500 text-xl">★</span>` : '';

        const div = document.createElement('div');
        div.className = "bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer transition-all group relative";
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1" onclick="editBottle('${bottle.id}')">
                    <div class="flex items-center gap-2">
                        <div class="font-semibold text-xl">${bottle.name}</div>
                        ${overStar}
                    </div>
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