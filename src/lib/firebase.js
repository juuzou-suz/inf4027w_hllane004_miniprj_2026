// Import the functions we need from Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration object
// This tells Firebase which project to connect to
// The values come from our .env.local file (process.env.VARIABLE_NAME)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app
// This is like "turning on" Firebase in our application
// We only want to do this once, so we use a variable to store it
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
// This gives us the tools to register users, log them in, log them out, etc.
export const auth = getAuth(app);

// Initialize Cloud Firestore
// This gives us the tools to read/write data to our database
export const db = getFirestore(app);

// Export the app itself (in case we need it elsewhere)
export default app;