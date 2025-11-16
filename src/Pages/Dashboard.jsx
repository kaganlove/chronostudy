import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import {
  BookOpen,
  Calendar,
  Plus,
  Clock,
  Play,
  StopCircle,
  Sparkles,
  Lock,
} from "lucide-react";

export default function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("subject");
  const [newSubject, setNewSubject] = useState("");
  const [newTest, setNewTest] = useState({ name: "", date: "", subjectId: "" });
  const [activeSession, setActiveSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // NEW STATES for Study Plan Generator
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [step, setStep] = useState(1);
  const [planData, setPlanData] = useState({
    subjectId: "",
    totalHours: "",
    testDate: "",
    daysOfWeek: [],
    preferredTime: "",
  });

  const user = auth.currentUser;

  // ---------- Firestore Sync ----------
  useEffect(() => {
    if (!user) return;

    const subjectQuery = query(collection(db, "subjects"), where("userId", "==", user.uid));
    const unsubscribeSubjects = onSnapshot(subjectQuery, (snapshot) => {
      setSubjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const testQuery = query(collection(db, "tests"), where("userId", "==", user.uid));
    const unsubscribeTests = onSnapshot(testQuery, (snapshot) => {
      setTests(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const sessionQuery = query(collection(db, "sessions"), where("userId", "==", user.uid));
    const unsubscribeSessions = onSnapshot(sessionQuery, (snapshot) => {
      setSessions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeSubjects();
      unsubscribeTests();
      unsubscribeSessions();
    };
  }, [user]);

  // ---------- Add Subject ----------
  const handleAddSubject = async () => {
    if (!newSubject.trim() || !user) return;
    try {
      await addDoc(collection(db, "subjects"), {
        name: newSubject.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
        color: "#33D4C6", // default color
      });
      setNewSubject("");
      setShowModal(false);
    } catch (error) {
      console.error("Error adding subject:", error);
    }
  };

  // ---------- Add Test ----------
  const handleAddTest = async () => {
    if (!newTest.name.trim() || !newTest.date || !newTest.subjectId || !user) return;
    try {
      await addDoc(collection(db, "tests"), {
        ...newTest,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewTest({ name: "", date: "", subjectId: "" });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding test:", error);
    }
  };

  // ---------- Helpers ----------
  const getNextTestForSubject = (subjectId) => {
    const subjectTests = tests.filter((t) => t.subjectId === subjectId);
    if (subjectTests.length === 0) return null;
    return subjectTests.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  };

  const getStudyMinutes = (subjectId) => {
    const subjectSessions = sessions.filter((s) => s.subjectId === subjectId);
    return subjectSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  };

  const getNextUpcomingTest = () => {
  if (tests.length === 0) return null;

  const today = new Date();
  const upcomingTests = tests.filter((t) => new Date(t.date) >= today);

  if (upcomingTests.length === 0) return null;

  return upcomingTests.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
};


  const nextTest = getNextUpcomingTest();

  // ---------- Timer ----------
  useEffect(() => {
    let timer;
    if (activeSession) {
      timer = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeSession]);

  const startSession = (subjectId) => {
    setActiveSession({ subjectId, startTime: Date.now() });
    setElapsedTime(0);
  };

  const endSession = async () => {
    if (!activeSession || !user) return;
    const durationMinutes = Math.floor(elapsedTime / 60);
    try {
      await addDoc(collection(db, "sessions"), {
        userId: user.uid,
        subjectId: activeSession.subjectId,
        duration: durationMinutes,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving session:", error);
    }
    setActiveSession(null);
    setElapsedTime(0);
  };

  // ---------- Study Plan Generation ----------

  // ---------- Helper for Preferred Time ----------
const getStartTime = (preferredTime) => {
  switch (preferredTime) {
    case "morning":
      return "8:00 AM";
    case "afternoon":
      return "1:00 PM";
    case "evening":
      return "6:30 PM";
    default:
      return "Anytime";
  }
};

  const handleGeneratePlan = async () => {
    if (
      !planData.subjectId ||
      !planData.totalHours ||
      !planData.testDate ||
      planData.daysOfWeek.length === 0 ||
      !planData.preferredTime
    ) {
      alert("Please complete all steps.");
      return;
    }

    const user = auth.currentUser;
    const totalHours = Number(planData.totalHours);
    const subject = subjects.find((s) => s.id === planData.subjectId);

    const startDate = new Date();
    const endDate = new Date(planData.testDate);
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

    let sessions = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayName = Object.keys(dayMap).find((key) => dayMap[key] === d.getDay());
      if (planData.daysOfWeek.includes(dayName)) {
        sessions.push(new Date(d));
      }
    }

    const minutesPerSession = Math.round((totalHours * 60) / sessions.length);

for (let date of sessions) {
  const startTime = getStartTime(planData.preferredTime);
  const durationMinutes = minutesPerSession;

  // Compute end time based on duration
  const endTime = (() => {
    const [hour, minute] = startTime.split(/[: ]/);
    const isPM = startTime.includes("PM");
    let totalMinutes =
      (parseInt(hour) % 12 + (isPM ? 12 : 0)) * 60 + parseInt(minute);
    totalMinutes += durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const suffix = endHours >= 12 ? "PM" : "AM";
    const displayHours = endHours % 12 === 0 ? 12 : endHours % 12;
    return `${displayHours}:${String(endMinutes).padStart(2, "0")} ${suffix}`;
  })();

  await addDoc(collection(db, "studyPlans"), {
    userId: user.uid,
    subjectId: planData.subjectId,
    testId: planData.linkedTestId || null,
    title: `${subject.name} Study Session`,
    date: date.toISOString().split("T")[0],
    preferredTime: planData.preferredTime,
    startTime,   // ✅ must be included
    endTime,     // ✅ must be included
    duration: durationMinutes,
    status: "scheduled",
    color: subject?.color || "#33D4C6",
    createdAt: serverTimestamp(),
  });
}


    setShowPlanModal(false);
    setStep(1); // Reset modal for next use
    setPlanData({
      subjectId: "",
      totalHours: "",
      testDate: "",
      daysOfWeek: [],
      preferredTime: "",
    });

    alert("Study plan generated and added to your calendar!");
  };

  // ---------- Layout ----------
  return (
    <div className="p-8 bg-[#F8F8F2] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-indigo-900">Welcome Kagan</h1>
        <div className="text-sm flex items-center gap-3">
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md">Free Tier</span>
          <button className="bg-[#33D4C6] text-white px-3 py-1 rounded-md hover:opacity-90">
            Upgrade
          </button>
        </div>
      </div>
      <p className="text-slate-600 mb-8">
        Here’s your study overview. Stay consistent and make every minute count.
      </p>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <BookOpen className="text-[#33D4C6]" size={28} />
          <div>
            <p className="text-slate-500 text-sm">Subjects</p>
            <p className="text-indigo-900 text-xl font-semibold">{subjects.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <Calendar className="text-[#33D4C6]" size={28} />
          <div>
            <p className="text-slate-500 text-sm">Next Test</p>
            <p className="text-indigo-900 text-xl font-semibold">
              {nextTest ? new Date(nextTest.date).toLocaleDateString() : "None"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4 hover:bg-[#f3f3ef] transition"
          >
            <Plus className="text-[#33D4C6]" size={28} />
            <div>
              <p className="text-slate-500 text-sm">Quick Add</p>
              <p className="text-indigo-900 text-xl font-semibold">New</p>
            </div>
          </button>

          <button
            onClick={() => setShowPlanModal(true)}
            className="bg-[#33D4C6] text-white rounded-2xl shadow-sm p-6 flex items-center gap-3 hover:opacity-90 transition"
          >
            <Clock size={28} />
            <div>
              <p className="text-sm">Auto Plan</p>
              <p className="text-lg font-semibold">Generate</p>
            </div>
          </button>
        </div>
      </div>

      {/* Subjects Section */}
      {subjects.length === 0 ? (
        <p className="text-slate-600">No subjects found yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {subjects.map((subject) => {
            const nextTest = getNextTestForSubject(subject.id);
            const totalMinutes = getStudyMinutes(subject.id);
            const isActive = activeSession?.subjectId === subject.id;

            return (
              <div
                key={subject.id}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition relative border-l-4"
                style={{ borderColor: subject.color || "#33D4C6" }}
              >
                <h3 className="text-lg font-semibold text-indigo-900 mb-1">
                  {subject.name}
                </h3>
                <p className="text-slate-600 text-sm mb-1">
                  {nextTest
                    ? `Next test: ${nextTest.name} (${new Date(nextTest.date).toLocaleDateString()})`
                    : "No tests scheduled yet."}
                </p>
                <div className="flex items-center gap-2 text-slate-600 text-sm mt-1">
                  <Clock size={16} className="text-[#33D4C6]" />
                  {totalMinutes > 0
                    ? `${totalMinutes} min studied`
                    : "No study sessions logged."}
                </div>

                {/* Progress Bar */}
                <div className="mt-3 bg-gray-200 h-2 rounded-full overflow-hidden relative">
                  <div
                    className="bg-gray-400 h-2 transition-all"
                    style={{
                      width: `${Math.min((totalMinutes / 60) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 italic">
                  Upgrade to Plus to unlock progress tracking.
                </p>

                {/* Study Timer */}
                <div className="mt-4 flex items-center justify-between">
                  {isActive ? (
                    <>
                      <p className="text-indigo-900 font-semibold">
                        {Math.floor(elapsedTime / 60)
                          .toString()
                          .padStart(2, "0")}
                        :
                        {(elapsedTime % 60)
                          .toString()
                          .padStart(2, "0")}
                      </p>
                      <button
                        onClick={endSession}
                        className="flex items-center gap-1 bg-[#FF6F5E] text-white px-3 py-1 rounded-md hover:opacity-90 transition"
                      >
                        <StopCircle size={16} />
                        End
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startSession(subject.id)}
                      className="flex items-center gap-1 bg-[#33D4C6] text-white px-3 py-1 rounded-md hover:opacity-90 transition"
                    >
                      <Play size={16} />
                      Start Session
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pro Upgrade Section */}
      <div className="mt-16 text-center bg-white p-8 rounded-2xl shadow-sm">
        <Sparkles className="mx-auto text-[#33D4C6]" size={40} />
        <h3 className="text-xl font-semibold text-indigo-900 mt-3">Upgrade to Pro</h3>
        <p className="text-slate-600 mt-2">
          Unlock customization, themes, widgets, and full dashboard control.
        </p>
        <button className="mt-4 bg-[#2D2A5A] text-white px-6 py-2 rounded-md hover:opacity-90 transition flex items-center gap-2 mx-auto">
          <Lock size={18} />
          Upgrade to Pro
        </button>
      </div>

{/* Quick Add Modal */}
{showModal && (
  <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-50">
    <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
      <h2 className="text-2xl font-semibold text-indigo-900 mb-6">
        Quick Add
      </h2>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setModalType("subject")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            modalType === "subject"
              ? "bg-[#33D4C6] text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Subject
        </button>
        <button
          onClick={() => setModalType("test")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            modalType === "test"
              ? "bg-[#33D4C6] text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Test
        </button>
      </div>

      {modalType === "subject" ? (
        <>
          <p className="mb-3 text-slate-600">Enter a new subject name:</p>
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="e.g., Physics"
            className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-[#33D4C6]"
          />
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSubject}
              className="px-4 py-2 bg-[#33D4C6] text-white rounded-md hover:opacity-90 transition"
            >
              Add Subject
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-slate-600">Enter new test details:</p>
          <input
            type="text"
            value={newTest.name}
            onChange={(e) =>
              setNewTest({ ...newTest, name: e.target.value })
            }
            placeholder="Test name"
            className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-[#33D4C6] mb-3"
          />
          <input
            type="date"
            value={newTest.date}
            onChange={(e) =>
              setNewTest({ ...newTest, date: e.target.value })
            }
            className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-[#33D4C6] mb-3"
          />
          <select
            value={newTest.subjectId}
            onChange={(e) =>
              setNewTest({ ...newTest, subjectId: e.target.value })
            }
            className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-[#33D4C6]"
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTest}
              className="px-4 py-2 bg-[#33D4C6] text-white rounded-md hover:opacity-90 transition"
            >
              Add Test
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}

      {/* Study Plan Modal */}
{showPlanModal && (
  <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-50">
    <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
      <h2 className="text-2xl font-semibold text-indigo-900 mb-6">
        Create Your Study Plan
      </h2>

      {/* Step 1: Select Subject */}
      {step === 1 && (
        <div>
          <p className="mb-3 text-slate-600">Which subject is this for?</p>
          <select
            value={planData.subjectId}
            onChange={(e) =>
              setPlanData({ ...planData, subjectId: e.target.value })
            }
            className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-[#33D4C6]"
          >
            <option value="">Select a subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Step 2: Select Linked Test */}
      {step === 2 && (
  <div>
    <p className="mb-3 text-slate-600">
      Which test is this plan preparing for?
    </p>
    <select
      value={planData.linkedTestId || ""}
      onChange={(e) => {
        const value = e.target.value;
        if (value === "new") {
          setPlanData({
            ...planData,
            linkedTestId: "",
            newTest: { name: "", date: "" },
          });
        } else {
          const selectedTest = tests.find((t) => t.id === value);
          setPlanData({
            ...planData,
            linkedTestId: value,
            testDate: selectedTest?.date || "",
          });
        }
      }}
      className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-[#33D4C6]"
    >
      <option value="">Select a test</option>
      {tests
        .filter((t) => t.subjectId === planData.subjectId)
        .map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} — {new Date(t.date).toLocaleDateString()}
          </option>
        ))}
      <option value="new">+ Add New Test</option>
    </select>

    {/* Inline New Test Creator */}
    {planData.newTest && (
      <div className="mt-4 space-y-3">
        <input
          type="text"
          placeholder="Test name"
          value={planData.newTest.name}
          onChange={(e) =>
            setPlanData({
              ...planData,
              newTest: { ...planData.newTest, name: e.target.value },
            })
          }
          className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-[#33D4C6]"
        />
        <input
          type="date"
          value={planData.newTest.date}
          onChange={(e) =>
            setPlanData({
              ...planData,
              newTest: { ...planData.newTest, date: e.target.value },
              testDate: e.target.value,
            })
          }
          className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-[#33D4C6]"
        />
        <button
          onClick={async () => {
            if (!planData.newTest.name || !planData.newTest.date) {
              alert("Please fill out both name and date.");
              return;
            }
            const docRef = await addDoc(collection(db, "tests"), {
              ...planData.newTest,
              subjectId: planData.subjectId,
              userId: user.uid,
              createdAt: serverTimestamp(),
            });
            setPlanData({
              ...planData,
              linkedTestId: docRef.id,
              newTest: null,
            });
            alert("New test added!");
          }}
          className="px-3 py-2 bg-[#33D4C6] text-white rounded-md hover:opacity-90 transition text-sm"
        >
          Save Test
        </button>
      </div>
    )}
  </div>
)}

      {/* Step 3: Total Hours */}
      {step === 3 && (
        <div>
          <p className="mb-3 text-slate-600">
            How many total hours do you want to study before your test?
          </p>
          <input
            type="number"
            value={planData.totalHours}
            onChange={(e) =>
              setPlanData({ ...planData, totalHours: e.target.value })
            }
            placeholder="e.g., 10"
            className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-[#33D4C6]"
          />
        </div>
      )}

      {/* Step 4: Test Date */}
      {step === 4 && (
        <div>
          <p className="mb-3 text-slate-600">When is your test?</p>
          <input
            type="date"
            value={planData.testDate}
            onChange={(e) =>
              setPlanData({ ...planData, testDate: e.target.value })
            }
            className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-[#33D4C6]"
          />
        </div>
      )}

      {/* Step 5: Study Days */}
      {step === 5 && (
        <div>
          <p className="mb-3 text-slate-600">
            Which days of the week can you study?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <button
                key={day}
                onClick={() => {
                  const selected = planData.daysOfWeek.includes(day)
                    ? planData.daysOfWeek.filter((d) => d !== day)
                    : [...planData.daysOfWeek, day];
                  setPlanData({ ...planData, daysOfWeek: selected });
                }}
                className={`py-2 rounded-md border text-sm ${
                  planData.daysOfWeek.includes(day)
                    ? "bg-[#33D4C6] text-white"
                    : "bg-white border-gray-300 text-slate-700"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 6: Preferred Time */}
      {step === 6 && (
        <div>
          <p className="mb-3 text-slate-600">
            What time of day do you study best?
          </p>
          <select
            value={planData.preferredTime}
            onChange={(e) =>
              setPlanData({ ...planData, preferredTime: e.target.value })
            }
            className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-[#33D4C6]"
          >
            <option value="">Select a time</option>
            <option value="morning">Morning (8AM–12PM)</option>
            <option value="afternoon">Afternoon (12PM–5PM)</option>
            <option value="evening">Evening (5PM–9PM)</option>
          </select>
        </div>
      )}

      {/* Navigation Buttons */}
<div className="flex justify-between mt-8 items-center">
  <div className="flex gap-2">
    <button
      onClick={() => {
        setShowPlanModal(false);
        setStep(1);
        setPlanData({
          subjectId: "",
          linkedTestId: "",
          totalHours: "",
          testDate: "",
          daysOfWeek: [],
          preferredTime: "",
        });
      }}
      className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300 transition"
    >
      Cancel
    </button>

    {step > 1 && (
      <button
        onClick={() => setStep(step - 1)}
        className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300 transition"
      >
        Back
      </button>
    )}
  </div>

  {step < 6 ? (
    <button
      onClick={() => setStep(step + 1)}
      className="px-4 py-2 bg-[#33D4C6] text-white rounded-md hover:opacity-90 transition"
    >
      Next
    </button>
  ) : (
    <button
      onClick={handleGeneratePlan}
      className="px-4 py-2 bg-[#33D4C6] text-white rounded-md hover:opacity-90 transition"
    >
      Generate Plan
    </button>
  )}
</div>

    </div>
  </div>
)}
</div>  
  );
}