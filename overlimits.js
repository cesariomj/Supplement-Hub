// overlimits.js - CLEAN & FINAL (No duplicates)

console.log('🚨 overlimits.js - CLEAN FINAL v20250512');

let overLimitsFilter = 'all';

function renderOverLimitsTab() {
    const content = document.getElementById('overlimits-content') || document.getElementById('overlaps-content');
    if (!content) return;

    content.innerHTML = `
        <div class="mb-8">
            <h2 class="text-2xl font-semibold mb-2">Over Limits & Safety Alerts</h2>
            <p class="text-slate-500 dark:text-slate-400">Based on this week's planner • ${window.currentProfile || 'Mark'}</p>
            
            <div class="flex gap-3 mt-6 mb-8" id="overlimits-filters">
                <button onclick="setOverLimitsFilter('all')" id="filter-all" class="px-6 py-3 rounded-3xl font-medium bg-emerald-600 text-white">All</button>
                <button onclick="setOverLimitsFilter('over')" id="filter-over" class="px-6 py-3 rounded-3xl font-medium">Over Limit</button>
                <button onclick="setOverLimitsFilter('close')" id="filter-close" class="px-6 py-3 rounded-3xl font-medium">Close to Limit</button>
            </div>
        </div>
        <div id="overlimits-results" class="space-y-8"></div>
    `;

    renderOverLimitsResults();
}

function setOverLimitsFilter(mode) {
    overLimitsFilter = mode;
    updateFilterButtons();
    renderOverLimitsResults();
}

function updateFilterButtons() {
    ['all', 'over', 'close'].forEach(mode => {
        const btn = document.getElementById(`filter-${mode}`);
        if (btn) {
            if (mode === overLimitsFilter) {
                btn.classList.add('bg-emerald-600', 'text-white');
                btn.classList.remove('bg-transparent', 'text-slate-700', 'dark:text-slate-300');
            } else {
                btn.classList.remove('bg-emerald-600', 'text-white');
                btn.classList.add('bg-transparent', 'text-slate-700', 'dark:text-slate-300');
            }
        }
    });
}

function renderOverLimitsResults() {
    const container = document.getElementById('overlimits-results');
    if (!container) return;

    const data = calculateDayTotalsForOverlimits();

    if (Object.keys(data).length === 0) {
        container.innerHTML = `<div class="text-center py-20 text-slate-500">No ingredients in this week's planner.</div>`;
        return;
    }

    let html = '';

    Object.values(data).forEach(item => {
        const percent = item.limit > 0 ? Math.round((item.total / item.limit) * 100) : 0;
        
        let statusClass = 'border-emerald-200';
        let statusLabel = 'Within Limit';
        if (item.limit === 0 || item.total > item.limit) {
            statusClass = 'border-red-500 bg-red-50 dark:bg-red-950/30';
            statusLabel = 'OVER LIMIT';
        } else if (percent > 80) {
            statusClass = 'border-amber-500 bg-amber-50 dark:bg-amber-950/30';
            statusLabel = 'Close to Limit';
        }

        // Filter
        if (overLimitsFilter === 'over' && statusLabel !== 'OVER LIMIT') return;
        if (overLimitsFilter === 'close' && statusLabel !== 'Close to Limit') return;

        html += `
            <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border ${statusClass}">
                <div class="flex justify-between items-start mb-4">
                    <div class="font-semibold text-lg">${item.name}</div>
                    <div class="text-right">
                        <div class="font-medium">${item.total.toFixed(1)} ${item.unit} weekly</div>
                        ${item.limit ? `<div class="text-xs text-slate-500">Limit: ${item.limit} ${item.unit}</div>` : ''}
                    </div>
                </div>

                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b dark:border-slate-700">
                            <th class="py-2 text-left font-medium">Bottle</th>
                            ${window.DAY_LABELS.map(d => `<th class="text-center py-2 font-medium">${d}</th>`).join('')}
                            <th class="text-right py-2 font-medium">WT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(item.byBottle).map(([bottleName, dailyAmounts]) => `
                            <tr class="border-b dark:border-slate-700 last:border-0">
                                <td class="py-2 font-medium">${bottleName}</td>
                                ${dailyAmounts.map(amount => `
                                    <td class="text-center py-2 ${amount > 0 ? 'font-medium' : 'text-slate-400'}">
                                        ${amount > 0 ? amount.toFixed(1) : '-'}
                                    </td>
                                `).join('')}
                                <td class="text-right py-2 font-semibold">
                                    ${dailyAmounts.reduce((a, b) => a + b, 0).toFixed(1)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    });

    container.innerHTML = html || `<div class="text-center py-12 text-slate-500">No items match the selected filter.</div>`;
}

function calculateDayTotalsForOverlimits() {
    console.log('📊 Starting calculation...');

    // Safety guard
    if (!window.DAYS || !Array.isArray(window.DAYS)) {
        console.warn('⚠️ window.DAYS not ready yet');
        return {};
    }

    const totals = {};

    window.DAYS.forEach((day, dayIndex) => {
        const dayPlan = window.weeklyPlan?.[day];
        if (!dayPlan) return;

        Object.entries(dayPlan).forEach(([bottleId, servingsRaw]) => {
            const servings = parseFloat(servingsRaw) || 0;
            if (servings <= 0) return;

            const bottle = window.bottles.find(b => b.id === bottleId);
            if (!bottle?.ingredients?.length) return;

            bottle.ingredients.forEach(ing => {
                if (!ing?.name) return;

                const norm = normalizeName(ing.name);
                const dose = parseFloat(ing.dose) || 0;
                const unit = ing.unit || 'mg';
                const amount = dose * servings;

                if (!totals[norm]) {
                    totals[norm] = {
                        name: ing.name,
                        unit: unit,
                        limit: null,
                        byBottle: {},
                        total: 0
                    };
                }

                const item = totals[norm];
                item.total += amount;

                if (!item.byBottle[bottle.name]) {
                    item.byBottle[bottle.name] = Array(7).fill(0);
                }
                item.byBottle[bottle.name][dayIndex] += amount;
            });
        });
    });

    // Attach safety limits
    Object.keys(window.safetyLimits || {}).forEach(key => {
        const norm = normalizeName(key);
        if (totals[norm]) {
            totals[norm].limit = parseFloat(window.safetyLimits[key].limit) || 0;
        }
    });

    console.log('📊 Final totals for', Object.keys(totals).length, 'ingredients');
    return totals;
}

function normalizeName(name) {
    return String(name).toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/\s+/g, '');
}

function normalizeName(name) {
    return name.toLowerCase().trim()
        .replace(/[^a-z0-9]/g, '')
        .replace(/\s+/g, '');
};

// Global exports
window.renderOverLimitsTab = renderOverLimitsTab;
window.setOverLimitsFilter = setOverLimitsFilter;

console.log('🚨 overlimits.js - CLEAN FINAL LOADED SUCCESSFULLY');