// firebase.js - Clean & Working Version

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

// ====================== AUTH ======================
window.signInWithGoogle = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .catch(err => {
            console.error(err);
            if (typeof showToast === 'function') showToast("Sign in failed", "error");
        });
};

window.signOut = function() {
    if (confirm("Sign out?")) {
        auth.signOut().then(() => window.location.reload());
    }
};

// ====================== SYNC ======================
window.syncToFirebase = function() {
    if (!currentUser) return;

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
        .then(() => console.log('💾 Synced to Firebase'))
        .catch(err => console.error("Sync failed:", err));
};

window.loadFromFirebase = function() {
    if (!currentUser) return;

    const userRef = db.collection('users').doc(currentUser.uid);

    userRef.get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            
            if (data.bottles) window.bottles = data.bottles;
            if (data.safetyLimits) window.safetyLimits = data.safetyLimits;
            if (data.vendors) window.vendors = data.vendors;
            if (data.weeklyPlan) window.weeklyPlan = data.weeklyPlan;
            if (data.shoppingLists) window.shoppingLists = data.shoppingLists;

            console.log(`✅ Loaded ${window.bottles.length} bottles from Firebase`);
            if (typeof renderAllTabs === 'function') renderAllTabs();
            if (typeof showToast === 'function') showToast('✅ Data loaded from cloud');
        }
    }).catch(err => console.error("Load error:", err));
};

// Auto-sync
const originalSaveAllData = window.saveAllData;
window.saveAllData = function() {
    if (typeof originalSaveAllData === 'function') originalSaveAllData();
    if (currentUser) setTimeout(window.syncToFirebase, 800);
};

// Auth State
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        console.log(`✅ Signed in as ${user.displayName || user.email}`);
        document.getElementById('login-screen').classList.add('hidden');
        setTimeout(window.loadFromFirebase, 1000);
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
    }
});

console.log('🔥 firebase.js - Clean Real-Time Sync Ready');