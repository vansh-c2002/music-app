import { useState, useRef, useEffect } from "react";
import { Music2, BookOpen, LogOut, LogIn } from "lucide-react";
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Music2 className="w-8 h-8 text-primary" />
          <span className="text-xl font-semibold text-primary">Oh Sheet!</span>
        </Link>

        <div className="flex items-center gap-8">
          <Link
            to="/"
            className={`hover:text-accent transition-colors ${location.pathname === "/" ? "text-accent" : "text-foreground"}`}
          >
            Home
          </Link>
          <Link
            to="/upload"
            className={`hover:text-accent transition-colors ${location.pathname === "/upload" ? "text-accent" : "text-foreground"}`}
          >
            Upload
          </Link>

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
                      className="w-8 h-8 rounded-full border border-border"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-semibold">
                      {(currentUser.displayName ?? currentUser.email ?? "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-foreground hidden sm:block">
                    {currentUser.displayName?.split(" ")[0] ?? "Account"}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-primary truncate">
                        {currentUser.displayName ?? "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/library"); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      My Library
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
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
                className="flex items-center gap-2 px-5 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
