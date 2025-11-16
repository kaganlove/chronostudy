// -----------------------------
// ChronoStudy Firestore Utility
// -----------------------------
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { auth } from "./firebase";

// Initialize Firestore
const db = getFirestore();

/**
 * Adds a new subject for the currently signed-in user.
 * @param {string} name - The subject name (e.g., "Calculus")
 */
export async function addSubject(name) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not signed in.");

    await addDoc(collection(db, "subjects"), {
      userId: user.uid,
      name,
      createdAt: new Date(),
    });

    console.log(`✅ Subject "${name}" added successfully.`);
  } catch (error) {
    console.error("Error adding subject:", error.message);
  }
}

/**
 * Adds a new test for a specific subject.
 * @param {string} subjectName - The name of the subject (e.g., "Calculus")
 * @param {string} date - The date of the test (YYYY-MM-DD)
 * @param {number} hours - The number of hours to study for this test
 */
export async function addTest(subjectName, date, hours) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not signed in.");

    await addDoc(collection(db, "tests"), {
      userId: user.uid,
      subjectName,
      date,
      hours: Number(hours),
      createdAt: new Date(),
    });

    console.log(`✅ Test for "${subjectName}" on ${date} added successfully.`);
  } catch (error) {
    console.error("Error adding test:", error.message);
  }
}

/**
 * Retrieves all subjects and tests for the current user.
 * @returns {Promise<{ subjects: Array, tests: Array }>}
 */
export async function getUserData() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not signed in.");

    const subjectsQuery = query(collection(db, "subjects"), where("userId", "==", user.uid));
    const testsQuery = query(collection(db, "tests"), where("userId", "==", user.uid));

    const [subjectsSnap, testsSnap] = await Promise.all([
      getDocs(subjectsQuery),
      getDocs(testsQuery),
    ]);

    const subjects = subjectsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const tests = testsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    console.log("📘 User data retrieved successfully.");
    return { subjects, tests };
  } catch (error) {
    console.error("Error retrieving user data:", error.message);
    return { subjects: [], tests: [] };
  }
}
