// ==================== FIREBASE SETUP - COMPAT VERSION (No module required) ====================

const firebaseConfig = {
  apiKey: "AIzaSyAXLN1iuYEamMvUO9E4-W2O4dXJ_HTFQRA",
  authDomain: "supplement-hub-2345a.firebaseapp.com",
  projectId: "supplement-hub-2345a",
  storageBucket: "supplement-hub-2345a.firebasestorage.app",
  messagingSenderId: "849158321928",
  appId: "1:849158321928:web:aff3698046998cc779debd"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let userDoc = null;
let unsubscribe = null;

let isWriting = false;
let lastSyncedHash = '';

// Auth Listener
auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        console.log(`✅ Signed in as ${user.displayName || user.email}`);
        userDoc = db.collection("users").doc(user.uid);
        startRealTimeListener();
    } else {
        console.log("🔐 No user signed in");
    }
});

// Sync to Firebase
async function syncToFirebase() {
    if (!currentUser || isWriting) return;
    
    isWriting = true;
    try {
        const dataToSave = {
            bottles: window.bottles || [],
            weeklyPlan: window.weeklyPlan || {},
            safetyLimits: window.safetyLimits || [],
            vendors: window.vendors || [],
            shoppingLists: window.shoppingLists || [],
            userSettings: window.userSettings || {},
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        const hashData = {
            bottles: dataToSave.bottles,
            weeklyPlan: dataToSave.weeklyPlan,
            safetyLimits: dataToSave.safetyLimits,
            vendors: dataToSave.vendors,
            shoppingLists: dataToSave.shoppingLists,
            userSettings: dataToSave.userSettings
        };

        const currentHash = JSON.stringify(hashData);
        if (currentHash === lastSyncedHash) {
            console.log('🔄 No change - skipping Firebase write');
            return;
        }

        await userDoc.set(dataToSave, { merge: true });
        lastSyncedHash = currentHash;
        console.log('✅ Synced to Firebase');
    } catch (error) {
        console.error('Firebase sync error:', error);
    } finally {
        isWriting = false;
    }
}

// Real-time Listener
function startRealTimeListener() {
    if (!currentUser || !userDoc) return;
    if (unsubscribe) unsubscribe();

    unsubscribe = userDoc.onSnapshot((docSnap) => {
        if (docSnap.exists && !isWriting) {
            console.log('✅ Real-time update received');
            const data = docSnap.data();
            
            if (data.bottles) window.bottles = data.bottles;
            if (data.weeklyPlan) window.weeklyPlan = data.weeklyPlan;
            if (data.safetyLimits) window.safetyLimits = data.safetyLimits;
            if (data.vendors) window.vendors = data.vendors;
            if (data.shoppingLists) window.shoppingLists = data.shoppingLists;
            if (data.userSettings) window.userSettings = data.userSettings;

            lastSyncedHash = JSON.stringify({
                bottles: data.bottles,
                weeklyPlan: data.weeklyPlan,
                safetyLimits: data.safetyLimits,
                vendors: data.vendors,
                shoppingLists: data.shoppingLists,
                userSettings: data.userSettings
            });

            renderAllTabs();
        }
    });
}

// Global exports
window.syncToFirebase = syncToFirebase;

console.log("🔥 firebase.js loaded");