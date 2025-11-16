import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { LogOut, Clock, LayoutDashboard, CalendarDays, BookOpen } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import { signIn, signOutUser, watchAuth, db } from "./lib/firebase";
import HeroDashboard from "./Pages/HeroDashboard";
import Dashboard from "./Pages/Dashboard";
import Availability from "./Pages/Availability";
import CalendarPage from "./Pages/Calendar";
import SubjectsPage from "./Pages/Subjects";
import ChronoLogo from "./assets/chronostudy-logo.png";

// ✅ New import for shared state context
import { SubjectProvider } from "./context/SubjectContext";

export default function App() {
  const [user, setUser] = useState(null);
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = watchAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setTier(userSnap.data().tier || "free");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    // ✅ Wrapped everything in SubjectProvider for shared subject selection
    <SubjectProvider>
      <Router>
        <div className="min-h-screen bg-[#F8F8F2] text-[#4A4A4A] font-[Manrope]">
          {/* Header */}
          <header className="flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-white/30 px-8 py-4 shadow-sm">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src={ChronoLogo}
                  alt="ChronoStudy Logo"
                  className="w-8 h-8 object-contain"
                />
                <h1 className="text-xl font-bold text-[#2D2A5A]">ChronoStudy</h1>
              </Link>

              <nav className="flex gap-4 text-sm">
                <Link
                  to="/dashboard"
                  className="hover:text-[#33D4C6] flex items-center gap-1"
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <Link
                  to="/subjects"
                  className="hover:text-[#33D4C6] flex items-center gap-1"
                >
                  <BookOpen className="w-4 h-4" /> Subjects
                </Link>
                <Link
                  to="/calendar"
                  className="hover:text-[#33D4C6] flex items-center gap-1"
                >
                  <CalendarDays className="w-4 h-4" /> Calendar
                </Link>
                <Link
                  to="/availability"
                  className="hover:text-[#33D4C6] flex items-center gap-1"
                >
                  <Clock className="w-4 h-4" /> Availability
                </Link>
              </nav>
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#2D2A5A] capitalize">
                  Tier: {tier}
                </span>
                <button
                  onClick={signOutUser}
                  className="bg-[#FF6F5E] hover:bg-[#e86455] transition text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="bg-[#33D4C6] hover:bg-[#2D2A5A] hover:text-white transition text-[#2D2A5A] px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-sm"
              >
                Sign in with Google
              </button>
            )}
          </header>

          {/* Routes */}
          <Routes>
            <Route path="/" element={<HeroDashboard user={user} />} />
            <Route
              path="/dashboard"
              element={<Dashboard user={user} tier={tier} />}
            />
            <Route
              path="/subjects"
              element={<SubjectsPage user={user} tier={tier} />}
            />
            <Route
              path="/calendar"
              element={<CalendarPage user={user} tier={tier} />}
            />
            <Route path="/availability" element={<Availability />} />
          </Routes>
        </div>
      </Router>
    </SubjectProvider>
  );
}
