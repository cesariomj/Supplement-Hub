// utils.js
console.log('🛠️ utils.js loaded');

window.showToast = function(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:16px 24px;border-radius:9999px;color:white;font-weight:500;z-index:9999;${type==='error'?'background:#ef4444':'background:#10b981'};`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
};

window.createModal = function(id, html) {
    let old = document.getElementById(id);
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = "fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4";
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
};

window.hideModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.remove();
};