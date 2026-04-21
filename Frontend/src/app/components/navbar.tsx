import { Music2 } from "lucide-react";
import { Link, useLocation } from "react-router";

export function Navbar() {
  const location = useLocation();
  
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
            className={`hover:text-accent transition-colors ${location.pathname === '/' ? 'text-accent' : 'text-foreground'}`}
          >
            Home
          </Link>
          <Link 
            to="/upload" 
            className={`hover:text-accent transition-colors ${location.pathname === '/upload' ? 'text-accent' : 'text-foreground'}`}
          >
            Upload
          </Link>
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-secondary transition-colors">
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}
