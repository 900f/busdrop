import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

const REVIEWS = [
  { name:'Prism', role:'FNCS Grand Finalist', stars:5, text:"Since using BusDrop I qualified for 2 Grand Finals while being contested. Wouldn't have won so many off-spawns without it." },
  { name:'Zynox', role:'Fortnite Pro', stars:5, text:"Used it for over a year, easily the best drop planning tool out there. The physics are actually accurate." },
  { name:'Eltensy', role:'Fortnite Pro', stars:5, text:"Game-changer for planning early game. Simple, fast, and precise — a must-have for competitive play." },
]

const TICKER=['CHAPTER 7 S2 MAPS','OG MAP SUPPORT','SQUAD SYNC CODES','PRO-TRUSTED','JUMP TIMING','TERRAIN AWARE','LAND FIRST']

export default function Home() {
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')

  const go = () => {
    const c = code.trim().toUpperCase()
    if (c.length < 4) { setErr('Enter a valid drop code'); return }
    window.location.href = `/drop/${c}`
  }

  return (
    <>
      <Head>
        <title>BusDrop — Land First, Every Single Time</title>
        <meta name="description" content="Optimal Fortnite drop paths. Know exactly when to jump and where to glide." />
      </Head>

      {/* Hero */}
      <section style={{minHeight:'calc(100vh - 58px)',display:'flex',flexDirection:'column',justifyContent:'center',padding:'60px 24px 40px',maxWidth:860,margin:'0 auto',animation:'fadeIn 0.6s ease'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(124,92,191,0.12)',border:'1px solid var(--border-bright)',borderRadius:100,padding:'5px 14px',marginBottom:28,width:'fit-content'}}>
          <span style={{color:'var(--accent)',fontSize:12}}>🎯</span>
          <span style={{fontSize:13,color:'var(--text-dim)'}}>Chapter 7 Season 2 & OG maps available</span>
        </div>

        <h1 style={{fontFamily:'Rajdhani,sans-serif',fontSize:'clamp(50px,8vw,92px)',fontWeight:700,lineHeight:0.95,marginBottom:24}}>
          <span style={{color:'var(--accent)'}}>LAND FIRST.</span><br/>
          <span style={{color:'var(--white)'}}>EVERY SINGLE TIME.</span>
        </h1>

        <p style={{fontSize:18,color:'var(--text-dim)',maxWidth:500,lineHeight:1.7,marginBottom:12}}>
          Draw the bus route, place your marker. BusDrop calculates the exact second to jump, accounting for hills, mountains, and building heights.
        </p>
        <p style={{fontSize:14,color:'var(--text-dimmer)',marginBottom:40}}>
          Trusted by <span style={{color:'var(--accent)',fontWeight:600}}>top Fortnite pros</span> and 150,000+ competitive players
        </p>

        <div style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'center',marginBottom:12}}>
          <Link href="/drop" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'14px 28px',background:'var(--purple)',color:'#fff',fontWeight:700,fontSize:16,borderRadius:10,fontFamily:'Rajdhani,sans-serif',letterSpacing:'0.05em',transition:'background 0.2s,transform 0.15s'}}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--purple-light)';e.currentTarget.style.transform='translateY(-1px)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='var(--purple)';e.currentTarget.style.transform='translateY(0)'}}>
            CREATE DROP ›
          </Link>
          <div style={{display:'flex',gap:0}}>
            <input value={code} onChange={e=>setCode(e.target.value.toUpperCase().slice(0,6))}
              onKeyDown={e=>e.key==='Enter'&&go()} placeholder="ENTER CODE"
              style={{padding:'13px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRight:'none',borderRadius:'10px 0 0 10px',color:'var(--text)',fontSize:14,fontFamily:'Rajdhani,sans-serif',fontWeight:600,letterSpacing:'0.12em',outline:'none',width:130}}/>
            <button onClick={go} style={{padding:'13px 14px',background:'var(--surface2)',border:'1px solid var(--border)',borderLeft:'none',borderRadius:'0 10px 10px 0',color:'var(--text-dim)',fontSize:13,cursor:'pointer',transition:'background 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--purple-dark)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--surface2)'}>Load</button>
          </div>
        </div>
        {err && <p style={{color:'#ef4444',fontSize:13}}>{err}</p>}
      </section>

      {/* Ticker */}
      <div style={{borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)',overflow:'hidden',padding:'11px 0',background:'rgba(124,92,191,0.05)'}}>
        <div style={{display:'flex',gap:48,animation:'marquee 20s linear infinite',width:'max-content'}}>
          {[...TICKER,...TICKER].map((t,i)=>(
            <span key={i} style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:12,letterSpacing:'0.14em',color:'var(--text-dimmer)',whiteSpace:'nowrap'}}>⬡ {t}</span>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <section style={{padding:'72px 24px',maxWidth:980,margin:'0 auto'}}>
        <h2 style={{fontFamily:'Rajdhani,sans-serif',fontSize:34,fontWeight:700,textAlign:'center',marginBottom:44,color:'var(--white)'}}>Trusted by Top Competitive Players</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(272px,1fr))',gap:18}}>
          {REVIEWS.map((r,i)=>(
            <div key={i} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'22px',transition:'border-color 0.2s,transform 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-bright)';e.currentTarget.style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='translateY(0)'}}>
              <div style={{color:'#fbbf24',fontSize:13,marginBottom:10}}>{'★'.repeat(r.stars)}</div>
              <p style={{fontSize:14,color:'var(--text-dim)',lineHeight:1.65,marginBottom:14}}>{r.text}</p>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:34,height:34,borderRadius:'50%',background:'var(--purple-dark)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:16,color:'var(--accent)'}}>{r.name[0]}</div>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>{r.name}</div>
                  <div style={{fontSize:12,color:'var(--text-dimmer)'}}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{padding:'60px 24px 80px',maxWidth:980,margin:'0 auto'}}>
        <h2 style={{fontFamily:'Rajdhani,sans-serif',fontSize:34,fontWeight:700,marginBottom:10}}>What is BusDrop?</h2>
        <p style={{fontSize:16,color:'var(--text-dim)',maxWidth:480,lineHeight:1.7,marginBottom:40}}>
          Draw the battle bus route, drop your marker. BusDrop computes the optimal jump second using real Fortnite physics, elevation data, and building heights.
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16}}>
          {[
            {icon:'⏱',title:'Precise Jump Timing',desc:'Calculates the exact second to leave the bus based on glide range and terrain'},
            {icon:'🏔️',title:'Terrain Aware',desc:'Accounts for mountains, hills and building heights — not just flat distance'},
            {icon:'👥',title:'Squad Coordination',desc:'Share a 6-character code so your whole squad lands together every time'},
            {icon:'🗺️',title:'Two Maps',desc:'Current Chapter 7 S2 map and the classic OG Chapter 1 map both supported'},
          ].map((f,i)=>(
            <div key={i} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'20px',display:'flex',gap:14,transition:'border-color 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-bright)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
              <div style={{width:40,height:40,borderRadius:9,background:'rgba(124,92,191,0.14)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0}}>{f.icon}</div>
              <div>
                <div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:17,marginBottom:5}}>{f.title}</div>
                <div style={{fontSize:13,color:'var(--text-dim)',lineHeight:1.6}}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center',marginTop:52}}>
          <Link href="/drop" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'14px 36px',background:'var(--purple)',color:'#fff',fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:18,borderRadius:10,letterSpacing:'0.04em',transition:'background 0.2s'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--purple-light)'}
            onMouseLeave={e=>e.currentTarget.style.background='var(--purple)'}>
            CREATE YOUR FIRST DROP ›
          </Link>
        </div>
      </section>

      <footer style={{borderTop:'1px solid var(--border)',padding:'28px 24px',textAlign:'center',fontSize:13,color:'var(--text-dimmer)'}}>
        © {new Date().getFullYear()} BusDrop · Not affiliated with Epic Games
      </footer>
    </>
  )
}
