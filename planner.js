// planner.js - Polished with Sort

console.log('📅 planner.js loaded');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function renderWeeklyPlanner() {
    const content = document.getElementById('planner-content');
    if (!content) return;

    let activeCount = 0;
    window.bottles.forEach(b => {
        if (DAYS.some(day => (window.weeklyPlan[day] || {})[b.id] > 0)) activeCount++;
    });

    let html = `
        <div class="mb-8 flex justify-between items-center">
            <div>
                <h2 class="text-2xl font-semibold">Weekly Planner</h2>
                <p class="text-slate-500 dark:text-slate-400">${activeCount} of ${window.bottles.length} bottles scheduled</p>
            </div>
            
            <div class="flex items-center gap-4">
                <select id="planner-sort" onchange="renderPlannerTable()" 
                        class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-3xl px-5 py-3 text-sm">
                    <option value="total-desc">Sort by Total (High to Low)</option>
                    <option value="name-asc">Sort by Bottle Name</option>
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
                        ${DAY_LABELS.map(d => `<th class="px-4 py-5 text-center">${d}</th>`).join('')}
                        <th class="px-6 py-5 text-center font-medium">Total</th>
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
        tbody.innerHTML = `<tr><td colspan="9" class="p-12 text-center text-slate-500">No bottles yet.</td></tr>`;
        return;
    }

    const sortMode = document.getElementById('planner-sort')?.value || 'total-desc';

    let sortedBottles = [...window.bottles];

    if (sortMode === 'total-desc') {
        sortedBottles.sort((a, b) => {
            let totalA = DAYS.reduce((sum, day) => sum + (window.weeklyPlan[day]?.[a.id] || 0), 0);
            let totalB = DAYS.reduce((sum, day) => sum + (window.weeklyPlan[day]?.[b.id] || 0), 0);
            return totalB - totalA;
        });
    } else {
        sortedBottles.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    sortedBottles.forEach(bottle => {
        let total = 0;
        let cells = DAYS.map(day => {
            const val = window.weeklyPlan[day]?.[bottle.id] || 0;
            total += val;
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
                        <button onclick="quickFillBottle('${bottle.id}', true)" class="px-4 text-xs bg-emerald-600 text-white rounded-2xl">Daily</button>
                        <button onclick="quickFillBottle('${bottle.id}', false)" class="px-4 text-xs border rounded-2xl">Every Other</button>
                    </div>
                </td>
                ${cells}
                <td class="px-6 py-5 text-center font-semibold text-emerald-600">${total}</td>
            </tr>`;
    });
}

// Quick Fill, Update, Reset functions (same as before)
function quickFillBottle(bottleId, everyDay) { /* ... your existing function ... */ }
function updatePlannerServings(day, bottleId, value) { /* ... */ }
function resetAllServingsToZero() { /* ... */ }

// Exports
window.renderWeeklyPlanner = renderWeeklyPlanner;
window.quickFillBottle = quickFillBottle;
window.updatePlannerServings = updatePlannerServings;
window.resetAllServingsToZero = resetAllServingsToZero;