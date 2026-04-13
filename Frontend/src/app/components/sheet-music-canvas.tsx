import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";

interface Note {
  id: number;
  measure: number;
  beat: number;
  pitch: string;
  selected: boolean;
}

interface SheetMusicCanvasProps {
  isPlaying: boolean;
  playbackPosition: number;
  loopStart: number | null;
  loopEnd: number | null;
  onLoopSelect: (start: number, end: number) => void;
  selectedNotes: number[];
  onNoteSelect: (noteId: number) => void;
}

export function SheetMusicCanvas({
  isPlaying,
  playbackPosition,
  loopStart,
  loopEnd,
  onLoopSelect,
  selectedNotes,
  onNoteSelect,
}: SheetMusicCanvasProps) {
  const [isDraggingLoop, setIsDraggingLoop] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Mock notes data
  const notes: Note[] = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    measure: Math.floor(i / 4),
    beat: i % 4,
    pitch: ["C", "D", "E", "F", "G", "A", "B"][i % 7],
    selected: selectedNotes.includes(i),
  }));

  const handleMouseDown = (measure: number) => {
    setIsDraggingLoop(true);
    setDragStart(measure);
  };

  const handleMouseUp = (measure: number) => {
    if (isDraggingLoop && dragStart !== null) {
      const start = Math.min(dragStart, measure);
      const end = Math.max(dragStart, measure);
      onLoopSelect(start, end);
    }
    setIsDraggingLoop(false);
    setDragStart(null);
  };

  return (
    <div className="flex-1 bg-background overflow-auto p-8">
      <div className="max-w-5xl mx-auto">
        {/* Sheet Music Display */}
        <div className="bg-card rounded-xl shadow-2xl p-8 border border-border hover:shadow-accent/20 transition-shadow duration-500">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-primary">Moonlight Sonata</h2>
              <p className="text-sm text-muted-foreground">Ludwig van Beethoven</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Key: C# Minor</p>
              <p className="text-sm text-muted-foreground">Time: 4/4</p>
            </div>
          </div>

          {/* Staff Lines */}
          <div className="relative" ref={canvasRef}>
            {/* Playback cursor */}
            {isPlaying && (
              <motion.div
                animate={{ left: `${(playbackPosition % 8) * 12.5}%` }}
                transition={{ duration: 0.1 }}
                className="absolute top-0 bottom-0 w-0.5 bg-accent z-10"
                style={{ left: `${(playbackPosition % 8) * 12.5}%` }}
              />
            )}

            {/* Loop selection overlay */}
            {loopStart !== null && loopEnd !== null && (
              <div
                className="absolute top-0 bottom-0 bg-accent/10 border-l-2 border-r-2 border-accent z-0"
                style={{
                  left: `${loopStart * 12.5}%`,
                  width: `${(loopEnd - loopStart + 1) * 12.5}%`,
                }}
              />
            )}

            {/* Staff - 5 lines */}
            <div className="space-y-3 mb-12">
              {[0, 1, 2, 3, 4].map((line) => (
                <div key={line} className="h-px bg-border" />
              ))}
            </div>

            {/* Notes */}
            <div className="grid grid-cols-8 gap-4 relative -mt-40">
              {Array.from({ length: 8 }).map((_, measure) => (
                <div
                  key={measure}
                  className="relative cursor-pointer"
                  onMouseDown={() => handleMouseDown(measure)}
                  onMouseUp={() => handleMouseUp(measure)}
                >
                  {/* Measure line */}
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
                  
                  {/* Notes in this measure */}
                  <div className="space-y-8 py-8">
                    {notes.slice(measure * 4, measure * 4 + 4).map((note, idx) => {
                      const isHighlighted = isPlaying && Math.floor(playbackPosition / 4) === measure && playbackPosition % 4 === idx;
                      const isSelected = selectedNotes.includes(note.id);
                      
                      return (
                        <div
                          key={note.id}
                          className="relative"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNoteSelect(note.id);
                          }}
                        >
                          {/* Note head */}
                          <motion.div
                            animate={{
                              scale: isHighlighted ? 1.3 : 1,
                              backgroundColor: isHighlighted ? "#7FFFD4" : isSelected ? "#7FFFD4" : "#3E2723",
                            }}
                            className={`
                              w-6 h-4 rounded-full transform -rotate-12 cursor-pointer
                              ${isSelected ? 'ring-2 ring-accent' : ''}
                            `}
                            style={{
                              marginTop: `${idx * 8}px`,
                            }}
                          />
                          {/* Stem */}
                          <div className="absolute left-5 top-0 w-px h-12 bg-primary" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom staff lines */}
            <div className="space-y-3 mt-12">
              {[0, 1, 2, 3, 4].map((line) => (
                <div key={`bottom-${line}`} className="h-px bg-border" />
              ))}
            </div>
          </div>

          {/* Measures indicator */}
          <div className="grid grid-cols-8 gap-4 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="text-center text-xs text-muted-foreground">
                M{i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}