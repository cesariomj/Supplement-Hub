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

window.overlimitTolerance = parseFloat(localStorage.getItem('overlimitTolerance')) || 0; // percentage

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

    let userSection = currentUser ? `
        <div class="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-3xl text-sm">
            <span class="text-emerald-600">👤</span>
            <span>${currentUser.displayName || currentUser.email}</span>
            <button onclick="signOut()" class="ml-3 text-red-500 hover:text-red-600 text-xs">Sign Out</button>
        </div>
    ` : '';

    const html = `
        <div class="flex items-center gap-4 flex-wrap">
            <!-- Profile Selector -->
            <select id="profile-select" onchange="switchProfile(this.value)" 
                    class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-3xl px-5 py-3 font-medium">
                ${window.profiles.map(p => `<option value="${p}" ${p === window.currentProfile ? 'selected' : ''}>${p}</option>`).join('')}
            </select>

            <!-- Theme Toggle -->
            <button onclick="toggleTheme()" 
                    class="w-11 h-11 flex items-center justify-center text-2xl hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl">
                <span id="theme-icon">☀️</span>
            </button>

            <!-- User Info -->
            ${userSection}

            <!-- Hamburger Menu -->
            <button onclick="showSideMenu()" 
                    class="w-11 h-11 flex items-center justify-center text-3xl hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl">
                ☰
            </button>
        </div>
    `;

    container.innerHTML = html;
}

// ====================== SIDE MENU - Global Actions (Slides from Right) ======================
window.showSideMenu = function() {
    hideSideMenu(); // clear any old one

    const html = `
        <div id="side-menu" class="fixed inset-0 bg-black/50 z-[100] flex justify-end" onclick="if(event.target.id === 'side-menu') hideSideMenu()">
            <div class="w-80 bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto translate-x-full transition-transform duration-300" 
                 id="side-menu-panel"
                 onclick="event.stopImmediatePropagation()">
                
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-2xl font-semibold">Supplement Hub</h2>
                    <button onclick="hideSideMenu()" class="text-4xl leading-none text-slate-400 hover:text-slate-600">×</button>
                </div>

                <div class="space-y-1">
                    <button onclick="refreshAll();hideSideMenu()" 
                            class="w-full text-left px-5 py-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl flex items-center gap-3 text-lg">
                        🔄 Refresh All Data
                    </button>
                    
                    <button onclick="exportData();hideSideMenu()" 
                            class="w-full text-left px-5 py-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl flex items-center gap-3 text-lg">
                        ⬇️ Export Backup
                    </button>
                    
                    <button onclick="importData();hideSideMenu()" 
                            class="w-full text-left px-5 py-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl flex items-center gap-3 text-lg">
                        ⬆️ Import Backup
                    </button>
                    
                    <button onclick="manualInstallPrompt();hideSideMenu()" 
                            class="w-full text-left px-5 py-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl flex items-center gap-3 text-lg">
                        📲 Install App
                    </button>
                </div>

                <div class="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                    Tap outside this menu to close
                </div>
            </div>
        </div>
    `;

    const menu = document.createElement('div');
    menu.innerHTML = html;
    document.body.appendChild(menu);

    // Slide in animation
    setTimeout(() => {
        document.getElementById('side-menu-panel').classList.remove('translate-x-full');
    }, 10);
};

window.hideSideMenu = function() {
    const panel = document.getElementById('side-menu-panel');
    if (panel) {
        panel.classList.add('translate-x-full');
        setTimeout(() => {
            const menu = document.getElementById('side-menu');
            if (menu) menu.remove();
        }, 300);
    }
};

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

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📲 Install prompt available');
    deferredPrompt = e;
    showInstallButton();
});

function showInstallButton() {
    const container = document.getElementById('header-controls');
    if (!container) return;

    const installBtn = document.createElement('button');
    installBtn.id = 'install-button';
    installBtn.innerHTML = '📲 Install App';
    installBtn.className = "px-5 py-3 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl text-sm font-medium";
    installBtn.onclick = installApp;
    
    container.appendChild(installBtn);
}

window.installApp = function() {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('✅ User accepted install');
        }
        deferredPrompt = null;
        const btn = document.getElementById('install-button');
        if (btn) btn.remove();
    });
};

window.manualInstallPrompt = function() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
    } else {
        showToast("To install: Use Chrome menu → 'Install Supplement Hub'", "success");
    }
};

// Temporary debug for Install Prompt
console.log('PWA Install Status Check:');
console.log('- Service Worker registered:', 'serviceWorker' in navigator);
console.log('- Manifest present:', document.querySelector('link[rel="manifest"]') !== null);

// ====================== PWA INSTALL PROMPT ======================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📲 Install prompt is available');
    deferredPrompt = e;
});

window.manualInstallPrompt = function() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choice) => {
            console.log('User choice:', choice.outcome);
            deferredPrompt = null;
        });
    } else {
        showToast("To install this app:\n1. Click the menu (⋮) in Chrome\n2. Select 'Install Supplement Hub'", "success");
    }
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

// ====================== GLOBAL EXPORTS (Fix for missing functions) ======================
window.switchTab = switchTab;
window.saveAllData = saveAllData;
window.loadAllData = loadAllData;
window.showToast = showToast;
window.renderHeaderControls = renderHeaderControls;
window.refreshAll = refreshAll;
window.toggleTheme = toggleTheme;
window.applySavedTheme = applySavedTheme;
window.switchProfile = switchProfile;
window.exportData = exportData;
window.importData = importData;
window.signOut = signOut;
window.signInWithGoogle = signInWithGoogle;
window.manualInstallPrompt = manualInstallPrompt;
window.showSideMenu = showSideMenu;
window.hideSideMenu = hideSideMenu;

// Tab renderers
// ====================== FINAL GLOBAL EXPORTS (Make sure these exist) ======================
window.renderBottlesTab = typeof renderBottlesTab === 'function' ? renderBottlesTab : function(){};
window.renderWeeklyPlanner = typeof renderWeeklyPlanner === 'function' ? renderWeeklyPlanner : function(){};
window.renderOverLimitsTab = typeof renderOverLimitsTab === 'function' ? renderOverLimitsTab : function(){};
window.renderShoppingTab = typeof renderShoppingTab === 'function' ? renderShoppingTab : function(){};

window.manageSafetyLimits = typeof manageSafetyLimits === 'function' ? manageSafetyLimits : function(){ showToast("Safety Limits module"); };
window.manageVendors = typeof manageVendors === 'function' ? manageVendors : function(){ showToast("Vendors module"); };
window.manageUsers = typeof manageUsers === 'function' ? manageUsers : function() { showToast("Manage Users coming soon"); };

console.log('✅ app.js - FINAL CLEAN VERSION');