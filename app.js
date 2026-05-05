// app.js - Stable Local Version with Dynamic User Management

console.log('✅ app.js loaded - Stable Local');

// ==================== DYNAMIC USER MANAGEMENT ====================
window.profiles = JSON.parse(localStorage.getItem('profiles') || '["General", "Mark", "Lisa"]');
window.currentProfile = localStorage.getItem('currentProfile') || "Mark";
window.dataNeedsRefresh = false;

// Global constants
window.DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
window.DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

window.bottles = JSON.parse(localStorage.getItem('bottles') || '[]');
window.weeklyPlan = {};
window.safetyLimits = JSON.parse(localStorage.getItem('safetyLimits') || '{}');
window.vendors = JSON.parse(localStorage.getItem('vendors') || '["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"]');

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
            return { value: dose, unit: 'IU' };
        default:
            return { value: dose, unit: unit };
    }
}

function saveProfiles() {
    localStorage.setItem('profiles', JSON.stringify(window.profiles));
}

function loadProfileData() {
    window.weeklyPlan = JSON.parse(localStorage.getItem(`weeklyPlan_${window.currentProfile}`) || '{}');
}

function saveProfileData() {
    localStorage.setItem(`weeklyPlan_${window.currentProfile}`, JSON.stringify(window.weeklyPlan || {}));
}

function loadProfileShoppingData() {
    const key = `shoppingLists_${window.currentProfile}`;
    window.shoppingLists = JSON.parse(localStorage.getItem(key) || '{}');
    window.currentShoppingListName = localStorage.getItem(`currentShoppingListName_${window.currentProfile}`) || "Monthly";
}

function saveProfileShoppingData() {
    const key = `shoppingLists_${window.currentProfile}`;
    localStorage.setItem(key, JSON.stringify(window.shoppingLists || {}));
    localStorage.setItem(`currentShoppingListName_${window.currentProfile}`, window.currentShoppingListName || "Monthly");
}

function loadAllData() {
    console.log('📥 Loading all data...');
    window.bottles = JSON.parse(localStorage.getItem('bottles') || '[]');
    window.safetyLimits = JSON.parse(localStorage.getItem('safetyLimits') || '{}');
    window.vendors = JSON.parse(localStorage.getItem('vendors') || '["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"]');

    loadProfileData();
    loadProfileShoppingData();

    console.log(`✅ Loaded for profile: ${window.currentProfile}`);
    renderAllTabs();
}

function saveAllData() {
    localStorage.setItem('bottles', JSON.stringify(window.bottles || []));
    localStorage.setItem('safetyLimits', JSON.stringify(window.safetyLimits || {}));
    localStorage.setItem('vendors', JSON.stringify(window.vendors || []));

    saveProfileData();
    saveProfileShoppingData();

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

        if (tabIndex === 2 && window.dataNeedsRefresh) {
            if (typeof renderOverLimitsTab === 'function') renderOverLimitsTab();
            window.dataNeedsRefresh = false;
        }
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

    let html = `
        <select id="profile-select" onchange="switchProfile(this.value)" 
                class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-3xl px-5 py-3 font-medium">
    `;

    window.profiles.forEach(p => {
        html += `<option value="${p}" ${p === window.currentProfile ? 'selected' : ''}>${p}</option>`;
    });
    html += `</select>`;

    html += `
        <button onclick="manageUsers()" 
                class="px-4 py-3 text-sm border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-3xl">
            👥 Users
        </button>
        
        <button onclick="refreshAll()" 
                class="w-11 h-11 flex items-center justify-center text-2xl hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all" 
                title="Refresh all tabs">🔄</button>
        
        <button onclick="toggleTheme()" class="w-11 h-11 flex items-center justify-center text-2xl hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all">
            <span id="theme-icon">☀️</span>
        </button>
        
        <button onclick="exportData()" class="px-5 py-3 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl text-sm font-medium">Export</button>
        <button onclick="importData()" class="px-5 py-3 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl text-sm font-medium">Import</button>
    `;

    container.innerHTML = html;
}

// ==================== USER MANAGEMENT ====================
window.manageUsers = function() {
    const usersHTML = window.profiles.map(user => `
        <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl">
            <span class="font-medium">${user}</span>
            ${user !== "General" ? `
                <button onclick="deleteUser('${user}')" 
                        class="text-red-500 hover:text-red-600 px-4 py-2">Remove</button>
            ` : '<span class="text-emerald-600 text-sm">Shared Profile</span>'}
        </div>
    `).join('');

    const html = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md">
            <h3 class="text-2xl font-semibold mb-6">Manage Users</h3>
            
            <div class="mb-6">
                <input id="new-user-name" type="text" placeholder="New user name (e.g. Sarah)" 
                       class="w-full border rounded-2xl px-5 py-4 mb-3">
                <button onclick="addNewUser()" 
                        class="w-full py-4 bg-emerald-600 text-white rounded-3xl font-medium">
                    + Add User
                </button>
            </div>

            <div class="space-y-3 max-h-96 overflow-y-auto">
                ${usersHTML}
            </div>

            <button onclick="hideModal('users-modal')" 
                    class="w-full mt-8 py-4 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-3xl">
                Close
            </button>
        </div>
    `;

    createModal('users-modal', html);
};

window.addNewUser = function() {
    const name = document.getElementById('new-user-name').value.trim();
    if (!name) return showToast("Please enter a name", "error");
    if (window.profiles.includes(name)) return showToast("User already exists", "error");

    window.profiles.push(name);
    saveProfiles();
    hideModal('users-modal');
    renderHeaderControls();
    showToast(`Added user: ${name}`);
};

window.deleteUser = function(user) {
    if (confirm(`Delete user "${user}" and all their data? This cannot be undone.`)) {
        localStorage.removeItem(`weeklyPlan_${user}`);
        localStorage.removeItem(`shoppingLists_${user}`);
        localStorage.removeItem(`currentShoppingListName_${user}`);

        window.profiles = window.profiles.filter(p => p !== user);
        saveProfiles();

        if (window.currentProfile === user) {
            window.currentProfile = "General";
            localStorage.setItem('currentProfile', "General");
        }

        hideModal('users-modal');
        renderHeaderControls();
        loadAllData();
        showToast(`Deleted user: ${user}`);
    }
};

function saveProfiles() {
    localStorage.setItem('profiles', JSON.stringify(window.profiles));
}

// ==================== SWITCH PROFILE ====================
window.switchProfile = function(newProfile) {
    if (newProfile === window.currentProfile) return;
    saveAllData();
    window.currentProfile = newProfile;
    localStorage.setItem('currentProfile', newProfile);
    
    loadProfileData();
    loadProfileShoppingData();
    renderAllTabs();
    showToast(`Switched to ${newProfile}'s data`);
};

// Rest of your functions (toggleTheme, applySavedTheme, export, import, refreshAll, etc.)
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

window.refreshAll = function() {
    saveAllData();
    renderAllTabs();
    showToast('✅ Refreshed all tabs');
};

window.exportData = function() { /* your existing export */ };
window.importData = function() { /* your existing import */ };

// ==================== EXPORT & IMPORT ====================
window.exportData = function() {
    const data = {
        bottles: window.bottles || [],
        safetyLimits: window.safetyLimits || {},
        vendors: window.vendors || [],
        profiles: window.profiles || [],
        weeklyPlan: { [window.currentProfile]: window.weeklyPlan },
        shoppingLists: { [window.currentProfile]: window.shoppingLists },
        currentShoppingListName: { [window.currentProfile]: window.currentShoppingListName },
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
    showToast('✅ Data exported successfully');
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
                if (imported.profiles) window.profiles = imported.profiles;

                // Import current profile data
                const profileKey = imported.profile || window.currentProfile;
                if (imported.weeklyPlan && imported.weeklyPlan[profileKey]) {
                    window.weeklyPlan = imported.weeklyPlan[profileKey];
                }
                if (imported.shoppingLists && imported.shoppingLists[profileKey]) {
                    window.shoppingLists = imported.shoppingLists[profileKey];
                }
                if (imported.currentShoppingListName && imported.currentShoppingListName[profileKey]) {
                    window.currentShoppingListName = imported.currentShoppingListName[profileKey];
                }

                saveAllData();
                renderAllTabs();
                renderHeaderControls();
                showToast(`✅ Imported data for ${window.currentProfile}`);
            } catch (err) {
                console.error(err);
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

// Global exports
window.switchTab = switchTab;
window.saveAllData = saveAllData;
window.loadAllData = loadAllData;
window.showToast = showToast;
window.renderHeaderControls = renderHeaderControls;
window.manageUsers = manageUsers;
window.addNewUser = addNewUser;
window.deleteUser = deleteUser;