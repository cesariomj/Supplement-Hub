// firebase.js - Firebase Firestore integration

const firebaseConfig = {
  apiKey: "AIzaSyAXLN1iuYEamMvUO9E4-W2O4dXJ_HTFQRA",
  authDomain: "supplement-hub-2345a.firebaseapp.com",
  projectId: "supplement-hub-2345a",
  storageBucket: "supplement-hub-2345a.firebasestorage.app",
  messagingSenderId: "849158321928",
  appId: "1:849158321928:web:aff3698046998cc779debd"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const currentUserId = "default";   // We can expand to real auth later

async function loadAllData() {
    try {
        const doc = await db.collection("users").doc(currentUserId).get();
        if (doc.exists) {
            console.log("✅ Loaded from Firebase");
            return doc.data();
        }
        console.log("No data in Firebase yet");
        return null;
    } catch (err) {
        console.error("Firebase load failed:", err);
        return null;
    }
}

async function saveAllData() {
    const combined = {
        bottles: window.bottles || [],
        schedules: window.schedules || {},
        upperLimits: window.upperLimits || {},
        vitacart: {
            supplements: window.supplements || [],
            vendors: window.vendors || [],
            shoppingLists: window.shoppingLists || ["Monthly", "Weekly", "Special", "Sales"],
            currentShoppingList: window.currentShoppingList || "Monthly"
        }
    };

    try {
        await db.collection("users").doc(currentUserId).set(combined);
        console.log("✅ Saved to Firebase");
    } catch (err) {
        console.error("Firebase save failed:", err);
    }
}

window.loadAllData = loadAllData;
window.saveAllData = saveAllData;