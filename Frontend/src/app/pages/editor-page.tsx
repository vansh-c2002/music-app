import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Download, RotateCcw, RotateCw, ChevronLeft, ChevronRight, BookmarkPlus, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { SheetMusicCanvas } from "../components/sheet-music-canvas";
import type { SheetMusicCanvasHandle } from "../components/sheet-music-canvas";
import { EditorSidebar } from "../components/editor-sidebar";
import { PropertiesPanel } from "../components/properties-panel";
import {
  parseMusicXml,
  updateNotePitch,
  updateNoteDuration,
  deleteNote,
  applyDiatonicStep,
  transposeScore,
  keyLabel,
} from "../lib/parse-musicxml";
import type { ParsedNote, ScoreInfo } from "../lib/parse-musicxml";
import { useAuth } from "../lib/auth-context";
import { generateThumbnail } from "../lib/generate-thumbnail";
import { saveScore } from "../lib/save-score";

function parseScore(xml: string): { notes: ParsedNote[]; info: ScoreInfo | null } {
  try {
    const { notes, info } = parseMusicXml(xml);
    return { notes, info };
  } catch {
    return { notes: [], info: null };
  }
}

export function EditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { musicXml: initialXml, fileName } =
    (location.state as { musicXml: string; fileName: string }) ?? {};
  const { currentUser } = useAuth();
  const canvasRef = useRef<SheetMusicCanvasHandle>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const currentXml = history[histIdx] ?? "";

  const [cursorStep, setCursorStep] = useState(0);
  const [extraSelected, setExtraSelected] = useState<number[]>([]);

  const { notes: cursorNotes, info: scoreInfo } = currentXml ? parseScore(currentXml) : { notes: [], info: null };
  const cursorNote: ParsedNote | null = cursorNotes[cursorStep] ?? null;

  const selectedNotes: ParsedNote[] = (() => {
    const indices = new Set([cursorStep, ...extraSelected]);
    return Array.from(indices)
      .filter((i) => i >= 0 && i < cursorNotes.length)
      .map((i) => cursorNotes[i])
      .filter((n) => !n.isRest);
  })();

  useEffect(() => {
    if (!initialXml) {
      toast.error("No file loaded — please upload a sheet music image first.");
      navigate("/upload");
      return;
    }
    setHistory([initialXml]);
    setHistIdx(0);
  }, []);

  const moveNext = useCallback(() => {
    setCursorStep((s) => Math.min(s + 1, cursorNotes.length - 1));
    setExtraSelected([]);
  }, [cursorNotes.length]);

  const movePrev = useCallback(() => {
    setCursorStep((s) => Math.max(s - 1, 0));
    setExtraSelected([]);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "BUTTON") return;
      if (e.key === "ArrowRight") { e.preventDefault(); moveNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); movePrev(); }
      else if (e.key === "ArrowUp") {
        const targets = [cursorStep, ...extraSelected].map((i) => cursorNotes[i]).filter((n): n is ParsedNote => !!n && !n.isRest);
        if (targets.length > 0) { e.preventDefault(); changePitchMulti(targets, 1); }
      } else if (e.key === "ArrowDown") {
        const targets = [cursorStep, ...extraSelected].map((i) => cursorNotes[i]).filter((n): n is ParsedNote => !!n && !n.isRest);
        if (targets.length > 0) { e.preventDefault(); changePitchMulti(targets, -1); }
      } else if (e.key === "Delete" && cursorNote) { e.preventDefault(); handleDelete(cursorNote); }
      else if (e.key === "z" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleUndo(); }
      else if (e.key === "y" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cursorNote, cursorStep, extraSelected, cursorNotes, histIdx, history, moveNext, movePrev]);

  const pushXml = (newXml: string) => {
    setHistory((prev) => [...prev.slice(0, histIdx + 1), newXml]);
    setHistIdx((i) => i + 1);
  };

  const changePitchMulti = (notes: ParsedNote[], delta: number) => {
    let xml = currentXml;
    for (const note of notes) {
      const { step, octave } = applyDiatonicStep(note.step, note.octave, delta);
      xml = updateNotePitch(xml, note.measure, note.xmlIndex, step, octave, note.alter);
    }
    pushXml(xml);
  };

  const handleDelete = (note: ParsedNote) => {
    pushXml(deleteNote(currentXml, note.measure, note.xmlIndex));
  };

  const handleUndo = () => {
    if (histIdx <= 0) return;
    setHistIdx((i) => i - 1);
  };

  const handleRedo = () => {
    if (histIdx >= history.length - 1) return;
    setHistIdx((i) => i + 1);
  };

  const handleNoteClick = useCallback((note: ParsedNote, shiftHeld: boolean) => {
    const { notes } = parseScore(currentXml);
    let idx = notes.findIndex((n) => n.measure === note.measure && n.xmlIndex === note.xmlIndex);
    if (idx === -1) {
      idx = notes.findIndex((n) => n.measure === note.measure && n.beat === note.beat && n.staffId === note.staffId);
    }
    if (idx === -1) return;
    if (shiftHeld) {
      if (idx === cursorStep) return;
      setExtraSelected((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]);
    } else {
      setCursorStep(idx);
      setExtraSelected([]);
    }
  }, [currentXml, cursorStep]);

  const handlePitchCommit = useCallback((note: ParsedNote, step: string, octave: number) => {
    pushXml(updateNotePitch(currentXml, note.measure, note.xmlIndex, step, octave, note.alter));
  }, [currentXml, histIdx]);

  const handleTranspose = (semitones: number) => {
    pushXml(transposeScore(currentXml, semitones));
  };

  const handleSaveToLibrary = async () => {
    if (!currentUser) {
      toast.error("Sign in to save to your library");
      return;
    }
    setSaving(true);
    try {
      const thumbnailDataUrl = await generateThumbnail(canvasRef.current?.getOsmdDiv() ?? null);
      const id = await saveScore(currentUser.uid, currentXml, fileName ?? "score.musicxml", thumbnailDataUrl);
      setSavedId(id);
      toast.success("Saved to library!");
    } catch {
      toast.error("Failed to save to library");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!currentXml) return;
    const blob = new Blob([currentXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (fileName ?? "score").replace(/\.[^.]+$/, "") + ".musicxml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayTitle = fileName ? fileName.replace(/\.[^.]+$/, "") : "Sheet Music";

  if (!currentXml) return null;

  const multiSelected = extraSelected.length > 0;

  return (
    <div className="h-screen flex flex-col bg-white" tabIndex={-1}>

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

      {/* Top nav */}
      <div className="relative z-10 bg-white border-b-2 border-[#1C1917] px-6 py-3 flex items-center justify-between shrink-0 shadow-[0_2px_0_#1C1917]">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-[#1C1917]/60 hover:text-[#1C1917] transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="w-px h-6 bg-[#1C1917]/20" />
          <h1
            className="text-lg font-bold text-[#1C1917]"
            style={{ fontFamily: "DM Serif Display, Georgia, serif" }}
          >
            {displayTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={histIdx <= 0}
            className="p-2 rounded-lg border-2 border-[#1C1917] bg-white hover:bg-[#F5F0E8] disabled:opacity-30 transition-all shadow-[2px_2px_0_#1C1917] hover:shadow-[3px_3px_0_#1C1917] disabled:shadow-none"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4 text-[#1C1917]" />
          </button>

          {/* Redo */}
          <button
            onClick={handleRedo}
            disabled={histIdx >= history.length - 1}
            className="p-2 rounded-lg border-2 border-[#1C1917] bg-white hover:bg-[#F5F0E8] disabled:opacity-30 transition-all shadow-[2px_2px_0_#1C1917] hover:shadow-[3px_3px_0_#1C1917] disabled:shadow-none"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4 text-[#1C1917]" />
          </button>

          {/* Save */}
          {currentUser && (
            <button
              onClick={handleSaveToLibrary}
              disabled={saving || !!savedId}
              className="px-4 py-2 border-2 border-[#1C1917] bg-[#B8D4B0] hover:bg-[#a8c4a0] disabled:opacity-50 rounded-lg transition-all shadow-[2px_2px_0_#1C1917] hover:shadow-[3px_3px_0_#1C1917] flex items-center gap-2 font-medium text-[#1C1917] text-sm"
              title={savedId ? "Already saved" : "Save to Library"}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BookmarkPlus className="w-4 h-4" />
              )}
              <span>{savedId ? "Saved ✓" : "Save"}</span>
            </button>
          )}

          {/* Export */}
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-[#1C1917] text-white border-2 border-[#1C1917] rounded-lg hover:translate-y-[-1px] transition-all shadow-[2px_2px_0_#1C1917] hover:shadow-[4px_4px_0_#1C1917] flex items-center gap-2 font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Navigation / toolbar bar */}
      <div className="relative z-10 bg-[#F5F0E8] border-b-2 border-[#1C1917] px-4 py-2 flex items-center gap-3 shrink-0">

        {/* Prev / Next */}
        <button
          onClick={movePrev}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-[#1C1917] bg-white hover:bg-[#F5F0E8] text-sm font-medium transition-all shadow-[2px_2px_0_#1C1917]"
          title="Previous note (← arrow key)"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>
        <button
          onClick={moveNext}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-[#1C1917] bg-white hover:bg-[#F5F0E8] text-sm font-medium transition-all shadow-[2px_2px_0_#1C1917]"
          title="Next note (→ arrow key)"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Current note display */}
        {cursorNote && (
          <div className="px-3 py-1 rounded-lg border-2 border-[#1C1917] bg-[#F2C4C4] text-sm font-medium text-[#1C1917] shadow-[2px_2px_0_#1C1917]">
            {cursorNote.isRest
              ? "𝄽 Rest"
              : `♩ ${cursorNote.step}${cursorNote.alter === 1 ? "♯" : cursorNote.alter === -1 ? "♭" : ""}${cursorNote.octave}`}
            {" · "}M{cursorNote.measure + 1}
            {multiSelected && (
              <span className="ml-2 text-[#1C1917]/60">+{extraSelected.length} selected</span>
            )}
          </div>
        )}

        {/* Right side — key + transpose */}
        <div className="ml-auto flex items-center gap-3">
          {scoreInfo && (
            <div className="px-3 py-1 rounded-lg border-2 border-[#1C1917] bg-[#B8D8E8] text-xs font-medium text-[#1C1917] shadow-[2px_2px_0_#1C1917]">
              𝄞 {keyLabel(scoreInfo)}
            </div>
          )}

          <div className="flex items-center gap-1" title="Transpose whole piece">
            <span className="text-xs text-[#1C1917]/60 mr-1 font-medium">Transpose:</span>
            {[
              { label: "↓8va", val: -12, color: "#F9C8D8" },
              { label: "−½",   val: -1,  color: "#F9C8D8" },
              { label: "+½",   val: 1,   color: "#B8D4B0" },
              { label: "↑8va", val: 12,  color: "#B8D4B0" },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => handleTranspose(btn.val)}
                className="px-2 py-1 rounded border-2 border-[#1C1917] text-xs font-medium transition-all shadow-[2px_2px_0_#1C1917] hover:shadow-[3px_3px_0_#1C1917] hover:translate-y-[-1px]"
                style={{ backgroundColor: btn.color }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <EditorSidebar activeTool="select" onToolChange={() => {}} />

        <SheetMusicCanvas
          ref={canvasRef}
          musicXml={currentXml}
          selectedNotes={selectedNotes}
          onNoteClick={handleNoteClick}
          onPitchCommit={handlePitchCommit}
        />

        <PropertiesPanel
          note={cursorNote}
          onPitchStep={(note, newStep, newOctave) =>
            pushXml(updateNotePitch(currentXml, note.measure, note.xmlIndex, newStep, newOctave, 0))
          }
          onAlterChange={(note, alter) =>
            pushXml(updateNotePitch(currentXml, note.measure, note.xmlIndex, note.step, note.octave, alter))
          }
          onDurationChange={(note, type) =>
            pushXml(updateNoteDuration(currentXml, note.measure, note.xmlIndex, type))
          }
          onDelete={handleDelete}
        />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
      `}</style>
    </div>
  );
}
