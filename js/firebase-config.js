import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZjFjrdWYCxa3W7eBEegdon6O_KnRJbSg",
  authDomain: "eventbloxtr.firebaseapp.com",
  databaseURL: "https://eventbloxtr-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "eventbloxtr",
  storageBucket: "eventbloxtr.firebasestorage.app",
  messagingSenderId: "78628071464",
  appId: "1:78628071464:web:fb61321e798d0e56dcad1d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

signInAnonymously(auth).catch(console.error);
