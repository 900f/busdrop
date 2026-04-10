import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { prisma } from '@/lib/prisma'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { Point, MapType } from '@/lib/dropPhysics'
import { formatJumpTime } from '@/lib/dropPhysics'

const MapCanvas = dynamic(() => import('@/components/MapCanvas'), { ssr: false })

interface DropData {
  code: string
  mapType: string
  busRoute: Point[]
  dropPoint: Point
  landPoint: Point
  jumpTick: number
  flightPath: Point[]
  views: number
}

interface Props {
  drop: DropData | null
  code: string
}

export default function DropView({ drop, code }: Props) {
  if (!drop) {
    return (
      <>
        <Head><title>Drop Not Found — BusDrop</title></Head>
        <main style={{ maxWidth:560, margin:'80px auto', padding:'0 24px', textAlign:'center' }}>
          <div style={{ fontSize:44, marginBottom:18 }}>🔍</div>
          <h1 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:30, marginBottom:10 }}>Drop Not Found</h1>
          <p style={{ color:'var(--text-dim)', marginBottom:28 }}>
            No drop matched the code <strong style={{ color:'var(--accent)' }}>{code}</strong>. Check the code and try again.
          </p>
          <Link href="/drop" style={{ display:'inline-block', padding:'11px 26px', background:'var(--purple)', color:'#fff', borderRadius:9, fontWeight:700, fontFamily:'Rajdhani,sans-serif', fontSize:16 }}>Create a New Drop</Link>
        </main>
      </>
    )
  }

  const jumpTime = formatJumpTime(drop.jumpTick)
  const glideM = drop.flightPath.length > 1
    ? Math.round(Math.sqrt(
        Math.pow((drop.flightPath[drop.flightPath.length-1].x - drop.flightPath[0].x)*5500, 2) +
        Math.pow((drop.flightPath[drop.flightPath.length-1].y - drop.flightPath[0].y)*5500, 2)
      ))
    : 0

  return (
    <>
      <Head>
        <title>Drop {drop.code} — BusDrop</title>
        <meta name="description" content={`Fortnite drop — ${drop.mapType==='current'?'Chapter 7 S2':'OG Map'} — Jump at ${jumpTime}`} />
      </Head>
      <main style={{ maxWidth:880, margin:'0 auto', padding:'28px 18px 80px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:14, marginBottom:28 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text-dimmer)', letterSpacing:'0.13em', marginBottom:4 }}>DROP CODE</div>
            <h1 style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:52, color:'var(--accent)', letterSpacing:'0.16em' }}>{drop.code}</h1>
            <div style={{ fontSize:13, color:'var(--text-dimmer)', marginTop:3 }}>
              {drop.mapType==='current' ? 'Chapter 7 Season 2' : 'OG Map'} · {drop.views} views
            </div>
          </div>
          <Link href="/drop" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:8, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, fontWeight:600, transition:'border-color 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-bright)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>+ Create Your Own</Link>
        </div>

        {/* Info banner */}
        <div style={{ background:'rgba(124,92,191,0.09)', border:'1px solid var(--border-bright)', borderRadius:12, padding:'18px 22px', marginBottom:24, display:'flex', flexWrap:'wrap', gap:28, alignItems:'center' }}>
          {[
            { label:'JUMP TIMING', value: jumpTime, color:'#f87171' },
            { label:'GLIDE DISTANCE', value:`${glideM}m`, color:'var(--accent)' },
            { label:'MAP', value: drop.mapType==='current'?'CH7 S2':'OG', color:'var(--accent)' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize:10, color:'var(--text-dimmer)', letterSpacing:'0.1em', marginBottom:3 }}>{s.label}</div>
              <div style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:26, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(195px,1fr))', gap:10, marginBottom:24 }}>
          {[
            { n:'1', color:'#a78bfa', label:'Watch the bus', desc:'Follow the purple dashed route on the map' },
            { n:'2', color:'#f87171', label: jumpTime, desc:'Deploy at the red marker — that is your jump point' },
            { n:'3', color:'#4ade80', label:'Follow the green path', desc:'Glide along the line straight to your landing spot' },
          ].map(s => (
            <div key={s.n} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:11, padding:'14px 16px', display:'flex', gap:11, alignItems:'flex-start' }}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:`${s.color}1a`, border:`1.5px solid ${s.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:13, color:s.color, flexShrink:0 }}>{s.n}</div>
              <div>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:2, color:s.color }}>{s.label}</div>
                <div style={{ fontSize:12, color:'var(--text-dimmer)', lineHeight:1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <MapCanvas
          mapType={drop.mapType as MapType}
          mode="view"
          busRoute={drop.busRoute}
          landPoint={drop.landPoint}
          jumpPoint={drop.dropPoint}
          flightPath={drop.flightPath}
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
      </main>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const code = (ctx.params?.code as string ?? '').toUpperCase()
  if (!code) return { props: { drop: null, code: '' } }

  try {
    const drop = await prisma.drop.findUnique({ where: { code } })
    if (!drop) return { props: { drop: null, code } }

    await prisma.drop.update({ where: { id: drop.id }, data: { views: { increment: 1 } } })

    return {
      props: {
        code,
        drop: {
          code: drop.code,
          mapType: drop.mapType,
          busRoute: drop.busRoute as Point[],
          dropPoint: drop.dropPoint as Point,
          landPoint: drop.landPoint as Point,
          jumpTick: drop.jumpTick,
          flightPath: drop.flightPath as Point[],
          views: drop.views + 1,
        }
      }
    }
  } catch (e) {
    console.error(e)
    return { props: { drop: null, code } }
  }
}
