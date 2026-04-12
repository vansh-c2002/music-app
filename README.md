# Oh Sheet!

> Turn a photo of any sheet music into an editable digital score—instantly.

**Oh Sheet!** is a CS 343 course project by Team 4: [Vansh Chugh](https://github.com/vansh-c2002), [Khizran Fatima](https://github.com/khizran), and [Anh Phan](https://github.com/anhphan). We're building a tool that lets musicians photograph printed or handwritten sheet music and get back a clean, editable `.musicxml` file that opens directly in MuseScore.

No more manual note entry. No more transcription headaches. Just snap, convert, and edit.

---

## The Problem

Musicians constantly work with physical sheet music—but making even small changes (transposing, arranging, fixing errors) means manually re-entering every note into notation software like MuseScore. For a single page, this can take *hours*. 

Existing tools like Scan2Notes or Soundslice help, but they:
- Don't integrate smoothly with MuseScore's native workflow
- Output generic formats that lose musical context
- Rarely flag *musical* errors (e.g., a note that breaks the time signature)

## Our Solution

**Oh Sheet!** fits directly into the musician's existing workflow:

Upload photo/PDF
↓
OMR model extracts musical symbols
↓
Confidence scoring + music theory validation
↓
Export as .musicxml or .mxl → opens in MuseScore


### Key Features
- **MuseScore-native output**: Export directly to `.musicxml` or compressed `.mxl`
- **Confidence-aware conversion**: Low-confidence symbols are highlighted for quick review
- **Music theory validation**: Rule-based checks catch musically impossible outputs (e.g., overlapping notes, invalid rhythms)
- **Handwritten + printed support**: Leveraging modern OMR models trained on diverse sheet styles
- **Privacy-first**: Processing happens server-side; we don't store your scores
