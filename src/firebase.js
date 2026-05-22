// Firebase configuration for Crushrr Dating App
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBFE7mnQSYRsdYp-h1uvQV-oFQN5EFmF2g",
  authDomain: "lovelink-c06b3.firebaseapp.com",
  projectId: "lovelink-c06b3",
  storageBucket: "lovelink-c06b3.firebasestorage.app",
  messagingSenderId: "628932213996",
  appId: "1:628932213996:web:f7b3d5884c9a356808f9c9",
  measurementId: "G-YVNNR9MWT2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics - with try/catch to handle errors in some environments
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.log('Firebase Analytics not available:', error.message);
}

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Export for use in other files
export { app, analytics, auth, googleProvider, signInWithPopup };
