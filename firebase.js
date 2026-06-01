// firebase.js - Minimal Stable Version

console.log('🔥 firebase.js loaded');

const firebaseConfig = {
  apiKey: "AIzaSyAXLN1iuYEamMvUO9E4-W2O4dXJ_HTFQRA",
  authDomain: "supplement-hub-2345a.firebaseapp.com",
  projectId: "supplement-hub-2345a",
  storageBucket: "supplement-hub-2345a.firebasestorage.app",
  messagingSenderId: "849158321928",
  appId: "1:849158321928:web:a8a1df9d3f76f39b79debd"
};

firebase.initializeApp(firebaseConfig);

window.db = firebase.firestore();
window.auth = firebase.auth();

let currentUser = null;

// Basic Auth
window.signInWithGoogle = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
        console.error(err);
        if (typeof showToast === 'function') showToast("Sign in failed", "error");
    });
};

window.signOut = function() {
    if (confirm("Sign out?")) {
        auth.signOut().then(() => location.reload());
    }
};

// Simple Sync (no auto listener yet)
window.syncToFirebase = function() {
    if (!currentUser) return;
    console.log("💾 Sync called (basic version)");
};

window.loadFromFirebase = function() {
    if (!currentUser) return;
    console.log("📥 Load from Firebase called (basic version)");
};

// Auth listener
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        console.log(`✅ Signed in as ${user.displayName || user.email}`);
        document.getElementById('login-screen').classList.add('hidden');
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
    }
});

console.log('🔥 firebase.js - Minimal Stable Version Ready');