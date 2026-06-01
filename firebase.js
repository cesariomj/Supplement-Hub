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

window.syncToFirebase = function() {
    if (!currentUser) {
        console.log("⚠️ Sync skipped - no user");
        return;
    }

    console.log("📤 Attempting to sync", window.bottles.length, "bottles to Firebase...");

    const userRef = db.collection('users').doc(currentUser.uid);

    const data = {
        bottles: window.bottles || [],
        safetyLimits: window.safetyLimits || {},
        vendors: window.vendors || [],
        weeklyPlan: window.weeklyPlan || {},
        shoppingLists: window.shoppingLists || {},
        profiles: window.profiles || ["General", "Mark", "Lisa"],
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };

    userRef.set(data, { merge: true })
        .then(() => console.log('✅ Successfully synced to Firebase'))
        .catch(err => console.error("❌ Sync failed:", err));
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