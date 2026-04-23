// overlaps.js - Overlaps & Safety Analysis

console.log('🔄 overlaps.js loaded');

if (!window.dailyServings) window.dailyServings = {}; // bottleId -> servings per day

// Main render function called by app.js switchTab(1)
function renderOverlapsTab() {
    const content = document.getElementById('overlaps-content');
    if (!content) return;

    let html = `
        <div class="mb-8">
            <h2 class="text-2xl font-semibold mb-2">Daily Overlap Analysis</h2>
            <p class="text-slate-500 dark:text-slate-400">Total daily intake vs Safety Limits • Adjust servings below</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Bottles with servings -->
            <div class="lg:col-span-5">
                <h3 class="font-medium mb-4 flex items-center gap-2">
                    <span>Your Bottles & Daily Servings</span>
                </h3>
                <div id="overlaps-bottles-list" class="space-y-4"></div>
            </div>

            <!-- Results -->
            <div class="lg:col-span-7">
                <h3 class="font-medium mb-4">Ingredient Analysis</h3>
                <div id="overlaps-results" class="space-y-3"></div>
            </div>
        </div>
    `;

    content.innerHTML = html;
    renderOverlapsBottles();
    renderOverlapResults();
}

function renderOverlapsBottles() {
    const container = document.getElementById('overlaps-bottles-list');
    if (!container) return;
    container.innerHTML = '';

    if (window.bottles.length === 0) {
        container.innerHTML = `<p class="text-slate-500">No bottles added yet. Go to the Bottles tab first.</p>`;
        return;
    }

    window.bottles.forEach(bottle => {
        const servings = window.dailyServings[bottle.id] || 1;

        const div = document.createElement('div');
        div.className = "bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700";
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="font-semibold">${bottle.name}</div>
                    <div class="text-sm text-slate-500 dark:text-slate-400">${bottle.ingredients ? bottle.ingredients.length : 0} ingredients</div>
                </div>
                <div class="flex items-center gap-3">
                    <input type="number" value="${servings}" min="0" step="0.5"
                           class="w-20 text-center border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-2xl px-4 py-2"
                           onchange="updateDailyServings('${bottle.id}', this.value)">
                    <span class="text-sm text-slate-500">servings/day</span>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function updateDailyServings(bottleId, value) {
    const num = parseFloat(value);
    window.dailyServings[bottleId] = isNaN(num) || num < 0 ? 0 : num;
    if (typeof saveAllData === 'function') saveAllData();
    renderOverlapResults(); // live update
}

function renderOverlapResults() {
    const container = document.getElementById('overlaps-results');
    if (!container) return;
    container.innerHTML = '';

    // Aggregate total daily intake per ingredient
    const totals = {};

    window.bottles.forEach(bottle => {
        const servings = window.dailyServings[bottle.id] || 1;
        if (!bottle.ingredients) return;

        bottle.ingredients.forEach(ing => {
            const key = ing.name.toLowerCase().trim();
            const dose = parseFloat(ing.dose) || 0;
            if (!dose) return;

            if (!totals[key]) {
                totals[key] = {
                    name: ing.name,
                    total: 0,
                    unit: ing.unit || 'mg',
                    count: 0
                };
            }
            totals[key].total += dose * servings;
            totals[key].count++;
        });
    });

    if (Object.keys(totals).length === 0) {
        container.innerHTML = `<p class="text-slate-500 p-8 text-center">Add ingredients to bottles to see overlap analysis.</p>`;
        return;
    }

    Object.values(totals).sort((a, b) => b.total - a.total).forEach(item => {
        const limitData = window.safetyLimits[item.name.toLowerCase()] || { limit: null, unit: item.unit };
        const limit = limitData.limit;
        const isOver = limit && item.total > limit;
        const isClose = limit && item.total > limit * 0.8 && !isOver;

        let statusHTML = '';
        if (isOver) {
            statusHTML = `<span class="inline-flex items-center px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-medium rounded-2xl">⚠️ OVER LIMIT</span>`;
        } else if (isClose) {
            statusHTML = `<span class="inline-flex items-center px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded-2xl">Approaching limit</span>`;
        } else if (limit) {
            statusHTML = `<span class="inline-flex items-center px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-2xl">Safe</span>`;
        }

        const div = document.createElement('div');
        div.className = `p-6 rounded-3xl border ${isOver ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950' : isClose ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`;
        div.innerHTML = `
            <div class="flex justify-between">
                <div class="font-medium">${item.name}</div>
                ${statusHTML}
            </div>
            <div class="mt-3 flex items-baseline gap-2">
                <span class="text-3xl font-semibold">${item.total.toFixed(1)}</span>
                <span class="text-slate-500">${item.unit}</span>
                ${limit ? `<span class="text-slate-400 mx-2">/</span><span class="text-slate-500">${limit} ${limitData.unit}</span>` : ''}
            </div>
            ${item.count > 1 ? `<div class="text-xs text-slate-500 mt-1">from ${item.count} ingredients</div>` : ''}
        `;
        container.appendChild(div);
    });
}

// Make functions available globally
window.renderOverlapsTab = renderOverlapsTab;
window.updateDailyServings = updateDailyServings;