import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBW6vCf9il3omf_DX4pn78mEipQ7uplyVQ",
    authDomain: "prestigemerchandise-a1494.firebaseapp.com",
    projectId: "prestigemerchandise-a1494",
    storageBucket: "prestigemerchandise-a1494.firebasestorage.app",
    messagingSenderId: "22918042844",
    appId: "1:22918042844:web:8b2c68da24841d8a659019",
    measurementId: "G-K6VNE61Q00"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (optional, with safe check)
let analytics;
isSupported().then(yes => yes ? analytics = getAnalytics(app) : null);

export { app };
