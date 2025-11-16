import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Brain, Clock } from "lucide-react";

export default function HeroDashboard() {
  return (
    <div className="min-h-screen bg-[#F8F8F2] flex flex-col items-center justify-center text-center px-6">
      <div className="max-w-3xl">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/src/assets/chronostudy-logo.png"
            alt="ChronoStudy Icon"
            className="h-20 w-20 mb-4"
          />
          <h1 className="text-4xl font-bold text-[#2D2A5A]">Welcome to ChronoStudy</h1>
          <p className="text-lg text-[#4A4A4A] mt-2">
            Master your minutes, master your mind.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          <Link
            to="/dashboard"
            className="p-6 rounded-2xl shadow-md bg-white hover:shadow-lg transition-all border border-[#33D4C6]/20"
          >
            <Calendar className="h-10 w-10 text-[#33D4C6] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#2D2A5A]">Dashboard</h3>
            <p className="text-sm text-[#4A4A4A] mt-1">
              Track your subjects, tests, and schedules.
            </p>
          </Link>

          <Link
            to="/availability"
            className="p-6 rounded-2xl shadow-md bg-white hover:shadow-lg transition-all border border-[#33D4C6]/20"
          >
            <Clock className="h-10 w-10 text-[#33D4C6] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#2D2A5A]">Availability</h3>
            <p className="text-sm text-[#4A4A4A] mt-1">
              Set your ideal study windows or sync your calendar.
            </p>
          </Link>

          <Link
            to="/planner"
            className="p-6 rounded-2xl shadow-md bg-white hover:shadow-lg transition-all border border-[#33D4C6]/20"
          >
            <Brain className="h-10 w-10 text-[#33D4C6] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#2D2A5A]">AI Study Planner</h3>
            <p className="text-sm text-[#4A4A4A] mt-1">
              Let ChronoStudy intelligently build your study plan.
            </p>
          </Link>
        </div>

        <div className="mt-12">
          <Link
            to="/dashboard"
            className="bg-[#33D4C6] text-[#2D2A5A] px-8 py-3 rounded-full font-medium hover:bg-[#2D2A5A] hover:text-white transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
