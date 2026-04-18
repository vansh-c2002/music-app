# Oh Sheet!
> Turn a photo of any sheet music into an editable digital score—instantly.

**Oh Sheet!** is a CS 343 course project by [Vansh Chugh](https://github.com/vansh-c2002), [Khizran Fatima](https://github.com/kfatima317), and [Anh Phan](https://github.com/salad905). Upload a photo of printed sheet music and get back a clean, editable `.musicxml` file that opens directly in MuseScore.

---

## How It Works

```
Upload PNG/JPG of sheet music
        ↓
Modal GPU endpoint runs homr (OMR model)
        ↓
MusicXML file returned (~3–5 min)
        ↓
Export button downloads the .musicxml file → open in MuseScore
```

---

## Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) — install with `brew install pnpm` (Mac) or `npm install -g pnpm`
- The `VITE_API_URL` environment variable (ask Vansh for the Modal endpoint URL)

### Frontend Setup

```bash
git clone https://github.com/vansh-c2002/music-app.git
cd music-app/Frontend

# Copy the env template and fill in the API URL
cp .env.example .env
# Edit .env and set VITE_API_URL=<Modal endpoint URL>

pnpm install
pnpm dev
# → http://localhost:5173
```

### Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/upload` | Upload a PNG/JPG of sheet music |
| `/editor` | View result and export `.musicxml` |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS v4 + shadcn/ui |
| Backend | Python + FastAPI + [homr](https://github.com/liebharc/homr) OMR model |
| GPU Hosting | [Modal](https://modal.com) (free tier, T4 GPU) |
| Frontend Hosting | Cloudflare Pages |

---

## Project Structure

```
music-app/
├── Backend/
│   ├── modal_app.py        # Modal GPU endpoint (homr inference)
│   └── requirements.txt    # Just: modal, fastapi
├── Frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/      # LandingPage, UploadPage, EditorPage
│   │   │   ├── components/ # Editor UI, shadcn/ui primitives
│   │   │   ├── routes.tsx
│   │   │   └── App.tsx
│   │   └── styles/         # Tailwind + theme CSS (beige/brown + aquamarine)
│   ├── .env.example        # Copy to .env and fill in VITE_API_URL
│   ├── public/_redirects   # Cloudflare Pages SPA routing
│   └── package.json
└── README.md
```

---

## Backend Deployment (Vansh only)

The Modal backend is deployed once and shared. To redeploy after changes:

```bash
# Create and activate the backend venv (one-time)
python3 -m venv /path/to/venvs/ohsheet-backend
source /path/to/venvs/ohsheet-backend/bin/activate
pip install modal fastapi

# Authenticate with Modal (one-time)
modal setup

# Deploy
cd Backend
modal deploy modal_app.py
# → prints the endpoint URL to put in VITE_API_URL
```

---

## Frontend Deployment (Cloudflare Pages)

1. cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
2. Build settings:
   - **Root directory**: `Frontend`
   - **Build command**: `pnpm install && pnpm build`
   - **Output directory**: `dist`
3. Add environment variable: `VITE_API_URL` = Modal endpoint URL
4. Deploy — get a `*.pages.dev` URL

---

## Team

| Name | Role |
|------|------|
| Vansh Chugh | ML / OMR model + backend |
| Khizran Fatima | Frontend & UI/UX |
| Anh Phan | Backend & integration |
