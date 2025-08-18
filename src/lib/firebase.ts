
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
 apiKey: "AIzaSyB-AHzxMPGer2NI7EQVvP21qEbmSLWpqsE",
  authDomain: "tlacualli-a881e.firebaseapp.com",
  projectId: "tlacualli-a881e",
  storageBucket: "tlacualli-a881e.firebasestorage.app",
  messagingSenderId: "323312061685",
  appId: "1:323312061685:web:38922872679f08047409bc",
  measurementId: "G-1WY87VL7G4"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
