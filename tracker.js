// tracker.js - Simplified Modal with direct onclick

console.log('📦 tracker.js - Simplified Modal');

window.bottles = window.bottles || [];
window.vendors = window.vendors || ["Amazon", "iHerb", "Vitacost"];

let editingBottleId = null;
let currentIngredients = [];

function loadTrackerData(combined) {
    if (combined && combined.bottles) window.bottles = combined.bottles;
    console.log(`✅ Loaded ${window.bottles.length} bottles`);
    setTimeout(() => showSection('bottles'), 200);
}

function showToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:16px 24px;border-radius:9999px;background:#10b981;color:white;z-index:9999;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function showSection(section) {
    console.log('Showing section:', section);

    document.getElementById('bottles-content').style.display = 'none';
    document.getElementById('overlaps-content').style.display = 'none';
    document.getElementById('planner-content').style.display = 'none';
    document.getElementById('shopping-content').style.display = 'none';

    const content = document.getElementById(section + '-content');
    if (content) content.style.display = 'block';

    if (section === 'bottles') renderBottles();
    else if (section === 'shopping') renderShopping();
    else if (section === 'overlaps') renderOverlaps();
    else if (section === 'planner') renderPlanner();
}

// Structured Modal
function showBottleModal(bottle = null) {
    editingBottleId = bottle ? bottle.id : null;
    currentIngredients = bottle && bottle.ingredients ? bottle.ingredients.map(i => ({...i})) : [];

    let ingredientsHTML = currentIngredients.map((ing, index) => `
        <div class="flex gap-3 mb-3 items-end">
            <input type="text" value="${ing.name || ''}" placeholder="Ingredient name" 
                   class="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-2xl px-4 py-3" 
                   onchange="updateIngredient(${index}, 'name', this.value)">
            <input type="number" value="${ing.numeric || ''}" placeholder="Amount" 
                   class="w-28 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-2xl px-4 py-3" 
                   onchange="updateIngredient(${index}, 'dose', this.value)">
            <select onchange="updateIngredient(${index}, 'unit', this.value)" 
                    class="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-2xl px-4 py-3">
                <option value="mg" ${ing.unit === 'mg' ? 'selected' : ''}>mg</option>
                <option value="mcg" ${ing.unit === 'mcg' ? 'selected' : ''}>mcg</option>
                <option value="IU" ${ing.unit === 'IU' ? 'selected' : ''}>IU</option>
                <option value="g" ${ing.unit === 'g' ? 'selected' : ''}>g</option>
            </select>
            <button onclick="removeIngredient(${index})" class="text-red-600 px-4 py-3">Remove</button>
        </div>
    `).join('');

    const modalHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <h3 class="text-2xl font-semibold mb-6 dark:text-white">${editingBottleId ? 'Edit Bottle' : 'Add New Bottle'}</h3>
            
            <input id="bottle-name" type="text" value="${bottle ? bottle.name || '' : ''}" placeholder="Bottle name" 
                   class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-2xl px-5 py-4 mb-6">

            <div class="mb-6">
                <label class="block text-sm text-slate-500 dark:text-slate-400 mb-2">Vendor</label>
                <select id="bottle-vendor" class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-2xl px-5 py-4">
                    <option value="">No Vendor</option>
                    ${window.vendors.map(v => `<option value="${v}" ${bottle && bottle.vendor === v ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
            </div>

            <div class="mb-8">
                <div class="flex justify-between mb-3">
                    <span class="font-medium dark:text-white">Ingredients</span>
                    <button onclick="addIngredientRow()" class="text-emerald-600 hover:underline">+ Add Ingredient</button>
                </div>
                <div id="ingredients-list">${ingredientsHTML || '<p class="text-slate-500 dark:text-slate-400 py-8 text-center">No ingredients yet. Add one above.</p>'}</div>
            </div>

            <div class="flex gap-4">
                <button onclick="hideModal()" class="flex-1 py-4 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-3xl">Cancel</button>
                <button onclick="saveStructuredBottle()" class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">Save Bottle</button>
            </div>
        </div>
    `;

    createModal('bottle-modal', modalHTML);
}

function addIngredientRow() {
    currentIngredients.push({ name: '', dose: '', unit: 'mg', numeric: 0 });
    showBottleModal(window.bottles.find(b => b.id === editingBottleId));
}

function updateIngredient(index, field, value) {
    if (currentIngredients[index]) currentIngredients[index][field] = value;
}

function removeIngredient(index) {
    currentIngredients.splice(index, 1);
    showBottleModal(window.bottles.find(b => b.id === editingBottleId));
}

function saveStructuredBottle() {
    const name = document.getElementById('bottle-name').value.trim();
    const vendor = document.getElementById('bottle-vendor').value || null;

    if (!name) return showToast("Bottle name is required", "error");

    const ingredients = currentIngredients.filter(i => i.name && i.name.trim() !== '').map(i => ({
        name: i.name.trim(),
        dose: i.dose ? i.dose + (i.unit ? ' ' + i.unit : '') : '',
        unit: i.unit || 'mg',
        numeric: i.numeric || 0
    }));

    if (ingredients.length === 0) return showToast("Add at least one ingredient", "error");

    if (editingBottleId) {
        const bottle = window.bottles.find(b => b.id === editingBottleId);
        if (bottle) {
            bottle.name = name;
            bottle.ingredients = ingredients;
            bottle.vendor = vendor;
        }
    } else {
        window.bottles.push({ id: Date.now().toString(), name, ingredients, vendor });
    }

    if (typeof saveAllData === 'function') saveAllData();
    hideModal();
    showSection('bottles');
    showToast(editingBottleId ? "Bottle updated" : "New bottle added");
}

function hideModal() {
    const m = document.getElementById('bottle-modal');
    if (m) m.remove();
}

function createModal(id, html) {
    let existing = document.getElementById(id);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'fixed inset-0 bg-black/95 flex items-center justify-center z-[9999] p-4';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) hideModal();
    });
}

// Render functions
function renderBottles() {
    const content = document.getElementById('bottles-content');
    content.innerHTML = `
        <div class="flex gap-4 mb-8">
            <button onclick="showBottleModal()" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium">+ Add Bottle</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${window.bottles.map(b => `
                <div onclick="showBottleModal(window.bottles.find(x => x.id === '${b.id}'))" 
                     class="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 cursor-pointer hover:shadow">
                    <div class="font-semibold dark:text-white">${b.name}</div>
                    <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">${b.ingredients ? b.ingredients.length : 0} ingredients</div>
                    ${b.vendor ? `<div class="text-emerald-600 dark:text-emerald-400 text-sm mt-2">Vendor: ${b.vendor}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function renderShopping() {
    const content = document.getElementById('shopping-content');
    content.innerHTML = `
        <h2 class="text-3xl font-semibold mb-8 dark:text-white">Shopping (VitaCart)</h2>
        <p class="text-slate-500 dark:text-slate-400 mb-6">Your monthly supplement shopping list</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${window.bottles.map(b => `
                <div onclick="showBottleModal(window.bottles.find(x => x.id === '${b.id}'))" 
                     class="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 cursor-pointer hover:shadow">
                    <div class="font-semibold dark:text-white">${b.name}</div>
                    <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">${b.ingredients ? b.ingredients.length : 0} ingredients</div>
                    ${b.vendor ? `<div class="text-emerald-600 dark:text-emerald-400 text-sm mt-2">Vendor: ${b.vendor}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function renderOverlaps() {
    const content = document.getElementById('overlaps-content');
    content.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center max-w-2xl mx-auto">
            <h2 class="text-3xl font-semibold mb-4 dark:text-white">Overlapping Ingredients</h2>
            <p class="text-slate-500 dark:text-slate-400">This tab will show ingredients that appear in multiple bottles with total dosage and safety limit warnings.</p>
            <p class="mt-12 text-slate-400">(${window.bottles.length} bottles loaded)</p>
        </div>
    `;
}

function renderPlanner() {
    const content = document.getElementById('planner-content');
    content.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center max-w-2xl mx-auto">
            <h2 class="text-3xl font-semibold mb-4 dark:text-white">Weekly Planner</h2>
            <p class="text-slate-500 dark:text-slate-400">This tab will let you set how many servings of each bottle you take on each day of the week.</p>
            <p class="mt-12 text-slate-400">(${window.bottles.length} bottles loaded)</p>
        </div>
    `;
}

// Expose
window.loadTrackerData = loadTrackerData;
window.showBottleModal = showBottleModal;
window.showToast = showToast;
window.showSection = showSection;
window.addIngredientRow = addIngredientRow;
window.updateIngredient = updateIngredient;
window.removeIngredient = removeIngredient;
window.saveStructuredBottle = saveStructuredBottle;
window.hideModal = hideModal;

console.log('✅ tracker.js simplified modal loaded');