// planner.js - Clean Weekly Planner (editing only)

console.log('📅 planner.js loaded');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function renderWeeklyPlanner() {
    const content = document.getElementById('planner-content');
    if (!content) return;

    let activeBottles = 0;
    window.bottles.forEach(bottle => {
        const hasServings = DAYS.some(day => (window.weeklyPlan[day] || {})[bottle.id] > 0);
        if (hasServings) activeBottles++;
    });

    let html = `
        <div class="mb-8">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-semibold mb-1">Weekly Supplement Planner</h2>
                    <p class="text-slate-500 dark:text-slate-400">${activeBottles} of ${window.bottles.length} bottles scheduled</p>
                </div>
                
                <select id="planner-sort-select" onchange="renderPlannerTable()" 
                        class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-5 py-3">
                    <option value="name">Bottle Name (A–Z)</option>
                    <option value="total-desc" selected>Total Servings (High to Low)</option>
                </select>
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full border-collapse bg-white dark:bg-slate-800 rounded-3xl overflow-hidden">
                <thead>
                    <tr class="bg-slate-100 dark:bg-slate-900">
                        <th class="px-6 py-5 text-left font-medium">Bottle</th>
                        <th class="px-6 py-5 text-left font-medium w-56">Quick Fill</th>
                        ${DAY_LABELS.map(day => `<th class="px-4 py-5 text-center font-medium">${day}</th>`).join('')}
                        <th class="px-6 py-5 text-center font-medium">Total/week</th>
                    </tr>
                </thead>
                <tbody id="planner-table-body" class="divide-y dark:divide-slate-700"></tbody>
            </table>
        </div>
    `;

    content.innerHTML = html;
    renderPlannerTable();
}

function renderPlannerTable() {
    const tbody = document.getElementById('planner-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (window.bottles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="p-12 text-center text-slate-500">No bottles yet. Add some in the Bottles tab first.</td></tr>`;
        return;
    }

    const sortMode = document.getElementById('planner-sort-select')?.value || 'name';

    // Sort the bottles
    let sortedBottles = [...window.bottles];

    if (sortMode === 'total-desc') {
        sortedBottles.sort((a, b) => {
            let totalA = 0, totalB = 0;
            DAYS.forEach(day => {
                totalA += (window.weeklyPlan[day]?.[a.id] || 0);
                totalB += (window.weeklyPlan[day]?.[b.id] || 0);
            });
            return totalB - totalA;
        });
    } else {
        sortedBottles.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    sortedBottles.forEach(bottle => {
        let weeklyTotal = 0;
        let rowHTML = `<tr class="hover:bg-slate-50 dark:hover:bg-slate-700">
            <td class="px-6 py-5 font-medium">${bottle.name}</td>`;

        // Quick Fill column
        rowHTML += `
            <td class="px-6 py-5">
                <div class="flex items-center gap-2">
                    <input id="quick-num-${bottle.id}" type="number" value="0" min="0" step="0.5"
                           class="w-16 text-center border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl py-2">
                    <button onclick="quickFillBottle('${bottle.id}', true)" 
                            class="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl">Every Day</button>
                    <button onclick="quickFillBottle('${bottle.id}', false)" 
                            class="px-4 py-2 text-xs border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl">Every Other</button>
                </div>
            </td>`;

        DAYS.forEach(day => {
            const servings = window.weeklyPlan[day]?.[bottle.id] || 0;
            weeklyTotal += servings;

            rowHTML += `
                <td class="px-4 py-5 text-center">
                    <input type="number" value="${servings}" min="0" step="0.5"
                           class="w-16 text-center border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl py-2"
                           onchange="updatePlannerServings('${day}', '${bottle.id}', this.value)">
                </td>`;
        });

        rowHTML += `<td class="px-6 py-5 text-center font-semibold text-emerald-600">${weeklyTotal}</td></tr>`;
        tbody.innerHTML += rowHTML;
    });
}

function quickFillBottle(bottleId, everyDay) {
    const input = document.getElementById(`quick-num-${bottleId}`);
    let num = parseFloat(input ? input.value : 0) || 0;

    const everyOtherDays = ['monday', 'wednesday', 'friday', 'sunday'];

    DAYS.forEach(day => {
        if (!window.weeklyPlan[day]) window.weeklyPlan[day] = {};
        window.weeklyPlan[day][bottleId] = everyDay ? num : (everyOtherDays.includes(day) ? num : 0);
    });

    saveAllData();
    renderPlannerTable();
}

function updatePlannerServings(day, bottleId, value) {
    const num = parseFloat(value) || 0;
    if (!window.weeklyPlan[day]) window.weeklyPlan[day] = {};
    window.weeklyPlan[day][bottleId] = num;

    saveAllData();
    renderPlannerTable();
}

function resetAllServingsToZero() {
    if (confirm('Reset ALL servings to 0 for every bottle and every day?')) {
        DAYS.forEach(day => {
            window.weeklyPlan[day] = {};
        });
        saveAllData();
        renderPlannerTable();
        showToast('All servings reset to 0');
    }
}

function sortAndRenderPlanner() {
    renderPlannerTable(); // Re-render applies sort inside renderPlannerTable if needed
}

// Global exports
window.renderWeeklyPlanner = renderWeeklyPlanner;
window.quickFillBottle = quickFillBottle;
window.updatePlannerServings = updatePlannerServings;
window.resetAllServingsToZero = resetAllServingsToZero;