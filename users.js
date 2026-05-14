// users.js - Dynamic User Management

console.log('👥 users.js loaded');

window.manageUsers = function() {
    const html = `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md max-h-[90vh] flex flex-col">
            <h2 class="text-2xl font-semibold mb-6">Manage Users</h2>
            
            <div class="mb-6">
                <input id="new-user-name" type="text" placeholder="New user name" 
                       class="w-full border rounded-3xl px-5 py-4 mb-3">
                <button onclick="addNewUser()" 
                        class="w-full py-4 bg-emerald-600 text-white rounded-3xl">+ Add User</button>
            </div>

            <div id="user-list" class="flex-1 overflow-auto space-y-3"></div>

            <div class="pt-6 border-t mt-auto">
                <button onclick="hideModal('users-modal')" class="w-full py-4 border rounded-3xl">Close</button>
            </div>
        </div>
    `;

    createModal('users-modal', html);
    renderUserList();
};

function renderUserList() {
    const container = document.getElementById('user-list');
    if (!container) return;

    let html = '';

    window.profiles.forEach(user => {
        html += `
            <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl group">
                <div class="font-medium">${user}</div>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100">
                    <button onclick="renameUser('${user}')" class="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-xl text-sm">Rename</button>
                    <button onclick="deleteUser('${user}')" class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm">Delete</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html || `<div class="text-center py-12 text-slate-500">No users yet</div>`;
}

window.addNewUser = function() {
    const nameInput = document.getElementById('new-user-name');
    const name = nameInput.value.trim();
    
    if (!name) return showToast("User name required", "error");
    if (window.profiles.includes(name)) return showToast("User already exists", "error");

    window.profiles.push(name);
    window.profiles.sort();
    saveProfiles();
    renderUserList();
    nameInput.value = '';
    
    // Refresh header dropdown
    if (typeof renderHeaderControls === 'function') renderHeaderControls();
    
    showToast(`User "${name}" added`);
};

window.renameUser = function(oldName) {
    const newName = prompt(`Rename "${oldName}" to:`, oldName);
    if (!newName || newName === oldName) return;

    if (window.profiles.includes(newName)) {
        return showToast("User name already exists", "error");
    }

    // Update profiles list
    window.profiles = window.profiles.map(p => p === oldName ? newName : p);
    
    // Update current profile if needed
    if (window.currentProfile === oldName) {
        window.currentProfile = newName;
    }

    saveProfiles();
    renderUserList();
    renderHeaderControls(); // update top dropdown
    showToast(`Renamed "${oldName}" to "${newName}"`);

    if (typeof renderHeaderControls === 'function') renderHeaderControls();
};

window.deleteUser = function(name) {
    if (window.profiles.length <= 1) {
        return showToast("Cannot delete the last user", "error");
    }

    if (confirm(`Delete user "${name}" and all their data?`)) {
        window.profiles = window.profiles.filter(p => p !== name);
        
        if (window.currentProfile === name) {
            window.currentProfile = window.profiles[0];
        }

        saveProfiles();
        renderUserList();
        renderHeaderControls();
        showToast(`User "${name}" deleted`);
    }

    if (typeof renderHeaderControls === 'function') renderHeaderControls();
};

function saveProfiles() {
    localStorage.setItem('profiles', JSON.stringify(window.profiles));
    localStorage.setItem('currentProfile', window.currentProfile);
}

console.log('👥 users.js fully exported');