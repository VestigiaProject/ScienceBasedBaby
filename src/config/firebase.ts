import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyACkmcGR4RLjBkPifejm_TNB3BwvWNmcuU",
  authDomain: "baby-shouldi.firebaseapp.com",
  projectId: "baby-shouldi",
  storageBucket: "baby-shouldi.firebasestorage.app",
  messagingSenderId: "716684954997",
  appId: "1:716684954997:web:8699ded74384a30dc5973c",
  measurementId: "G-8ZZTSFN2QM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);