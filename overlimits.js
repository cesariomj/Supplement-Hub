// overlimits.js - Enhanced with Per-User Acceptable Over % 

console.log('🚨 overlimits.js loaded');

if (!window.userSettings) window.userSettings = {};
if (!window.userSettings.Mark) window.userSettings.Mark = { acceptableOverPercent: 20 };
if (!window.userSettings.Lisa) window.userSettings.Lisa = { acceptableOverPercent: 15 };
if (!window.userSettings.Shared) window.userSettings.Shared = { acceptableOverPercent: 10 };

function renderOverLimitsTab() {
    const content = document.getElementById('overlimits-content') || document.getElementById('overlaps-content');
    if (!content) return;

    const currentUser = window.currentProfile || 'Shared';
    const acceptable = window.userSettings[currentUser]?.acceptableOverPercent || 20;

    let html = `
        <div class="mb-8">
            <h2 class="text-2xl font-semibold mb-2">Over Limits & Safety Alerts</h2>
            <p class="text-slate-500 dark:text-slate-400">
                Weekly intake vs Safety Limits • ${currentUser}
            </p>
            
            <!-- Acceptable Over Limit Setting -->
            <div class="mt-6 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center gap-6">
                <div class="font-medium">Acceptable Over Limit %</div>
                <input id="acceptable-over" type="number" value="${acceptable}" 
                       class="w-24 text-center border rounded-2xl px-4 py-3" 
                       onchange="updateAcceptableOverPercent(this.value)">
                <span class="text-slate-500">%</span>
                <button onclick="saveUserSettings()" 
                        class="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm">Save Setting</button>
            </div>
        </div>
        <div id="overlimits-results" class="space-y-10"></div>
    `;

    content.innerHTML = html;
    renderOverLimitsResults();
}

function updateAcceptableOverPercent(value) {
    const currentUser = window.currentProfile || 'Shared';
    if (!window.userSettings[currentUser]) window.userSettings[currentUser] = {};
    window.userSettings[currentUser].acceptableOverPercent = parseFloat(value) || 20;
}

function saveUserSettings() {
    saveAllData();
    showToast('Acceptable over limit % saved');
    renderOverLimitsResults(); // refresh alerts
}

function renderOverLimitsResults() {
    const container = document.getElementById('overlimits-results');
    if (!container) return;
    container.innerHTML = '';

    const filteredBottles = getUserFilteredBottles();
    const currentUser = window.currentProfile || 'Shared';
    const acceptableOver = window.userSettings[currentUser]?.acceptableOverPercent || 20;
    let hasAnyAlerts = false;

    const days = window.DAYS || ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const dayLabels = window.DAY_LABELS || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    days.forEach((day, i) => {
        const dayTotals = calculateDayTotalsForOverlimits(day, filteredBottles, acceptableOver);
        
        const alerts = Object.values(dayTotals)
            .filter(item => item.isOver || item.isClose)
            .sort((a, b) => (b.isOver - a.isOver) || (b.total - a.total));

        if (alerts.length === 0) return;

        hasAnyAlerts = true;

        let dayHTML = `
            <div class="mb-12">
                <div class="flex items-center gap-3 mb-6">
                    <span class="font-semibold text-xl">${dayLabels[i]}</span>
                    <span class="px-5 py-1.5 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-sm font-medium rounded-3xl">
                        ${alerts.length} alert${alerts.length > 1 ? 's' : ''}
                    </span>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">`;

        alerts.forEach(item => {
            const percentOver = item.limit ? Math.round(((item.total / item.limit) * 100) - 100) : 0;
            const statusClass = item.isOver ? 'border-red-500 bg-red-50 dark:bg-red-950' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';

            let breakdownHTML = '<div class="mt-4 text-sm space-y-2">';
            item.contributions.forEach(c => {
                breakdownHTML += `
                    <div class="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-2xl">
                        <span>${c.bottle}</span>
                        <span class="font-medium">${c.amount} ${item.unit}</span>
                    </div>`;
            });
            breakdownHTML += '</div>';

            dayHTML += `
                <div class="p-7 rounded-3xl border ${statusClass}">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-semibold text-lg">${item.name}</div>
                            ${item.isOver ? 
                                `<div class="text-red-600 font-medium">⚠️ ${percentOver}% OVER (allowed: ${acceptableOver}%)</div>` : 
                                `<div class="text-yellow-600 font-medium">Close to limit (+${percentOver}%)</div>`
                            }
                        </div>
                        <div class="text-right">
                            <span class="text-4xl font-bold ${item.isOver ? 'text-red-600' : 'text-yellow-600'}">
                                ${item.total.toFixed(1)}
                            </span>
                            <span class="text-base ml-1">${item.unit}</span>
                            ${item.limit ? `<div class="text-xs text-slate-500 mt-1">limit: ${item.limit} ${item.limitUnit}</div>` : ''}
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
                <p class="text-3xl mb-4">✅</p>
                <p class="text-xl font-medium">All ingredients are within acceptable limits.</p>
            </div>`;
    }
}

// Updated calculation with user-specific acceptable %
function calculateDayTotalsForOverlimits(day, bottles, acceptableOver = 20) {
    const totals = {};
    const dayPlan = window.weeklyPlan[day] || {};

    bottles.forEach(bottle => {
        const servings = dayPlan[bottle.id] || 0;
        if (servings === 0 || !bottle.ingredients) return;

        bottle.ingredients.forEach(ing => {
            const normName = normalizeName(ing.name);
            const dose = parseFloat(ing.dose) || 0;
            if (dose <= 0) return;

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
                    limit: limitData ? limitData.limit : null,
                    limitUnit: limitData ? limitData.unit : ing.unit,
                    isOver: false,
                    isClose: false,
                    contributions: []
                };
            }

            totals[normName].total += dose * servings;
            totals[normName].contributions.push({
                bottle: bottle.name,
                amount: (dose * servings).toFixed(2)
            });
        });
    });

    Object.values(totals).forEach(item => {
        if (item.limit && item.limit > 0) {
            const ratio = item.total / item.limit;
            const threshold = 1 + (acceptableOver / 100);
            
            item.isOver = ratio > threshold;
            item.isClose = !item.isOver && ratio > 0.9;   // Still show close if near limit
        }
    });

    return totals;
}

function normalizeName(name) {
    if (!name) return '';
    
    let normalized = String(name).trim();
    
    // If the name contains parentheses, use the full name as the key (don't strip)
    if (normalized.includes('(') && normalized.includes(')')) {
        return normalized.toLowerCase();
    }
    
    // For names without parentheses, do light cleaning
    return normalized
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/ extract| root| leaf| complex| powder| capsule/gi, '')
        .trim();
}

// Reuse helper from planner
function getUserFilteredBottles() {
    if (!window.currentProfile || window.currentProfile === "Shared") return window.bottles;
    return window.bottles.filter(b => {
        if (!b.users || !Array.isArray(b.users) || b.users.length === 0) return true;
        return b.users.includes(window.currentProfile);
    });
}

window.renderOverLimitsTab = renderOverLimitsTab;