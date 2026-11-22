import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getMessaging } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

const firebaseConfig = {

  apiKey: "AIzaSyD91obV5pMOt8FGeyC2_StenLM6dKpbQK",
  authDomain: "family-bill-tracker-465e9.firebaseapp.com",
  projectId: "family-bill-tracker-465e9",
  storageBucket: "family-bill-tracker-465e9.firebasestorage.app",
  messagingSenderId: "933705487509",
  appId: "1:933705487509:web:152e1f6e0e60295193b79c"

};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const messaging =
    getMessaging(app);
