# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Oh Sheet!** is a CS 343 course project that converts photos of sheet music into editable `.musicxml` files for MuseScore. The current repo contains the frontend UI only — the OMR (Optical Music Recognition) backend is not yet implemented.

## Commands

All commands run from the `Frontend/` directory.

```bash
cd Frontend

# Install dependencies (uses pnpm)
pnpm install

# Start dev server
pnpm vite

# Build for production
pnpm build
```

There is no test suite configured yet.

## Architecture

The app is a React 18 SPA using Vite, React Router v7, Tailwind CSS v4, and shadcn/ui components.

**Page flow:**
- `/` — `LandingPage`: marketing/hero, links to upload
- `/upload` — `UploadPage`: file upload UI (photo/PDF input)
- `/editor` — `EditorPage`: full sheet music editor (currently UI-only with mock data)

**Editor layout** (`editor-page.tsx`) uses a classic DAW-style shell:
- Top nav bar (save/share/export)
- `EditorToolbar` — playback controls + tool selection
- Three-column body: `EditorSidebar` (tools) | `SheetMusicCanvas` (main view) | `PropertiesPanel` (note properties)
- `PlaybackTimeline` at the bottom
- `KeyboardShortcuts` modal overlay

All playback is simulated with `setInterval`; no real audio engine is wired up yet.

**UI components:** `Frontend/src/app/components/ui/` is the full shadcn/ui component library (do not edit these directly). Custom feature components live in `Frontend/src/app/components/`.

**Styling:** Custom CSS variables are defined in `src/styles/theme.css` (warm beige/brown palette with aquamarine accent `#7FFFD4`). Tailwind v4 is configured via the `@tailwindcss/vite` plugin — there is no `tailwind.config.js`. The `@` alias resolves to `Frontend/src/`.

**No backend exists yet.** All data is hardcoded/mocked in components.
