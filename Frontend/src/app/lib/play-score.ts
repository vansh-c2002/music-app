interface PlayNote {
  frequency: number;
  startSec: number;
  durationSec: number;
}

function noteToFrequency(step: string, octave: number, alter: number): number {
  const semitones: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midi = (octave + 1) * 12 + (semitones[step] ?? 0) + Math.round(alter);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function parseForPlayback(xml: string): { notes: PlayNote[]; totalDuration: number } {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  let bpm = 120;
  const firstSound = doc.querySelector("sound[tempo]");
  if (firstSound) bpm = parseFloat(firstSound.getAttribute("tempo") ?? "120");

  const notes: PlayNote[] = [];

  for (const part of Array.from(doc.getElementsByTagName("part"))) {
    let measureStartSec = 0;
    let divisions = 1;
    let currentBpm = bpm;

    for (const measure of Array.from(part.getElementsByTagName("measure"))) {
      const divEl = measure.getElementsByTagName("divisions")[0];
      if (divEl) divisions = parseInt(divEl.textContent!, 10);

      const soundEl = measure.querySelector("sound[tempo]");
      if (soundEl) currentBpm = parseFloat(soundEl.getAttribute("tempo") ?? String(currentBpm));

      const secPerBeat = 60 / currentBpm;
      let cursor = measureStartSec;
      let lastAdvance = 0;
      let measureEnd = measureStartSec;

      for (const child of Array.from(measure.childNodes) as Element[]) {
        const tag = child.nodeName;
        if (tag === "note") {
          const isChord = child.getElementsByTagName("chord").length > 0;
          const isRest = child.getElementsByTagName("rest").length > 0;
          const durEl = child.getElementsByTagName("duration")[0];
          const durSec = durEl
            ? (parseInt(durEl.textContent!, 10) / divisions) * secPerBeat
            : secPerBeat;
          const startSec = isChord ? cursor - lastAdvance : cursor;

          if (!isRest) {
            const pitchEl = child.getElementsByTagName("pitch")[0];
            if (pitchEl) {
              const step = pitchEl.getElementsByTagName("step")[0]?.textContent?.trim() ?? "C";
              const octave = parseInt(pitchEl.getElementsByTagName("octave")[0]?.textContent ?? "4", 10);
              const alter = parseFloat(pitchEl.getElementsByTagName("alter")[0]?.textContent ?? "0");
              notes.push({
                frequency: noteToFrequency(step, octave, alter),
                startSec,
                durationSec: durSec * 0.9,
              });
            }
          }

          if (!isChord) {
            lastAdvance = durSec;
            cursor += durSec;
            measureEnd = Math.max(measureEnd, cursor);
          }
        } else if (tag === "backup") {
          const d = child.getElementsByTagName("duration")[0];
          if (d) cursor -= (parseInt(d.textContent!, 10) / divisions) * secPerBeat;
        } else if (tag === "forward") {
          const d = child.getElementsByTagName("duration")[0];
          if (d) { cursor += (parseInt(d.textContent!, 10) / divisions) * secPerBeat; measureEnd = Math.max(measureEnd, cursor); }
        }
      }
      measureStartSec = measureEnd;
    }
  }

  const totalDuration = notes.reduce((m, n) => Math.max(m, n.startSec + n.durationSec), 0);
  return { notes, totalDuration };
}

export class ScorePlayer {
  private ctx: AudioContext | null = null;
  private notes: PlayNote[] = [];
  private totalDuration = 0;
  private pauseOffset = 0;
  private startedAt = 0;
  private playing = false;
  private nodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private endTimer: ReturnType<typeof setTimeout> | null = null;
  onEnd: (() => void) | null = null;

  load(xml: string) {
    this.stop();
    const { notes, totalDuration } = parseForPlayback(xml);
    this.notes = notes;
    this.totalDuration = totalDuration;
    this.pauseOffset = 0;
  }

  async play() {
    if (this.playing) return;
    if (!this.ctx) this.ctx = new AudioContext();
    await this.ctx.resume();

    const ctx = this.ctx;
    const now = ctx.currentTime;
    this.startedAt = now - this.pauseOffset;
    this.playing = true;
    this.nodes = [];

    for (const note of this.notes) {
      if (note.startSec < this.pauseOffset - 0.05) continue;
      const start = now + (note.startSec - this.pauseOffset);
      if (start < now - 0.01) continue;

      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.015);
      gain.gain.setValueAtTime(0.15, start + note.durationSec - 0.04);
      gain.gain.linearRampToValueAtTime(0, start + note.durationSec);

      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = note.frequency;
      osc.connect(gain);
      osc.start(start);
      osc.stop(start + note.durationSec + 0.05);

      this.nodes.push({ osc, gain });
    }

    const remaining = (this.totalDuration - this.pauseOffset) * 1000 + 300;
    this.endTimer = setTimeout(() => {
      if (this.playing) {
        this.playing = false;
        this.pauseOffset = 0;
        this.onEnd?.();
      }
    }, remaining);
  }

  pause() {
    if (!this.playing || !this.ctx) return;
    this.pauseOffset = this.ctx.currentTime - this.startedAt;
    this.playing = false;
    this._cancelNodes();
  }

  stop() {
    this.playing = false;
    this.pauseOffset = 0;
    this._cancelNodes();
  }

  private _cancelNodes() {
    if (this.endTimer !== null) { clearTimeout(this.endTimer); this.endTimer = null; }
    for (const { osc, gain } of this.nodes) {
      try { gain.gain.cancelScheduledValues(0); gain.gain.setValueAtTime(0, 0); osc.stop(); } catch {}
    }
    this.nodes = [];
  }

  dispose() {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}
