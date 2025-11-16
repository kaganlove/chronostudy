import React, { useState, useEffect } from "react";
import SidebarLayout from "../components/SidebarLayout";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useSubjectContext } from "../context/SubjectContext";

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [studyPlans, setStudyPlans] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const { setSelectedSubjectId } = useSubjectContext();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const subjQuery = query(collection(db, "subjects"), where("userId", "==", user.uid));
    const unsubSubj = onSnapshot(subjQuery, (snapshot) => {
      setSubjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const testQuery = query(collection(db, "tests"), where("userId", "==", user.uid));
    const unsubTests = onSnapshot(testQuery, (snapshot) => {
      setTests(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const planQuery = query(collection(db, "studyPlans"), where("userId", "==", user.uid));
    const unsubPlans = onSnapshot(planQuery, (snapshot) => {
      setStudyPlans(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubSubj();
      unsubTests();
      unsubPlans();
    };
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
const [newBlock, setNewBlock] = useState({
  subjectId: "",
  testId: "",
  date: "",
  startTime: "",
  duration: "",
});

  const handleDayClick = (day) => {
    setSelectedDate(day);
    setIsDrawerOpen(true);
  };

  const getTestsForDay = (day) => {
    if (!day) return [];
    const ymd = format(day, "yyyy-MM-dd");
    return tests.filter((t) => {
      if (typeof t.date === "string") return t.date === ymd;
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
      );
    });
  };

  const getPlansForDay = (day) => {
    if (!day) return [];
    const ymd = format(day, "yyyy-MM-dd");
    return studyPlans.filter((p) => {
      if (typeof p.date === "string") return p.date === ymd;
      const d = p.date?.toDate ? p.date.toDate() : new Date(p.date);
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
      );
    });
  };

  const getSubjectById = (id) => subjects.find((s) => s.id === id);
  const getSubjectColor = (subjectId) => getSubjectById(subjectId)?.color || "#4A4A4A";

  const formatPreferredTime = (pref) => {
    switch (pref) {
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

  const getSubjectName = (id) => {
    const subj = subjects?.find((s) => s.id === id);
    return subj ? subj.name : "Unknown Subject";
  };

  const getLinkedTestName = (subjectId) => {
    const test = tests?.find((t) => t.subjectId === subjectId);
    return test ? test.name : null;
  };

  const renderDays = () => {
    const dateFormat = "EEE";
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(
        <div
          key={i}
          className="text-center font-medium text-slate-600 py-2 border-b border-slate-200"
        >
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7">{days}</div>;
  };

  const renderCells = () => {
    const rows = [];
    let cells = [];
    let day = startDate;
    const dateFormat = "d";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;

        const dayEvents = [
          ...getTestsForDay(day),
          ...getPlansForDay(day).map((p) => ({
            ...p,
            name: p.title || "Study Session",
            isPlan: true,
          })),
        ];

        cells.push(
          <div
            key={day.toISOString()}
            className={`relative h-24 flex flex-col items-start justify-start p-2 border border-slate-200 text-sm transition
              ${!isSameMonth(day, monthStart) ? "bg-slate-100 text-slate-400" : "bg-white text-slate-700"}
              ${selectedDate && isSameDay(day, selectedDate) ? "bg-indigo-100 border-indigo-400" : "hover:bg-indigo-50"}
            `}
            onClick={() => handleDayClick(cloneDay)}
          >
            <span className="text-xs font-medium text-slate-600 mb-1">
              {format(day, dateFormat)}
            </span>

            <div className="flex flex-col gap-1 mt-1 pl-2 w-full items-start overflow-hidden">
              {dayEvents.slice(0, 4).map((t) => {
                const subj = getSubjectById(t.subjectId);
                const color = getSubjectColor(t.subjectId);
                const isSelected = selectedEventId === t.id;

                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-1 cursor-pointer rounded-sm px-1 transition
                      ${isSelected ? "ring-2 ring-indigo-300 bg-indigo-50" : "hover:bg-slate-100"}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEventId(t.id);
                      setSelectedSubjectId(subj?.id || null);
                      setSelectedDate(cloneDay);
                      setIsDrawerOpen(true);
                    }}
                    title={`${subj?.name || "Subject"} — ${t.name}`}
                    style={{
                      backgroundColor: t.isPlan ? `${color}15` : undefined,
                    }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className="text-[11px] truncate max-w-[150px] font-medium"
                      style={{ color: t.isPlan ? "#444" : "#222" }}
                    >
                      {t.isPlan
                        ? `${t.name} — ${t.startTime || formatPreferredTime(t.preferredTime)} (${t.duration || 45} min)`
                        : t.name}
                    </span>
                  </div>
                );
              })}
              {dayEvents.length > 4 && (
                <span className="text-[10px] text-slate-400 pl-1">
                  +{dayEvents.length - 4} more
                </span>
              )}
            </div>
          </div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div key={day.toISOString()} className="grid grid-cols-7">
          {cells}
        </div>
      );
      cells = [];
    }

    return <div>{rows}</div>;
  };

  return (
    <SidebarLayout>
      <div className="relative flex flex-col w-full bg-[#FCFBF7] text-slate-800 p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <button onClick={prevMonth} className="text-indigo-700 hover:text-indigo-900 transition">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-semibold text-indigo-900">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button onClick={nextMonth} className="text-indigo-700 hover:text-indigo-900 transition">
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="rounded-lg shadow bg-white overflow-hidden border border-slate-200">
          {renderDays()}
          {renderCells()}
        </div>

        <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
  <p className="text-slate-500 text-sm max-w-[60%] leading-relaxed">
    Click a study block to select its subject, then change the color from the left sidebar.
    You can also add new blocks or sessions directly to your schedule using the button on the right.
  </p>
  <button
  onClick={() => setShowAddBlockModal(true)}
  className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow hover:bg-indigo-700 transition self-end md:self-auto"
>
  + Add Study Block
</button>
</div>


        {/* Sidebar Drawer */}
        <div
          className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-[#F8F8F2]">
            <h3 className="text-lg font-semibold text-indigo-900">
              {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "No Date Selected"}
            </h3>
            <button onClick={() => setIsDrawerOpen(false)} className="text-slate-500 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 text-slate-700">
            <p className="mb-3 text-sm text-slate-500">
              Study sessions for this date will appear here.
            </p>

            <div className="space-y-2">
              {selectedDate &&
                [...getTestsForDay(selectedDate), ...getPlansForDay(selectedDate)].map((t) => {
                  const subj = getSubjectById(t.subjectId);
                  const color = getSubjectColor(t.subjectId);
                  return (
                    <div
  key={t.id}
  className="p-3 rounded-md text-sm leading-snug shadow-sm border"
  style={{
    borderLeft: `4px solid ${color}`,
    backgroundColor: `${color}10`,
  }}
>
  <h3 className="font-semibold text-indigo-900 mb-1">
    {t.title || "Study Session"}
  </h3>
  <p className="text-sm text-slate-700">
    <span className="font-medium">Subject:</span> {getSubjectName(t.subjectId)}
  </p>
  <p className="text-sm text-slate-700">
    <span className="font-medium">Time:</span> {t.startTime || formatPreferredTime(t.preferredTime)}
  </p>
  <p className="text-sm text-slate-700">
    <span className="font-medium">Duration:</span> {t.duration || 45} min
  </p>
  <p className="text-sm text-slate-700 italic mb-2">
    <span className="font-medium">Linked Test:</span>{" "}
    {getLinkedTestName(t.subjectId) || "None"}
  </p>

  {/* Action Buttons */}
  <div className="flex gap-2 mt-2">
    <button
      onClick={async () => {
        const newDuration = prompt(
          "Enter new duration (minutes):",
          t.duration || 45
        );
        if (newDuration) {
          try {
            await updateDoc(doc(db, "studyPlans", t.id), {
              duration: Number(newDuration),
            });
            alert("Study session updated!");
          } catch (error) {
  console.error("Error adding study block:", error.message);
  alert(`Failed to add study block: ${error.message}`);
}
        }
      }}
      className="text-sm bg-[#33D4C6] text-white px-3 py-1 rounded hover:opacity-90 transition"
    >
      Edit
    </button>

    <button
      onClick={async () => {
        if (window.confirm("Are you sure you want to delete this study session?")) {
          try {
            await deleteDoc(doc(db, "studyPlans", t.id));
            alert("Study session deleted!");
          } catch (error) {
            console.error("Error deleting session:", error);
            alert("Failed to delete session.");
          }
        }
      }}
      className="text-sm bg-[#FF6F5E] text-white px-3 py-1 rounded hover:opacity-90 transition"
    >
      Delete
    </button>
  </div>
</div>

                  );
                })}
            </div>
          </div>
        </div>

        {isDrawerOpen && (
          <div
            className="fixed top-0 right-0 bottom-0 left-56 bg-black/30 z-40"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}
      </div>
      {showAddBlockModal && (
  <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
      <h2 className="text-xl font-semibold text-indigo-900 mb-4">
        Add Study Block
      </h2>

      {/* Subject */}
      <label className="block mb-2 text-sm text-slate-700">Subject</label>
      <select
        value={newBlock.subjectId}
        onChange={(e) => setNewBlock({ ...newBlock, subjectId: e.target.value })}
        className="w-full border border-gray-300 rounded-md p-2 mb-4"
      >
        <option value="">Select a subject</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* Test */}
      <label className="block mb-2 text-sm text-slate-700">Linked Test (optional)</label>
      <select
        value={newBlock.testId}
        onChange={(e) => setNewBlock({ ...newBlock, testId: e.target.value })}
        className="w-full border border-gray-300 rounded-md p-2 mb-4"
      >
        <option value="">None</option>
        {tests
          .filter((t) => t.subjectId === newBlock.subjectId)
          .map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
      </select>

      {/* Date */}
      <label className="block mb-2 text-sm text-slate-700">Date</label>
      <input
        type="date"
        value={newBlock.date}
        onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })}
        className="w-full border border-gray-300 rounded-md p-2 mb-4"
      />

      {/* Time */}
      <label className="block mb-2 text-sm text-slate-700">Start Time</label>
      <input
        type="time"
        value={newBlock.startTime}
        onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
        className="w-full border border-gray-300 rounded-md p-2 mb-4"
      />

      {/* Duration */}
      <label className="block mb-2 text-sm text-slate-700">Duration (minutes)</label>
      <input
        type="number"
        value={newBlock.duration}
        onChange={(e) => setNewBlock({ ...newBlock, duration: e.target.value })}
        placeholder="e.g. 60"
        className="w-full border border-gray-300 rounded-md p-2 mb-6"
      />

      {/* Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setShowAddBlockModal(false)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            if (!newBlock.subjectId || !newBlock.date || !newBlock.startTime || !newBlock.duration) {
              alert("Please fill out all required fields.");
              return;
            }
            try {
              await addDoc(collection(db, "studyPlans"), {
                userId: auth.currentUser.uid,
                subjectId: newBlock.subjectId,
                testId: newBlock.testId || null,
                title: `${getSubjectName(newBlock.subjectId)} Study Session`,
                date: newBlock.date,
                startTime: newBlock.startTime,
                duration: Number(newBlock.duration),
                status: "scheduled",
                color:
                  subjects.find((s) => s.id === newBlock.subjectId)?.color || "#33D4C6",
                createdAt: serverTimestamp(),
              });
              setNewBlock({
                subjectId: "",
                testId: "",
                date: "",
                startTime: "",
                duration: "",
              });
              setShowAddBlockModal(false);
              alert("Study block added successfully!");
            } catch (error) {
              console.error("Error adding study block:", error);
              alert("Failed to add study block.");
            }
          }}
          className="px-4 py-2 bg-[#33D4C6] text-white rounded-md hover:opacity-90 transition"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
    </SidebarLayout>
  );
}
