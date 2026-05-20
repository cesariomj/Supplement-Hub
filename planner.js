// planner.js - Weekly Planner with User Filtering

console.log('📅 planner.js loaded');

function renderWeeklyPlanner() {
    const content = document.getElementById('planner-content');
    if (!content) return;

    if (!window.weeklyPlan) window.weeklyPlan = {};
    if (!window.bottles) window.bottles = [];

    let activeBottles = 0;
    const seenBottles = new Set();

    Object.values(window.weeklyPlan).forEach(dayPlan => {
        if (!dayPlan || typeof dayPlan !== 'object') return;

        Object.entries(dayPlan).forEach(([bottleId, servingsRaw]) => {
            const servings = parseFloat(servingsRaw) || 0;
            if (servings <= 0) return;

            const bottle = window.bottles.find(b => b.id === bottleId);
            if (!bottle) return;

            // User filter
            if (window.currentProfile !== "General" && 
                (!bottle.users || !bottle.users.includes(window.currentProfile))) {
                return;
            }

            if (!seenBottles.has(bottleId)) {
                seenBottles.add(bottleId);
                activeBottles++;
            }
        });
    });

    const html = `
        <div class="mb-8 flex justify-between items-center">
            <div>
                <h2 class="text-2xl font-semibold">Weekly Planner</h2>
                <p class="text-slate-500 dark:text-slate-400">
                    ${activeBottles} of ${window.bottles.length} bottles scheduled • ${window.currentProfile}
                </p>
            </div>
            
            <div class="flex items-center gap-4">
                <!-- New % Overlimit Accepted Field -->
                <div class="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-5 py-3 rounded-3xl">
                    <span class="text-sm font-medium text-slate-600 dark:text-slate-400">% Overlimit Accepted</span>
                    <input id="tolerance-input" type="number" min="0" max="100" step="5" 
                           value="${window.overlimitTolerance || 0}" 
                           class="w-20 text-center border border-slate-300 dark:border-slate-600 rounded-2xl py-2 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                           onchange="updateOverlimitTolerance(this.value)">
                    <span class="text-sm text-slate-500">%</span>
                </div>

                <select id="planner-sort" onchange="renderPlannerTable()" 
                        class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-3xl px-5 py-3 text-sm">
                    <option value="total-desc">Sort by Total ↓</option>
                    <option value="name-asc">Sort by Name</option>
                </select>
                
                <button onclick="resetAllServingsToZero()" 
                        class="px-6 py-3 border border-red-300 text-red-600 rounded-3xl text-sm hover:bg-red-50">
                    Reset All
                </button>
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full bg-white dark:bg-slate-800 rounded-3xl overflow-hidden">
                <thead>
                    <tr class="bg-slate-100 dark:bg-slate-900">
                        <th class="px-6 py-5 text-left">Bottle</th>
                        <th class="px-6 py-5 text-left w-56">Quick Fill</th>
                        ${window.DAY_LABELS.map(d => `<th class="px-4 py-5 text-center">${d}</th>`).join('')}
                        <th class="px-6 py-5 text-center font-medium">Total</th>
                        <th class="px-6 py-5 w-20"></th>
                    </tr>
                </thead>
                <tbody id="planner-body" class="divide-y"></tbody>
            </table>
        </div>
    `;

    content.innerHTML = html;
    renderPlannerTable();
}

function renderPlannerTable() {
    const tbody = document.getElementById('planner-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (window.bottles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="p-12 text-center text-slate-500">No bottles yet.</td></tr>`;
        return;
    }

    const sortMode = document.getElementById('planner-sort')?.value || 'total-desc';
    let sortedBottles = [...window.bottles];

    // Filter by current user
    if (window.currentProfile !== "General") {
        sortedBottles = sortedBottles.filter(bottle => 
            bottle.users && bottle.users.includes(window.currentProfile)
        );
    }

    if (sortedBottles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="p-12 text-center text-slate-500">
            No bottles assigned to ${window.currentProfile}.
        </td></tr>`;
        return;
    }

    // Calculate totals and filter out zero-total bottles
    const bottlesWithTotals = sortedBottles.map(bottle => {
        let total = 0;
        window.DAYS.forEach(day => {
            total += parseFloat(window.weeklyPlan[day]?.[bottle.id] || 0);
        });
        return { bottle, total };
    }).filter(item => item.total > 0);   // ← This line removes zero-total bottles

    if (bottlesWithTotals.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="p-12 text-center text-slate-500">
            No scheduled servings for ${window.currentProfile} yet.
        </td></tr>`;
        return;
    }

    // Sorting
    if (sortMode === 'total-desc') {
        bottlesWithTotals.sort((a, b) => b.total - a.total);
    } else {
        bottlesWithTotals.sort((a, b) => a.bottle.name.localeCompare(b.bottle.name));
    }

    // Helper Functions
    window.updateOverlimitTolerance = function(value) {
    window.overlimitTolerance = parseFloat(value) || 0;
    localStorage.setItem('overlimitTolerance', window.overlimitTolerance);
    
    showToast(`✅ Overlimit tolerance set to ${window.overlimitTolerance}%`, "success");
    
    // Refresh Over Limits tab to show new calculations
    if (typeof renderOverLimitsTab === 'function') {
        renderOverLimitsTab();
    }
};


    // Render
    bottlesWithTotals.forEach(({ bottle, total }) => {
        let cells = window.DAYS.map(day => {
            const val = window.weeklyPlan[day]?.[bottle.id] || 0;
            return `<td class="px-4 py-5 text-center">
                <input type="number" value="${val}" min="0" step="0.5" 
                       class="w-16 text-center border rounded-2xl py-2"
                       onchange="updatePlannerServings('${day}', '${bottle.id}', this.value)">
            </td>`;
        }).join('');

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700">
                <td class="px-6 py-5 font-medium">${bottle.name}</td>
                <td class="px-6 py-5">
                    <div class="flex gap-2">
                        <input id="quick-${bottle.id}" type="number" min="0" step="0.5" class="w-20 text-center border rounded-2xl py-2">
                        <button onclick="quickFillBottle('${bottle.id}', true)" class="px-4 text-xs bg-emerald-600 text-white rounded-2xl">Every Day</button>
                        <button onclick="quickFillBottle('${bottle.id}', false)" class="px-4 text-xs border rounded-2xl">Every Other</button>
                    </div>
                </td>
                ${cells}
                <td class="px-6 py-5 text-center font-semibold text-emerald-600">${total}</td>
                <td class="px-4 py-5 text-center">
                    <button onclick="zeroOutBottle('${bottle.id}')" class="text-red-500 hover:text-red-600 text-xl">🗑️</button>
                </td>
            </tr>`;
    });
}

// Global Exports
window.renderWeeklyPlanner = renderWeeklyPlanner;
window.renderPlannerTable = renderPlannerTable;

console.log('📅 planner.js fully exported');