import { useState, useMemo } from 'react'
import { brandsData } from '../pages/Contacts'

// Derive clearbit domain from website string or brand name
function deriveDomain(name, website) {
  const site = website || brandsData.find(b => b.name === name)?.website
  if (site) {
    return site.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
  // Guess from name: lowercase, strip spaces + special chars
  return name.toLowerCase().replace(/[^a-z0-9.]/g, '') + '.com'
}

/**
 * BrandLogo — circular brand logo via Clearbit, falls back to initials.
 *
 * Props:
 *   name     {string}  Brand name (required)
 *   website  {string}  Optional website URL — if omitted, looked up from brandsData or guessed
 *   size     {number}  Diameter in px (default 40)
 */
export default function BrandLogo({ name = '', website, size = 40 }) {
  const [failed, setFailed] = useState(false)

  const domain = useMemo(() => deriveDomain(name, website), [name, website])
  const src = !failed ? `https://logo.clearbit.com/${domain}` : null

  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const base = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxSizing: 'border-box',
  }

  if (src) {
    return (
      <div style={{ ...base, backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          style={{ width: '65%', height: '65%', objectFit: 'contain', display: 'block' }}
        />
      </div>
    )
  }

  return (
    <div style={{ ...base, backgroundColor: '#111111' }}>
      <span style={{
        color: '#FFFFFF',
        fontSize: Math.max(10, Math.round(size * 0.32)),
        fontWeight: 600,
        fontFamily: '"Inter", system-ui, sans-serif',
        lineHeight: 1,
        letterSpacing: '-0.01em',
        userSelect: 'none',
      }}>
        {initials}
      </span>
    </div>
  )
}
