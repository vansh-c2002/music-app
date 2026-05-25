import { ChevronUp, ChevronDown } from "lucide-react";
import type { ParsedNote } from "../lib/parse-musicxml";
import { pitchLabel, applyDiatonicStep } from "../lib/parse-musicxml";

const DURATIONS = [
  { label: "Whole", value: "whole" },
  { label: "Half", value: "half" },
  { label: "Quarter", value: "quarter" },
  { label: "8th", value: "eighth" },
  { label: "16th", value: "sixteenth" },
];

const ACCIDENTALS = [
  { label: "♭", value: -1 },
  { label: "♮", value: 0 },
  { label: "♯", value: 1 },
];

const PASTEL = ["#F2C4C4", "#B8D8E8", "#B8D4B0", "#F5E6A0", "#F9C8D8"];

interface PropertiesPanelProps {
  note: ParsedNote | null;
  onPitchStep: (note: ParsedNote, newStep: string, newOctave: number) => void;
  onAlterChange: (note: ParsedNote, alter: number) => void;
  onDurationChange: (note: ParsedNote, type: string) => void;
  onDelete: (note: ParsedNote) => void;
}

export function PropertiesPanel({
  note,
  onPitchStep,
  onAlterChange,
  onDurationChange,
  onDelete,
}: PropertiesPanelProps) {
  const handleUp = () => {
    if (!note || note.isRest) return;
    const { step, octave } = applyDiatonicStep(note.step, note.octave, 1);
    onPitchStep(note, step, octave);
  };

  const handleDown = () => {
    if (!note || note.isRest) return;
    const { step, octave } = applyDiatonicStep(note.step, note.octave, -1);
    onPitchStep(note, step, octave);
  };

  return (
    <div className="w-52 bg-white border-l border-[#1C1917]/10 overflow-y-auto flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1C1917]/10 bg-[#F5F0E8]">
        <h3
          className="font-bold text-sm text-[#1C1917]"
          style={{ fontFamily: "DM Serif Display, Georgia, serif" }}
        >
          Properties
        </h3>
      </div>

      <div className="p-4 flex-1">
        {!note ? (
          <div className="text-center pt-8">
            <div className="text-4xl mb-3 opacity-20">♩</div>
            <p className="text-xs text-[#1C1917]/40 leading-relaxed">
              Click a note to edit it
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Pitch display */}
            <div
              className="rounded-xl border-2 border-[#1C1917] p-3 text-center shadow-[3px_3px_0_#1C1917]"
              style={{ backgroundColor: PASTEL[(note.measure) % PASTEL.length] }}
            >
              <div
                className="text-2xl font-bold text-[#1C1917] mb-0.5"
                style={{ fontFamily: "DM Serif Display, Georgia, serif" }}
              >
                {pitchLabel(note)}
              </div>
              <div className="text-xs text-[#1C1917]/60">
                M{note.measure + 1} · {note.type}{note.isRest ? " rest" : ""}
              </div>
            </div>

            {!note.isRest && (
              <>
                {/* Pitch up/down */}
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]/50 mb-1.5 uppercase tracking-wide">
                    Pitch
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUp}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border-2 border-[#1C1917] bg-[#B8D4B0] hover:shadow-[2px_2px_0_#1C1917] transition-all text-sm font-medium text-[#1C1917]"
                    >
                      <ChevronUp className="w-3.5 h-3.5" /> Up
                    </button>
                    <button
                      onClick={handleDown}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border-2 border-[#1C1917] bg-[#F9C8D8] hover:shadow-[2px_2px_0_#1C1917] transition-all text-sm font-medium text-[#1C1917]"
                    >
                      <ChevronDown className="w-3.5 h-3.5" /> Down
                    </button>
                  </div>
                </div>

                {/* Accidental */}
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]/50 mb-1.5 uppercase tracking-wide">
                    Accidental
                  </label>
                  <div className="flex gap-1">
                    {ACCIDENTALS.map((a) => (
                      <button
                        key={a.value}
                        onClick={() => onAlterChange(note, a.value)}
                        className="flex-1 py-2 rounded-lg text-sm font-bold transition-all border-2"
                        style={{
                          backgroundColor: note.alter === a.value ? "#1C1917" : "#F5F0E8",
                          color: note.alter === a.value ? "white" : "#1C1917",
                          borderColor: note.alter === a.value ? "#1C1917" : "rgba(28,25,23,0.15)",
                          boxShadow: note.alter === a.value ? "2px 2px 0 #1C1917" : "none",
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-[#1C1917]/50 mb-1.5 uppercase tracking-wide">
                Duration
              </label>
              <div className="grid grid-cols-3 gap-1">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => onDurationChange(note, d.value)}
                    className="py-1.5 rounded-lg text-xs font-medium transition-all border-2"
                    style={{
                      backgroundColor: note.type === d.value ? "#1C1917" : "#F5F0E8",
                      color: note.type === d.value ? "white" : "#1C1917",
                      borderColor: note.type === d.value ? "#1C1917" : "rgba(28,25,23,0.15)",
                      boxShadow: note.type === d.value ? "2px 2px 0 #1C1917" : "none",
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => onDelete(note)}
              className="w-full py-2 rounded-lg border-2 border-[#1C1917] bg-white text-[#1C1917] text-sm font-medium hover:bg-[#F2C4C4] hover:shadow-[2px_2px_0_#1C1917] transition-all"
            >
              Delete Note
            </button>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
      `}</style>
    </div>
  );
}
