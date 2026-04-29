import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5ueVfQ6risVBoky2izbQmr26PetV6N6Y",
  authDomain: "booking-app-d0075.firebaseapp.com",
  projectId: "booking-app-d0075",
  storageBucket: "booking-app-d0075.firebasestorage.app",
  messagingSenderId: "1034772147958",
  appId: "1:1034772147958:web:325338e31d3792660a06d7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// EXPORT THESE FOR THE APP TO WORK:
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);