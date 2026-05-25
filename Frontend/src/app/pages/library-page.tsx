import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Music2, Download, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth-context";
import { deleteScore, type SavedScore } from "../lib/save-score";
import { Navbar } from "../components/navbar";

type ScoreTypeFilter = "all" | "classical" | "jazz";

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ScoreTypeFilter>("all");

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
          info: data.info ?? {
            keyFifths: 0,
            keyMode: "major",
            beats: 4,
            beatType: 4,
          },
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

  const pastelColors = [
    "#F2C4C4",
    "#B8D8E8",
    "#B8D4B0",
    "#F5E6A0",
    "#F9C8D8",
    "#B8D8E8",
  ];

  return (
    <div className="relative min-h-screen bg-white">
      <Navbar />

      {/* Graph paper background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-60 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(28, 25, 23, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(28, 25, 23, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative pt-28 pb-20 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1
              className="text-7xl font-serif font-bold mb-4 tracking-tight"
              style={{
                fontFamily: "DM Serif Display, Georgia, serif",
                letterSpacing: "-0.03em",
              }}
            >
              Your Score Library
            </h1>
            <p className="text-xl text-[#1C1917]/70">
              All your converted sheet music in one place
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 bg-white border-2 border-[#1C1917] rounded-full p-1 shadow-[4px_4px_0_#1C1917] mt-4">
            {(["all", "classical", "jazz"] as ScoreTypeFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-6 py-2 rounded-full transition-all font-medium text-sm capitalize
                  ${filter === tab
                    ? "bg-[#1C1917] text-white"
                    : "text-[#1C1917] hover:bg-[#1C1917]/5"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-4 border-[#1C1917] border-t-[#7FFFD4] rounded-full animate-spin" />
          </div>
        ) : scores.length === 0 ? (
          /* Empty state */
          <div className="text-center py-24">
            <div className="relative w-64 h-24 mx-auto mb-8">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t-2 border-[#1C1917]/40"
                  style={{ top: `${i * 16}px` }}
                />
              ))}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl">
                𝄽
              </div>
            </div>
            <p className="text-2xl text-[#1C1917]/60 mb-8">
              No scores yet — upload your first one.
            </p>
            <Link
              to="/upload"
              className="inline-block px-8 py-3 bg-[#7FFFD4] border-2 border-[#1C1917] rounded-full font-medium hover:translate-y-[-2px] transition-all shadow-[4px_4px_0_#1C1917] hover:shadow-[6px_6px_0_#1C1917]"
            >
              Upload Score →
            </Link>
          </div>
        ) : (
          /* Score grid */
          <div className="grid md:grid-cols-3 gap-8">
            {scores.map((score, idx) => (
              <div
                key={score.id}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredId(score.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div
                  className={`relative rounded-2xl border-2 border-[#1C1917] overflow-hidden transition-all
                    ${hoveredId === score.id
                      ? "shadow-[2px_2px_0_#1C1917] -translate-x-1 -translate-y-1"
                      : "shadow-[6px_6px_0_#1C1917]"
                    }`}
                >
                  {/* Thumbnail with pastel background + staff lines texture */}
                  <div
                    className="relative h-48 flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor:
                        pastelColors[idx % pastelColors.length],
                    }}
                    onClick={() => handleOpen(score)}
                  >
                    {/* Faint staff lines */}
                    <div className="absolute inset-0 opacity-20">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="absolute left-8 right-8 border-t border-[#1C1917]"
                          style={{ top: `${32 + i * 16}px` }}
                        />
                      ))}
                    </div>

                    {score.thumbnailDataUrl ? (
                      <img
                        src={score.thumbnailDataUrl}
                        alt={score.title}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <Music2
                        className="w-16 h-16 text-[#1C1917]/30 relative z-10"
                        strokeWidth={1}
                      />
                    )}

                    {/* Hover overlay */}
                    <div
                      className={`absolute inset-0 bg-[#1C1917]/10 flex items-center justify-center transition-opacity
                        ${hoveredId === score.id ? "opacity-100" : "opacity-0"}`}
                    >
                      <FolderOpen className="w-10 h-10 text-white drop-shadow-lg" />
                    </div>
                  </div>

                  {/* Dark info strip */}
                  <div
                    className="bg-[#1C1917] text-white p-4 relative overflow-hidden"
                    onClick={() => handleOpen(score)}
                  >
                    <h3 className="font-semibold truncate mb-1">
                      {score.title}
                    </h3>
                    <p className="text-xs text-white/60">
                      {formatDate(score.createdAt)}
                    </p>

                    {/* Slide-up Open button on hover */}
                    <div
                      className={`absolute bottom-full left-0 right-0 bg-[#7FFFD4] text-[#1C1917] py-3 text-center font-medium text-sm transition-all
                        ${hoveredId === score.id
                          ? "translate-y-0 opacity-100"
                          : "translate-y-2 opacity-0"
                        }`}
                    >
                      Open →
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="bg-white border-t border-[#1C1917]/10 p-3 flex items-center gap-2">
                    <button
                      onClick={() => handleOpen(score)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-[#7FFFD4] border border-[#1C1917] rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      Open
                    </button>
                    <button
                      onClick={() => handleDownload(score)}
                      className="p-1.5 rounded-lg border border-[#1C1917]/20 hover:border-[#1C1917] hover:bg-[#F5F0E8] transition-colors"
                      title="Download MusicXML"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(score)}
                      disabled={deletingId === score.id}
                      className="p-1.5 rounded-lg border border-[#1C1917]/20 hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
      `}</style>
    </div>
  );
}
