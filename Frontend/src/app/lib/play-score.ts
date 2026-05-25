import * as Tone from "tone";

interface PlayNote {
  noteName: string;
  startSec: number;
  durationSec: number;
}

function parseForPlayback(xml: string): { notes: PlayNote[]; bpm: number } {
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
              const octave = parseInt(
                pitchEl.getElementsByTagName("octave")[0]?.textContent ?? "4",
                10
              );
              const alter = parseFloat(
                pitchEl.getElementsByTagName("alter")[0]?.textContent ?? "0"
              );
              const acc = alter >= 1 ? "#" : alter <= -1 ? "b" : "";
              notes.push({
                noteName: `${step}${acc}${octave}`,
                startSec,
                durationSec: durSec * 0.92,
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
          if (d) {
            cursor += (parseInt(d.textContent!, 10) / divisions) * secPerBeat;
            measureEnd = Math.max(measureEnd, cursor);
          }
        }
      }

      measureStartSec = measureEnd;
    }
  }

  return { notes, bpm };
}

export class ScorePlayer {
  private synth: Tone.PolySynth | null = null;
  private part: Tone.Part | null = null;
  private endEventId: number | null = null;
  private _isPlaying = false;
  onEnd: (() => void) | null = null;

  load(xml: string) {
    this._cleanup();

    const { notes, bpm } = parseForPlayback(xml);
    if (notes.length === 0) return;

    Tone.getTransport().bpm.value = bpm;

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.5 },
      volume: -8,
    }).toDestination();

    const events = notes.map((n) => ({ time: n.startSec, ...n }));
    this.part = new Tone.Part<PlayNote & { time: number }>((time, val) => {
      this.synth?.triggerAttackRelease(val.noteName, val.durationSec, time);
    }, events);
    this.part.start(0);

    const totalDuration = Math.max(...notes.map((n) => n.startSec + n.durationSec));
    this.endEventId = Tone.getTransport().scheduleOnce(() => {
      setTimeout(() => {
        this._isPlaying = false;
        Tone.getTransport().stop();
        (Tone.getTransport() as any).position = 0;
        this.onEnd?.();
      }, 0);
    }, totalDuration + 0.3);

    Tone.getTransport().stop();
    (Tone.getTransport() as any).position = 0;
  }

  async play() {
    await Tone.start();
    if (this._isPlaying) return;
    Tone.getTransport().start();
    this._isPlaying = true;
  }

  pause() {
    if (!this._isPlaying) return;
    Tone.getTransport().pause();
    this.synth?.releaseAll();
    this._isPlaying = false;
  }

  stop() {
    Tone.getTransport().stop();
    (Tone.getTransport() as any).position = 0;
    this.synth?.releaseAll();
    this._isPlaying = false;
  }

  get isPlaying() {
    return this._isPlaying;
  }

  private _cleanup() {
    if (this.endEventId !== null) {
      Tone.getTransport().clear(this.endEventId);
      this.endEventId = null;
    }
    this.part?.dispose();
    this.part = null;
    this.synth?.dispose();
    this.synth = null;
    this.stop();
  }

  dispose() {
    this._cleanup();
  }
}
