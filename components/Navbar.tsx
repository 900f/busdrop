import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Navbar() {
  const router = useRouter()

  const link = (href: string, label: string) => {
    const active = router.pathname === href || router.pathname.startsWith(href + '/')
    return (
      <Link href={href} style={{
        padding:'6px 14px', borderRadius:7, fontSize:14, fontWeight:500,
        color: active ? 'var(--text)' : 'var(--text-dim)',
        background: active ? 'rgba(124,92,191,0.12)' : 'transparent',
        transition:'color 0.2s,background 0.2s',
      }}>{label}</Link>
    )
  }

  return (
    <nav style={{
      position:'sticky',top:0,zIndex:100,
      background:'rgba(13,11,20,0.88)',
      backdropFilter:'blur(16px)',
      borderBottom:'1px solid var(--border)',
      padding:'0 20px',
      height:58,
      display:'flex',alignItems:'center',justifyContent:'space-between',
    }}>
      <Link href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
        <div style={{
          width:30,height:30,borderRadius:8,
          background:'var(--purple)',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:15,
        }}>⬇</div>
        <span style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:20,color:'var(--text)'}}>
          BusDrop
        </span>
      </Link>

      <div style={{display:'flex',gap:4,alignItems:'center'}}>
        {link('/drops','Drops')}
        <Link href="/drop" style={{
          padding:'8px 18px',borderRadius:8,fontSize:14,fontWeight:600,
          background:'var(--purple)',color:'#fff',
          transition:'background 0.2s',marginLeft:6,
          fontFamily:'Rajdhani,sans-serif',letterSpacing:'0.04em',
        }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--purple-light)'}
          onMouseLeave={e=>e.currentTarget.style.background='var(--purple)'}
        >Create Drop</Link>
      </div>
    </nav>
  )
}
