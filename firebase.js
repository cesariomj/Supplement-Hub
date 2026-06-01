// firebase.js - Clean & Stable Real-Time Sync v9

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
let dataUnsubscribe = null;

// ====================== AUTH ======================
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

// ====================== REAL-TIME SYNC ======================
function startRealTimeListener() {
    if (!currentUser || dataUnsubscribe) return;

    console.log("🔄 Starting real-time listener...");

    const userRef = db.collection('users').doc(currentUser.uid);

    dataUnsubscribe = userRef.onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            
            window.bottles = data.bottles || [];
            window.safetyLimits = data.safetyLimits || {};
            window.vendors = data.vendors || [];
            window.weeklyPlan = data.weeklyPlan || {};
            window.shoppingLists = data.shoppingLists || {};

            console.log(`🔄 Real-time sync: ${window.bottles.length} bottles`);
            if (typeof renderAllTabs === 'function') renderAllTabs();
        }
    });
}

// Save to Firebase
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
        .catch(err => console.error("❌ Sync failed:", err));
};

// Auto-sync after saves
const originalSaveAllData = window.saveAllData;
window.saveAllData = function() {
    if (typeof originalSaveAllData === 'function') originalSaveAllData();
    if (currentUser) setTimeout(window.syncToFirebase, 700);
};

// Auth listener
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        console.log(`✅ Signed in as ${user.displayName || user.email}`);
        document.getElementById('login-screen').classList.add('hidden');
        setTimeout(startRealTimeListener, 1000);
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
        if (dataUnsubscribe) dataUnsubscribe();
    }
});

console.log('🔥 firebase.js - Clean Real-Time Sync v9 Ready');