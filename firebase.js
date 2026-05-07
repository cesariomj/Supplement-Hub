// firebase.js - Real-Time Sync Ready

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

console.log('✅ Firebase initialized for real-time sync');