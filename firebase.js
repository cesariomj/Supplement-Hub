// firebase.js - Real-Time Sync + Auth

console.log('🔥 firebase.js loaded');

const firebaseConfig = {
  apiKey: "AIzaSyAXLN1iuYEamMvUO9E4-W2O4dXJ_HTFQRA",
  authDomain: "supplement-hub-2345a.firebaseapp.com",
  projectId: "supplement-hub-2345a",
  storageBucket: "supplement-hub-2345a.firebasestorage.app",
  messagingSenderId: "849158321928",
  appId: "1:849158321928:web:a8a1df9d3f76f39b79debd"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

window.db = firebase.firestore();
window.auth = firebase.auth();

console.log('✅ Firebase initialized for real-time sync');

// ====================== AUTH FUNCTIONS ======================
window.signInWithGoogle = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .catch(err => {
            console.error("Sign in error:", err);
            showToast("Sign in failed. Please try again.", "error");
        });
};

window.signOut = function() {
    if (confirm("Sign out of Supplement Hub?")) {
        auth.signOut().then(() => {
            window.location.reload();
        });
    }
};

// ====================== AUTH STATE LISTENER ======================
auth.onAuthStateChanged(user => {
    window.currentUser = user;
    
    if (user) {
        console.log(`✅ Signed in as ${user.displayName || user.email}`);
        document.getElementById('login-screen')?.classList.add('hidden');
    } else {
        console.log('👤 No user signed in');
        document.getElementById('login-screen')?.classList.remove('hidden');
    }
    
    // Refresh header
    if (typeof renderHeaderControls === 'function') {
        renderHeaderControls();
    }
});

console.log('🔥 firebase.js fully exported with auth');