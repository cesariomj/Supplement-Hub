// firebase.js - Robust Real-Time Sync v3

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
    auth.signInWithPopup(provider).catch(err => {
        console.error(err);
        showToast("Sign in failed", "error");
    });
};

window.signOut = function() {
    if (confirm("Sign out?")) auth.signOut().then(() => location.reload());
};

// ====================== CORE SYNC ======================
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
        .then(() => console.log('💾 Successfully synced to Firebase'))
        .catch(err => console.error("❌ Sync failed:", err));
};

window.loadFromFirebase = function() {
    if (!currentUser) return;

    console.log("🔄 Loading data from Firebase...");

    const userRef = db.collection('users').doc(currentUser.uid);

    userRef.get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            
            window.bottles = data.bottles || [];
            window.safetyLimits = data.safetyLimits || {};
            window.vendors = data.vendors || [];
            window.weeklyPlan = data.weeklyPlan || {};
            window.shoppingLists = data.shoppingLists || {};

            console.log(`✅ Loaded ${window.bottles.length} bottles from Firebase`);
            renderAllTabs();
            showToast(`Loaded ${window.bottles.length} bottles`, "success");
        } else {
            console.log("No existing data found - starting fresh");
        }
    }).catch(err => console.error("Load error:", err));
};

// Auto-save hook
const originalSave = window.saveAllData;
window.saveAllData = function() {
    if (typeof originalSave === 'function') originalSave();
    if (currentUser) setTimeout(window.syncToFirebase, 700);
};

// Auth listener
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        console.log(`✅ Signed in as ${user.displayName || user.email}`);
        document.getElementById('login-screen').classList.add('hidden');
        setTimeout(window.loadFromFirebase, 1200); // Give time for everything to load
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
    }
});

console.log('🔥 firebase.js - Robust Sync v3 Ready');