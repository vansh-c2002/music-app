import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Download, RotateCcw, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { SheetMusicCanvas } from "../components/sheet-music-canvas";
import { EditorSidebar } from "../components/editor-sidebar";
import { PropertiesPanel } from "../components/properties-panel";
import {
  parseMusicXml,
  updateNotePitch,
  updateNoteDuration,
  deleteNote,
  applyDiatonicStep,
} from "../lib/parse-musicxml";
import type { ParsedNote } from "../lib/parse-musicxml";

function getCursorNotes(xml: string): ParsedNote[] {
  try {
    return parseMusicXml(xml).notes;
  } catch {
    return [];
  }
}

export function EditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { musicXml: initialXml, fileName } =
    (location.state as { musicXml: string; fileName: string }) ?? {};

  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const currentXml = history[histIdx] ?? "";

  const [cursorStep, setCursorStep] = useState(0);
  // Indices into cursorNotes that are shift-selected in addition to cursorStep
  const [extraSelected, setExtraSelected] = useState<number[]>([]);

  const cursorNotes = currentXml ? getCursorNotes(currentXml) : [];
  const cursorNote: ParsedNote | null = cursorNotes[cursorStep] ?? null;

  // All selected notes to pass to canvas (non-rest only, since canvas can't hit rests)
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

      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        movePrev();
      } else if (e.key === "ArrowUp") {
        // Move all selected non-rest notes up
        const targets = [cursorStep, ...extraSelected]
          .map((i) => cursorNotes[i])
          .filter((n): n is ParsedNote => !!n && !n.isRest);
        if (targets.length > 0) {
          e.preventDefault();
          changePitchMulti(targets, 1);
        }
      } else if (e.key === "ArrowDown") {
        const targets = [cursorStep, ...extraSelected]
          .map((i) => cursorNotes[i])
          .filter((n): n is ParsedNote => !!n && !n.isRest);
        if (targets.length > 0) {
          e.preventDefault();
          changePitchMulti(targets, -1);
        }
      } else if (e.key === "Delete" && cursorNote) {
        e.preventDefault();
        handleDelete(cursorNote);
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === "y" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
      }
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
    const notes = getCursorNotes(currentXml);
    let idx = notes.findIndex(
      (n) => n.measure === note.measure && n.xmlIndex === note.xmlIndex
    );
    // If it's a chord secondary (not in cursorNotes), fall back to the chord primary
    if (idx === -1) {
      // chord secondary: fall back to matching by staffId + beat
      idx = notes.findIndex(
        (n) => n.measure === note.measure && n.beat === note.beat && n.staffId === note.staffId
      );
    }
    if (idx === -1) return;

    if (shiftHeld) {
      if (idx === cursorStep) return;
      setExtraSelected((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      );
    } else {
      setCursorStep(idx);
      setExtraSelected([]);
    }
  }, [currentXml, cursorStep]);

  const handlePitchCommit = useCallback((note: ParsedNote, step: string, octave: number) => {
    pushXml(updateNotePitch(currentXml, note.measure, note.xmlIndex, step, octave, note.alter));
  }, [currentXml, histIdx]);

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
    <div className="h-screen flex flex-col bg-background" tabIndex={-1}>
      {/* Top nav */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="w-px h-6 bg-border" />
          <h1 className="text-lg font-semibold">{displayTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={histIdx <= 0}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-40 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={histIdx >= history.length - 1}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-40 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-accent text-accent-foreground hover:opacity-90 rounded-lg transition-opacity flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="bg-card border-b border-border px-4 py-2 flex items-center gap-3 shrink-0">
        <button
          onClick={movePrev}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors"
          title="Previous note (← arrow key)"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>
        <button
          onClick={moveNext}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors"
          title="Next note (→ arrow key)"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>

        {cursorNote && (
          <span className="text-sm text-muted-foreground ml-2">
            {cursorNote.isRest
              ? "Rest"
              : `${cursorNote.step}${cursorNote.alter === 1 ? "#" : cursorNote.alter === -1 ? "b" : ""}${cursorNote.octave}`}
            {" · "}M{cursorNote.measure + 1}
            {multiSelected && (
              <span className="ml-2 text-accent">+{extraSelected.length} selected</span>
            )}
          </span>
        )}

        <div className="ml-auto text-xs text-muted-foreground">
          Click · Shift+click to multi-select · ← → navigate · ↑ ↓ change pitch · drag to repitch · Del to delete
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        <EditorSidebar activeTool="select" onToolChange={() => {}} />

        <SheetMusicCanvas
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
    </div>
  );
}
