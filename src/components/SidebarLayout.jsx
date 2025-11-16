import React, { useState, useEffect } from "react";
import { Filter, Settings } from "lucide-react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useSubjectContext } from "../context/SubjectContext";

export default function SidebarLayout({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  const { selectedSubjectId } = useSubjectContext();
  const [activeColor, setActiveColor] = useState(null);

  // Watch for color changes of the selected subject
  useEffect(() => {
    if (!selectedSubjectId) return;

    const unsub = onSnapshot(doc(db, "subjects", selectedSubjectId), (docSnap) => {
      if (docSnap.exists()) {
        setActiveColor(docSnap.data().color || null);
      }
    });

    return () => unsub();
  }, [selectedSubjectId]);

  // Update color in Firestore
  const handleColorChange = async (color) => {
    if (!selectedSubjectId) return;
    try {
      const ref = doc(db, "subjects", selectedSubjectId);
      await updateDoc(ref, { color });
      setActiveColor(color);
      console.log(`Updated color for subject ${selectedSubjectId} → ${color}`);
    } catch (error) {
      console.error("Error updating color:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FCFBF7] transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={`relative bg-white border-r border-slate-200 shadow-sm transition-all duration-300 ease-in-out ${
          isOpen ? "w-48 p-4" : "w-0 p-0"
        }`}
      >
        {/* Sidebar content */}
        <div
          className={`transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Color Options */}
          <div className="mb-8">
            <h2 className="text-indigo-900 font-semibold mb-3 text-sm">
              Color Options
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {[
                "#FF6B6B", // Red
                "#FF9F1C", // Orange
                "#FFD93D", // Yellow
                "#6BCB77", // Green
                "#4D96FF", // Blue
                "#8358E8", // Purple
              ].map((color) => (
                <div
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-7 h-7 rounded-full cursor-pointer border transition-transform hover:scale-105 ${
                    activeColor === color
                      ? "ring-2 ring-black border-black"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Set color: ${color}`}
                ></div>
              ))}
            </div>

            <p className="text-xs italic text-slate-500 mt-3 leading-snug">
              Choose a color to assign it to the selected subject.
              <br />
              Custom color selection available in{" "}
              <span className="font-medium text-indigo-600">
                ChronoStudy Plus
              </span>
              .
            </p>
          </div>

          {/* Filter Options */}
          <div className="space-y-2">
            <h2 className="text-indigo-900 font-semibold mb-2 text-sm">
              Filter Options
            </h2>
            <select className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-400">
              <option value="all">All</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Toggle Tab */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            absolute -right-6 top-3 w-6 h-14
            flex items-center justify-center
            bg-white border border-slate-200 border-l-0
            rounded-r-md hover:bg-slate-50
            transition-all duration-300
          `}
          title={isOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          <Settings size={18} className="text-indigo-700" />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-12 p-8 overflow-y-auto bg-[#FCFBF7] text-slate-800 transition-colors duration-300">
        {children}
      </main>
    </div>
  );
}
