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
    <div className="w-56 bg-sidebar border-l border-sidebar-border overflow-y-auto flex flex-col">
      <div className="p-4 flex-1">
        <h3 className="font-semibold text-sm mb-4">Properties</h3>

        {!note ? (
          <p className="text-xs text-muted-foreground text-center pt-8">
            Click a note to edit it.
            <br /><br />
            Click again to drag it up or down to change pitch.
          </p>
        ) : (
          <div className="space-y-5">
            {/* Pitch display + step arrows */}
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-2xl font-bold mb-1">{pitchLabel(note)}</div>
              <div className="text-xs text-muted-foreground">
                M{note.measure + 1} · {note.type}{note.isRest ? " rest" : ""}
              </div>
            </div>

            {!note.isRest && (
              <>
                {/* Step up/down */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Pitch</label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUp}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-muted hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                      title="Step up (↑)"
                    >
                      <ChevronUp className="w-4 h-4" />
                      Up
                    </button>
                    <button
                      onClick={handleDown}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-muted hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                      title="Step down (↓)"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Down
                    </button>
                  </div>
                </div>

                {/* Accidental */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Accidental</label>
                  <div className="flex gap-1">
                    {ACCIDENTALS.map((a) => (
                      <button
                        key={a.value}
                        onClick={() => onAlterChange(note, a.value)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          note.alter === a.value
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted hover:bg-muted/70"
                        }`}
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
              <label className="block text-xs text-muted-foreground mb-1.5">Duration</label>
              <div className="grid grid-cols-3 gap-1">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => onDurationChange(note, d.value)}
                    className={`py-1.5 rounded-lg text-xs transition-colors ${
                      note.type === d.value
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted hover:bg-muted/70"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => onDelete(note)}
              className="w-full py-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 text-sm transition-colors"
            >
              Delete Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
