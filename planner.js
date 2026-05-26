// planner.js - Weekly Planner with User Filtering

console.log('📅 planner.js loaded');

function renderWeeklyPlanner() {
    const content = document.getElementById('planner-content');
    if (!content) return;

    if (!window.weeklyPlan) window.weeklyPlan = {};

    // === Count Assigned Bottles (same logic as Bottles tab) ===
    let assignedBottles = window.bottles.length;

    if (window.currentProfile !== "General") {
        assignedBottles = window.bottles.filter(bottle => 
            bottle.users && Array.isArray(bottle.users) && bottle.users.includes(window.currentProfile)
        ).length;
    }

    // === Count Scheduled Bottles (has at least one day with servings) ===
    let scheduledBottles = 0;
    const seenBottles = new Set();

    Object.values(window.weeklyPlan).forEach(dayPlan => {
        if (!dayPlan || typeof dayPlan !== 'object') return;

        Object.entries(dayPlan).forEach(([bottleId, servingsRaw]) => {
            const servings = parseFloat(servingsRaw) || 0;
            if (servings <= 0) return;

            const bottle = window.bottles.find(b => b.id === bottleId);
            if (!bottle) return;

            // Respect user assignment
            if (window.currentProfile !== "General" && 
                (!bottle.users || !bottle.users.includes(window.currentProfile))) {
                return;
            }

            if (!seenBottles.has(bottleId)) {
                seenBottles.add(bottleId);
                scheduledBottles++;
            }
        });
    });

    const html = `
        <div class="mb-8 flex justify-between items-center">
            <div>
                <h2 class="text-2xl font-semibold">Weekly Planner</h2>
                <p class="text-slate-500 dark:text-slate-400">
                    ${scheduledBottles} of ${assignedBottles} bottles scheduled • ${window.currentProfile}
                </p>
            </div>
            
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-5 py-3 rounded-3xl">
                    <span class="text-sm font-medium text-slate-600 dark:text-slate-400">% Overlimit Accepted</span>
                    <input id="tolerance-input" type="number" min="0" max="100" step="5" 
                           value="${window.overlimitTolerance || 0}" 
                           class="w-20 text-center border border-slate-300 dark:border-slate-600 rounded-2xl py-2 font-mono"
                           onchange="updateOverlimitTolerance(this.value)">
                    <span class="text-sm text-slate-500">%</span>
                </div>

                <select id="planner-sort" onchange="renderPlannerTable()" class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-3xl px-5 py-3 text-sm">
                    <option value="total-desc">Sort by Total ↓</option>
                    <option value="name-asc">Sort by Name</option>
                </select>
                <button onclick="resetAllServingsToZero()" class="px-6 py-3 border border-red-300 text-red-600 rounded-3xl text-sm hover:bg-red-50">Reset All</button>
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

    let filteredBottles = [...window.bottles];

    if (window.currentProfile !== "General") {
        filteredBottles = filteredBottles.filter(bottle => 
            bottle.users && Array.isArray(bottle.users) && bottle.users.includes(window.currentProfile)
        );
    }

    if (filteredBottles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="p-12 text-center text-slate-500">
            No bottles assigned to ${window.currentProfile}.
        </td></tr>`;
        return;
    }

    const sortMode = document.getElementById('planner-sort')?.value || 'total-desc';

    const bottlesWithTotals = filteredBottles.map(bottle => {
        let total = 0;
        window.DAYS.forEach(day => {
            total += parseFloat(window.weeklyPlan[day]?.[bottle.id] || 0);
        });
        return { bottle, total };
    });

    if (sortMode === 'total-desc') {
        bottlesWithTotals.sort((a, b) => b.total - a.total);
    } else {
        bottlesWithTotals.sort((a, b) => a.bottle.name.localeCompare(b.bottle.name));
    }

    // Render with proper scoping
    bottlesWithTotals.forEach(({ bottle, total }) => {
        let cells = window.DAYS.map(day => {
            const val = window.weeklyPlan[day]?.[bottle.id] || 0;
            return `<td class="px-4 py-5 text-center">
                <input type="number" value="${val}" min="0" step="1" 
                       class="w-16 text-center border rounded-2xl py-2"
                       onchange="updatePlannerServings('${day}', '${bottle.id}', this.value)">
            </td>`;
        }).join('');

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700">
                <td class="px-6 py-5 font-medium">${bottle.name}</td>
                <td class="px-6 py-5">
                    <div class="flex gap-2">
                        <input id="quick-${bottle.id}" type="number" value="0" min="0" step="1" 
                               class="w-20 text-center border rounded-2xl py-2">
                        <button onclick="quickFillBottle('${bottle.id}', true)" 
                                class="px-4 text-xs bg-emerald-600 text-white rounded-2xl">Every Day</button>
                        <button onclick="quickFillBottle('${bottle.id}', false)" 
                                class="px-4 text-xs border rounded-2xl">Every Other</button>
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

// ====================== PLANNER HELPER FUNCTIONS ======================

window.updatePlannerServings = function(day, bottleId, value) {
    if (!window.weeklyPlan[day]) window.weeklyPlan[day] = {};

    const num = parseFloat(value);
    if (num > 0) {
        window.weeklyPlan[day][bottleId] = num;
    } else {
        delete window.weeklyPlan[day][bottleId];
    }

    saveAllData();
};

window.quickFillBottle = function(bottleId, isEveryDay) {
    if (!window.weeklyPlan) window.weeklyPlan = {};

    // Get value from the Quick Fill input box
    const input = document.getElementById(`quick-${bottleId}`);
    let servings = input && input.value !== '' ? parseFloat(input.value) : 0;

    // Force whole number
    servings = Math.round(Math.max(0, servings));

    console.log(`Quick Fill: ${isEveryDay ? 'Every Day' : 'Every Other'} → ${servings} for ${bottleId}`);

    window.DAYS.forEach((day, index) => {
        if (!window.weeklyPlan[day]) {
            window.weeklyPlan[day] = {};
        }

        if (isEveryDay) {
            // Every Day = fill ALL days
            window.weeklyPlan[day][bottleId] = servings;
        } else {
            // Every Other = fill Mon, Wed, Fri, Sun
            if (index % 2 === 0) {
                window.weeklyPlan[day][bottleId] = servings;
            } else {
                delete window.weeklyPlan[day][bottleId];
            }
        }
    });

    saveAllData();
    renderPlannerTable();

    const msg = isEveryDay 
        ? `✅ Every Day filled with ${servings}` 
        : `✅ Every Other Day filled with ${servings} (Mon/Wed/Fri/Sun)`;

    showToast(msg);
};

window.zeroOutBottle = function(bottleId) {
    window.DAYS.forEach(day => {
        if (window.weeklyPlan[day]) {
            delete window.weeklyPlan[day][bottleId];
        }
    });
    saveAllData();
    renderPlannerTable();
};

window.resetAllServingsToZero = function() {
    if (confirm("Reset ALL servings to zero?")) {
        window.weeklyPlan = {};
        saveAllData();
        renderPlannerTable();
        showToast("All servings reset to zero");
    }
};

// Global Exports
window.renderWeeklyPlanner = renderWeeklyPlanner;
window.renderPlannerTable = renderPlannerTable;
window.updatePlannerServings = updatePlannerServings;
window.quickFillBottle = quickFillBottle;
window.zeroOutBottle = zeroOutBottle;
window.resetAllServingsToZero = resetAllServingsToZero;

console.log('📅 planner.js fully exported');