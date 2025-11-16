import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB4sXHMFAX3tdpHfQ6X2UfvkQ-giJtVY5M",
  authDomain: "chronostudy.firebaseapp.com",
  projectId: "chronostudy",
  storageBucket: "chronostudy.firebasestorage.app",
  messagingSenderId: "1007484196229",
  appId: "1:1007484196229:web:f5d97f5ec52162e223a0ec",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

// Create or fetch user profile on sign-in
export const signIn = async () => {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || "New User",
      tier: "free", // default tier
      createdAt: serverTimestamp(),
    });
  }
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const watchAuth = (cb) => onAuthStateChanged(auth, cb);
