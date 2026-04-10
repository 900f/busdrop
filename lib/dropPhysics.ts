// BusDrop — Fortnite drop physics engine
// Coordinates are normalised [0..1] where (0,0) = top-left of map
// In-game map is approximately 5500 x 5500 metres

export type Point = { x: number; y: number }
export type MapType = 'current' | 'og'

// ─── Elevation grids ─────────────────────────────────────────────────────────
// 20×20 terrain height grid in metres. Bilinear interpolation for precision.
const GRID = 20

const ELEVATION_CURRENT: number[] = [
  20,20,25,30,40,50,45,35,25,20,20,25,30,35,30,25,20,15,15,20,
  20,25,35,50,70,80,75,55,35,22,22,30,45,50,40,30,22,18,16,18,
  22,30,50,80,120,140,130,90,55,30,28,40,70,80,60,40,28,20,18,20,
  25,40,70,110,150,160,155,110,70,40,35,55,90,100,80,55,35,25,20,22,
  30,55,90,130,155,160,150,105,65,38,38,65,105,115,95,65,38,28,22,25,
  28,45,75,110,140,150,140,95,58,33,35,60,95,108,88,58,35,25,20,22,
  22,35,55,85,115,125,120,80,48,28,30,48,78,90,72,48,30,22,18,20,
  18,25,38,58,80,90,85,58,35,22,22,36,58,68,54,36,22,18,15,18,
  16,20,28,42,58,65,62,44,28,18,18,26,42,50,40,26,18,14,12,15,
  15,18,24,36,50,56,54,38,24,16,16,22,36,42,34,22,16,12,10,12,
  15,18,22,32,44,50,48,34,22,15,15,20,32,38,30,20,15,12,10,12,
  16,20,26,38,52,60,56,40,26,18,18,26,40,48,38,26,18,14,12,14,
  18,24,34,50,68,78,72,52,32,22,22,32,50,60,48,32,22,16,14,16,
  22,30,44,65,88,100,95,68,42,28,28,42,65,78,62,42,28,20,18,20,
  26,36,54,80,108,120,115,82,52,34,34,52,80,96,76,52,34,24,20,24,
  30,40,60,88,116,128,122,88,56,36,36,56,88,104,84,56,36,26,22,26,
  28,36,54,80,108,118,114,82,52,34,34,52,80,96,76,52,34,24,20,24,
  22,28,42,62,84,94,90,64,40,26,26,40,62,74,60,40,26,20,16,20,
  18,22,30,45,60,68,66,48,30,20,20,30,46,55,44,30,20,15,12,15,
  15,18,24,34,46,52,50,36,22,16,16,22,34,40,32,22,16,12,10,12,
]

const ELEVATION_OG: number[] = [
  60,80,100,120,100,70,50,35,25,20,20,25,35,45,40,30,20,15,15,20,
  80,110,150,180,160,110,75,50,32,22,22,30,48,58,50,36,22,16,14,18,
  100,145,200,230,210,150,100,65,40,26,26,40,65,80,68,48,28,18,15,20,
  110,160,215,245,228,165,110,72,44,28,28,45,72,90,75,52,30,20,16,22,
  95,140,190,220,208,152,100,65,40,25,25,40,65,82,68,48,28,18,14,20,
  70,100,135,160,152,112,75,48,30,20,20,30,48,60,50,36,22,15,12,16,
  45,65,88,108,104,78,52,34,22,15,15,22,34,42,36,26,16,12,10,14,
  30,42,58,72,70,52,36,24,16,12,12,16,24,32,28,20,14,10,8,12,
  22,30,42,54,52,40,28,18,12,10,10,14,20,26,22,16,12,8,6,10,
  18,24,34,44,42,32,22,15,10,8,8,12,16,22,18,13,10,7,5,8,
  15,20,28,36,34,27,18,12,8,6,6,10,14,18,15,11,8,6,5,7,
  16,22,30,40,38,30,20,14,10,7,7,11,16,20,17,12,9,6,5,8,
  20,28,38,50,48,37,25,17,12,8,8,14,20,26,22,16,11,8,6,10,
  26,36,50,65,63,48,33,22,15,10,10,16,25,32,27,20,14,10,7,12,
  30,42,58,76,74,56,38,25,18,12,10,18,28,38,32,24,16,11,8,14,
  35,48,66,86,84,63,43,29,20,14,12,20,32,42,36,27,18,13,10,16,
  32,44,60,80,78,58,40,27,18,13,11,18,29,38,33,25,17,12,9,14,
  26,36,50,65,63,47,32,22,15,10,9,15,24,32,27,20,14,10,7,12,
  18,25,34,44,43,33,23,15,11,7,7,11,18,23,20,15,11,7,5,9,
  12,17,23,30,29,22,15,11,8,5,5,8,12,16,14,10,8,5,4,6,
]

export function getElevation(p: Point, map: MapType): number {
  const grid = map === 'current' ? ELEVATION_CURRENT : ELEVATION_OG
  const gx = Math.min(GRID - 1, Math.max(0, Math.floor(p.x * GRID)))
  const gy = Math.min(GRID - 1, Math.max(0, Math.floor(p.y * GRID)))
  const gx1 = Math.min(GRID - 1, gx + 1)
  const gy1 = Math.min(GRID - 1, gy + 1)
  const fx = (p.x * GRID) - gx
  const fy = (p.y * GRID) - gy
  const v00 = grid[gy * GRID + gx]
  const v10 = grid[gy * GRID + gx1]
  const v01 = grid[gy1 * GRID + gx]
  const v11 = grid[gy1 * GRID + gx1]
  return v00*(1-fx)*(1-fy) + v10*fx*(1-fy) + v01*(1-fx)*fy + v11*fx*fy
}

interface Zone { x0:number; y0:number; x1:number; y1:number; extra:number }
const BUILDINGS: Record<MapType, Zone[]> = {
  current: [
    {x0:0.42,y0:0.38,x1:0.54,y1:0.50,extra:12},
    {x0:0.58,y0:0.25,x1:0.68,y1:0.38,extra:8},
    {x0:0.18,y0:0.32,x1:0.30,y1:0.44,extra:8},
    {x0:0.68,y0:0.44,x1:0.78,y1:0.58,extra:10},
    {x0:0.73,y0:0.21,x1:0.84,y1:0.34,extra:8},
  ],
  og: [
    {x0:0.38,y0:0.39,x1:0.50,y1:0.50,extra:25}, // Tilted (tallest buildings)
    {x0:0.50,y0:0.44,x1:0.62,y1:0.56,extra:8},
    {x0:0.46,y0:0.56,x1:0.58,y1:0.66,extra:8},
    {x0:0.28,y0:0.20,x1:0.40,y1:0.30,extra:8},
    {x0:0.60,y0:0.48,x1:0.72,y1:0.58,extra:8},
    {x0:0.16,y0:0.16,x1:0.28,y1:0.28,extra:10},
  ],
}

function buildingExtra(p: Point, map: MapType): number {
  for (const z of BUILDINGS[map]) {
    if (p.x>=z.x0 && p.x<=z.x1 && p.y>=z.y0 && p.y<=z.y1) return z.extra
  }
  return 0
}

const MAP_SIZE = 5500

function dist2d(a: Point, b: Point): number {
  const dx=(b.x-a.x)*MAP_SIZE, dy=(b.y-a.y)*MAP_SIZE
  return Math.sqrt(dx*dx+dy*dy)
}

// Chaikin smoothing
export function smoothRoute(pts: Point[], iterations=3): Point[] {
  let p = pts
  for (let iter=0; iter<iterations; iter++) {
    const out: Point[] = [p[0]]
    for (let i=0; i<p.length-1; i++) {
      out.push({x:0.75*p[i].x+0.25*p[i+1].x, y:0.75*p[i].y+0.25*p[i+1].y})
      out.push({x:0.25*p[i].x+0.75*p[i+1].x, y:0.25*p[i].y+0.75*p[i+1].y})
    }
    out.push(p[p.length-1])
    p = out
  }
  return p
}

function polyLen(pts: Point[]): number {
  let l=0
  for (let i=0;i<pts.length-1;i++) l+=dist2d(pts[i],pts[i+1])
  return l
}

function ptAtDist(pts: Point[], d: number): Point {
  let acc=0
  for (let i=0;i<pts.length-1;i++) {
    const seg=dist2d(pts[i],pts[i+1])
    if (acc+seg>=d) {
      const t=(d-acc)/seg
      return {x:pts[i].x+t*(pts[i+1].x-pts[i].x), y:pts[i].y+t*(pts[i+1].y-pts[i].y)}
    }
    acc+=seg
  }
  return pts[pts.length-1]
}

function distAlongRoute(pts: Point[], target: Point): {d:number; pt:Point} {
  let bestD2=Infinity, bestPt=pts[0], bestAcc=0, acc=0
  for (let i=0;i<pts.length-1;i++) {
    const a=pts[i],b=pts[i+1]
    const sdx=b.x-a.x,sdy=b.y-a.y
    const lsq=sdx*sdx+sdy*sdy
    let t=lsq===0?0:((target.x-a.x)*sdx+(target.y-a.y)*sdy)/lsq
    t=Math.max(0,Math.min(1,t))
    const px=a.x+t*sdx,py=a.y+t*sdy
    const dx2=(px-target.x)*MAP_SIZE,dy2=(py-target.y)*MAP_SIZE
    const d2=dx2*dx2+dy2*dy2
    if (d2<bestD2){bestD2=d2;bestPt={x:px,y:py};bestAcc=acc+dist2d(a,{x:px,y:py})}
    acc+=dist2d(a,b)
  }
  return {d:bestAcc,pt:bestPt}
}

// Physics constants
const BUS_SPEED = 87        // m/s
const BUS_ALT = 120         // m above sea level (absolute minimum)
const DIVE_HSPEED = 75      // m/s horizontal in freefall
const DIVE_VSPEED = 78      // m/s downward in freefall
const GLIDE_HSPEED = 20     // m/s horizontal gliding
const GLIDE_VSPEED = 11     // m/s downward gliding
const GLIDE_TRIGGER = 35    // m above effective ground to deploy

export interface DropResult {
  jumpPoint: Point
  jumpTimeSec: number
  flightPath: Point[]
  landPoint: Point
  glideDistM: number
  freefallDistM: number
  targetGroundAlt: number
  jumpAlt: number
  error?: string
}

export function computeDrop(rawRoute: Point[], target: Point, map: MapType): DropResult {
  if (rawRoute.length < 2) {
    return {jumpPoint:target,jumpTimeSec:0,flightPath:[target],landPoint:target,glideDistM:0,freefallDistM:0,targetGroundAlt:0,jumpAlt:BUS_ALT}
  }

  const route = smoothRoute(rawRoute, 3)
  const groundAlt = getElevation(target, map)
  const bldExtra = buildingExtra(target, map)
  const effectiveGround = groundAlt + bldExtra

  // Bus flies at least BUS_ALT, or 80m above terrain max along route
  const jumpAlt = Math.max(BUS_ALT, effectiveGround + 80)

  // How far can you travel horizontally?
  const freefallDrop = Math.max(0, jumpAlt - effectiveGround - GLIDE_TRIGGER)
  const freefallTime = freefallDrop / DIVE_VSPEED
  const maxFreefallH = freefallTime * DIVE_HSPEED
  const glideTime = GLIDE_TRIGGER / GLIDE_VSPEED
  const maxGlideH = glideTime * GLIDE_HSPEED
  const maxRange = maxFreefallH + maxGlideH

  // Walk bus route to find first point within range of target
  const totalLen = polyLen(route)
  let jumpPoint: Point = route[0]
  const SAMPLES = 600
  let found = false

  for (let i=0;i<=SAMPLES;i++) {
    const pt = ptAtDist(route, (i/SAMPLES)*totalLen)
    if (dist2d(pt, target) <= maxRange) {
      jumpPoint = pt
      found = true
      break
    }
  }
  if (!found) jumpPoint = distAlongRoute(route, target).pt

  const {d: jumpDist} = distAlongRoute(route, jumpPoint)
  const jumpTimeSec = jumpDist / BUS_SPEED

  // Build flight path
  const totalH = dist2d(jumpPoint, target)
  const dx = target.x - jumpPoint.x
  const dy = target.y - jumpPoint.y
  const dLen = Math.sqrt(dx*dx+dy*dy) || 1e-9

  const actualFreefallH = Math.min(maxFreefallH, totalH)
  const actualGlideH = totalH - actualFreefallH

  // Perpendicular for terrain-deflection arc
  const perpX = -dy/dLen, perpY = dx/dLen

  const STEPS = 60
  const flightPath: Point[] = []

  for (let i=0;i<=STEPS;i++) {
    const frac = i/STEPS
    const hDist = frac * totalH
    const t = totalH > 0 ? hDist/totalH : 0

    // Terrain slope deflection (only during glide phase)
    let deflect = 0
    if (hDist > actualFreefallH && totalH > 0) {
      const midPt:Point = {x: jumpPoint.x+t*dx, y: jumpPoint.y+t*dy}
      const localElev = getElevation(midPt, map)
      deflect = (localElev - groundAlt) / 300 * 0.003 * Math.sin(t*Math.PI)
    }

    flightPath.push({
      x: jumpPoint.x + t*dx + perpX*deflect,
      y: jumpPoint.y + t*dy + perpY*deflect,
    })
  }

  return {
    jumpPoint,
    jumpTimeSec,
    flightPath,
    landPoint: flightPath[flightPath.length-1],
    glideDistM: actualGlideH,
    freefallDistM: actualFreefallH,
    targetGroundAlt: effectiveGround,
    jumpAlt,
  }
}

export function formatJumpTime(sec: number): string {
  if (sec < 2) return 'Jump immediately!'
  return `${Math.round(sec)}s after bus start`
}

export const POIS: Record<MapType, Array<{name:string;x:number;y:number}>> = {
  current: [
    {name:'Frenzy Fields',x:0.63,y:0.31},
    {name:'Pleasant Piazza',x:0.48,y:0.44},
    {name:'Restoration Rig',x:0.24,y:0.38},
    {name:'Reckless Railways',x:0.35,y:0.60},
    {name:'Lavish Lair',x:0.73,y:0.51},
    {name:'Seaport City',x:0.78,y:0.27},
    {name:'Brutal Beachhead',x:0.15,y:0.48},
    {name:"Shogun's Solitude",x:0.55,y:0.70},
  ],
  og: [
    {name:'Tilted Towers',x:0.43,y:0.44},
    {name:'Dusty Divot',x:0.56,y:0.51},
    {name:'Fatal Fields',x:0.63,y:0.74},
    {name:'Salty Springs',x:0.52,y:0.62},
    {name:'Pleasant Park',x:0.33,y:0.25},
    {name:'Retail Row',x:0.67,y:0.55},
    {name:'Loot Lake',x:0.41,y:0.42},
    {name:'Polar Peak',x:0.24,y:0.79},
    {name:'Paradise Palms',x:0.83,y:0.70},
    {name:'Haunted Hills',x:0.21,y:0.23},
    {name:'Shifty Shafts',x:0.42,y:0.57},
    {name:'Greasy Grove',x:0.31,y:0.63},
  ],
}
