import Head from 'next/head'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { Point, MapType } from '@/lib/dropPhysics'
import { formatJumpTime } from '@/lib/dropPhysics'

const MapCanvas = dynamic(() => import('@/components/MapCanvas'), { ssr: false })

type Step = 'map' | 'bus' | 'land' | 'result'

interface DropResult {
  code: string
  jumpPoint: Point
  jumpTimeSec: number
  flightPath: Point[]
  landPoint: Point
  glideDistM: number
  freefallDistM: number
  jumpAlt: number
  targetGroundAlt: number
}

export default function DropPage() {
  const [step, setStep] = useState<Step>('map')
  const [mapType, setMapType] = useState<MapType>('current')
  const [busRoute, setBusRoute] = useState<Point[]>([])
  const [landPoint, setLandPoint] = useState<Point | null>(null)
  const [result, setResult] = useState<DropResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleBusChange = useCallback((r: Point[]) => setBusRoute(r), [])
  const handleLandChange = useCallback((p: Point) => setLandPoint(p), [])

  const canNext = () => {
    if (step === 'map') return true
    if (step === 'bus') return busRoute.length >= 5
    if (step === 'land') return landPoint !== null
    return false
  }

  const next = async () => {
    if (step === 'map') { setStep('bus'); return }
    if (step === 'bus') { setStep('land'); return }
    if (step === 'land') {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/drops/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mapType, busRoute, landPoint }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
        setResult(data)
        setStep('result')
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
  }

  const back = () => {
    if (step === 'bus') setStep('map')
    if (step === 'land') setStep('bus')
    if (step === 'result') { setStep('land'); setResult(null) }
  }

  const reset = () => { setStep('map'); setBusRoute([]); setLandPoint(null); setResult(null); setError('') }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = result ? `${origin}/drop/${result.code}` : ''

  const STEPS = ['Choose Map', 'Draw Bus Route', 'Set Landing', 'Your Drop']
  const stepIdx = ['map','bus','land','result'].indexOf(step)

  return (
    <>
      <Head><title>Create Drop — BusDrop</title></Head>
      <main style={{ maxWidth:880, margin:'0 auto', padding:'28px 18px 80px' }}>

        {/* Step bar */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:36, overflowX:'auto', paddingBottom:4 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{
                  width:26, height:26, borderRadius:'50%',
                  background: i < stepIdx ? 'var(--purple)' : i === stepIdx ? 'var(--purple)' : 'var(--surface2)',
                  border: `2px solid ${i === stepIdx ? 'var(--purple-light)' : 'transparent'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:700,
                  color: i <= stepIdx ? '#fff' : 'var(--text-dimmer)',
                  transition:'all 0.25s', flexShrink:0,
                }}>
                  {i < stepIdx ? '✓' : i+1}
                </div>
                <span style={{ fontSize:13, fontWeight:500, color: i === stepIdx ? 'var(--text)' : 'var(--text-dimmer)', whiteSpace:'nowrap' }}>{s}</span>
              </div>
              {i < STEPS.length-1 && (
                <div style={{ width:28, height:1, background: i < stepIdx ? 'var(--purple)' : 'var(--border)', margin:'0 8px', flexShrink:0, transition:'background 0.3s' }}/>
              )}
            </div>
          ))}
        </div>

        {/* ── Step: Choose Map ── */}
        {step === 'map' && (
          <div style={{ animation:'fadeIn 0.35s ease' }}>
            <h1 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:34, fontWeight:700, marginBottom:6 }}>Choose Your Map</h1>
            <p style={{ color:'var(--text-dim)', fontSize:14, marginBottom:28 }}>Select the Fortnite map you're playing on</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, maxWidth:520, marginBottom:36 }}>
              {(['current','og'] as MapType[]).map(m => (
                <button key={m} onClick={() => setMapType(m)} style={{
                  padding:'26px 18px',
                  background: mapType===m ? 'rgba(124,92,191,0.14)' : 'var(--surface)',
                  border: `2px solid ${mapType===m ? 'var(--purple)' : 'var(--border)'}`,
                  borderRadius:13, cursor:'pointer',
                  display:'flex', flexDirection:'column', alignItems:'flex-start', gap:7,
                  transition:'all 0.2s',
                }}>
                  <span style={{ fontSize:26 }}>{m==='current' ? '🗺️' : '🏔️'}</span>
                  <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:18, color: mapType===m ? 'var(--accent)' : 'var(--text)' }}>
                    {m==='current' ? 'Chapter 7 S2' : 'OG Map'}
                  </span>
                  <span style={{ fontSize:12, color:'var(--text-dimmer)', textAlign:'left' }}>
                    {m==='current' ? 'Current season map' : 'Classic Chapter 1 map'}
                  </span>
                  {mapType===m && <span style={{ fontSize:10, fontWeight:700, color:'var(--accent)', letterSpacing:'0.1em' }}>✓ SELECTED</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Bus + Land (map shown) ── */}
        {(step==='bus' || step==='land') && (
          <div style={{ animation:'fadeIn 0.35s ease' }}>
            <h1 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:30, fontWeight:700, marginBottom:5 }}>
              {step==='bus' ? 'Draw the Bus Route' : 'Place Your Landing Spot'}
            </h1>
            <p style={{ color:'var(--text-dim)', fontSize:14, marginBottom:16 }}>
              {step==='bus'
                ? 'Click and drag across the map to trace the battle bus path. Draw the full route — you can redraw anytime.'
                : 'Click exactly where you want to land on the map.'}
            </p>

            {step==='bus' && busRoute.length >= 5 && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.25)', borderRadius:8, padding:'6px 14px', marginBottom:14, fontSize:13, color:'#4ade80' }}>
                ✓ Route drawn ({busRoute.length} points)
                <button onClick={() => setBusRoute([])} style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:12, padding:0 }}>Clear</button>
              </div>
            )}
            {step==='land' && landPoint && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.25)', borderRadius:8, padding:'6px 14px', marginBottom:14, fontSize:13, color:'#4ade80' }}>
                ✓ Landing spot set — click anywhere to move it
              </div>
            )}

            <MapCanvas
              mapType={mapType}
              mode={step==='bus' ? 'draw-bus' : 'set-land'}
              busRoute={busRoute}
              landPoint={landPoint}
              jumpPoint={null}
              flightPath={[]}
              onBusRouteChange={handleBusChange}
              onLandPointChange={handleLandChange}
            />
          </div>
        )}

        {/* ── Step: Result ── */}
        {step==='result' && result && (
          <div style={{ animation:'fadeIn 0.35s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22, flexWrap:'wrap' }}>
              <div style={{ width:46, height:46, borderRadius:12, background:'rgba(74,222,128,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>✓</div>
              <div>
                <h1 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:30, fontWeight:700, color:'#4ade80' }}>Drop Ready!</h1>
                <p style={{ color:'var(--text-dim)', fontSize:14 }}>Share the code with your squad</p>
              </div>
            </div>

            {/* Share code block */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border-bright)', borderRadius:14, padding:'24px', marginBottom:20 }}>
              <p style={{ fontSize:11, color:'var(--text-dimmer)', letterSpacing:'0.12em', marginBottom:6 }}>DROP CODE</p>
              <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', marginBottom:14 }}>
                <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:52, letterSpacing:'0.2em', color:'var(--accent)' }}>{result.code}</span>
                <button onClick={() => copy(result.code)} style={{
                  padding:'9px 18px', borderRadius:8,
                  background: copied ? 'rgba(74,222,128,0.12)' : 'var(--surface2)',
                  border: `1px solid ${copied ? 'rgba(74,222,128,0.4)' : 'var(--border)'}`,
                  color: copied ? '#4ade80' : 'var(--text)',
                  fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.2s',
                }}>{copied ? '✓ Copied!' : 'Copy Code'}</button>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <input readOnly value={shareUrl} style={{ flex:1, minWidth:180, padding:'8px 11px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:7, color:'var(--text-dim)', fontSize:12, fontFamily:'monospace' }}/>
                <button onClick={() => copy(shareUrl)} style={{ padding:'8px 14px', borderRadius:7, background:'var(--purple)', border:'none', color:'#fff', fontSize:13, cursor:'pointer', transition:'background 0.2s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--purple-light)'}
                  onMouseLeave={e=>e.currentTarget.style.background='var(--purple)'}>Copy Link</button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10, marginBottom:20 }}>
              {[
                { label:'JUMP AT', value: formatJumpTime(result.jumpTimeSec), sub:'from bus start' },
                { label:'FREEFALL', value:`${Math.round(result.freefallDistM)}m`, sub:'horizontal' },
                { label:'GLIDE', value:`${Math.round(result.glideDistM)}m`, sub:'horizontal' },
                { label:'BUS ALT', value:`${Math.round(result.jumpAlt)}m`, sub:'above sea level' },
                { label:'GROUND', value:`${Math.round(result.targetGroundAlt)}m`, sub:'at landing' },
                { label:'MAP', value: mapType==='current' ? 'CH7 S2' : 'OG', sub:'selected map' },
              ].map((s,i) => (
                <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:11, padding:'14px 16px' }}>
                  <div style={{ fontSize:10, color:'var(--text-dimmer)', letterSpacing:'0.1em', marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:22, color:'var(--accent)' }}>{s.value}</div>
                  <div style={{ fontSize:11, color:'var(--text-dimmer)' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Map view */}
            <MapCanvas
              mapType={mapType}
              mode="view"
              busRoute={busRoute}
              landPoint={result.landPoint}
              jumpPoint={result.jumpPoint}
              flightPath={result.flightPath}
              onBusRouteChange={() => {}}
              onLandPointChange={() => {}}
            />

            {/* Legend */}
            <div style={{ display:'flex', gap:18, marginTop:12, flexWrap:'wrap', fontSize:12, color:'var(--text-dim)' }}>
              <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ display:'inline-block', width:18, height:3, background:'#a78bfa', borderRadius:2 }}/> Bus route
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ display:'inline-block', width:9, height:9, borderRadius:'50%', background:'#ef4444' }}/> Jump point
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ display:'inline-block', width:18, height:3, background:'#4ade80', borderRadius:2 }}/> Glide path
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ display:'inline-block', width:9, height:9, borderRadius:'50%', background:'#4ade80' }}/> Landing spot
              </span>
            </div>

            <div style={{ display:'flex', gap:10, marginTop:22, flexWrap:'wrap' }}>
              <button onClick={reset} style={{ padding:'11px 22px', borderRadius:9, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, fontWeight:600, cursor:'pointer', transition:'border-color 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-bright)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>Create Another</button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop:14, padding:'11px 15px', background:'rgba(239,68,68,0.09)', border:'1px solid rgba(239,68,68,0.28)', borderRadius:8, fontSize:13, color:'#f87171' }}>
            ⚠ {error}
          </div>
        )}

        {/* Nav buttons */}
        {step !== 'result' && (
          <div style={{ display:'flex', gap:10, marginTop:28, flexWrap:'wrap' }}>
            {step !== 'map' && (
              <button onClick={back} style={{ padding:'12px 22px', borderRadius:9, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, fontWeight:600, cursor:'pointer' }}>← Back</button>
            )}
            <button onClick={next} disabled={!canNext() || loading} style={{
              padding:'12px 30px', borderRadius:9,
              background: canNext() && !loading ? 'var(--purple)' : 'var(--surface2)',
              border:'none',
              color: canNext() && !loading ? '#fff' : 'var(--text-dimmer)',
              fontSize:15, fontWeight:700, cursor: canNext() && !loading ? 'pointer' : 'not-allowed',
              fontFamily:'Rajdhani,sans-serif', letterSpacing:'0.04em', transition:'background 0.2s',
              display:'flex', alignItems:'center', gap:8,
            }}
              onMouseEnter={e=>{ if(canNext()&&!loading) e.currentTarget.style.background='var(--purple-light)' }}
              onMouseLeave={e=>{ if(canNext()&&!loading) e.currentTarget.style.background='var(--purple)' }}
            >
              {loading && <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/>}
              {loading ? 'Computing…' : step==='land' ? 'CALCULATE DROP ›' : 'NEXT ›'}
            </button>
            {step==='bus' && busRoute.length < 5 && (
              <span style={{ alignSelf:'center', fontSize:12, color:'var(--text-dimmer)' }}>Draw the bus route to continue</span>
            )}
          </div>
        )}
      </main>
    </>
  )
}
