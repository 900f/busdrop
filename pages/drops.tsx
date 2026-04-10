import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { useState } from 'react'

interface Drop { code:string; mapType:string; views:number; createdAt:string }

export default function DropsPage({ drops }: { drops: Drop[] }) {
  const [filter, setFilter] = useState<'all'|'current'|'og'>('all')
  const filtered = drops.filter(d => filter==='all' || d.mapType===filter)

  return (
    <>
      <Head><title>Browse Drops — BusDrop</title></Head>
      <main style={{ maxWidth:880, margin:'0 auto', padding:'36px 18px 80px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:14, marginBottom:28 }}>
          <div>
            <h1 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:38, fontWeight:700 }}>Recent Drops</h1>
            <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>Browse publicly shared drop routes</p>
          </div>
          <Link href="/drop" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:9, background:'var(--purple)', color:'#fff', fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:15, letterSpacing:'0.04em' }}>+ CREATE DROP</Link>
        </div>

        <div style={{ display:'flex', gap:7, marginBottom:24 }}>
          {(['all','current','og'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:600,
              background: filter===f ? 'var(--purple)' : 'var(--surface)',
              border: `1px solid ${filter===f ? 'var(--purple)' : 'var(--border)'}`,
              color: filter===f ? '#fff' : 'var(--text-dim)',
              cursor:'pointer', transition:'all 0.15s',
            }}>
              {f==='all' ? 'All Maps' : f==='current' ? 'Chapter 7 S2' : 'OG Map'}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'56px 0', color:'var(--text-dimmer)' }}>
            <div style={{ fontSize:38, marginBottom:14 }}>🗺️</div>
            <p>No drops yet. Be the first to create one!</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
            {filtered.map((d,i) => (
              <Link key={d.code} href={`/drop/${d.code}`} style={{
                display:'block', background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:11, padding:'18px', textDecoration:'none',
                animation:`slideUp 0.4s ease ${i*0.03}s both`,
                transition:'border-color 0.2s,transform 0.15s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-bright)';e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='translateY(0)'}}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:26, color:'var(--accent)', letterSpacing:'0.1em' }}>{d.code}</span>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', background:'rgba(124,92,191,0.14)', color:'var(--purple-light)', padding:'3px 8px', borderRadius:5 }}>
                    {d.mapType==='current' ? 'CH7 S2' : 'OG'}
                  </span>
                </div>
                <div style={{ display:'flex', gap:14, fontSize:12, color:'var(--text-dimmer)' }}>
                  <span>👁 {d.views}</span>
                  <span>🕐 {new Date(d.createdAt).toLocaleDateString('en-GB')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const drops = await prisma.drop.findMany({
      orderBy: { createdAt:'desc' },
      take: 60,
      select: { code:true, mapType:true, views:true, createdAt:true },
    })
    return { props: { drops: drops.map(d => ({...d, createdAt: d.createdAt.toISOString()})) } }
  } catch {
    return { props: { drops: [] } }
  }
}
