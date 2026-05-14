// firebase.js - Final Safe Version (No load-order issues)

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
let unsubscribe = null;
let isSyncingFromFirebase = false;

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
        auth.signOut().then(() => window.location.reload());
    }
};

// ====================== SYNC TO FIREBASE (Safe) ======================
let syncTimeout = null;

window.syncToFirebase = function() {
    if (!currentUser || isSyncingFromFirebase) return;

    if (syncTimeout) clearTimeout(syncTimeout);

    syncTimeout = setTimeout(() => {
        console.log('🔄 Attempting sync to Firebase...');

        const userRef = db.collection('users').doc(currentUser.uid);

        const dataToSync = {
            bottles: window.bottles || [],
            safetyLimits: window.safetyLimits || {},
            vendors: window.vendors || [],
            weeklyPlan: window.weeklyPlan || {},
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        userRef.set(dataToSync, { merge: true })
            .then(() => {
                console.log('✅ Successfully synced to Firebase');
                if (typeof showToast === 'function') {
                    showToast('💾 Synced to cloud');
                }
            })
            .catch(err => console.error("Sync failed:", err));
    }, 800);
};

// Safe auto-sync (only if saveAllData exists)
setTimeout(() => {
    if (typeof saveAllData === 'function') {
        const originalSave = saveAllData;
        window.saveAllData = function() {
            originalSave();
            if (currentUser) syncToFirebase();
        };
        console.log('🔄 Auto-sync hook installed');
    }
}, 1000);

// ====================== REAL-TIME LISTENER ======================
function startRealTimeListener() {
    if (!currentUser || unsubscribe) return;

    const userRef = db.collection('users').doc(currentUser.uid);

    unsubscribe = userRef.onSnapshot(doc => {
        if (!doc.exists) return;

        isSyncingFromFirebase = true;
        const remote = doc.data() || {};

        if (remote.bottles) window.bottles = remote.bottles;
        if (remote.safetyLimits) window.safetyLimits = remote.safetyLimits;
        if (remote.vendors) window.vendors = remote.vendors;
        if (remote.weeklyPlan) window.weeklyPlan = remote.weeklyPlan;

        if (typeof renderAllTabs === 'function') renderAllTabs();

        isSyncingFromFirebase = false;
        console.log('🔄 Synced from Firebase');
    });
}

// ====================== AUTH STATE ======================
auth.onAuthStateChanged(user => {
    currentUser = user;
    window.currentUser = user;

    if (user) {
        console.log(`✅ Signed in as ${user.displayName || user.email}`);
        setTimeout(startRealTimeListener, 800);
    } else if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }

    if (typeof renderHeaderControls === 'function') {
        setTimeout(renderHeaderControls, 300);
    }
});

console.log('🔥 firebase.js - Final Safe Version Loaded');