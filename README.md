# Oh Sheet!
> Turn a photo of any sheet music into an editable digital score — instantly.

**Oh Sheet!** is a CS 343 course project by [Vansh Chugh](https://github.com/vansh-c2002), [Khizran Fatima](https://github.com/kfatima317), and [Anh Phan](https://github.com/salad905).

Upload a photo or scan of printed sheet music — as a PNG, JPG, or multi-page PDF — and get back a clean, editable `.musicxml` file that opens directly in MuseScore.

---

## How It Works
Upload PNG, JPG, or PDF (single or multiple files)
↓
Files validated + ad countdown on free tier
↓
Modal GPU endpoint runs HOMR (OMR model) on each page
↓
MusicXML returned (~3–5 min per page)
↓
View result in editor → export .musicxml → open in MuseScore

---

## Features

- Upload PNG, JPG, or PDF files
- Multi-file upload — select multiple images at once
- Multi-page PDF support — every page is processed automatically
- In-browser sheet music editor with note properties panel
- One-click export to `.musicxml` for MuseScore
- Low-confidence notes flagged for user review
- Google OAuth sign-in (Firebase Auth)
- Personal library — save, browse, and re-open past scores (Firestore)
- Ad-supported free tier (30-second countdown before processing)
- Live at [music-app-924.pages.dev](https://music-app-924.pages.dev)

---

## Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) — install with `brew install pnpm` (Mac) or `npm install -g pnpm`
- Environment variables (ask Vansh) — see `.env.example`

### Frontend Setup

```bash
git clone https://github.com/vansh-c2002/music-app.git
cd music-app/Frontend

# Copy the env template and fill in the values
cp .env.example .env
# Edit .env — set VITE_API_URL and all VITE_FIREBASE_* vars (ask Vansh)

pnpm install
pnpm dev
# → http://localhost:5173
```

### Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/upload` | Upload sheet music files (requires sign-in) |
| `/editor` | View converted score and export `.musicxml` |
| `/library` | Personal saved scores (protected, requires sign-in) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS v4 + shadcn/ui |
| Animations | Motion (Framer Motion) |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Firestore (user score library, inline thumbnails) |
| Backend | Python + FastAPI + [HOMR](https://github.com/liebharc/homr) OMR model |
| PDF conversion | pdf2image + poppler |
| GPU Hosting | [Modal](https://modal.com) (T4 GPU, pay-per-invocation) |
| Frontend Hosting | Cloudflare Pages |

---

## Project Structure
music-app/
├── Backend/
│   └── modal_app.py        # Modal GPU endpoint — HOMR inference, Firebase token verification
├── Frontend/
│   ├── src/app/
│   │   ├── pages/          # LandingPage, UploadPage, EditorPage, LibraryPage
│   │   ├── components/     # Navbar, SheetMusicCanvas, ProtectedRoute, editor UI
│   │   ├── lib/            # firebase.ts, auth-context.tsx, save-score.ts, generate-thumbnail.ts
│   │   ├── routes.tsx
│   │   └── App.tsx
│   ├── .env.example        # Copy to .env and fill in all vars
│   ├── firestore.rules     # Firestore security rules (deploy via Firebase console)
│   ├── public/_redirects   # Cloudflare Pages SPA routing fix
│   └── package.json
└── README.md

---

## Backend Deployment (Vansh only)

The Modal backend is deployed once and shared across the team. To redeploy after changes:

```bash
# One-time: install modal and authenticate
pip install modal
modal setup

# One-time: create the Firebase service account secret
# Generate a service account key from Firebase Console → Project Settings → Service Accounts
# Then:
modal secret create firebase-service-account FIREBASE_SERVICE_ACCOUNT_JSON='<paste JSON here>'

# Deploy
modal deploy Backend/modal_app.py
# → prints the endpoint URL to put in VITE_API_URL
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/transcribe` | POST | Single image (PNG/JPG) → MusicXML |
| `/transcribe-multi` | POST | Multiple files or PDF → MusicXML (first page returned) |

---

## Frontend Deployment (Cloudflare Pages)

1. [cloudflare.com](https://cloudflare.com) → Workers & Pages → Create → Pages → Connect to Git
2. Build settings:
   - **Root directory**: `frontend`
   - **Build command**: `pnpm install && pnpm build`
   - **Output directory**: `dist`
3. Add environment variables (all `VITE_*` keys from `.env.example`)
4. Deploy — live at `*.pages.dev`

---

## Team

| Name | Role |
|------|------|
| Vansh Chugh | ML / OMR model + backend |
| Khizran Fatima | Frontend & UI/UX + backend |
| Anh Phan | Research + integration + backend |

---

## Roadmap

- [ ] CoT post-hoc correction — pipe HOMR output through an LLM to flag music theory violations before showing the result
- [ ] Multi-page editor — stitch multiple pages of MusicXML into a single scrollable score
- [ ] Handwritten score support — integrate the ISMIR 2025 jazz lead sheet model for handwritten input
- [x] Auth + user accounts — Google OAuth + personal score library
- [ ] Export button prominence — make export more visible in the editor (user feedback)
