import { useRef, useEffect, useState, useCallback } from 'react'
import { Point, MapType, POIS, getElevation, smoothRoute } from '@/lib/dropPhysics'

interface Props {
  mapType: MapType
  mode: 'draw-bus' | 'set-land' | 'view'
  busRoute: Point[]
  landPoint: Point | null
  jumpPoint: Point | null
  flightPath: Point[]
  onBusRouteChange: (r: Point[]) => void
  onLandPointChange: (p: Point) => void
}

// These URLs work client-side — loaded by the browser, not the server
const MAP_URLS: Record<MapType, string> = {
  // fortnite-api.com public map images (no auth required)
  current: 'https://media.fortniteapi.io/images/map.png',
  og:      'https://media.fortniteapi.io/images/map.png?season=og',
}

// Fallback: draw a terrain heatmap from our elevation data
function drawTerrainFallback(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  map: MapType
) {
  // Draw terrain colour from elevation
  const imgData = ctx.createImageData(w, h)
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const p: Point = { x: px/w, y: py/h }
      const elev = getElevation(p, map)
      const t = Math.min(1, elev / 200) // 0..1

      // Colour: deep blue (sea) → green (grass) → brown → white (snow)
      let r,g,b
      if (t < 0.05) { r=20;g=40;b=90 }          // water
      else if (t < 0.2) { r=30;g=80;b=40 }       // lowland green
      else if (t < 0.5) { r=55;g=110;b=50 }      // grass
      else if (t < 0.7) { r=90;g=130;b=60 }      // highland
      else if (t < 0.85){ r=120;g=100;b=70 }     // rocky
      else { r=210;g=210;b=220 }                  // snow

      const idx = (py*w + px)*4
      imgData.data[idx]   = r
      imgData.data[idx+1] = g
      imgData.data[idx+2] = b
      imgData.data[idx+3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)

  // Draw grid
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 0.5
  for (let i=0;i<=10;i++) {
    const x=(i/10)*w, y=(i/10)*h
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()
  }
}

export default function MapCanvas({
  mapType, mode, busRoute, landPoint, jumpPoint, flightPath,
  onBusRouteChange, onLandPointChange
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)
  const imgCache  = useRef<Record<string, HTMLImageElement>>({})
  const [imgState, setImgState] = useState<'loading'|'loaded'|'error'>('loading')
  const [canvasSize, setCanvasSize] = useState(600)
  const drawing = useRef(false)
  const routeRef = useRef<Point[]>(busRoute)

  // Keep routeRef in sync
  useEffect(() => { routeRef.current = busRoute }, [busRoute])

  // Resize observer — square canvas filling container
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      setCanvasSize(Math.floor(w))
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  // Load map image
  useEffect(() => {
    setImgState('loading')
    const url = MAP_URLS[mapType]
    if (imgCache.current[url]) { setImgState('loaded'); return }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    img.onload = () => { imgCache.current[url] = img; setImgState('loaded') }
    img.onerror = () => setImgState('error')
  }, [mapType])

  // ── Pixel-perfect coordinate conversion ───────────────────────────────────
  // Must use canvas.getBoundingClientRect() scaled to canvas logical size
  const eventToNorm = useCallback((e: MouseEvent | Touch): Point => {
    const canvas = canvasRef.current
    if (!canvas) return {x:0,y:0}
    const rect = canvas.getBoundingClientRect()
    // rect.width/height = CSS display size (may differ from canvas.width/height)
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = e.clientX
    const clientY = e.clientY
    const px = (clientX - rect.left) * scaleX
    const py = (clientY - rect.top)  * scaleY
    return {
      x: Math.max(0, Math.min(1, px / canvas.width)),
      y: Math.max(0, Math.min(1, py / canvas.height)),
    }
  }, [])

  // ── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0,0,W,H)

    // Background
    const url = MAP_URLS[mapType]
    const img = imgCache.current[url]
    if (img) {
      ctx.drawImage(img, 0,0,W,H)
      // Darken slightly for contrast
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(0,0,W,H)
    } else {
      drawTerrainFallback(ctx, W, H, mapType)
    }

    // POI labels
    ctx.save()
    ctx.font = `600 ${Math.max(9,W*0.017)}px 'Rajdhani',sans-serif`
    ctx.textAlign = 'center'
    POIS[mapType].forEach(poi => {
      const x=poi.x*W, y=poi.y*H
      // Shadow pill
      const tw = ctx.measureText(poi.name).width
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.beginPath()
      ctx.roundRect(x-tw/2-5, y-12, tw+10, 16, 4)
      ctx.fill()
      ctx.fillStyle = 'rgba(232,224,245,0.95)'
      ctx.fillText(poi.name, x, y)
    })
    ctx.restore()

    // Bus route (smoothed display)
    if (busRoute.length >= 2) {
      const smooth = smoothRoute(busRoute, 2)
      ctx.save()
      ctx.strokeStyle = '#a78bfa'
      ctx.lineWidth = Math.max(2, W*0.004)
      ctx.setLineDash([W*0.015, W*0.007])
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.shadowColor = 'rgba(167,139,250,0.4)'
      ctx.shadowBlur = 6
      ctx.beginPath()
      smooth.forEach((p,i) => {
        const x=p.x*W,y=p.y*H
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
      })
      ctx.stroke()
      ctx.setLineDash([])
      ctx.shadowBlur = 0

      // Direction arrows every 80px
      const totalPx = smooth.reduce((acc,p,i) => {
        if (i===0) return 0
        const prev=smooth[i-1]
        return acc+Math.sqrt(((p.x-prev.x)*W)**2+((p.y-prev.y)*H)**2)
      }, 0)
      const arrowEvery = 80
      let accPx = 0
      ctx.fillStyle = '#c4b5fd'
      for (let i=1;i<smooth.length;i++) {
        const prev=smooth[i-1],cur=smooth[i]
        const segPx = Math.sqrt(((cur.x-prev.x)*W)**2+((cur.y-prev.y)*H)**2)
        if (accPx+segPx >= arrowEvery) {
          const t=(arrowEvery-accPx)/segPx
          const ax=prev.x+t*(cur.x-prev.x),ay=prev.y+t*(cur.y-prev.y)
          const angle=Math.atan2((cur.y-prev.y)*H,(cur.x-prev.x)*W)
          ctx.save()
          ctx.translate(ax*W,ay*H)
          ctx.rotate(angle)
          const sz=W*0.012
          ctx.beginPath()
          ctx.moveTo(sz,0)
          ctx.lineTo(-sz,-sz*0.6)
          ctx.lineTo(-sz,sz*0.6)
          ctx.closePath()
          ctx.fill()
          ctx.restore()
          accPx = 0
        } else accPx += segPx
      }

      // Bus start dot
      ctx.fillStyle = '#7c5cbf'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(smooth[0].x*W, smooth[0].y*H, W*0.012,0,Math.PI*2)
      ctx.fill(); ctx.stroke()
      ctx.fillStyle='#fff'
      ctx.font=`bold ${W*0.018}px sans-serif`
      ctx.textAlign='center'
      ctx.fillText('🚌',smooth[0].x*W, smooth[0].y*H+5)
    }

    // Flight path
    if (flightPath.length >= 2) {
      ctx.save()
      ctx.strokeStyle = '#4ade80'
      ctx.lineWidth = Math.max(2, W*0.0045)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.shadowColor = 'rgba(74,222,128,0.3)'
      ctx.shadowBlur = 8
      ctx.beginPath()
      flightPath.forEach((p,i) => {
        const x=p.x*W,y=p.y*H
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
      })
      ctx.stroke()
      ctx.shadowBlur=0

      // Chevrons
      ctx.fillStyle='#4ade80'
      const sz=W*0.011
      for (let i=6;i<flightPath.length;i+=6) {
        const a=flightPath[i-1],b=flightPath[i]
        const angle=Math.atan2((b.y-a.y)*H,(b.x-a.x)*W)
        ctx.save()
        ctx.translate(b.x*W,b.y*H)
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.moveTo(sz,0)
        ctx.lineTo(-sz,-sz*0.6)
        ctx.lineTo(-sz,sz*0.6)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      ctx.restore()
    }

    // Jump point (red — pulsing rings baked in)
    if (jumpPoint) {
      const jx=jumpPoint.x*W, jy=jumpPoint.y*H
      ctx.save()
      // Outer rings
      ;[24,16].forEach((r,i) => {
        ctx.strokeStyle=`rgba(239,68,68,${0.2+i*0.15})`
        ctx.lineWidth=1.5
        ctx.beginPath();ctx.arc(jx,jy,r*W/600,0,Math.PI*2);ctx.stroke()
      })
      // Core
      ctx.fillStyle='#ef4444'
      ctx.beginPath();ctx.arc(jx,jy,W*0.014,0,Math.PI*2);ctx.fill()
      ctx.strokeStyle='#fff';ctx.lineWidth=2
      ctx.beginPath();ctx.arc(jx,jy,W*0.014,0,Math.PI*2);ctx.stroke()
      // Label
      const pill='JUMP'
      ctx.font=`700 ${W*0.018}px 'Rajdhani',sans-serif`
      ctx.textAlign='center'
      const tw=ctx.measureText(pill).width
      ctx.fillStyle='rgba(0,0,0,0.7)'
      ctx.beginPath()
      ctx.roundRect(jx-tw/2-6, jy-W*0.038, tw+12, 18, 4)
      ctx.fill()
      ctx.fillStyle='#fca5a5'
      ctx.fillText(pill,jx,jy-W*0.022)
      ctx.restore()
    }

    // Land point (green pin)
    if (landPoint) {
      const lx=landPoint.x*W, ly=landPoint.y*H
      const r=W*0.016
      ctx.save()
      // Pin body
      ctx.fillStyle='#4ade80'
      ctx.strokeStyle='#fff'
      ctx.lineWidth=2
      ctx.beginPath()
      ctx.arc(lx,ly-r,r,0,Math.PI*2)
      ctx.fill();ctx.stroke()
      // Pin tail
      ctx.beginPath()
      ctx.moveTo(lx,ly+r*0.3)
      ctx.lineTo(lx-r*0.7,ly-r)
      ctx.lineTo(lx+r*0.7,ly-r)
      ctx.closePath()
      ctx.fill();ctx.stroke()
      // Inner dot
      ctx.fillStyle='#fff'
      ctx.beginPath();ctx.arc(lx,ly-r,r*0.35,0,Math.PI*2);ctx.fill()
      // Label
      const pill='LAND'
      ctx.font=`700 ${W*0.018}px 'Rajdhani',sans-serif`
      ctx.textAlign='center'
      const tw=ctx.measureText(pill).width
      ctx.fillStyle='rgba(0,0,0,0.7)'
      ctx.beginPath()
      ctx.roundRect(lx-tw/2-6,ly+r*1.4,tw+12,18,4)
      ctx.fill()
      ctx.fillStyle='#86efac'
      ctx.fillText(pill,lx,ly+r*1.4+13)
      ctx.restore()
    }

  }, [busRoute, landPoint, jumpPoint, flightPath, mapType, imgState, canvasSize])

  useEffect(() => { draw() }, [draw])

  // ── Event handlers ────────────────────────────────────────────────────────
  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const raw = 'touches' in e ? e.touches[0] : e.nativeEvent as MouseEvent
    const p = eventToNorm(raw)
    if (mode === 'draw-bus') {
      drawing.current = true
      routeRef.current = [p]
      onBusRouteChange([p])
    } else if (mode === 'set-land') {
      onLandPointChange(p)
    }
  }

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current || mode !== 'draw-bus') return
    e.preventDefault()
    const raw = 'touches' in e ? e.touches[0] : e.nativeEvent as MouseEvent
    const p = eventToNorm(raw)
    const prev = routeRef.current[routeRef.current.length-1]
    if (!prev) return
    const dx=(p.x-prev.x)*canvasSize, dy=(p.y-prev.y)*canvasSize
    if (dx*dx+dy*dy > 4) { // min 2px movement
      const next = [...routeRef.current, p]
      routeRef.current = next
      onBusRouteChange(next)
    }
  }

  const onUp = () => { drawing.current = false }

  const cursor = mode==='draw-bus' ? 'crosshair' : mode==='set-land' ? 'cell' : 'default'

  return (
    <div ref={wrapRef} style={{width:'100%',position:'relative'}}>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{
          display:'block', width:'100%', height:'auto',
          borderRadius:12, cursor,
          touchAction:'none',
          border:'1px solid rgba(124,92,191,0.25)',
          background:'#0d1520',
        }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
      />

      {/* Loading overlay */}
      {imgState==='loading' && (
        <div style={{
          position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
          background:'rgba(13,11,20,0.6)',borderRadius:12,
          fontSize:13,color:'var(--text-dimmer)',gap:8,
        }}>
          <span style={{width:16,height:16,border:'2px solid var(--purple)',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/>
          Loading map…
        </div>
      )}

      {/* Instruction hint */}
      {mode!=='view' && (
        <div style={{
          position:'absolute',bottom:12,left:'50%',transform:'translateX(-50%)',
          background:'rgba(13,11,20,0.88)',backdropFilter:'blur(8px)',
          borderRadius:8,padding:'6px 16px',
          border:'1px solid rgba(124,92,191,0.25)',
          fontSize:12,color:'rgba(232,224,245,0.7)',
          pointerEvents:'none',whiteSpace:'nowrap',
        }}>
          {mode==='draw-bus' ? '✏️ Click and drag to draw the bus route' : '📍 Click anywhere to place your landing marker'}
        </div>
      )}
    </div>
  )
}
