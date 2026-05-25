import { useState, useRef, useEffect } from "react";
import { BookOpen, LogOut, LogIn } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../lib/auth-context";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, loading, signInWithGoogle, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // user closed popup — no-op
    }
  };

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#1C1917]/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-[#1C1917] hover:opacity-80 transition-opacity"
          style={{ fontFamily: "DM Serif Display, Georgia, serif" }}
        >
          Oh Sheet!
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-[#1C1917] ${
              location.pathname === "/"
                ? "text-[#1C1917] font-semibold"
                : "text-[#1C1917]/60"
            }`}
          >
            Home
          </Link>
          <Link
            to="/upload"
            className={`text-sm font-medium transition-colors hover:text-[#1C1917] ${
              location.pathname === "/upload"
                ? "text-[#1C1917] font-semibold"
                : "text-[#1C1917]/60"
            }`}
          >
            Upload
          </Link>
          <Link
            to="/library"
            className={`text-sm font-medium transition-colors hover:text-[#1C1917] ${
              location.pathname === "/library"
                ? "text-[#1C1917] font-semibold"
                : "text-[#1C1917]/60"
            }`}
          >
            Library
          </Link>

          {/* Auth */}
          {!loading && (
            currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName ?? "User"}
                      className="w-8 h-8 rounded-full border-2 border-[#1C1917]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1C1917] flex items-center justify-center text-white text-sm font-semibold">
                      {(currentUser.displayName ?? currentUser.email ?? "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-[#1C1917] font-medium hidden sm:block">
                    {currentUser.displayName?.split(" ")[0] ?? "Account"}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-[#1C1917] rounded-xl shadow-[4px_4px_0_#1C1917] py-1 z-50">
                    <div className="px-4 py-2 border-b border-[#1C1917]/10">
                      <p className="text-sm font-semibold text-[#1C1917] truncate">
                        {currentUser.displayName ?? "User"}
                      </p>
                      <p className="text-xs text-[#1C1917]/50 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/library"); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#1C1917] hover:bg-[#F5F0E8] transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      My Library
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#1C1917] hover:bg-[#F5F0E8] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1C1917] text-white border-2 border-[#1C1917] rounded-full text-sm font-medium hover:translate-y-[-2px] transition-all shadow-[4px_4px_0_#1C1917] hover:shadow-[6px_6px_0_#1C1917]"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
      `}</style>
    </nav>
  );
}
