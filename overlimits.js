// overlimits.js - Clean & Polished Final Version

console.log('🚨 overlimits.js loaded');

function renderOverLimitsTab() {
    const content = document.getElementById('overlimits-content');
    if (!content) return;

    let html = `
        <div class="mb-8">
            <h2 class="text-2xl font-semibold mb-2">Over Limits & Safety Alerts</h2>
            <p class="text-slate-500 dark:text-slate-400">Based on this week's planner • ${window.currentProfile}</p>
        </div>
        <div id="overlimits-results" class="space-y-12"></div>
    `;

    content.innerHTML = html;
    renderOverLimitsResults();
}

function renderOverLimitsResults() {
    const container = document.getElementById('overlimits-results');
    if (!container) return;
    container.innerHTML = '';

    const days = window.DAYS || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels = window.DAY_LABELS || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    let hasAnyAlerts = false;

    days.forEach((day, i) => {
        const dayTotals = calculateDayTotalsForOverlimits(day);
        
        const alerts = Object.values(dayTotals)
            .filter(item => item.isOver || item.isClose)
            .sort((a, b) => (b.isOver ? 1 : 0) - (a.isOver ? 1 : 0) || b.total - a.total);

        if (alerts.length === 0) return;

        hasAnyAlerts = true;

        let dayHTML = `
            <div class="mb-12">
                <div class="flex items-center gap-3 mb-6">
                    <span class="font-semibold text-xl">${dayLabels[i]}</span>
                    <span class="px-5 py-1.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm font-medium rounded-3xl">
                        ${alerts.length} alert${alerts.length > 1 ? 's' : ''}
                    </span>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">`;

        alerts.forEach(item => {
            const statusClass = item.isOver 
                ? 'border-red-500 bg-red-50 dark:bg-red-950/50' 
                : 'border-amber-500 bg-amber-50 dark:bg-amber-950/50';

            let breakdownHTML = '<div class="mt-5 space-y-3">';
            item.contributions.forEach(c => {
                breakdownHTML += `
                    <div class="flex justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl text-sm">
                        <span>${c.bottle}</span>
                        <span class="font-medium">${c.amount} ${item.unit}</span>
                    </div>`;
            });
            breakdownHTML += '</div>';

            dayHTML += `
                <div class="p-7 rounded-3xl border ${statusClass}">
                    <div class="flex justify-between items-start mb-4">
                        <div class="font-semibold text-lg">${item.name}</div>
                        <div class="text-right">
                            <span class="text-4xl font-bold ${item.isOver ? 'text-red-600' : 'text-amber-600'}">
                                ${item.total.toFixed(1)}
                            </span>
                            <span class="text-base ml-1">${item.unit}</span>
                            ${item.limit ? `<div class="text-xs text-slate-500">limit: ${item.limit} ${item.limitUnit}</div>` : ''}
                        </div>
                    </div>
                    ${breakdownHTML}
                </div>`;
        });

        dayHTML += `</div></div>`;
        container.innerHTML += dayHTML;
    });

    if (!hasAnyAlerts) {
        container.innerHTML = `
            <div class="bg-white dark:bg-slate-800 p-16 rounded-3xl text-center">
                <p class="text-6xl mb-6">✅</p>
                <p class="text-xl font-medium">All ingredients are within safe limits this week.</p>
            </div>`;
    }
}

function calculateDayTotalsForOverlimits(day) {
    const totals = {};
    const dayPlan = window.weeklyPlan[day] || {};

    window.bottles.forEach(bottle => {
        const servings = dayPlan[bottle.id] || 0;
        if (servings <= 0 || !bottle.ingredients) return;

        bottle.ingredients.forEach(ing => {
            const normName = normalizeName(ing.name);
            const dose = parseFloat(ing.dose) || 0;
            if (dose <= 0) return;

            // Find matching safety limit
            let limitData = null;
            for (let key in window.safetyLimits) {
                if (normalizeName(key) === normName) {
                    limitData = window.safetyLimits[key];
                    break;
                }
            }

            if (!totals[normName]) {
                totals[normName] = {
                    name: ing.name,
                    total: 0,
                    unit: ing.unit || 'mg',
                    limit: limitData ? parseFloat(limitData.limit) || 0 : 0,
                    limitUnit: limitData ? limitData.unit : ing.unit,
                    isOver: false,
                    isClose: false,
                    contributions: []
                };
            }

            const amountThisBottle = dose * servings;
            totals[normName].total += amountThisBottle;
            totals[normName].contributions.push({
                bottle: bottle.name,
                amount: amountThisBottle.toFixed(1)
            });
        });
    });

    // Mark over/close
    Object.values(totals).forEach(item => {
        if (item.limit > 0) {
            item.isOver = item.total > item.limit;
            item.isClose = !item.isOver && item.total > item.limit * 0.8;
        }
    });

    return totals;
}

function normalizeName(name) {
    return name.toLowerCase()
               .trim()
               .replace(/\s+/g, ' ')
               .replace(/ \(.*?\)/g, '')
               .replace(/ extract| root| leaf| complex/gi, '');
}

// Export
window.renderOverLimitsTab = renderOverLimitsTab;