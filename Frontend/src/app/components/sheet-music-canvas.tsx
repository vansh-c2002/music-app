import { useEffect, useRef, useState, useCallback } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { parseMusicXml, applyDiatonicStep } from "../lib/parse-musicxml";
import type { ParsedNote } from "../lib/parse-musicxml";

const ACCENT = "#E8622A";

interface NoteHit {
  note: ParsedNote;
  x: number;
  y: number;
  lineSpacingPx: number;
  el: Element;
}

interface DragState {
  note: ParsedNote;
  startY: number;
  currentY: number;
  lineSpacingPx: number;
}

interface Props {
  musicXml: string;
  selectedNotes: ParsedNote[];
  onNoteClick: (note: ParsedNote, shiftHeld: boolean) => void;
  onPitchCommit: (note: ParsedNote, step: string, octave: number) => void;
}

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

// Returns Y midpoints between every pair of adjacent staves (within + across systems).
// A gap larger than 1.5× lineSpacing means a new staff started.
function staffBoundaryYs(container: HTMLElement, lineSpacingPx: number): number[] {
  const top = container.getBoundingClientRect().top;
  const ys: number[] = [];
  for (const line of container.querySelectorAll<SVGLineElement>("line")) {
    if (Math.abs(parseFloat(line.getAttribute("y1") ?? "0") -
                 parseFloat(line.getAttribute("y2") ?? "0")) < 1) {
      ys.push(line.getBoundingClientRect().top - top);
    }
  }
  ys.sort((a, b) => a - b);
  const deduped: number[] = [];
  for (const y of ys) {
    if (!deduped.length || y - deduped[deduped.length - 1] > 2) deduped.push(y);
  }
  const boundaries: number[] = [];
  for (let i = 1; i < deduped.length; i++) {
    if (deduped[i] - deduped[i - 1] > lineSpacingPx * 1.5)
      boundaries.push((deduped[i] + deduped[i - 1]) / 2);
  }
  return boundaries;
}

function buildHitsFromOsmd(
  osmd: any,
  container: HTMLElement,
  parsedNotes: ParsedNote[],
  lineSpacingPx: number
): NoteHit[] | null {
  try {
    const measureList = osmd?.GraphicSheet?.MeasureList;
    if (!measureList?.length) return null;

    const containerRect = container.getBoundingClientRect();

    // Group parsed notes by (localMeasure, staffId)
    const byKey = new Map<string, ParsedNote[]>();
    for (const n of parsedNotes) {
      const k = `${n.localMeasure}_${n.staffId}`;
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k)!.push(n);
    }

    const hits: NoteHit[] = [];

    for (let m = 0; m < measureList.length; m++) {
      const staffLines: any[] = measureList[m] ?? [];
      for (let s = 0; s < staffLines.length; s++) {
        const gMeasure = staffLines[s];
        if (!gMeasure?.staffEntries) continue;
        const candidates = byKey.get(`${m}_${s}`) ?? [];
        let idx = 0;

        for (const se of gMeasure.staffEntries) {
          for (const ve of se.graphicalVoiceEntries ?? []) {
            for (const gn of ve.notes ?? []) {
              const note = candidates[idx++];
              if (!note) continue;

              const vfn = gn.vfnote?.[0] ?? gn.vfNote?.[0];
              const groupEl: Element | null =
                vfn?.attrs?.el ?? vfn?.getSVGElement?.() ?? null;
              if (!groupEl) continue;

              const nhEl = groupEl.querySelector(".vf-notehead") ?? groupEl;
              const r = nhEl.getBoundingClientRect();
              if (r.width === 0 && r.height === 0) continue;

              hits.push({
                note,
                x: r.left + r.width / 2 - containerRect.left,
                y: r.top + r.height / 2 - containerRect.top,
                lineSpacingPx,
                el: nhEl,
              });
            }
          }
        }
      }
    }

    return hits.length > 0 ? hits : null;
  } catch {
    return null;
  }
}

function buildHits(container: HTMLElement, parsedNotes: ParsedNote[]): NoteHit[] {
  const selectors = [".vf-notehead", ".vf-note-head", "[class*='notehead']"];
  let els: Element[] = [];
  for (const sel of selectors) {
    els = Array.from(container.querySelectorAll(sel));
    if (els.length > 0) break;
  }
  if (els.length === 0) return [];

  const lineSpacingPx = measureLineSpacing(container);
  const containerRect = container.getBoundingClientRect();

  const positioned = els.map((el) => {
    const r = el.getBoundingClientRect();
    return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  });

  const numStaves = parsedNotes.length
    ? Math.max(...parsedNotes.map((n) => n.staffId)) + 1
    : 1;

  const sortByReadingOrder = (arr: typeof positioned, rowHeight: number) =>
    arr.slice().sort((a, b) => {
      const ra = Math.floor((a.cy - containerRect.top) / rowHeight);
      const rb = Math.floor((b.cy - containerRect.top) / rowHeight);
      return ra !== rb ? ra - rb : a.cx - b.cx;
    });

  if (numStaves === 1) {
    const sorted = sortByReadingOrder(positioned, lineSpacingPx * 10);
    const count = Math.min(sorted.length, parsedNotes.length);
    return sorted.slice(0, count).map((p, i) => ({
      note: parsedNotes[i],
      x: p.cx - containerRect.left,
      y: p.cy - containerRect.top,
      lineSpacingPx,
      el: p.el,
    }));
  }

  // Multi-staff: split noteheads by Y band, one band per staff per system.
  // boundaries.filter(b => y > b).length counts staves above; mod numStaves
  // cycles 0..numStaves-1 within each system (top staff = 0).
  const boundaries = staffBoundaryYs(container, lineSpacingPx);
  const rowHeight = lineSpacingPx * 8;

  const staffNotes: ParsedNote[][] = Array.from({ length: numStaves }, () => []);
  for (const n of parsedNotes) staffNotes[n.staffId].push(n);

  const hits: NoteHit[] = [];
  for (let s = 0; s < numStaves; s++) {
    const staffEls = positioned.filter((pos) => {
      const slot = boundaries.filter((b) => pos.cy - containerRect.top > b).length % numStaves;
      return slot === s;
    });
    const sorted = sortByReadingOrder(staffEls, rowHeight);
    const notes = staffNotes[s];
    const count = Math.min(sorted.length, notes.length);
    for (let i = 0; i < count; i++) {
      hits.push({
        note: notes[i],
        x: sorted[i].cx - containerRect.left,
        y: sorted[i].cy - containerRect.top,
        lineSpacingPx,
        el: sorted[i].el,
      });
    }
  }
  return hits;
}

function findNoteContainer(noteheadEl: Element): Element | null {
  let el: Element | null = noteheadEl.parentElement;
  while (el && el.tagName.toLowerCase() !== "svg") {
    if (el.querySelector(".vf-stem")) return el;
    el = el.parentElement;
  }
  return null;
}

function colorFill(el: Element, color: string | null) {
  const children = el.querySelectorAll("path, rect, ellipse, circle, use");
  (children.length > 0 ? Array.from(children) : [el]).forEach((c) => {
    (c as SVGElement).style.fill = color ?? "";
    (c as SVGElement).style.stroke = color ? "none" : "";
  });
}

function colorStroke(el: Element, color: string | null) {
  const children = el.querySelectorAll("path, rect, line");
  (children.length > 0 ? Array.from(children) : [el]).forEach((c) => {
    (c as SVGElement).style.stroke = color ?? "";
    (c as SVGElement).style.fill = color ? "none" : "";
  });
}

function colorNote(noteheadEl: Element, color: string | null) {
  colorFill(noteheadEl, color);

  const container = findNoteContainer(noteheadEl);
  if (!container) return;

  const stemEl = container.querySelector(".vf-stem");
  if (stemEl) colorStroke(stemEl, color);

  // Flag = the "swirl" on standalone eighth/sixteenth notes (not beamed)
  const flagEl = container.querySelector(".vf-flag");
  if (flagEl) colorFill(flagEl, color);
}

export function SheetMusicCanvas({ musicXml, selectedNotes, onNoteClick, onPitchCommit }: Props) {
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
      const lineSpacingPx = measureLineSpacing(osmdDivRef.current);
      const hits =
        buildHitsFromOsmd(osmdRef.current, osmdDivRef.current, notes, lineSpacingPx) ??
        buildHits(osmdDivRef.current, notes);
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
      requestAnimationFrame(() => requestAnimationFrame(rebuild));
    };

    init().catch(console.error);
  }, [musicXml, rebuild]);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(() => {
      if (renderedXmlRef.current) setTimeout(rebuild, 100);
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [rebuild]);

  // Color selected noteheads directly in the OSMD SVG
  useEffect(() => {
    for (const hit of noteHits) {
      const isSelected = selectedNotes.some(
        (n) => n.measure === hit.note.measure && n.xmlIndex === hit.note.xmlIndex
      );
      colorNote(hit.el, isSelected ? ACCENT : null);
    }
  }, [noteHits, selectedNotes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState) return;
    setDragState((d) => d ? { ...d, currentY: e.clientY } : null);
  }, [dragState]);

  const commitDrag = useCallback(() => {
    if (!dragState || dragState.note.isRest) { setDragState(null); return; }
    const dy = dragState.startY - dragState.currentY;
    const steps = Math.round(dy / (dragState.lineSpacingPx / 2));
    if (steps !== 0) {
      const { step, octave } = applyDiatonicStep(dragState.note.step, dragState.note.octave, steps);
      onPitchCommit(dragState.note, step, octave);
    }
    setDragState(null);
  }, [dragState, onPitchCommit]);

  // Only allow drag on the single selected note
  const singleSelected =
    selectedNotes.length === 1
      ? noteHits.find(
          (h) =>
            h.note.measure === selectedNotes[0].measure &&
            h.note.xmlIndex === selectedNotes[0].xmlIndex
        ) ?? null
      : null;

  const dragSteps = dragState
    ? Math.round((dragState.startY - dragState.currentY) / (dragState.lineSpacingPx / 2))
    : 0;

  const dragLabel = (() => {
    if (!dragState || dragState.note.isRest || dragSteps === 0) return null;
    const { step, octave } = applyDiatonicStep(dragState.note.step, dragState.note.octave, dragSteps);
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
        <div ref={osmdDivRef} style={{ width: "100%", backgroundColor: "#fff" }} />

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
              const isSelected = selectedNotes.some(
                (n) => n.measure === hit.note.measure && n.xmlIndex === hit.note.xmlIndex
              );
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
                      cursor:
                        isSelected && singleSelected && !hit.note.isRest
                          ? "ns-resize"
                          : "pointer",
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isSelected && singleSelected && !hit.note.isRest) {
                        setDragState({
                          note: hit.note,
                          startY: e.clientY,
                          currentY: e.clientY,
                          lineSpacingPx: hit.lineSpacingPx,
                        });
                      } else {
                        onNoteClick(hit.note, e.shiftKey);
                      }
                    }}
                  />
                  {/* Drag pitch label */}
                  {isDragging && dragLabel && (
                    <text
                      x={hit.x + r + 8}
                      y={displayY + 4}
                      fontSize={12}
                      fontWeight="bold"
                      fill={ACCENT}
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
