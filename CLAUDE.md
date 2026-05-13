# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Oh Sheet!** is a CS 343 course project that converts photos of sheet music into editable `.musicxml` files for MuseScore. It has a fully functional React frontend, a Python GPU backend on Modal, and Firebase-based auth + Firestore library.

## Commands

All commands run from the `Frontend/` directory.

```bash
cd Frontend

pnpm install       # install dependencies
pnpm dev           # start dev server → localhost:5173
pnpm build         # production build
```

Backend deploy (from repo root, requires Modal auth):
```bash
modal deploy Backend/modal_app.py
```

There is no test suite configured yet.

## Architecture

### Frontend (`Frontend/`)
React 18 SPA — Vite, React Router v7, Tailwind CSS v4, shadcn/ui.

**Routes:**
- `/` — `LandingPage`
- `/upload` — `UploadPage` (requires sign-in; sends files to Modal backend with Firebase ID token)
- `/editor` — `EditorPage` (OSMD sheet music renderer, note clicking/editing, Save to Library button)
- `/library` — `LibraryPage` (protected; Firestore real-time listener, score grid)

**Auth:** `src/app/lib/auth-context.tsx` — `AuthProvider` wraps the whole app in `App.tsx`. `useAuth()` gives `currentUser`, `signInWithGoogle`, `signOut`.

**Firebase libs** (`src/app/lib/`):
- `firebase.ts` — initializes Firebase from `VITE_FIREBASE_*` env vars; exports `auth`, `db`, `googleProvider`
- `auth-context.tsx` — React context for auth state
- `save-score.ts` — Firestore write/delete to `users/{uid}/scores/{scoreId}`
- `generate-thumbnail.ts` — SVG → canvas → base64 JPEG thumbnail (600×400, for Firestore inline storage)

**Editor:** `SheetMusicCanvas` (`sheet-music-canvas.tsx`) is a `forwardRef` exposing `getOsmdDiv()` for thumbnail capture. It renders MusicXML via OSMD with custom note-click hit areas.

**UI components:** `Frontend/src/app/components/ui/` — shadcn/ui library, do not edit directly.

**Styling:** `src/styles/theme.css` — warm beige/brown palette, aquamarine accent `#7FFFD4`. Tailwind v4 via `@tailwindcss/vite`, no `tailwind.config.js`.

### Backend (`Backend/modal_app.py`)
FastAPI app deployed on Modal (T4 GPU). See `Backend/` for full details.

- Runs HOMR OMR model on uploaded images/PDFs
- Verifies Firebase ID tokens (Bearer header) on every request
- Firebase Admin SDK credentials loaded from Modal secret `firebase-service-account`

### Firebase project
- Project ID: `music-app-8ac62`
- Auth: Google OAuth provider
- Firestore: `users/{uid}/scores/{scoreId}` — stores `title`, `fileName`, `musicXml`, `thumbnailDataUrl`, `info`, timestamps
- Security rules: `Frontend/firestore.rules` (deploy via Firebase console)
- Authorized domains: `localhost`, `music-app-924.pages.dev`

## Environment Variables

Frontend `.env` (gitignored — copy from `.env.example`):
```
VITE_API_URL                    Modal endpoint URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

## Key constraints
- Modal version 1.4.2 — `modal.imports()` does NOT exist; use `try/except ImportError` for container-only imports
- Firestore document limit is 1MB — thumbnails are stored as JPEG base64 inline; keep thumbnail resolution at 600×400
- No Firebase Storage (free Spark plan) — thumbnails inline in Firestore only
