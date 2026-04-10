# BusDrop 🎯

> Land first, every single time. Optimal Fortnite drop paths powered by real bus physics and terrain data.

## Features

- **Freehand Bus Route** — click-drag to draw a curved bus path across the map
- **Terrain-aware physics** — 20×20 elevation grid + building height data for precise jump timing
- **Real drop physics** — freefall (75 m/s) + glide (20 m/s) phases with auto-deploy at 35m above terrain
- **Share codes** — 6-character codes (e.g. `X9KF2A`) to share with your squad
- **Two maps** — Chapter 7 S2 and OG (Chapter 1) map support
- **Cookie popup** — corner slide-up, non-intrusive
- **Responsive** — works on mobile and desktop

---

## Tech Stack

- **Framework**: Next.js 14 (Pages Router, TypeScript)
- **Database**: PostgreSQL via [Neon](https://neon.tech) + Prisma ORM
- **Hosting**: Vercel
- **Map images**: Loaded client-side from fortniteapi.io (no API key required)

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Neon database
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the **connection string**

### 3. Environment
```bash
cp .env.example .env.local
# Paste your DATABASE_URL into .env.local
```

### 4. Push schema
```bash
npx prisma db push
```

### 5. Run locally
```bash
npm run dev
```

---

## Deploy to Vercel

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add `DATABASE_URL` environment variable (your Neon connection string)
4. Deploy — `prisma generate` runs automatically in the build step

---

## How the physics work

The drop engine in `lib/dropPhysics.ts`:

1. **Smooths** the hand-drawn bus route using Chaikin's algorithm (3 iterations)
2. **Samples** terrain elevation from a 20×20 bilinear-interpolated grid
3. **Adds building height** for POI zones (e.g. Tilted Towers adds 25m)
4. **Calculates max range** from bus altitude using real phase splits:
   - Freefall: 75 m/s horizontal, 78 m/s vertical until 35m above ground
   - Glide: 20 m/s horizontal, 11 m/s vertical from 35m to ground
5. **Walks the route** to find the first bus position within range of your marker
6. **Computes jump time** as `distance along route / 87 m/s` (bus speed)
7. **Builds a 60-point flight path** with terrain-deflection arcing in the glide phase

---

## Customising

Edit constants in `lib/dropPhysics.ts`:

| Constant | Default | Description |
|---|---|---|
| `BUS_SPEED` | 87 m/s | Battle bus speed |
| `BUS_ALT` | 120 m | Bus altitude above sea level |
| `DIVE_HSPEED` | 75 m/s | Freefall horizontal speed |
| `DIVE_VSPEED` | 78 m/s | Freefall descent speed |
| `GLIDE_HSPEED` | 20 m/s | Glide horizontal speed |
| `GLIDE_VSPEED` | 11 m/s | Glide descent speed |
| `GLIDE_TRIGGER` | 35 m | Height above terrain to auto-deploy |

Update `ELEVATION_CURRENT` / `ELEVATION_OG` arrays to adjust terrain height data per season.

---

© BusDrop — not affiliated with Epic Games
