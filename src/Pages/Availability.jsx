import { useState } from "react";
import { Clock, CalendarCheck2, Sun, Moon } from "lucide-react";

export default function Availability() {
  const [availability, setAvailability] = useState({});
  const [focusTime, setFocusTime] = useState("evening");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleDay = (day) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--textSecondary)] p-8 font-inter">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-[var(--primary)] flex items-center gap-3">
          <Clock className="text-[var(--accent1)] w-8 h-8" />
          Availability & Focus Settings
        </h1>
        <p className="mt-2 text-gray-600 max-w-xl">
          Tell ChronoStudy when you’re most available and when you focus best. This helps generate your adaptive study plan.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Weekly Availability */}
        <section className="brand-glass p-6 border border-white/20 shadow-glass rounded-2xl">
          <h2 className="font-semibold text-lg text-[var(--primary)] mb-4 flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-[var(--accent1)]" />
            Weekly Availability
          </h2>
          <p className="text-sm text-gray-500 mb-4">Select the days you’re typically free to study.</p>
          <div className="grid grid-cols-2 gap-3">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`py-2 px-3 rounded-lg font-medium transition border text-sm shadow-soft backdrop-blur-sm ${
                  availability[day]
                    ? "bg-[var(--accent1)] text-[var(--primary)] border-transparent"
                    : "bg-white/60 text-gray-700 border border-white/40 hover:bg-white/80"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </section>

        {/* Focus Preferences */}
        <section className="brand-glass p-6 border border-white/20 shadow-glass rounded-2xl">
          <h2 className="font-semibold text-lg text-[var(--primary)] mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 text-[var(--accent1)]" />
            Focus Time Preferences
          </h2>
          <p className="text-sm text-gray-500 mb-4">When do you feel most alert and productive?</p>

          <div className="flex flex-col gap-3">
            <label className={`cursor-pointer p-3 rounded-lg border text-sm flex justify-between items-center transition ${focusTime === "morning" ? "bg-[var(--accent1)] text-[var(--primary)] border-transparent" : "bg-white/60 border-white/40"}`}>
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-[var(--accent1)]" /> Morning (6am – 12pm)
              </div>
              <input type="radio" checked={focusTime === "morning"} onChange={() => setFocusTime("morning")} />
            </label>

            <label className={`cursor-pointer p-3 rounded-lg border text-sm flex justify-between items-center transition ${focusTime === "afternoon" ? "bg-[var(--accent1)] text-[var(--primary)] border-transparent" : "bg-white/60 border-white/40"}`}>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--accent1)]" /> Afternoon (12pm – 6pm)
              </div>
              <input type="radio" checked={focusTime === "afternoon"} onChange={() => setFocusTime("afternoon")} />
            </label>

            <label className={`cursor-pointer p-3 rounded-lg border text-sm flex justify-between items-center transition ${focusTime === "evening" ? "bg-[var(--accent1)] text-[var(--primary)] border-transparent" : "bg-white/60 border-white/40"}`}>
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-[var(--accent1)]" /> Evening (6pm – 11pm)
              </div>
              <input type="radio" checked={focusTime === "evening"} onChange={() => setFocusTime("evening")} />
            </label>
          </div>
        </section>
      </div>

      <div className="mt-10 flex justify-end">
        <button className="bg-[var(--accent2)] hover:bg-[#e86455] text-white font-semibold px-6 py-3 rounded-xl shadow-soft transition">
          Save Preferences
        </button>
      </div>
    </div>
  );
}