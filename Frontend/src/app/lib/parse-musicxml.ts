export interface ParsedNote {
  id: number;          // global sequential ID
  xmlIndex: number;    // index within the <note> elements of its measure (for XML mutation)
  measure: number;      // 0-based global measure index (across all parts, used for XML mutation)
  localMeasure: number; // 0-based index within its own <part> (matches OSMD's MeasureList index)
  partIndex: number;    // which <part> this note belongs to
  staffId: number;      // unique 0-based staff index derived from (partIndex, <staff> number)
  beat: number;        // 0-based beat within measure
  step: string;        // C D E F G A B  (or "R" for rest)
  octave: number;
  alter: number;       // -1 flat  0 natural  1 sharp
  type: string;        // whole half quarter eighth sixteenth ...
  isRest: boolean;
}

export interface ScoreInfo {
  title: string;
  composer: string;
  keyFifths: number;
  keyMode: string;
  beats: number;
  beatType: number;
}

export interface ParsedScore {
  info: ScoreInfo;
  notes: ParsedNote[];
}

const DIATONIC = ["C", "D", "E", "F", "G", "A", "B"];

function getText(parent: Element | Document, tag: string): string {
  return parent.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
}

function fifthsToKey(fifths: number, mode: string): string {
  const major = ["C","G","D","A","E","B","F#","C#","F","Bb","Eb","Ab","Db","Gb","Cb"];
  const minor = ["A","E","B","F#","C#","G#","D#","A#","D","G","C","F","Bb","Eb","Ab"];
  const name = (mode === "minor" ? minor : major)[fifths + 7];
  return `${name} ${mode === "minor" ? "Minor" : "Major"}`;
}

export function parseMusicXml(xml: string): ParsedScore {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  const title =
    getText(doc, "work-title") ||
    getText(doc, "movement-title") ||
    "Untitled";
  const composer =
    doc.querySelector("creator[type='composer']")?.textContent?.trim() ??
    getText(doc, "creator") ??
    "";

  const keyEl = doc.getElementsByTagName("key")[0];
  const keyFifths = parseInt(keyEl?.getElementsByTagName("fifths")[0]?.textContent ?? "0", 10);
  const keyMode = keyEl?.getElementsByTagName("mode")[0]?.textContent?.trim() ?? "major";

  const timeEl = doc.getElementsByTagName("time")[0];
  const beats = parseInt(getText(timeEl ?? doc.documentElement, "beats") || "4", 10);
  const beatType = parseInt(getText(timeEl ?? doc.documentElement, "beat-type") || "4", 10);

  const info: ScoreInfo = { title, composer, keyFifths, keyMode, beats, beatType };

  const notes: ParsedNote[] = [];
  let noteId = 0;
  const parts = doc.getElementsByTagName("part");
  // Use parts if present, otherwise fall back to flat measure list
  const partEls = parts.length > 0 ? Array.from(parts) : [doc.documentElement];
  let globalMeasureOffset = 0;

  for (let p = 0; p < partEls.length; p++) {
    const partMeasures = partEls[p].getElementsByTagName("measure");

    for (let m = 0; m < partMeasures.length; m++) {
      const measure = partMeasures[m];
      const noteEls = measure.getElementsByTagName("note");
      let beat = 0;

      for (let n = 0; n < noteEls.length; n++) {
        const noteEl = noteEls[n];
        const isRest = noteEl.getElementsByTagName("rest").length > 0;
        const isChord = noteEl.getElementsByTagName("chord").length > 0;

        const pitchEl = noteEl.getElementsByTagName("pitch")[0];
        const step = pitchEl?.getElementsByTagName("step")[0]?.textContent?.trim() ?? "C";
        const octave = parseInt(pitchEl?.getElementsByTagName("octave")[0]?.textContent ?? "4", 10);
        const alter = parseFloat(pitchEl?.getElementsByTagName("alter")[0]?.textContent ?? "0");
        const type = noteEl.getElementsByTagName("type")[0]?.textContent?.trim() ?? "quarter";

        if (!isChord) beat++;
        const staffNum = parseInt(noteEl.getElementsByTagName("staff")[0]?.textContent ?? "1", 10);

        notes.push({
          id: noteId++,
          xmlIndex: n,
          measure: globalMeasureOffset + m,
          localMeasure: m,
          partIndex: p,
          staffId: 0, // filled in below
          beat: beat - 1,
          step: isRest ? "R" : step,
          octave: isRest ? 4 : octave,
          alter: isRest ? 0 : alter,
          type,
          isRest,
          _staffNum: staffNum, // temp field
        } as any);
      }
    }

    globalMeasureOffset += partMeasures.length;
  }

  // Assign staffId: unique sequential index per (partIndex, staffNum) pair,
  // in the order first encountered — which is top-staff-first in standard MusicXML.
  const staffKeys = new Map<string, number>();
  for (const n of notes) {
    const raw = (n as any)._staffNum as number;
    const key = `${n.partIndex}_${raw}`;
    if (!staffKeys.has(key)) staffKeys.set(key, staffKeys.size);
    n.staffId = staffKeys.get(key)!;
    delete (n as any)._staffNum;
  }

  return { info, notes };
}

export function pitchLabel(note: ParsedNote): string {
  if (note.isRest) return "Rest";
  const acc = note.alter === 1 ? "#" : note.alter === -1 ? "b" : "";
  return `${note.step}${acc}${note.octave}`;
}

export function keyLabel(info: ScoreInfo): string {
  return fifthsToKey(info.keyFifths, info.keyMode);
}

// --- XML mutation helpers ---

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, "application/xml");
}

function serializeXml(doc: Document): string {
  return new XMLSerializer().serializeToString(doc);
}

export function updateNotePitch(
  xml: string,
  measureIdx: number,
  xmlNoteIdx: number,
  step: string,
  octave: number,
  alter: number
): string {
  const doc = parseXml(xml);
  const measures = doc.getElementsByTagName("measure");
  const measure = measures[measureIdx];
  if (!measure) return xml;

  const noteEls = measure.getElementsByTagName("note");
  const noteEl = noteEls[xmlNoteIdx];
  if (!noteEl) return xml;

  const pitch = noteEl.getElementsByTagName("pitch")[0];
  if (!pitch) return xml;

  const stepEl = pitch.getElementsByTagName("step")[0];
  if (stepEl) stepEl.textContent = step;

  const octaveEl = pitch.getElementsByTagName("octave")[0];
  if (octaveEl) octaveEl.textContent = String(octave);

  // Update or remove alter
  const existingAlter = pitch.getElementsByTagName("alter")[0];
  if (alter !== 0) {
    if (existingAlter) {
      existingAlter.textContent = String(alter);
    } else {
      const alterEl = doc.createElement("alter");
      alterEl.textContent = String(alter);
      pitch.insertBefore(alterEl, octaveEl ?? null);
    }
  } else if (existingAlter) {
    pitch.removeChild(existingAlter);
  }

  return serializeXml(doc);
}

export function deleteNote(xml: string, measureIdx: number, xmlNoteIdx: number): string {
  const doc = parseXml(xml);
  const measures = doc.getElementsByTagName("measure");
  const measure = measures[measureIdx];
  if (!measure) return xml;

  const noteEls = Array.from(measure.getElementsByTagName("note"));
  const noteEl = noteEls[xmlNoteIdx];
  if (!noteEl) return xml;

  // Replace with a rest of the same duration
  const typeEl = noteEl.getElementsByTagName("type")[0];
  const durationEl = noteEl.getElementsByTagName("duration")[0];
  const rest = doc.createElement("note");

  const restEl = doc.createElement("rest");
  rest.appendChild(restEl);

  if (durationEl) {
    const dur = doc.createElement("duration");
    dur.textContent = durationEl.textContent;
    rest.appendChild(dur);
  }
  if (typeEl) {
    const type = doc.createElement("type");
    type.textContent = typeEl.textContent;
    rest.appendChild(type);
  }

  measure.replaceChild(rest, noteEl);
  return serializeXml(doc);
}

// Quarter = 1× divisions; whole = 4×; half = 2×; eighth = 0.5×; etc.
const TYPE_MULTIPLIER: Record<string, number> = {
  whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25, "32nd": 0.125,
};

export function updateNoteDuration(
  xml: string,
  measureIdx: number,
  xmlNoteIdx: number,
  newType: string
): string {
  const multiplier = TYPE_MULTIPLIER[newType];
  if (multiplier === undefined) return xml;

  const doc = parseXml(xml);
  const measures = doc.getElementsByTagName("measure");

  // Find the nearest <divisions> value at or before this measure
  let divisions = 1;
  for (let i = measureIdx; i >= 0; i--) {
    const divEl = measures[i]?.getElementsByTagName("divisions")[0];
    if (divEl) { divisions = parseInt(divEl.textContent ?? "1", 10); break; }
  }

  const measure = measures[measureIdx];
  if (!measure) return xml;

  const noteEl = measure.getElementsByTagName("note")[xmlNoteIdx];
  if (!noteEl) return xml;

  const typeEl = noteEl.getElementsByTagName("type")[0];
  if (typeEl) typeEl.textContent = newType;

  const durationEl = noteEl.getElementsByTagName("duration")[0];
  if (durationEl) durationEl.textContent = String(Math.round(divisions * multiplier));

  return serializeXml(doc);
}

export function applyDiatonicStep(
  step: string,
  octave: number,
  delta: number
): { step: string; octave: number } {
  const idx = DIATONIC.indexOf(step);
  if (idx === -1) return { step, octave };
  let newIdx = idx + delta;
  let newOctave = octave;
  while (newIdx < 0) { newIdx += 7; newOctave--; }
  while (newIdx >= 7) { newIdx -= 7; newOctave++; }
  return { step: DIATONIC[newIdx], octave: newOctave };
}
