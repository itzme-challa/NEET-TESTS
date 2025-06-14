import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyAolcB_o6f1CQPbLSYrMKTYaz_xYs54khY",
    authDomain: "quizapp-1ae20.firebaseapp.com",
    databaseURL: "https://quizapp-1ae20-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "quizapp-1ae20",
    storageBucket: "quizapp-1ae20.appspot.com",
    messagingSenderId: "626886802317",
    appId: "1:626886802317:web:df08c307697ca235c45bc4",
    measurementId: "G-NKJTC5C1XW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

export { auth, database, provider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
