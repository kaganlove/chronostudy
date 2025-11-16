// src/lib/firebase.js
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
  collection,
  query,
  where,
  getDocs,
  writeBatch,
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

/** Helpers to get per-user collection refs */
export const userDocRef = (uid) => doc(db, "users", uid);
export const userSubjectsRef = (uid) => collection(db, "users", uid, "subjects");
export const userTestsRef = (uid) => collection(db, "users", uid, "tests");
export const userSessionsRef = (uid) => collection(db, "users", uid, "sessions");

/** One-time migration: move root-level docs (subjects/tests/sessions) -> users/{uid}/... */
async function migrateUserDataIfNeeded(uid) {
  // Add a simple flag on the user doc after migration so we don’t repeat.
  const uRef = userDocRef(uid);
  const snap = await getDoc(uRef);
  if (snap.exists() && snap.data()?.migratedV1) return;

  const batch = writeBatch(db);

  // Find legacy docs attributed to this user at the root level.
  const legacy = [
    { coll: "subjects", dest: userSubjectsRef(uid) },
    { coll: "tests", dest: userTestsRef(uid) },
    { coll: "sessions", dest: userSessionsRef(uid) },
  ];

  for (const { coll, dest } of legacy) {
    const q = query(collection(db, coll), where("userId", "==", uid));
    const qs = await getDocs(q);
    qs.forEach((d) => {
      const data = d.data();
      // Write into nested collection (keep same doc id content but new auto id)
      batch.set(doc(dest), data);
    });
  }

  // Mark the user as migrated
  batch.set(uRef, { migratedV1: true }, { merge: true });

  await batch.commit();
}

// Create or fetch user profile on sign-in, then migrate old data
export const signIn = async () => {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const uRef = userDocRef(user.uid);
  const uSnap = await getDoc(uRef);

  if (!uSnap.exists()) {
    await setDoc(uRef, {
      email: user.email,
      displayName: user.displayName || "New User",
      tier: "free",
      createdAt: serverTimestamp(),
    });
  }

  await migrateUserDataIfNeeded(user.uid);
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const watchAuth = (cb) => onAuthStateChanged(auth, cb);
