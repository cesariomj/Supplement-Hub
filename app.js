// app.js - Stable Local Version with Multi-Profile Support

console.log('✅ app.js loaded - Stable Local');

// Multi-profile support
window.profiles = ["Mark", "Lisa"];

// Global constants
window.DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
window.DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
window.currentProfile = localStorage.getItem('currentProfile') || "Mark";

window.bottles = JSON.parse(localStorage.getItem('bottles') || '[]');
window.weeklyPlan = {};
window.safetyLimits = JSON.parse(localStorage.getItem('safetyLimits') || '{}');
window.vendors = JSON.parse(localStorage.getItem('vendors') || '["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"]');
window.shoppingLists = JSON.parse(localStorage.getItem('shoppingLists') || '{}');
window.currentShoppingListName = localStorage.getItem('currentShoppingListName') || "Monthly";

// Unit normalization helper
function normalizeDose(dose, unit) {
    dose = parseFloat(dose) || 0;
    if (!unit) return { value: dose, unit: 'mg' };

    switch (unit.toLowerCase()) {
        case 'g':
        case 'gram':
            return { value: dose * 1000, unit: 'mg' };
        case 'mcg':
        case 'µg':
            return { value: dose / 1000, unit: 'mg' };
        case 'iu':
            // For Vitamin D etc., rough conversion (not perfect, but better than nothing)
            return { value: dose, unit: 'IU' }; // keep as-is for now
        default:
            return { value: dose, unit: unit };
    }
}

function loadProfileData() {
    window.weeklyPlan = JSON.parse(localStorage.getItem(`weeklyPlan_${window.currentProfile}`) || '{}');
}

function saveProfileData() {
    localStorage.setItem(`weeklyPlan_${window.currentProfile}`, JSON.stringify(window.weeklyPlan || {}));
}

function loadAllData() {
    console.log('📥 Loading all data...');
    window.bottles = JSON.parse(localStorage.getItem('bottles') || '[]');
    window.safetyLimits = JSON.parse(localStorage.getItem('safetyLimits') || '{}');
    window.vendors = JSON.parse(localStorage.getItem('vendors') || '["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"]');
    window.shoppingLists = JSON.parse(localStorage.getItem('shoppingLists') || '{}');
    window.currentShoppingListName = localStorage.getItem('currentShoppingListName') || "Monthly";

    loadProfileData();
    console.log(`✅ Loaded for profile: ${window.currentProfile}`);
    renderAllTabs();
}

function saveAllData() {
    localStorage.setItem('bottles', JSON.stringify(window.bottles || []));
    localStorage.setItem('safetyLimits', JSON.stringify(window.safetyLimits || {}));
    localStorage.setItem('vendors', JSON.stringify(window.vendors || []));
    localStorage.setItem('shoppingLists', JSON.stringify(window.shoppingLists || {}));
    localStorage.setItem('currentShoppingListName', window.currentShoppingListName || "Monthly");
    saveProfileData();
    console.log(`💾 Saved for profile: ${window.currentProfile}`);
}

function renderAllTabs() {
    console.log('🔄 Rendering all tabs...');
    if (typeof renderBottlesTab === 'function') renderBottlesTab();
    if (typeof renderWeeklyPlanner === 'function') renderWeeklyPlanner();
    if (typeof renderOverLimitsTab === 'function') renderOverLimitsTab();
    if (typeof renderShoppingTab === 'function') renderShoppingTab();
}

function switchTab(tabIndex) {
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
    });

    const contents = document.querySelectorAll('.tab-content');
    if (contents[tabIndex]) {
        contents[tabIndex].classList.add('active');
        contents[tabIndex].style.display = 'block';
    }

    document.querySelectorAll('.tab-button').forEach((b, i) => {
        b.classList.toggle('active', i === tabIndex);
    });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:16px 24px;border-radius:9999px;color:white;font-weight:500;z-index:9999;${type==='error'?'background:#ef4444':'background:#10b981'};`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function renderHeaderControls() {
    const container = document.getElementById('header-controls');
    if (!container) return;

    let html = `<select id="profile-select" onchange="switchProfile(this.value)" class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-3xl px-5 py-3 font-medium">`;
    window.profiles.forEach(p => {
        html += `<option value="${p}" ${p === window.currentProfile ? 'selected' : ''}>${p}</option>`;
    });
    html += `</select>`;

    html += `
        <button onclick="toggleTheme()" class="w-11 h-11 flex items-center justify-center text-2xl hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all">
            <span id="theme-icon">☀️</span>
        </button>
        <button onclick="exportData()" class="px-5 py-3 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl text-sm font-medium">Export</button>
        <button onclick="importData()" class="px-5 py-3 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl text-sm font-medium">Import</button>
    `;

    html += `
        <button onclick="refreshAll()" 
                class="w-11 h-11 flex items-center justify-center text-2xl hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all" 
                title="Refresh all tabs">
            🔄
        </button>
    `;
    container.innerHTML = html;
}

window.switchProfile = function(newProfile) {
    if (newProfile === window.currentProfile) return;
    saveAllData();
    window.currentProfile = newProfile;
    localStorage.setItem('currentProfile', newProfile);
    loadProfileData();
    renderAllTabs();
    showToast(`Switched to ${newProfile}'s data`);
};

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = isDark ? '🌙' : '☀️';
}

function applySavedTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.classList.add('dark');
        const icon = document.getElementById('theme-icon');
        if (icon) icon.textContent = '🌙';
    }
}

// Import / Export (basic)
window.exportData = function() {
    const data = {
        bottles: window.bottles || [],
        safetyLimits: window.safetyLimits || {},
        vendors: window.vendors || [],
        shoppingLists: window.shoppingLists || {},
        currentShoppingListName: window.currentShoppingListName || "Monthly",
        weeklyPlan: { [window.currentProfile]: window.weeklyPlan }, // export only current profile for now
        exportDate: new Date().toISOString(),
        profile: window.currentProfile
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplement-hub-backup-${window.currentProfile}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ Data exported');
};

window.importData = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (imported.bottles) window.bottles = imported.bottles;
                if (imported.safetyLimits) window.safetyLimits = imported.safetyLimits;
                if (imported.vendors) window.vendors = imported.vendors;
                if (imported.shoppingLists) window.shoppingLists = imported.shoppingLists;
                if (imported.currentShoppingListName) window.currentShoppingListName = imported.currentShoppingListName;

                // Import weekly plan for the current profile (or the one in backup)
                if (imported.weeklyPlan) {
                    const profileKey = imported.profile || window.currentProfile;
                    window.weeklyPlan = imported.weeklyPlan[profileKey] || imported.weeklyPlan || {};
                }

                saveAllData();
                renderAllTabs();
                showToast(`✅ Imported for ${window.currentProfile}`);
            } catch (err) {
                showToast('❌ Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

// Init
window.onload = () => {
    console.log('🚀 Supplement Hub ready (local mode)');
    applySavedTheme();
    loadAllData();
    renderHeaderControls();
    switchTab(0);
};

window.refreshAll = function() {
    saveAllData();           // ensure latest data is saved
    renderAllTabs();         // re-render everything
    showToast('✅ Refreshed all tabs');
};

// Global exports
window.switchTab = switchTab;
window.saveAllData = saveAllData;
window.loadAllData = loadAllData;
window.showToast = showToast;
window.renderHeaderControls = renderHeaderControls;