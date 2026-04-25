// app.js - Fixed tab switching (this should solve the duplicate content)

console.log('app.js loaded');

let currentTab = 0;

// app.js - Core data management (updated for dailyServings + safetyLimits)

function loadAllData() {
    console.log('📥 Loading all data from localStorage...');

    window.bottles = JSON.parse(localStorage.getItem('bottles') || '[]');
    window.dailyServings = JSON.parse(localStorage.getItem('dailyServings') || '{}'); // keep for backward compatibility
    window.safetyLimits = JSON.parse(localStorage.getItem('safetyLimits') || '{}');
    window.weeklyPlan = JSON.parse(localStorage.getItem('weeklyPlan') || '{}');

    // Default empty weekly plan if none exists
    if (Object.keys(window.weeklyPlan).length === 0) {
        const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        days.forEach(day => { window.weeklyPlan[day] = {}; });
    }

    console.log(`✅ Loaded ${window.bottles.length} bottles + weekly plan`);

    if (typeof renderBottlesTab === 'function') renderBottlesTab();
}

function saveAllData() {
    try {
        localStorage.setItem('bottles', JSON.stringify(window.bottles || []));
        localStorage.setItem('weeklyPlan', JSON.stringify(window.weeklyPlan || {}));
        localStorage.setItem('safetyLimits', JSON.stringify(window.safetyLimits || {}));
        localStorage.setItem('dailyServings', JSON.stringify(window.dailyServings || {})); // keep for now
        console.log('💾 All data saved');
    } catch (e) {
        console.error('Save failed', e);
    }
}

function switchTab(tabIndex) {
    // Remove active from all buttons and contents
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Activate selected
    const buttons = document.querySelectorAll('.tab-button');
    if (buttons[tabIndex]) buttons[tabIndex].classList.add('active');

    const contents = document.querySelectorAll('.tab-content');
    if (contents[tabIndex]) contents[tabIndex].classList.add('active');

    // Render correct tab
    if (tabIndex === 0 && typeof renderBottlesTab === 'function') renderBottlesTab();
    if (tabIndex === 1 && typeof renderWeeklyPlanner === 'function') renderWeeklyPlanner();
    if (tabIndex === 2 && typeof renderOverLimitsTab === 'function') renderOverLimitsTab();
    if (tabIndex === 3 && typeof renderShoppingTab === 'function') renderShoppingTab();

    // tab 3 = Shopping (later)
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                let imported = JSON.parse(ev.target.result);

                // Support both array of bottles or {bottles: [...]}
                if (Array.isArray(imported)) {
                    window.bottles = imported;
                } else if (imported && Array.isArray(imported.bottles)) {
                    window.bottles = imported.bottles;
                } else {
                    window.bottles = [];
                    showToast('No valid bottle data found in file', 'error');
                    return;
                }

                // Normalize every ingredient
                let fixedCount = 0;

                window.bottles.forEach(bottle => {
                    if (!bottle.ingredients || !Array.isArray(bottle.ingredients)) {
                        bottle.ingredients = [];
                        return;
                    }

                    bottle.ingredients = bottle.ingredients.map(ing => {
                        let name = (ing.name || '').trim();
                        let doseStr = (ing.dose || '').toString().trim();
                        let numeric = ing.numeric !== undefined ? Number(ing.numeric) : NaN;
                        let unit = 'mg';   // default

                        // Priority 1: Use clean numeric if available
                        if (!isNaN(numeric) && numeric !== null) {
                            // Try to extract unit from dose string if present
                            const unitMatch = doseStr.match(/\b(mg|mcg|µg|ug|IU|iu|g|ml)\b/i);
                            if (unitMatch) {
                                unit = unitMatch[1].toLowerCase().replace('µg', 'mcg');
                            }
                            fixedCount++;
                            return {
                                name: name,
                                dose: numeric.toString(),
                                unit: unit
                            };
                        }

                        // Priority 2: Parse from "dose" string if numeric is missing
                        if (doseStr) {
                            // Extract number from string like "338 mg" or "125 mcg (5000 IU)"
                            const numMatch = doseStr.match(/[\d,]+(\.\d+)?/);
                            let parsedNum = numMatch ? parseFloat(numMatch[0].replace(/,/g, '')) : NaN;

                            const unitMatch = doseStr.match(/\b(mg|mcg|µg|ug|IU|iu|g)\b/i);
                            if (unitMatch) unit = unitMatch[1].toLowerCase().replace('µg', 'mcg');

                            if (!isNaN(parsedNum)) {
                                fixedCount++;
                                return {
                                    name: name,
                                    dose: parsedNum.toString(),
                                    unit: unit
                                };
                            }
                        }

                        // Fallback: keep as-is
                        return {
                            name: name,
                            dose: doseStr || '',
                            unit: ing.unit || 'mg'
                        };
                    });
                });

                if (typeof saveAllData === 'function') saveAllData();

                showToast(`✅ Imported ${window.bottles.length} bottles and fixed ${fixedCount} ingredient amounts!`);

                // Refresh Bottles tab
                if (typeof switchTab === 'function') {
                    switchTab(0);
                } else if (typeof renderBottlesTab === 'function') {
                    renderBottlesTab();
                }

            } catch (err) {
                console.error('Import error:', err);
                showToast('Invalid JSON file', 'error');
            }
        };
        reader.readAsText(file);
    };

    document.body.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 500);
}

function exportData() {
    const data = {
        bottles: window.bottles || [],
        safetyLimits: window.safetyLimits || {},
        vendors: window.vendors || [],
        weeklyPlan: window.weeklyPlan || {},
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplement-hub-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('✅ Data exported successfully');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:16px 24px;border-radius:9999px;color:white;z-index:9999;${type==='error' ? 'background:#ef4444' : 'background:#10b981'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

// Global exports
window.switchTab = switchTab;
window.loadAllData = loadAllData;
window.saveAllData = saveAllData;
window.importData = importData;
window.exportData = exportData;
window.showToast = showToast;

console.log('✅ app.js fully initialized');