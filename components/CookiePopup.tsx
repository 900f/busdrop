import { useState, useEffect } from 'react'

export default function CookiePopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('dm_cookies')
    if (!accepted) {
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('dm_cookies', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      width: 300,
      background: 'var(--surface)',
      border: '1px solid var(--border-bright)',
      borderRadius: 12,
      padding: '16px 18px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'cookieSlide 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
    }}>
      <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 12 }}>
        We use cookies to save your drop preferences and improve your experience.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={accept}
          style={{
            flex: 1,
            padding: '7px 0',
            background: 'var(--purple)',
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--purple-light)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--purple)')}
        >
          Accept
        </button>
        <button
          onClick={accept}
          style={{
            padding: '7px 12px',
            background: 'transparent',
            color: 'var(--text-dimmer)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Decline
        </button>
      </div>
    </div>
  )
}
