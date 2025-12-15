import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";

// NOTE: In a real environment, use process.env.REACT_APP_FIREBASE_API_KEY etc.
// For this specific request, we are maintaining the structure but you MUST ensure
// these keys are correct and restricted in your Google Cloud Console.
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDqEDD2Hds_pX5phI5cZKU3Q-mRtQxTZDg",
    authDomain: "duobloom-a9b7b.firebaseapp.com",
    projectId: "duobloom-a9b7b",
    storageBucket: "duobloom-a9b7b.firebasestorage.app",
    messagingSenderId: "118209789780",
    appId: "1:118209789780:web:ce2563e693a76f09a7d2c1",
    measurementId: "G-Z0W0LK6D88"
};

let app;
let auth: Auth;
let db: Firestore;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase Init Error", e);
}

export { auth, db, GoogleAuthProvider };