// app.js - Stable v2.3 (Fixed function exposure)

console.log('✅ app.js - Stable v2.3 loaded');

// ====================== GLOBAL STATE ======================
window.bottles = [];
window.weeklyPlan = {};
window.safetyLimits = {};
window.vendors = ["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"];
window.shoppingLists = {};
window.currentShoppingListName = "Monthly";

// ====================== LOCAL STORAGE ======================
function loadLocalData() {
    console.log('📥 Loading from localStorage...');
    window.bottles = JSON.parse(localStorage.getItem('bottles') || '[]');
    window.weeklyPlan = JSON.parse(localStorage.getItem('weeklyPlan') || '{}');
    window.safetyLimits = JSON.parse(localStorage.getItem('safetyLimits') || '{}');
    window.vendors = JSON.parse(localStorage.getItem('vendors') || JSON.stringify(window.vendors));
    window.shoppingLists = JSON.parse(localStorage.getItem('shoppingLists') || '{}');

    if (Object.keys(window.shoppingLists).length === 0) {
        window.shoppingLists = { "Monthly": {}, "Weekly": {} };
    }
}

function saveAllData() {
    localStorage.setItem('bottles', JSON.stringify(window.bottles));
    localStorage.setItem('weeklyPlan', JSON.stringify(window.weeklyPlan));
    localStorage.setItem('safetyLimits', JSON.stringify(window.safetyLimits));
    localStorage.setItem('vendors', JSON.stringify(window.vendors));
    localStorage.setItem('shoppingLists', JSON.stringify(window.shoppingLists));
    console.log('💾 Saved to localStorage');
}

// ====================== RENDERING ======================
function renderAllTabs() {
    console.log('🔄 Rendering all tabs...');
    
    setTimeout(() => {
        if (typeof renderBottlesTab === 'function') {
            renderBottlesTab();
        } else {
            console.error("renderBottlesTab is still not defined!");
        }
        
        if (typeof renderWeeklyPlanner === 'function') renderWeeklyPlanner();
        if (typeof renderOverLimitsTab === 'function') renderOverLimitsTab();
        if (typeof renderShoppingTab === 'function') renderShoppingTab();
    }, 200); // Increased delay
}

// ====================== UI HELPERS ======================
window.switchTab = function(tabIndex) {
    document.querySelectorAll('.tab-content').forEach((content, i) => {
        content.style.display = i === tabIndex ? 'block' : 'none';
    });

    document.querySelectorAll('.tab-button').forEach((btn, i) => {
        btn.classList.toggle('active', i === tabIndex);
    });
};

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:16px 24px;border-radius:9999px;color:white;font-weight:500;z-index:9999;${type==='error'?'background:#ef4444':'background:#10b981'};`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

window.toggleTheme = function() {
    document.documentElement.classList.toggle('dark');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = document.documentElement.classList.contains('dark') ? '🌙' : '☀️';
};

// Import / Export
window.exportData = function() {
    const data = {
        bottles: window.bottles,
        weeklyPlan: window.weeklyPlan,
        safetyLimits: window.safetyLimits,
        vendors: window.vendors,
        shoppingLists: window.shoppingLists,
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplement-hub-backup-${new Date().toISOString().slice(0,10)}.json`;
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
                if (imported.weeklyPlan) window.weeklyPlan = imported.weeklyPlan;
                if (imported.safetyLimits) window.safetyLimits = imported.safetyLimits;
                if (imported.vendors) window.vendors = imported.vendors;
                if (imported.shoppingLists) window.shoppingLists = imported.shoppingLists;

                saveAllData();
                renderAllTabs();           // Force full re-render
                setTimeout(renderBottlesTab, 300);  // Extra safety
                showToast(`✅ Imported ${window.bottles.length} bottles!`);
            } catch (err) {
                console.error(err);
                showToast('❌ Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

// Other helpers
// User/Profile Switching
window.switchUser = function(profile) {
    window.currentProfile = profile;
    document.getElementById('branch-indicator').textContent = 'round-8.1';
    showToast(`Switched to ${profile} profile`);
    
    renderBottlesTab();
    if (typeof renderWeeklyPlanner === 'function') renderWeeklyPlanner();
    if (typeof renderOverLimitsTab === 'function') renderOverLimitsTab();   // ← Add this
};

// Hamburger Menu with Auto-close
window.toggleHamburgerMenu = function() {
    const menu = document.getElementById('hamburger-menu');
    if (menu) menu.classList.toggle('hidden');
};

// Close menu after any menu item is clicked
window.closeHamburgerMenu = function() {
    const menu = document.getElementById('hamburger-menu');
    if (menu) menu.classList.add('hidden');
};

window.refreshAllData = function() {
    if (confirm('Reload all data?')) {
        loadLocalData();
        renderAllTabs();
        showToast('✅ Data refreshed');
    }
};

window.installApp = function() {
    showToast('PWA Install coming soon...');
};

// Close hamburger menu when clicking outside
document.addEventListener('click', function(e) {
    const menu = document.getElementById('hamburger-menu');
    if (!menu) return;
    
    const isMenuButton = e.target.closest('button[onclick*="toggleHamburgerMenu"]');
    const isInsideMenu = e.target.closest('#hamburger-menu');
    
    if (!isMenuButton && !isInsideMenu) {
        menu.classList.add('hidden');
    }
});

// ====================== INIT ======================
window.onload = () => {
    loadLocalData();
    renderAllTabs();
    window.switchTab(0);
    console.log('🚀 Supplement Hub initialized successfully');
};

// Expose everything
window.saveAllData = saveAllData;
window.loadLocalData = loadLocalData;
window.renderAllTabs = renderAllTabs;
window.showToast = showToast;