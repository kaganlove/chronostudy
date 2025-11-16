import { createContext, useContext, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const SubjectContext = createContext();

export function SubjectProvider({ children }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  // Update a subject's color in Firestore
  const updateSubjectColor = async (subjectId, color) => {
    if (!subjectId) return;
    try {
      const ref = doc(db, "subjects", subjectId);
      await updateDoc(ref, { color });
      console.log(`✅ Updated subject ${subjectId} to color ${color}`);
    } catch (err) {
      console.error("❌ Error updating subject color:", err);
    }
  };

  return (
    <SubjectContext.Provider
      value={{ selectedSubjectId, setSelectedSubjectId, updateSubjectColor }}
    >
      {children}
    </SubjectContext.Provider>
  );
}

export const useSubjectContext = () => useContext(SubjectContext);
