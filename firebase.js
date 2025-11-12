
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
//import { getAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAHIKKv6eAosJtwc6bFjWyOKpYC8ySzMoU",
  authDomain: "temis-15a66.firebaseapp.com",
  projectId: "temis-15a66",
  storageBucket: "temis-15a66.firebasestorage.app",
  messagingSenderId: "942142011077",
  appId: "1:942142011077:web:ca9ae2b6d91300913da2ac"
};

// Inicia Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);
//export const auth = getAuth(app);

export default app;