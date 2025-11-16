// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwwNfxWNcfaiua62_3af7b-5g0sgHSHOo",
  authDomain: "placementhub-63892.firebaseapp.com",
  projectId: "placementhub-63892",
  storageBucket: "placementhub-63892.firebasestorage.app",
  messagingSenderId: "301940010490",
  appId: "1:301940010490:web:fbca510265418b20748843",
  measurementId: "G-TWM0PD3G8X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
