import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAlPQBm1F0uTPDvWsXaMyfC8KU7GHIqnR4",
  authDomain: "r6-match-data.firebaseapp.com",
  projectId: "r6-match-data",
  storageBucket: "r6-match-data.appspot.com",
  messagingSenderId: "912845187347",
  appId: "1:912845187347:web:aebbc33879cab206b712e6",
  measurementId: "G-T4GEWSY3YR",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

export default defineNuxtPlugin(() => {});
