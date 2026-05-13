import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { Music2, Download, Trash2, FolderOpen, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth-context";
import { deleteScore, type SavedScore } from "../lib/save-score";
import { Navbar } from "../components/navbar";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LibraryPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [scores, setScores] = useState<SavedScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "users", currentUser.uid, "scores"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: SavedScore[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title ?? "Untitled",
          fileName: data.fileName ?? "",
          createdAt: data.createdAt?.toDate() ?? new Date(),
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
          musicXml: data.musicXml ?? "",
          thumbnailDataUrl: data.thumbnailDataUrl ?? null,
          info: data.info ?? { keyFifths: 0, keyMode: "major", beats: 4, beatType: 4 },
        };
      });
      setScores(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleOpen = (score: SavedScore) => {
    navigate("/editor", {
      state: { musicXml: score.musicXml, fileName: score.fileName },
    });
  };

  const handleDownload = (score: SavedScore) => {
    const blob = new Blob([score.musicXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = score.fileName.replace(/\.[^.]+$/, "") + ".musicxml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (score: SavedScore) => {
    if (!currentUser) return;
    setDeletingId(score.id);
    try {
      await deleteScore(currentUser.uid, score.id);
      toast.success(`"${score.title}" deleted`);
    } catch {
      toast.error("Failed to delete score");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <BookOpen className="w-7 h-7 text-accent" />
            <h1 className="text-3xl font-bold text-primary">My Library</h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : scores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <Music2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-primary mb-2">No scores yet</h2>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Transcribe a sheet music image and save it to your library.
              </p>
              <button
                onClick={() => navigate("/upload")}
                className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Upload Sheet Music
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {scores.map((score) => (
                <div
                  key={score.id}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-accent/50 transition-colors group"
                >
                  <div
                    className="aspect-[3/2] bg-muted flex items-center justify-center overflow-hidden cursor-pointer relative"
                    onClick={() => handleOpen(score)}
                  >
                    {score.thumbnailDataUrl ? (
                      <img
                        src={score.thumbnailDataUrl}
                        alt={score.title}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <Music2 className="w-12 h-12 text-muted-foreground/40" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <FolderOpen className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>

                  <div className="p-4">
                    <h3
                      className="font-semibold text-primary truncate cursor-pointer hover:text-accent transition-colors mb-1"
                      onClick={() => handleOpen(score)}
                    >
                      {score.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {formatDate(score.createdAt)}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpen(score)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Open
                      </button>
                      <button
                        onClick={() => handleDownload(score)}
                        className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        title="Download MusicXML"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(score)}
                        disabled={deletingId === score.id}
                        className="p-1.5 rounded-lg bg-muted hover:bg-destructive/20 hover:text-destructive transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
