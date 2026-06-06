// ==================== FIREBASE SETUP (Global SDK) ====================

// Make sure these Firebase scripts are in your index.html:
// <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "123456789",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase (using compat version)
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let userDoc = null;
let unsubscribe = null;

// Loop protection
let isWriting = false;
let lastSyncedHash = '';

// ==================== AUTH LISTENER ====================
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

// ==================== SYNC TO FIREBASE ====================
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

// ==================== REAL-TIME LISTENER ====================
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

            const hashData = {
                bottles: data.bottles,
                weeklyPlan: data.weeklyPlan,
                safetyLimits: data.safetyLimits,
                vendors: data.vendors,
                shoppingLists: data.shoppingLists,
                userSettings: data.userSettings
            };
            lastSyncedHash = JSON.stringify(hashData);

            renderAllTabs();
        }
    });
}

// ==================== GLOBAL EXPORTS ====================
window.syncToFirebase = syncToFirebase;
window.startRealTimeListener = startRealTimeListener;

console.log("🔥 firebase.js loaded");