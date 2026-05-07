// app.js - COMPLETE STABLE VERSION (with saveProfiles fixed)

console.log('✅ app.js loaded - Stable Local');

let currentUser = null;
let unsubscribe = null;
let isSyncingFromFirebase = false;

// ==================== GLOBAL DATA ====================
window.profiles = JSON.parse(localStorage.getItem('profiles') || '["General", "Mark", "Lisa"]');
window.currentProfile = localStorage.getItem('currentProfile') || "Mark";
window.dataNeedsRefresh = false;

window.DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
window.DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

window.bottles = JSON.parse(localStorage.getItem('bottles') || '[]');
window.safetyLimits = JSON.parse(localStorage.getItem('safetyLimits') || '{}');
window.vendors = JSON.parse(localStorage.getItem('vendors') || '["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"]');

// ==================== CORE ====================
function saveProfiles() {
    localStorage.setItem('profiles', JSON.stringify(window.profiles));
}

function loadAllData() {
    console.log('📥 Loading all data...');
    window.bottles = JSON.parse(localStorage.getItem('bottles') || '[]');
    window.safetyLimits = JSON.parse(localStorage.getItem('safetyLimits') || '{}');
    window.vendors = JSON.parse(localStorage.getItem('vendors') || '["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"]');

    window.weeklyPlan = JSON.parse(localStorage.getItem(`weeklyPlan_${window.currentProfile}`) || '{}');
    const shoppingKey = `shoppingLists_${window.currentProfile}`;
    window.shoppingLists = JSON.parse(localStorage.getItem(shoppingKey) || '{}');
    window.currentShoppingListName = localStorage.getItem(`currentShoppingListName_${window.currentProfile}`) || "Monthly";

    console.log(`✅ Loaded for profile: ${window.currentProfile}`);
    renderAllTabs();
}

function saveAllData() {
    localStorage.setItem('bottles', JSON.stringify(window.bottles || []));
    localStorage.setItem('safetyLimits', JSON.stringify(window.safetyLimits || {}));
    localStorage.setItem('vendors', JSON.stringify(window.vendors || []));
    localStorage.setItem(`weeklyPlan_${window.currentProfile}`, JSON.stringify(window.weeklyPlan || {}));
    localStorage.setItem(`shoppingLists_${window.currentProfile}`, JSON.stringify(window.shoppingLists || {}));
    localStorage.setItem(`currentShoppingListName_${window.currentProfile}`, window.currentShoppingListName || "Monthly");

    console.log(`💾 Saved for profile: ${window.currentProfile}`);
}

function renderAllTabs() {
    if (typeof renderBottlesTab === 'function') renderBottlesTab();
    if (typeof renderWeeklyPlanner === 'function') renderWeeklyPlanner();
    if (typeof renderOverLimitsTab === 'function') renderOverLimitsTab();
    if (typeof renderShoppingTab === 'function') renderShoppingTab();
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
        <div class="flex items-center gap-3 flex-wrap">
            <select id="profile-select" onchange="switchProfile(this.value)" class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-3xl px-5 py-3 font-medium">
                ${window.profiles.map(p => `<option value="${p}" ${p === window.currentProfile ? 'selected' : ''}>${p}</option>`).join('')}
            </select>

            <button onclick="manageUsers()" class="px-4 py-3 text-sm border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-3xl">👥 Users</button>
            <button onclick="refreshAll()" class="w-11 h-11 flex items-center justify-center text-2xl hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl" title="Refresh">🔄</button>
            <button onclick="toggleTheme()" class="w-11 h-11 flex items-center justify-center text-2xl hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl"><span id="theme-icon">☀️</span></button>
            
            ${userSection}
            
            <button onclick="exportData()" class="px-5 py-3 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl text-sm font-medium">Export</button>
            <button onclick="importData()" class="px-5 py-3 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl text-sm font-medium">Import</button>
        </div>
    `;

    container.innerHTML = html;
}

// User Management
window.manageUsers = function() {
    const usersHTML = window.profiles.map(user => `
        <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl">
            <span class="font-medium">${user}</span>
            ${user !== "General" ? `<button onclick="deleteUser('${user}')" class="text-red-500 hover:text-red-600 px-4 py-2">Remove</button>` : '<span class="text-emerald-600 text-sm">Shared</span>'}
        </div>
    `).join('');

    const html = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md">
            <h3 class="text-2xl font-semibold mb-6">Manage Users</h3>
            <div class="mb-6">
                <input id="new-user-name" type="text" placeholder="New user name" class="w-full border rounded-2xl px-5 py-4 mb-3">
                <button onclick="addNewUser()" class="w-full py-4 bg-emerald-600 text-white rounded-3xl">+ Add User</button>
            </div>
            <div class="space-y-3">${usersHTML}</div>
            <button onclick="hideModal('users-modal')" class="w-full mt-8 py-4 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-3xl">Close</button>
        </div>
    `;
    createModal('users-modal', html);
};

window.addNewUser = function() {
    const name = document.getElementById('new-user-name').value.trim();
    if (!name) return showToast("Enter a name", "error");
    if (window.profiles.includes(name)) return showToast("User exists", "error");

    window.profiles.push(name);
    saveProfiles();
    hideModal('users-modal');
    renderHeaderControls();
    showToast(`Added ${name}`);
};

window.deleteUser = function(user) {
    if (confirm(`Delete ${user} and all their data?`)) {
        localStorage.removeItem(`weeklyPlan_${user}`);
        localStorage.removeItem(`shoppingLists_${user}`);
        localStorage.removeItem(`currentShoppingListName_${user}`);

        window.profiles = window.profiles.filter(p => p !== user);
        saveProfiles();

        if (window.currentProfile === user) window.currentProfile = "General";

        hideModal('users-modal');
        renderHeaderControls();
        loadAllData();
        showToast(`Deleted ${user}`);
    }
};

window.switchProfile = function(newProfile) {
    if (newProfile === window.currentProfile) return;
    saveAllData();
    window.currentProfile = newProfile;
    localStorage.setItem('currentProfile', newProfile);
    loadAllData();
    showToast(`Switched to ${newProfile}`);
};

// Export / Import, Firebase, etc. (keep the rest of your working code)

// Init and exports at the bottom...

// ==================== EXPORT / IMPORT ====================
window.exportData = function() {
    const data = {
        bottles: window.bottles || [],
        safetyLimits: window.safetyLimits || {},
        vendors: window.vendors || [],
        profiles: window.profiles || [],
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
                if (imported.profiles) window.profiles = imported.profiles;

                saveAllData();
                renderAllTabs();
                renderHeaderControls();
                showToast('✅ Imported successfully');
            } catch (err) {
                showToast('❌ Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

// ==================== FIREBASE REAL-TIME SYNC ====================
function startRealTimeListener() {
    if (!currentUser) return;
    if (unsubscribe) unsubscribe();

    const userRef = db.collection('users').doc(currentUser.uid);
    unsubscribe = userRef.onSnapshot(doc => {
        if (doc.exists) {
            isSyncingFromFirebase = true;
            const data = doc.data();
            if (data.bottles) window.bottles = data.bottles;
            if (data.safetyLimits) window.safetyLimits = data.safetyLimits;
            if (data.vendors) window.vendors = data.vendors;
            if (data.profiles) window.profiles = data.profiles;

            saveAllData();
            renderAllTabs();
            renderHeaderControls();
            isSyncingFromFirebase = false;
        }
    });
}

function syncToFirebase() {
    if (!currentUser || isSyncingFromFirebase) return;
    db.collection('users').doc(currentUser.uid).set({
        bottles: window.bottles,
        safetyLimits: window.safetyLimits,
        vendors: window.vendors,
        profiles: window.profiles,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

window.signInWithGoogle = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(() => showToast("Sign in failed", "error"));
};

window.signOut = function() {
    if (confirm("Sign out?")) auth.signOut().then(() => window.location.reload());
};

const originalSave = saveAllData;
window.saveAllData = function() {
    originalSave();
    if (currentUser && !isSyncingFromFirebase) setTimeout(syncToFirebase, 800);
};

window.refreshAll = function() {
    saveAllData();
    renderAllTabs();
    showToast('✅ Refreshed');
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
    if (saved === 'dark' || (!saved && prefersDark)) document.documentElement.classList.add('dark');
}

function initFirebaseAuth() {
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            document.getElementById('login-screen').classList.add('hidden');
            renderHeaderControls();
            startRealTimeListener();
        } else {
            document.getElementById('login-screen').classList.remove('hidden');
            if (unsubscribe) unsubscribe();
            renderHeaderControls();
        }
    });
}

// ==================== INIT ====================
window.onload = () => {
    console.log('🚀 Supplement Hub ready');
    applySavedTheme();
    loadAllData();
    renderHeaderControls();
    initFirebaseAuth();
    switchTab(0);
};

// ==================== GLOBAL EXPORTS ====================
window.switchTab = switchTab;
window.saveAllData = saveAllData;
window.loadAllData = loadAllData;
window.showToast = showToast;
window.renderHeaderControls = renderHeaderControls;
window.manageUsers = manageUsers;
window.addNewUser = addNewUser;
window.deleteUser = deleteUser;
window.refreshAll = refreshAll;
window.signOut = signOut;
window.signInWithGoogle = signInWithGoogle;
window.exportData = exportData;
window.importData = importData;