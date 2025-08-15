
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "tlacualli-bfbh0",
  "appId": "1:918335842280:web:9756be54035734c080265d",
  "storageBucket": "tlacualli-bfbh0.firebasestorage.app",
  "apiKey": "AIzaSyB627iXGidjNf_rXMn4Y7dH2Gfw4X78IcE",
  "authDomain": "tlacualli-bfbh0.firebaseapp.com",
  "messagingSenderId": "918335842280"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
