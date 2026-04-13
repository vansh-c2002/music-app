import { Link } from "react-router";
import { Home, Upload } from "lucide-react";
import { Navbar } from "../components/navbar";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center px-6">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-accent mb-4">404</h1>
            <h2 className="text-3xl font-semibold text-primary mb-4">Page Not Found</h2>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Link
              to="/"
              className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Link>
            <Link
              to="/upload"
              className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-all flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Music
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
