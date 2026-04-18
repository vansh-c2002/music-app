# Oh Sheet!
> Turn a photo of any sheet music into an editable digital score—instantly.

**Oh Sheet!** is a CS 343 course project by Team 1: [Vansh Chugh](https://github.com/vansh-c2002), [Khizran Fatima](https://github.com/kfatima317), and [Anh Phan](https://github.com/salad905). We're building a tool that lets musicians photograph printed or handwritten sheet music and get back a clean, editable `.musicxml` file that opens directly in MuseScore.

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

```
Upload photo/PDF
↓
OMR model extracts musical symbols
↓
Confidence scoring + music theory validation
↓
Export as .musicxml or .mxl → opens in MuseScore
```

### Key Features
- **MuseScore-native output**: Export directly to `.musicxml` or compressed `.mxl`
- **Confidence-aware conversion**: Low-confidence symbols are highlighted for quick review
- **Music theory validation**: Rule-based checks catch musically impossible outputs (e.g., overlapping notes, invalid rhythms)
- **Handwritten + printed support**: Leveraging modern OMR models trained on diverse sheet styles
- **Privacy-first**: Processing happens server-side; we don't store your scores

---

## Running the Frontend Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher). You can check by running:
```bash
node -v
npm -v
```

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/vansh-c2002/music-app.git
cd music-app
```

2. **Go into the Frontend folder**
```bash
cd Frontend
```

3. **Install dependencies**
```bash
npm install
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser and go to:**
```
http://localhost:5173
```

### Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/upload` | Upload your sheet music (PNG, JPG, PDF) |
| `/editor` | View and edit the converted score |

> **Note:** The OMR model backend is currently in development. The frontend runs with a mock conversion flow for now — upload a file and it will simulate the processing pipeline and take you to the editor.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend *(in progress)* | Python + FastAPI |
| AI/ML *(in progress)* | PyTorch + pre-trained OMR model |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (frontend) + Render (backend) |

---

## Project Structure

```
music-app/
├── Frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/         # Landing, Upload, Editor pages
│   │   │   ├── components/    # Navbar and UI components
│   │   │   ├── routes.tsx     # App routing
│   │   │   └── App.tsx        # Root component
│   │   └── styles/            # Tailwind + theme CSS
│   ├── index.html
│   └── package.json
└── README.md
```

---

## Team

| Name | Role |
|------|------|
| Vansh Chugh | ML / OMR model research & inference |
| Khizran Fatima | Frontend & UI/UX |
| Anh Phan | Backend & integration |
```
