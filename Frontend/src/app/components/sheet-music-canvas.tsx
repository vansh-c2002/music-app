import { useEffect, useRef, useState, useCallback } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { parseMusicXml, applyDiatonicStep } from "../lib/parse-musicxml";
import type { ParsedNote } from "../lib/parse-musicxml";

interface NoteHit {
  note: ParsedNote;
  x: number; // center px relative to container
  y: number;
  lineSpacingPx: number;
}

interface DragState {
  note: ParsedNote;
  startY: number;
  currentY: number;
  lineSpacingPx: number;
}

interface Props {
  musicXml: string;
  selectedNote: ParsedNote | null;
  onNoteClick: (note: ParsedNote) => void;
  onPitchCommit: (note: ParsedNote, step: string, octave: number) => void;
}

// Derive line spacing from rendered staff lines in the SVG
function measureLineSpacing(container: HTMLElement): number {
  const ys: number[] = [];
  const containerTop = container.getBoundingClientRect().top;
  for (const line of container.querySelectorAll<SVGLineElement>("line")) {
    const y1 = parseFloat(line.getAttribute("y1") ?? "0");
    const y2 = parseFloat(line.getAttribute("y2") ?? "0");
    if (Math.abs(y1 - y2) < 1) {
      ys.push(line.getBoundingClientRect().top - containerTop);
    }
  }
  ys.sort((a, b) => a - b);
  const diffs: number[] = [];
  for (let i = 1; i < ys.length; i++) {
    const d = ys[i] - ys[i - 1];
    if (d > 2 && d < 40) diffs.push(d);
  }
  if (diffs.length === 0) return 12;
  diffs.sort((a, b) => a - b);
  return diffs[Math.floor(diffs.length / 2)];
}

// Build hit areas from VexFlow's rendered noteheads
function buildHits(
  container: HTMLElement,
  parsedNotes: ParsedNote[]
): NoteHit[] {
  // VexFlow renders noteheads inside groups with class vf-notehead (v4) or similar
  const selectors = [".vf-notehead", ".vf-note-head", "[class*='notehead']"];
  let els: Element[] = [];
  for (const sel of selectors) {
    els = Array.from(container.querySelectorAll(sel));
    if (els.length > 0) break;
  }

  if (els.length === 0) return [];

  const lineSpacingPx = measureLineSpacing(container);
  const containerRect = container.getBoundingClientRect();

  // Sort elements by visual reading order: row (coarse Y bands) then X
  const rowHeight = lineSpacingPx * 10;
  const positioned = els.map((el) => {
    const r = el.getBoundingClientRect();
    return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  });
  positioned.sort((a, b) => {
    const ra = Math.floor((a.cy - containerRect.top) / rowHeight);
    const rb = Math.floor((b.cy - containerRect.top) / rowHeight);
    return ra !== rb ? ra - rb : a.cx - b.cx;
  });

  // Match non-rest notes to positioned elements in order
  const nonRest = parsedNotes.filter((n) => !n.isRest);
  const count = Math.min(positioned.length, nonRest.length);
  const hits: NoteHit[] = [];
  for (let i = 0; i < count; i++) {
    hits.push({
      note: nonRest[i],
      x: positioned[i].cx - containerRect.left,
      y: positioned[i].cy - containerRect.top,
      lineSpacingPx,
    });
  }
  return hits;
}

export function SheetMusicCanvas({
  musicXml,
  selectedNote,
  onNoteClick,
  onPitchCommit,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const osmdDivRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const renderedXmlRef = useRef("");
  const [noteHits, setNoteHits] = useState<NoteHit[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [containerH, setContainerH] = useState(0);

  const rebuild = useCallback(() => {
    if (!osmdDivRef.current || !musicXml) return;
    try {
      const { notes } = parseMusicXml(musicXml);
      const hits = buildHits(osmdDivRef.current, notes);
      setNoteHits(hits);
      setContainerH(osmdDivRef.current.scrollHeight);
    } catch (e) {
      console.warn("Note hit build failed:", e);
    }
  }, [musicXml]);

  useEffect(() => {
    if (!osmdDivRef.current || !musicXml) return;
    if (renderedXmlRef.current === musicXml) return;
    renderedXmlRef.current = musicXml;

    const init = async () => {
      if (osmdRef.current) {
        try { (osmdRef.current as any).clear?.(); } catch {}
        osmdDivRef.current!.innerHTML = "";
      }

      const osmd = new OpenSheetMusicDisplay(osmdDivRef.current!, {
        autoResize: true,
        backend: "svg",
        drawTitle: true,
        drawComposer: true,
        drawCredits: true,
        drawPartNames: false,
        pageBackgroundColor: "#ffffff",
      } as any);
      osmdRef.current = osmd;

      await osmd.load(musicXml);
      osmd.render();

      // Two frames: first for OSMD to flush, second to measure
      requestAnimationFrame(() => requestAnimationFrame(rebuild));
    };

    init().catch(console.error);
  }, [musicXml, rebuild]);

  // Rebuild on container resize
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(() => {
      if (renderedXmlRef.current) setTimeout(rebuild, 100);
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [rebuild]);

  // Drag
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState) return;
    setDragState((d) => d ? { ...d, currentY: e.clientY } : null);
  }, [dragState]);

  const commitDrag = useCallback(() => {
    if (!dragState || dragState.note.isRest) { setDragState(null); return; }
    const dy = dragState.startY - dragState.currentY;
    const steps = Math.round(dy / (dragState.lineSpacingPx / 2));
    if (steps !== 0) {
      const { step, octave } = applyDiatonicStep(
        dragState.note.step, dragState.note.octave, steps
      );
      onPitchCommit(dragState.note, step, octave);
    }
    setDragState(null);
  }, [dragState, onPitchCommit]);

  const selectedHit = noteHits.find(
    (h) =>
      selectedNote &&
      h.note.measure === selectedNote.measure &&
      h.note.xmlIndex === selectedNote.xmlIndex
  ) ?? null;

  const dragSteps = dragState
    ? Math.round((dragState.startY - dragState.currentY) / (dragState.lineSpacingPx / 2))
    : 0;

  const dragLabel = (() => {
    if (!dragState || !dragState.note || dragState.note.isRest || dragSteps === 0) return null;
    const { step, octave } = applyDiatonicStep(
      dragState.note.step, dragState.note.octave, dragSteps
    );
    return `${step}${octave}`;
  })();

  return (
    <div
      className="flex-1 bg-background overflow-auto"
      onMouseMove={handleMouseMove}
      onMouseUp={commitDrag}
      onMouseLeave={commitDrag}
    >
      <div ref={wrapperRef} style={{ position: "relative" }}>
        {/* OSMD renders here */}
        <div ref={osmdDivRef} style={{ width: "100%", backgroundColor: "#fff" }} />

        {/* Overlay SVG — sized to match OSMD content */}
        {noteHits.length > 0 && (
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: containerH || "100%",
              overflow: "visible",
              pointerEvents: "none",
            }}
          >
            {noteHits.map((hit, i) => {
              const isSelected =
                selectedHit?.note.measure === hit.note.measure &&
                selectedHit?.note.xmlIndex === hit.note.xmlIndex;
              const isDragging =
                dragState?.note.measure === hit.note.measure &&
                dragState?.note.xmlIndex === hit.note.xmlIndex;
              const r = hit.lineSpacingPx * 0.7;
              const displayY = isDragging
                ? hit.y - dragSteps * (hit.lineSpacingPx / 2)
                : hit.y;

              return (
                <g key={i}>
                  {/* Clickable hit area */}
                  <ellipse
                    cx={hit.x}
                    cy={hit.y}
                    rx={r + 5}
                    ry={(r + 5) * 0.75}
                    fill="rgba(0,0,0,0)"
                    style={{
                      pointerEvents: "all",
                      cursor: isSelected && !hit.note.isRest ? "ns-resize" : "pointer",
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isSelected && !hit.note.isRest) {
                        setDragState({
                          note: hit.note,
                          startY: e.clientY,
                          currentY: e.clientY,
                          lineSpacingPx: hit.lineSpacingPx,
                        });
                      } else {
                        onNoteClick(hit.note);
                      }
                    }}
                  />
                  {/* Selection ring */}
                  {isSelected && (
                    <ellipse
                      cx={hit.x}
                      cy={displayY}
                      rx={r + 3}
                      ry={(r + 3) * 0.75}
                      fill="none"
                      stroke="#7FFFD4"
                      strokeWidth={2.5}
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  {/* Drag pitch label */}
                  {isDragging && dragLabel && (
                    <text
                      x={hit.x + r + 8}
                      y={displayY + 4}
                      fontSize={12}
                      fontWeight="bold"
                      fill="#7FFFD4"
                      style={{ pointerEvents: "none" }}
                    >
                      {dragLabel}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
