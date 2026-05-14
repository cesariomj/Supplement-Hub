// app.js - FINAL CLEAN CORE

console.log('✅ app.js loaded - Stable Local');

// Firebase variables
// let isSyncingFromFirebase = false;

// ==================== GLOBAL DATA ====================
window.profiles = JSON.parse(localStorage.getItem('profiles') || '["General", "Mark", "Lisa"]');
window.currentProfile = localStorage.getItem('currentProfile') || "Mark";
window.dataNeedsRefresh = false;

window.DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
window.DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

window.bottles = JSON.parse(localStorage.getItem('bottles') || '[]');
window.safetyLimits = JSON.parse(localStorage.getItem('safetyLimits') || '{}');
window.vendors = JSON.parse(localStorage.getItem('vendors') || '["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"]');// ==================== CORE DATA FUNCTIONS ====================

// ==================== CORE DATA FUNCTIONS ====================
function saveAllData() {
    localStorage.setItem('bottles', JSON.stringify(window.bottles || []));
    localStorage.setItem('safetyLimits', JSON.stringify(window.safetyLimits || {}));
    localStorage.setItem('vendors', JSON.stringify(window.vendors || []));
    localStorage.setItem('profiles', JSON.stringify(window.profiles));
    localStorage.setItem('currentProfile', window.currentProfile);
}

function loadAllData() {
    console.log('📥 Loading all data...');
    window.bottles = JSON.parse(localStorage.getItem('bottles') || '[]');
    window.safetyLimits = JSON.parse(localStorage.getItem('safetyLimits') || '{}');
    window.vendors = JSON.parse(localStorage.getItem('vendors') || '["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"]');
    console.log(`✅ Loaded for profile: ${window.currentProfile}`);
}

function saveProfiles() {
    localStorage.setItem('profiles', JSON.stringify(window.profiles));
}

// ==================== RENDERING ====================
function renderAllTabs() {
    console.log('🔄 Rendering all tabs...');
    if (typeof window.renderBottlesTab === 'function') window.renderBottlesTab();
    if (typeof window.renderWeeklyPlanner === 'function') window.renderWeeklyPlanner();
    if (typeof window.renderOverLimitsTab === 'function') window.renderOverLimitsTab();
    if (typeof window.renderShoppingTab === 'function') window.renderShoppingTab();
}

function switchTab(tabIndex) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    const contents = document.querySelectorAll('.tab-content');
    if (contents[tabIndex]) contents[tabIndex].style.display = 'block';

    document.querySelectorAll('.tab-button').forEach((b, i) => b.classList.toggle('active', i === tabIndex));
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:16px 24px;border-radius:9999px;color:white;font-weight:500;z-index:9999;${type==='error'?'background:#ef4444':'background:#10b981'};`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}



// ==================== HEADER ====================
function renderHeaderControls() {
    const container = document.getElementById('header-controls');
    if (!container) return;

    const html = `
        <div class="flex items-center justify-between w-full">
            <!-- Left Side -->
            <div class="flex items-center gap-4">
                <span class="text-xl font-semibold">Supplement Hub</span>
                
                <select onchange="switchProfile(this.value)" 
                        class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-3xl px-5 py-3 font-medium">
                    ${window.profiles.map(p => `<option value="${p}" ${p === window.currentProfile ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
            </div>

            <!-- Right Side -->
            <div class="flex items-center gap-3">
                <button onclick="toggleTheme()" class="w-11 h-11 flex items-center justify-center text-2xl hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl">
                    <span id="theme-icon">☀️</span>
                </button>
                
                <button onclick="showSideMenu()" 
                        class="w-11 h-11 flex items-center justify-center text-3xl hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl">
                    ☰
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = isDark ? '🌙' : '☀️';
}

function applySavedTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
}

window.refreshAll = function() {
    saveAllData();
    renderAllTabs();
    showToast('✅ Refreshed');
};

// ==================== PROFILE SWITCHING ====================
window.switchProfile = function(newProfile) {
    if (newProfile === window.currentProfile) return;
    saveAllData();
    window.currentProfile = newProfile;
    localStorage.setItem('currentProfile', newProfile);
    loadAllData();
    renderAllTabs();
    showToast(`Switched to ${newProfile}`);
};

// ==================== EXPORT / IMPORT ====================
window.exportData = function() {
    const exportData = {
        bottles: window.bottles || [],
        safetyLimits: window.safetyLimits || {},
        vendors: window.vendors || [],
        profiles: window.profiles || [],
        currentProfile: window.currentProfile,
        weeklyPlan: window.weeklyPlan || {},           // ← Added
        shoppingLists: window.shoppingLists || {},     // ← Added
        timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Supplement-Hub-Backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('✅ Full backup exported (including Weekly Planner)');
};

window.importData = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const imported = JSON.parse(event.target.result);

                if (imported.bottles) window.bottles = imported.bottles;
                if (imported.safetyLimits) window.safetyLimits = imported.safetyLimits;
                if (imported.vendors) window.vendors = imported.vendors;
                if (imported.profiles) window.profiles = imported.profiles;
                if (imported.weeklyPlan) window.weeklyPlan = imported.weeklyPlan;     // ← Added
                if (imported.shoppingLists) window.shoppingLists = imported.shoppingLists;

                saveAllData();
                renderAllTabs();
                showToast(`✅ Imported backup successfully`);
            } catch (err) {
                console.error(err);
                showToast('❌ Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
};

window.showSideMenu = function() {
    const html = `
        <div class="bg-white dark:bg-slate-800 w-80 h-full fixed top-0 right-0 shadow-2xl p-6 flex flex-col z-50">
            <div class="flex justify-between items-center mb-8">
                <h2 class="text-2xl font-semibold">Menu</h2>
                <button onclick="hideModal('side-menu')" class="text-3xl">✕</button>
            </div>

            <div class="flex-1 space-y-2">
                <button onclick="manageUsers();hideModal('side-menu')" 
                        class="w-full text-left px-5 py-4 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl flex items-center gap-3">
                    👥 Manage Users
                </button>
                
                <button onclick="refreshAll();hideModal('side-menu')" 
                        class="w-full text-left px-5 py-4 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl flex items-center gap-3">
                    🔄 Refresh All
                </button>

                <button onclick="exportData();hideModal('side-menu')" 
                        class="w-full text-left px-5 py-4 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl flex items-center gap-3">
                    ⬇️ Export Backup
                </button>

                <button onclick="importData();hideModal('side-menu')" 
                        class="w-full text-left px-5 py-4 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl flex items-center gap-3">
                    ⬆️ Import Backup
                </button>
            </div>

            <div class="pt-6 border-t">
                ${currentUser ? `
                    <button onclick="signOut();hideModal('side-menu')" 
                            class="w-full py-4 text-red-600 hover:bg-red-50 rounded-2xl">
                        Sign Out
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    createModal('side-menu', html);
};

// ==================== INIT ====================
window.onload = () => {
    console.log('🚀 Supplement Hub ready');
    applySavedTheme();
    loadAllData();
    renderHeaderControls();
    renderAllTabs();
    switchTab(0);
};

// ==================== GLOBAL EXPORTS ====================
window.switchTab = switchTab;
window.saveAllData = saveAllData;
window.loadAllData = loadAllData;
window.renderAllTabs = renderAllTabs;
window.showToast = showToast;
window.renderHeaderControls = renderHeaderControls;
window.refreshAll = refreshAll;
window.exportData = exportData;
window.importData = importData;
window.manageSafetyLimits = manageSafetyLimits;
window.manageVendors = manageVendors;
window.switchProfile = switchProfile;
window.saveProfiles = saveProfiles;

console.log('✅ app.js - FINAL CLEAN VERSION');