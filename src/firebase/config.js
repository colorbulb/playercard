// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyADGpgValITKs6zCNqkJTz2Dc5eENVh6-Y",
  authDomain: "nextelite-89f47.firebaseapp.com",
  databaseURL: "https://nextelite-89f47-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nextelite-89f47",
  storageBucket: "nextelite-89f47.firebasestorage.app",
  messagingSenderId: "106713038598",
  appId: "1:106713038598:web:f8e4bcdc867e7980e96887",
  measurementId: "G-82B1QNTJ4N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

export { app, analytics, database };

