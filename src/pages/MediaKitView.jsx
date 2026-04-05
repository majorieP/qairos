import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMediaKits } from '../context/MediaKitsContext'
import { clientsData } from './Roster'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CREATOR_PHOTO_MAP = { 1:'women/12', 2:'men/10', 3:'women/22', 4:'men/20', 5:'women/32', 6:'women/26', 7:'men/15', 8:'women/44', 9:'men/25', 10:'women/8' }
function creatorPhotoUrl(id) {
  const path = CREATOR_PHOTO_MAP[id] || `women/${((id * 7) % 49) + 1}`
  return `https://randomuser.me/api/portraits/${path}.jpg`
}

function fmtNum(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

// ─── Fake-but-realistic data seeded per creator ───────────────────────────────

const AUDIENCE_DATA = [
  { ageRange: '25–34', gender: { female: 72, male: 25, other: 3 }, locations: [['🇺🇸', 'United States', '62%'], ['🇬🇧', 'United Kingdom', '14%'], ['🇨🇦', 'Canada', '8%']] },
  { ageRange: '18–24', gender: { female: 58, male: 38, other: 4 }, locations: [['🇺🇸', 'United States', '58%'], ['🇦🇺', 'Australia', '12%'], ['🇩🇪', 'Germany', '7%']] },
  { ageRange: '25–34', gender: { female: 81, male: 17, other: 2 }, locations: [['🇺🇸', 'United States', '71%'], ['🇲🇽', 'Mexico', '9%'],    ['🇧🇷', 'Brazil', '6%']] },
  { ageRange: '35–44', gender: { female: 45, male: 52, other: 3 }, locations: [['🇺🇸', 'United States', '55%'], ['🇫🇷', 'France', '11%'],   ['🇮🇹', 'Italy', '8%']] },
  { ageRange: '25–34', gender: { female: 69, male: 28, other: 3 }, locations: [['🇺🇸', 'United States', '68%'], ['🇨🇦', 'Canada', '10%'],   ['🇦🇺', 'Australia', '7%']] },
  { ageRange: '25–34', gender: { female: 77, male: 20, other: 3 }, locations: [['🇺🇸', 'United States', '60%'], ['🇬🇧', 'United Kingdom', '16%'], ['🇦🇺', 'Australia', '9%']] },
  { ageRange: '18–24', gender: { female: 55, male: 41, other: 4 }, locations: [['🇺🇸', 'United States', '52%'], ['🇨🇦', 'Canada', '13%'],   ['🇳🇿', 'New Zealand', '7%']] },
  { ageRange: '25–34', gender: { female: 83, male: 15, other: 2 }, locations: [['🇺🇸', 'United States', '74%'], ['🇲🇽', 'Mexico', '8%'],    ['🇦🇷', 'Argentina', '5%']] },
  { ageRange: '35–44', gender: { female: 48, male: 49, other: 3 }, locations: [['🇺🇸', 'United States', '63%'], ['🇬🇧', 'United Kingdom', '11%'], ['🇮🇪', 'Ireland', '6%']] },
  { ageRange: '25–34', gender: { female: 71, male: 26, other: 3 }, locations: [['🇺🇸', 'United States', '57%'], ['🇯🇵', 'Japan', '10%'],    ['🇰🇷', 'South Korea', '8%']] },
]

const CONTENT_TYPES = [
  ['IG Reels', 'TikTok Videos', 'YouTube Shorts'],
  ['TikTok Videos', 'IG Stories', 'IG Reels'],
  ['IG Reels', 'Blog Posts', 'Pinterest Pins'],
  ['YouTube Videos', 'IG Reels', 'Podcast Episodes'],
  ['IG Stories', 'TikTok Videos', 'IG Reels'],
  ['IG Reels', 'TikTok Videos', 'YouTube Shorts'],
  ['TikTok Videos', 'IG Reels', 'YouTube Shorts'],
  ['IG Reels', 'YouTube Shorts', 'TikTok Videos'],
  ['Podcast Episodes', 'YouTube Videos', 'Blog Posts'],
  ['IG Reels', 'TikTok Videos', 'IG Stories'],
]

const FALLBACK_BRANDS = [
  { name: 'Nike',      domain: 'nike.com' },
  { name: 'Sephora',   domain: 'sephora.com' },
  { name: 'Amazon',    domain: 'amazon.com' },
  { name: 'Apple',     domain: 'apple.com' },
  { name: 'Glossier',  domain: 'glossier.com' },
  { name: 'Alo Yoga',  domain: 'aloyoga.com' },
]

const BRAND_DOMAIN_MAP = {
  'Nike': 'nike.com', 'Sephora': 'sephora.com', 'Amazon': 'amazon.com', 'Apple': 'apple.com',
  'Glossier': 'glossier.com', 'Alo Yoga': 'aloyoga.com', 'Strideline': 'strideline.com',
  'Lumière Beauty': 'lumiere.com', 'Bloom Wellness': 'bloomwellness.com',
  'TechTrends': 'techtrends.com', 'Solstice': 'solstice.com',
  'Verdant Foods': 'verdantfoods.com', 'NovaTech': 'novatech.com',
  'CloudDenim': 'clouddenim.com', 'H&M': 'hm.com', 'ASOS': 'asos.com',
  'Zara': 'zara.com', 'Revolve': 'revolve.com', 'Fenty Beauty': 'fentybeauty.com',
  'Charlotte Tilbury': 'charlottetilbury.com', 'Gymshark': 'gymshark.com',
  'Lululemon': 'lululemon.com', 'Adidas': 'adidas.com', 'Spotify': 'spotify.com',
  'Notion': 'notion.so', 'Adobe': 'adobe.com', 'Squarespace': 'squarespace.com',
}
function brandDomain(name) {
  return BRAND_DOMAIN_MAP[name] || (name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com')
}

const FALLBACK_RATES = {
  Instagram: [
    { platform: 'Instagram', type: 'Story (×3)',  rate: 800 },
    { platform: 'Instagram', type: 'Reel',        rate: 2500 },
    { platform: 'Instagram', type: 'Feed Post',   rate: 1800 },
  ],
  TikTok: [
    { platform: 'TikTok', type: 'Video',            rate: 2000 },
    { platform: 'TikTok', type: 'Series (3 videos)',rate: 5500 },
    { platform: 'TikTok', type: 'Live Mention',     rate: 1200 },
  ],
  YouTube: [
    { platform: 'YouTube', type: 'Integration (30–60s)', rate: 3500 },
    { platform: 'YouTube', type: 'Dedicated Video',      rate: 6000 },
    { platform: 'YouTube', type: 'Shorts',               rate: 1500 },
  ],
  Podcast: [
    { platform: 'Podcast', type: 'Host-read Ad (30s)',    rate: 1200 },
    { platform: 'Podcast', type: 'Host-read Ad (60s)',    rate: 2000 },
    { platform: 'Podcast', type: 'Sponsored Episode',     rate: 4000 },
  ],
  Blog: [
    { platform: 'Blog', type: 'Sponsored Post',  rate: 1500 },
    { platform: 'Blog', type: 'Product Review',  rate: 900 },
  ],
  'Twitter/X': [
    { platform: 'Twitter/X', type: 'Sponsored Tweet', rate: 600 },
    { platform: 'Twitter/X', type: 'Thread',          rate: 1000 },
  ],
}

const PLATFORM_COLORS = {
  Instagram: '#E1306C', TikTok: '#111111', YouTube: '#FF0000',
  'Twitter/X': '#111111', Pinterest: '#E60023', Blog: '#FF6B35', Podcast: '#8B5CF6',
}

function contentImages(clientId) {
  return Array.from({ length: 6 }, (_, i) => ({
    url:      `https://picsum.photos/seed/${clientId * 17 + i + 30}/400/${i % 3 === 2 ? 400 : 500}`,
    likes:    fmtNum(Math.floor((clientId * 1337 + i * 503) % 45000) + 5000),
    comments: String(Math.floor((clientId * 431 + i * 211) % 1800) + 200),
  }))
}
function platformThumbs(clientId, pIdx) {
  return Array.from({ length: 3 }, (_, i) =>
    `https://picsum.photos/seed/${clientId * 31 + pIdx * 5 + i + 10}/80/80`
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0 }) {
  const ref  = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el  = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } }, { threshold: 0.05 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(16px)', transition: `opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ borderBottom: '1px solid #EEEEEE', paddingBottom: 12, marginBottom: 24 }}>
      <h2 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: 18, color: '#111111', margin: 0 }}>
        {children}
      </h2>
    </div>
  )
}

function ContentImg({ url, likes, comments }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <img src={url} alt="" style={{ width: '100%', display: 'block', aspectRatio: '4/5', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.56)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, opacity: hov ? 1 : 0, transition: 'opacity 0.2s' }}>
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: '"Inter", system-ui' }}>♥ {likes}</span>
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: '"Inter", system-ui' }}>💬 {comments}</span>
      </div>
    </div>
  )
}

function BrandCircle({ name, domain }) {
  const [err, setErr] = useState(false)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid #EEEEEE', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {!err && domain ? (
          <img
            src={`https://logo.clearbit.com/${domain}`}
            alt={name}
            style={{ width: 28, height: 28, objectFit: 'contain' }}
            onError={() => setErr(true)}
          />
        ) : (
          <span style={{ fontFamily: '"Inter", system-ui', fontWeight: 700, fontSize: 11, color: '#888888' }}>{initials}</span>
        )}
      </div>
      <span style={{ fontFamily: '"Inter", system-ui', fontSize: 11, color: '#AAAAAA', textAlign: 'center', maxWidth: 64, lineHeight: 1.3 }}>{name}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MediaKitView() {
  const { token }                       = useParams()
  const { mediaKits, publishMediaKit }  = useMediaKits()
  const [copied, setCopied]             = useState(false)

  const kit = mediaKits.find(m => m.shareToken === token)

  if (!kit) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: '"Inter", system-ui', fontWeight: 600, fontSize: 20, color: '#111111', marginBottom: 8 }}>Media kit not found</p>
          <Link to="/media-kits" style={{ fontFamily: '"Inter", system-ui', fontSize: 13, color: '#888888', textDecoration: 'none' }}>← Back to Media Kits</Link>
        </div>
      </div>
    )
  }

  const client = clientsData.find(c => c.id === kit.clientId)
  if (!client) return null

  const photo          = creatorPhotoUrl(client.id)
  const totalFollowers = client.platforms?.reduce((s, p) => s + (p.followersNum || 0), 0) || 0
  const primaryP       = client.platforms?.find(p => p.name === client.primaryPlatform) || client.platforms?.[0]
  const audience       = AUDIENCE_DATA[(client.id - 1) % 10]
  const imgs           = contentImages(client.id)
  const contentTypePills = CONTENT_TYPES[(client.id - 1) % 10]

  // Past deal brands (or fallback to well-known brands)
  const dealBrands = (client.deals || [])
    .filter(d => d.status === 'Signed' || d.status === 'Closed' || d.status === 'Completed')
    .map(d => ({ name: d.brand, domain: brandDomain(d.brand) }))
  const brands = dealBrands.length > 0 ? dealBrands : FALLBACK_BRANDS

  // Rates (from client or seeded fallback)
  const rates = client.rates?.length > 0
    ? client.rates
    : (FALLBACK_RATES[client.primaryPlatform] || FALLBACK_RATES.Instagram)

  const manager = client.assignedManager || 'Qairos Team'

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const btnDark = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#111111', color: '#fff',
    border: '1px solid #111111', borderRadius: 8,
    padding: '7px 16px', fontSize: 13,
    fontFamily: '"Inter", system-ui', fontWeight: 500,
    cursor: 'pointer', transition: 'opacity 0.15s',
  }
  const btnGhost = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'transparent', color: '#888888',
    border: '1px solid #EEEEEE', borderRadius: 8,
    padding: '7px 16px', fontSize: 13,
    fontFamily: '"Inter", system-ui', fontWeight: 400,
    cursor: 'pointer', transition: 'border-color 0.15s',
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* ── Sticky action bar ──────────────────────────────────────────────── */}
      <div
        className="print:hidden"
        style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #EEEEEE' }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '10px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/media-kits" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#888888', textDecoration: 'none', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = '#111111'}
            onMouseLeave={e => e.currentTarget.style.color = '#888888'}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Media Kits
          </Link>
          <span style={{ width: 1, height: 14, background: '#EEEEEE', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {client.name} — Media Kit
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {kit.status === 'Draft' && (
              <button
                onClick={() => publishMediaKit(kit.id)}
                style={{ ...btnGhost, color: '#1A7A4A', borderColor: '#BBF7D0', background: '#EDFAF3' }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1A7A4A', flexShrink: 0 }} />
                Publish
              </button>
            )}
            <button onClick={handleCopy} style={btnGhost}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#CCCCCC'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#EEEEEE'}
            >
              {copied ? (
                <>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5 5.5-5" stroke="#1A7A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ color: '#1A7A4A' }}>Copied</span>
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4.5 7.5h-2a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><rect x="4.5" y="4.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
                  Share link
                </>
              )}
            </button>
            <button onClick={() => window.print()} style={btnDark}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4V1.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><rect x="1" y="4" width="10" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M3 9.5v1a.5.5 0 00.5.5h5a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8.5" cy="6.5" r=".65" fill="currentColor"/></svg>
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Document ───────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 32px 80px' }}>

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: 0, marginBottom: 48 }}>

          {/* Left — creator photo */}
          <div style={{ paddingRight: 48 }}>
            <div style={{ position: 'relative' }}>
              <img
                src={photo}
                alt={client.name}
                style={{ width: '100%', height: 400, objectFit: 'cover', borderRadius: 12, display: 'block' }}
              />
              {/* Represented by pill */}
              <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', border: '1px solid #EEEEEE', borderRadius: 20, padding: '5px 12px' }}>
                <svg width="9" height="9" viewBox="0 0 14 14" fill="none"><path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#111111" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 5L10 6.5V9.5L7 11L4 9.5V6.5L7 5Z" fill="#111111"/></svg>
                <span style={{ fontFamily: '"Inter", system-ui', fontWeight: 500, fontSize: 11, color: '#111111' }}>Represented by Qairos</span>
              </div>
            </div>
          </div>

          {/* Right — info */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ fontFamily: '"Inter", system-ui', fontWeight: 700, fontSize: 40, color: '#111111', letterSpacing: '-0.02em', margin: 0, marginBottom: 8, lineHeight: 1.1 }}>
              {client.name}
            </h1>
            <p style={{ fontFamily: '"Inter", system-ui', fontWeight: 400, fontSize: 16, color: '#999999', margin: 0, marginBottom: 20 }}>
              {client.handle}
            </p>

            {/* Niche tags */}
            {client.niches?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {client.niches.map(n => (
                  <span key={n} style={{ fontFamily: '"Inter", system-ui', fontWeight: 400, fontSize: 13, color: '#666666', border: '1px solid #EEEEEE', borderRadius: 6, padding: '4px 12px', background: '#fff' }}>
                    {n}
                  </span>
                ))}
              </div>
            )}

            {/* Location + platform */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {client.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: '"Inter", system-ui', fontSize: 14, color: '#666666' }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1a3.5 3.5 0 013.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 016 1z" stroke="currentColor" strokeWidth="1.2"/><circle cx="6" cy="4.5" r="1.2" stroke="currentColor" strokeWidth="1.1"/></svg>
                  {client.location}
                </span>
              )}
              {client.location && client.primaryPlatform && (
                <span style={{ width: 1, height: 12, background: '#EEEEEE' }} />
              )}
              {client.primaryPlatform && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: '"Inter", system-ui', fontSize: 14, color: '#666666' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: PLATFORM_COLORS[client.primaryPlatform] || '#888888', flexShrink: 0 }} />
                  {client.primaryPlatform}
                </span>
              )}
            </div>

            {/* Bio */}
            {client.bio && (
              <p style={{ fontFamily: '"Inter", system-ui', fontWeight: 400, fontSize: 16, color: '#444444', lineHeight: 1.7, margin: 0, marginBottom: 36 }}>
                {client.bio}
              </p>
            )}

            {/* 3 key stats */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              {[
                { label: 'Total Reach',      value: fmtNum(totalFollowers) },
                { label: 'Avg Engagement',   value: primaryP?.engagement ? `${primaryP.engagement}%` : '—' },
                { label: 'Primary Platform', value: client.primaryPlatform || '—' },
              ].map((stat, i) => (
                <div key={stat.label} style={{ flex: 1, paddingLeft: i > 0 ? 24 : 0, paddingRight: i < 2 ? 24 : 0, borderLeft: i > 0 ? '1px solid #EEEEEE' : 'none' }}>
                  <p style={{ fontFamily: '"Inter", system-ui', fontWeight: 700, fontSize: 28, color: '#111111', letterSpacing: '-0.02em', margin: 0, marginBottom: 4, lineHeight: 1.1 }}>
                    {stat.value}
                  </p>
                  <p style={{ fontFamily: '"Inter", system-ui', fontWeight: 400, fontSize: 12, color: '#999999', margin: 0 }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ PLATFORMS ═══════════════════════════════════════════════════════ */}
        {client.platforms?.length > 0 && (
          <FadeIn delay={40}>
            <div style={{ marginBottom: 48 }}>
              <SectionTitle>Platforms</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {client.platforms.map((p, pIdx) => {
                  const avgLikes = p.followersNum ? fmtNum(Math.round(p.followersNum * (p.engagement || 0) / 100)) : '—'
                  const thumbs   = platformThumbs(client.id, pIdx)
                  const dotColor = PLATFORM_COLORS[p.name] || '#888888'
                  return (
                    <div key={p.name} style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 12, padding: 20, display: 'grid', gridTemplateColumns: '180px 1fr 264px', gap: 28, alignItems: 'center' }}>
                      {/* Platform header */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                          <span style={{ fontFamily: '"Inter", system-ui', fontWeight: 600, fontSize: 15, color: '#111111' }}>{p.name}</span>
                        </div>
                        {p.handle && <span style={{ fontFamily: '"Inter", system-ui', fontSize: 13, color: '#999999' }}>{p.handle}</span>}
                      </div>
                      {/* 2×2 stats grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                        {[
                          { label: 'Followers',       value: p.followers || '—' },
                          { label: 'Engagement Rate', value: p.engagement ? `${p.engagement}%` : '—' },
                          { label: 'Avg Views',       value: p.avgViews || '—' },
                          { label: 'Avg Likes',       value: avgLikes },
                        ].map(stat => (
                          <div key={stat.label}>
                            <p style={{ fontFamily: '"Inter", system-ui', fontWeight: 700, fontSize: 20, color: '#111111', margin: 0, marginBottom: 2, lineHeight: 1.1 }}>{stat.value}</p>
                            <p style={{ fontFamily: '"Inter", system-ui', fontWeight: 400, fontSize: 11, color: '#999999', margin: 0 }}>{stat.label}</p>
                          </div>
                        ))}
                      </div>
                      {/* 3 content thumbnails */}
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {thumbs.map((src, ti) => (
                          <img key={ti} src={src} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </FadeIn>
        )}

        {/* ══ AUDIENCE ════════════════════════════════════════════════════════ */}
        <FadeIn delay={60}>
          <div style={{ marginBottom: 48 }}>
            <SectionTitle>Audience</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

              {/* Age Range */}
              <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 12, padding: 20 }}>
                <p style={{ fontFamily: '"Inter", system-ui', fontWeight: 500, fontSize: 11, color: '#999999', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, marginBottom: 14 }}>Primary Age</p>
                <p style={{ fontFamily: '"Inter", system-ui', fontWeight: 700, fontSize: 36, color: '#111111', letterSpacing: '-0.02em', margin: 0, marginBottom: 6, lineHeight: 1.1 }}>
                  {audience.ageRange}
                </p>
                <p style={{ fontFamily: '"Inter", system-ui', fontWeight: 400, fontSize: 12, color: '#999999', margin: 0 }}>of total audience</p>
              </div>

              {/* Gender Split */}
              <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 12, padding: 20 }}>
                <p style={{ fontFamily: '"Inter", system-ui', fontWeight: 500, fontSize: 11, color: '#999999', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, marginBottom: 14 }}>Gender Split</p>
                <p style={{ fontFamily: '"Inter", system-ui', fontWeight: 700, fontSize: 36, color: '#111111', letterSpacing: '-0.02em', margin: 0, marginBottom: 6, lineHeight: 1.1 }}>
                  {audience.gender.female > audience.gender.male ? `${audience.gender.female}% F` : `${audience.gender.male}% M`}
                </p>
                {/* Bar */}
                <div style={{ display: 'flex', height: 5, borderRadius: 99, overflow: 'hidden', background: '#F0F0F0', marginBottom: 10 }}>
                  <div style={{ width: `${audience.gender.female}%`, background: '#E1306C' }} />
                  <div style={{ width: `${audience.gender.male}%`, background: '#111111' }} />
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', gap: 12 }}>
                  {[['Female', audience.gender.female, '#E1306C'], ['Male', audience.gender.male, '#111111'], ['Other', audience.gender.other, '#DDDDDD']].map(([lbl, pct, col]) => (
                    <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: col, flexShrink: 0 }} />
                      <span style={{ fontFamily: '"Inter", system-ui', fontSize: 11, color: '#888888' }}>{lbl} {pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Locations */}
              <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 12, padding: 20 }}>
                <p style={{ fontFamily: '"Inter", system-ui', fontWeight: 500, fontSize: 11, color: '#999999', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, marginBottom: 14 }}>Top Locations</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {audience.locations.map(([flag, country, pct], li) => (
                    <div key={country} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: li < audience.locations.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18, lineHeight: 1 }}>{flag}</span>
                        <span style={{ fontFamily: '"Inter", system-ui', fontSize: 13, color: '#333333' }}>{country}</span>
                      </div>
                      <span style={{ fontFamily: '"Inter", system-ui', fontWeight: 600, fontSize: 13, color: '#111111' }}>{pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ══ CONTENT SHOWCASE ════════════════════════════════════════════════ */}
        <FadeIn delay={80}>
          <div style={{ marginBottom: 48 }}>
            <SectionTitle>Content</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
              {imgs.map((img, i) => (
                <ContentImg key={i} url={img.url} likes={img.likes} comments={img.comments} />
              ))}
            </div>
            {/* Best performing content types */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: '"Inter", system-ui', fontSize: 12, color: '#999999', marginRight: 4 }}>Best performing</span>
              {contentTypePills.map(type => (
                <span key={type} style={{ fontFamily: '"Inter", system-ui', fontWeight: 500, fontSize: 13, color: '#444444', background: '#F5F5F5', border: '1px solid #EEEEEE', borderRadius: 6, padding: '5px 12px' }}>
                  {type}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ══ PAST PARTNERSHIPS ═══════════════════════════════════════════════ */}
        <FadeIn delay={100}>
          <div style={{ marginBottom: 48 }}>
            <SectionTitle>Brands</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {brands.map(b => (
                <BrandCircle key={b.name} name={b.name} domain={b.domain} />
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ══ RATE CARD ═══════════════════════════════════════════════════════ */}
        <FadeIn delay={120}>
          <div style={{ marginBottom: 48 }}>
            <SectionTitle>Work With Me</SectionTitle>
            <div style={{ border: '1px solid #EEEEEE', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Inter", system-ui' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA' }}>
                    {['Platform', 'Content Type', 'Rate'].map((h, i) => (
                      <th key={h} style={{ padding: '10px 16px', fontWeight: 500, fontSize: 11, color: '#999999', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: i === 2 ? 'right' : 'left', borderBottom: '1px solid #EEEEEE' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rates.map((r, i) => (
                    <tr key={i} style={{ borderBottom: i < rates.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#666666', fontWeight: 400 }}>{r.platform}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#333333', fontWeight: 400 }}>{r.type}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#111111', fontWeight: 600, textAlign: 'right' }}>
                        ${typeof r.rate === 'number' ? r.rate.toLocaleString() : r.rate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontFamily: '"Inter", system-ui', fontSize: 13, color: '#999999', marginTop: 14 }}>
              For custom packages, contact <a href="mailto:talent@qairos.co" style={{ color: '#111111', fontWeight: 500, textDecoration: 'none' }}>{manager.toLowerCase().includes('@') ? manager : `${manager.toLowerCase().replace(/\s/g, '.')}@qairos.co`}</a>
            </p>
          </div>
        </FadeIn>

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <div className="print:hidden" style={{ borderTop: '1px solid #EEEEEE', paddingTop: 40, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32 }}>
          {/* Left — agency info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#111111" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 5L10 6.5V9.5L7 11L4 9.5V6.5L7 5Z" fill="#111111"/></svg>
              <span style={{ fontFamily: '"Inter", system-ui', fontWeight: 700, fontSize: 16, color: '#111111' }}>Qairos</span>
            </div>
            <p style={{ fontFamily: '"Inter", system-ui', fontSize: 13, color: '#666666', margin: 0, marginBottom: 2 }}>{manager}</p>
            <a href="mailto:talent@qairos.co" style={{ fontFamily: '"Inter", system-ui', fontSize: 13, color: '#888888', textDecoration: 'none' }}>talent@qairos.co</a>
          </div>

          {/* Center — generated by */}
          <p style={{ fontFamily: '"Inter", system-ui', fontSize: 12, color: '#AAAAAA', alignSelf: 'center' }}>
            Media Kit generated by Qairos
          </p>

          {/* Right — action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCopy} style={btnDark}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {copied ? (
                <>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4.5 7.5h-2a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><rect x="4.5" y="4.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
                  Share Link
                </>
              )}
            </button>
            <button onClick={() => window.print()} style={btnDark}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4V1.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><rect x="1" y="4" width="10" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M3 9.5v1a.5.5 0 00.5.5h5a.5.5 0 00.5-.5v-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8.5" cy="6.5" r=".65" fill="currentColor"/></svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
