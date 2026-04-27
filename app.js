console.log('✅ app.js loaded - Stable Local');

window.bottles = [];
window.weeklyPlan = {};
window.safetyLimits = {};
window.vendors = ["Amazon", "iHerb", "Vitacost", "PureFormulas", "Other"];

// ====================== LOAD / SAVE ======================
function loadAllData() {
    console.log('📥 Loading from localStorage...');
    window.bottles = JSON.parse(localStorage.getItem('bottles') || '[]');
    window.weeklyPlan = JSON.parse(localStorage.getItem('weeklyPlan') || '{}');
    window.safetyLimits = JSON.parse(localStorage.getItem('safetyLimits') || '{}');
    renderAllTabs();
}

function saveAllData() {
    localStorage.setItem('bottles', JSON.stringify(window.bottles));
    localStorage.setItem('weeklyPlan', JSON.stringify(window.weeklyPlan));
    localStorage.setItem('safetyLimits', JSON.stringify(window.safetyLimits));
    console.log('💾 Saved locally');
}

function renderAllTabs() {
    if (typeof renderBottlesTab === 'function') renderBottlesTab();
    if (typeof renderWeeklyPlanner === 'function') renderWeeklyPlanner();
    if (typeof renderOverLimitsTab === 'function') renderOverLimitsTab();
    if (typeof renderShoppingTab === 'function') renderShoppingTab();
}

function switchTab(tabIndex) {
    console.log(`Switching to tab ${tabIndex}`);

    // Force hide ALL tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });

    // Show only the selected one
    const contents = document.querySelectorAll('.tab-content');
    if (contents[tabIndex]) {
        contents[tabIndex].classList.add('active');
        contents[tabIndex].style.display = 'block';
    }

    // Update buttons
    document.querySelectorAll('.tab-button').forEach((btn, index) => {
        btn.classList.toggle('active', index === tabIndex);
    });
}

// ====================== IMPORT / EXPORT ======================
window.exportData = function() {
    const data = {
        bottles: window.bottles || [],
        weeklyPlan: window.weeklyPlan || {},
        safetyLimits: window.safetyLimits || {},
        vendors: window.vendors || [],
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

                saveAllData();
                renderAllTabs();
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

// Toast helper
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:16px 24px;border-radius:9999px;color:white;font-weight:500;z-index:9999;${type==='error'?'background:#ef4444':'background:#10b981'};`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Init
window.onload = () => {
    console.log('🚀 Supplement Hub ready (local mode)');
    loadAllData();
    switchTab(0);
};

// Global exports
window.switchTab = switchTab;
window.saveAllData = saveAllData;
window.loadAllData = loadAllData;
window.showToast = showToast;