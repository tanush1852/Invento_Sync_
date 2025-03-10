// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {getAuth} from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5bVcW38KKCCyWt0wyAVydOmnq9LdCLvM",
  authDomain: "automatedans.firebaseapp.com",
  projectId: "automatedans",
  storageBucket: "automatedans.firebasestorage.app",
  messagingSenderId: "473649036417",
  appId: "1:473649036417:web:4eac399fb07adcd1e56180"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db=getFirestore(app);
export const auth=getAuth(app)