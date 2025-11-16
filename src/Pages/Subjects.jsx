import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";
import { useSubjectContext } from "../context/SubjectContext"; // ✅ NEW

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [selectedSubjectColor, setSelectedSubjectColor] = useState(null);
  const user = auth.currentUser;
  const [studyPlans, setStudyPlans] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // ✅ NEW - get shared context
  const { selectedSubjectId, setSelectedSubjectId } = useSubjectContext();

  // ---- Fetch Data ----
  useEffect(() => {
    if (!user) return;

    const subjQuery = query(
      collection(db, "subjects"),
      where("userId", "==", user.uid)
    );

    const plansQuery = query(
  collection(db, "studyPlans"),
  where("userId", "==", user.uid)
);
const unsubscribePlans = onSnapshot(plansQuery, (snapshot) => {
  setStudyPlans(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
});

    const unsubscribeSubj = onSnapshot(subjQuery, (snapshot) => {
      setSubjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const testQuery = query(
      collection(db, "tests"),
      where("userId", "==", user.uid)
    );
    const unsubscribeTests = onSnapshot(testQuery, (snapshot) => {
      setTests(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const sessQuery = query(
      collection(db, "sessions"),
      where("userId", "==", user.uid)
    );
    const unsubscribeSessions = onSnapshot(sessQuery, (snapshot) => {
      setSessions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeSubj();
      unsubscribeTests();
      unsubscribeSessions();
      unsubscribePlans();
    };
  }, [user]);

  // ---- Helpers ----
  const getTestsForSubject = (subjectId) =>
    tests.filter((t) => t.subjectId === subjectId);
  const getSessionsForSubject = (subjectId) =>
    sessions.filter((s) => s.subjectId === subjectId);
  const getTotalStudyTime = (subjectId) =>
    getSessionsForSubject(subjectId).reduce(
      (sum, s) => sum + (s.duration || 0),
      0
    );

  // ---- Handle Color Change ----
  const handleColorPick = async (color) => {
    const targetSubject = expandedSubject || selectedSubjectId;
    if (!targetSubject || !user) return;

    try {
      const subjRef = doc(db, "subjects", targetSubject);
      await updateDoc(subjRef, { color });
      setSelectedSubjectColor(color);
      console.log("Updated color for subject:", targetSubject);
    } catch (err) {
      console.error("Error updating color:", err);
    }
  };

  // ---- Persist color selection per subject ----
  useEffect(() => {
    if (expandedSubject) {
      const subject = subjects.find((s) => s.id === expandedSubject);
      if (subject && subject.color) {
        setSelectedSubjectColor(subject.color);
      }
    }
  }, [expandedSubject, subjects]);

  // ✅ Sync context when expanding
  const handleExpand = (subjectId) => {
    const newState = expandedSubject === subjectId ? null : subjectId;
    setExpandedSubject(newState);
    setSelectedSubjectId(newState); // sync with sidebar
  };

  return (
    <SidebarLayout onColorPick={handleColorPick}>
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-900">
            Subjects Overview
          </h1>
          <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-md">
            Free Tier
          </span>
        </div>

        {/* How to Use Section */}
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg mb-6">
          <h2 className="font-semibold text-indigo-900 mb-1">
            How to Use This Page
          </h2>
          <p className="text-slate-700 text-sm">
            Click a subject to expand its details, view your related tests, and
            check total study time. Use the sidebar to change this subject’s
            color (saved automatically). Upgrade to{" "}
            <span className="font-medium text-indigo-700">
              ChronoStudy Plus
            </span>{" "}
            to unlock custom color customization and progress tracking.
          </p>
        </div>

        {/* Subject Cards */}
        <div className="grid md:grid-cols-2 auto-rows-auto gap-6 items-start">
          {subjects.length === 0 ? (
            <p className="text-slate-600 italic">No subjects found yet.</p>
          ) : (
            subjects.map((subject) => {
              const subjTests = getTestsForSubject(subject.id);
              const totalMinutes = getTotalStudyTime(subject.id);
              const isExpanded = expandedSubject === subject.id;
              const subjectColor = subject.color || "#33D4C6";

              return (
                <div
                  key={subject.id}
                  className="bg-white p-6 rounded-2xl shadow-sm border-l-4 transition-all duration-300"
                  style={{ borderColor: subjectColor }}
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-indigo-900">
                      {subject.name}
                    </h2>
                    <button
                      onClick={() => handleExpand(subject.id)} // ✅ replaced inline toggle
                      className="text-slate-500 hover:text-slate-700"
                    >
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  </div>

                  {/* Study Summary */}
                  <p className="text-slate-600 text-sm mb-1">
                    {subjTests.length} test
                    {subjTests.length !== 1 && "s"} scheduled
                  </p>
                  <p className="text-slate-600 text-sm">
                    {totalMinutes > 0
                      ? `${totalMinutes} minutes studied`
                      : "No study sessions yet."}
                  </p>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 border-t pt-3 space-y-3">
                      {subjTests.length === 0 ? (
                        <p className="text-slate-500 text-sm italic">
                          No tests available yet.
                        </p>
                      ) : (
                        subjTests.map((test) => {
                          const testSessions = sessions.filter(
                            (s) => s.subjectId === subject.id
                          );
                          const totalStudy = testSessions.reduce(
                            (sum, s) => sum + (s.duration || 0),
                            0
                          );

                          return (
                            <div
                              key={test.id}
                                className="bg-gray-50 p-3 rounded-lg flex flex-col gap-1 cursor-pointer hover:bg-gray-100 transition"
                                onClick={() => {
                                  setSelectedTest(test);
                                  setShowPlanModal(true);
                                }}
                              >
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-indigo-900">
                                  {test.name}
                                </h4>
                                <p className="text-slate-500 text-sm">
                                  {new Date(test.date).toLocaleDateString()}
                                </p>
                              </div>

                              {/* Progress Bar Placeholder */}
                              <div className="mt-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-gray-400 h-2"
                                  style={{
                                    width: `${Math.min(
                                      (totalStudy / 600) * 100,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 italic flex items-center gap-1">
                                <Lock size={12} /> Upgrade to Plus for progress
                                tracking.
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Linked Study Sessions */}
      {showPlanModal && selectedTest && (
  <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
      <h2 className="text-xl font-semibold text-indigo-900 mb-4">
        Study Plan — {selectedTest.name}
      </h2>

      {/* Linked Study Sessions */}
      <div className="max-h-96 overflow-y-auto space-y-3">
        {studyPlans
  .filter((p) => {
    // ✅ Include both properly linked plans and legacy ones missing testId
    const sameSubject = p.subjectId === selectedTest.subjectId;
    const sameTest = !p.testId || p.testId === selectedTest.id;
    return sameSubject && sameTest;
  })
  .map((plan) => (

            <div
              key={plan.id}
              className="p-3 border rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-indigo-900">
                  {new Date(plan.date).toLocaleDateString()}
                </p>
                <p className="text-sm text-slate-600">
                  {plan.duration} min — {plan.status || "scheduled"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const newDuration = prompt(
                      "Enter new duration (minutes):",
                      plan.duration
                    );
                    if (newDuration) {
                      await updateDoc(doc(db, "studyPlans", plan.id), {
                        duration: Number(newDuration),
                      });
                    }
                  }}
                  className="text-sm bg-[#33D4C6] text-white px-2 py-1 rounded hover:opacity-90 transition"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
  if (window.confirm("Delete this test?")) {
    await deleteDoc(doc(db, "tests", selectedTest.id));

    // ✅ Refresh local state so the test disappears immediately
    setSelectedTest(null);
    setShowPlanModal(false);

    // Optional: show confirmation toast
    alert("Test deleted successfully.");
  }
}}

                  className="text-sm bg-[#FF6F5E] text-white px-2 py-1 rounded hover:opacity-90 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

        {studyPlans.filter(
          (p) => p.subjectId === selectedTest.subjectId && p.testId === selectedTest.id
        ).length === 0 && (
          <p className="text-slate-600 italic text-sm">
            No study plan sessions found for this test.
          </p>
        )}
      </div>

      {/* Delete Entire Study Plan / Test */}
      <div className="flex justify-between mt-6">
        <button
          onClick={async () => {
            if (
              window.confirm(
                "Delete entire study plan for this test? This will remove all linked sessions."
              )
            ) {
              const linkedPlans = studyPlans.filter(
                (p) =>
                  p.subjectId === selectedTest.subjectId &&
                  p.testId === selectedTest.id
              );
              for (const plan of linkedPlans) {
                await deleteDoc(doc(db, "studyPlans", plan.id));
              }
            }
          }}
          className="px-4 py-2 bg-[#FF9F1C] text-white rounded-md hover:opacity-90 transition"
        >
          Delete Study Plan
        </button>

        <button
  onClick={async () => {
    if (
      window.confirm(
        "Delete this test and all linked study plans? This cannot be undone."
      )
    ) {
      try {
        // 🔹 Delete all study plans linked to this test
        const linkedPlans = studyPlans.filter(
          (p) =>
            p.subjectId === selectedTest.subjectId &&
            p.testId === selectedTest.id
        );

        for (const plan of linkedPlans) {
          await deleteDoc(doc(db, "studyPlans", plan.id));
        }

        // 🔹 Delete the test itself
        await deleteDoc(doc(db, "tests", selectedTest.id));

        // 🔹 Update UI immediately
        setTests((prev) => prev.filter((t) => t.id !== selectedTest.id));
        setStudyPlans((prev) =>
          prev.filter(
            (p) =>
              !(
                p.subjectId === selectedTest.subjectId &&
                p.testId === selectedTest.id
              )
          )
        );
        setSelectedTest(null);
        setShowPlanModal(false);

        alert("Test and all linked study plans deleted successfully.");
      } catch (error) {
        console.error("Error deleting test and plans:", error);
        alert("Failed to delete test. Check console for details.");
      }
    }
  }}
  className="px-4 py-2 bg-[#FF6F5E] text-white rounded-md hover:opacity-90 transition"
>
  Delete Test
</button>

      </div>

      {/* Close Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={() => setShowPlanModal(false)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </SidebarLayout>
  );
}
