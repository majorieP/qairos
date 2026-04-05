import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMediaKits } from '../context/MediaKitsContext'
import { clientsData } from './Roster'
import PageHeader from '../components/PageHeader'

const CREATOR_PHOTO_MAP = { 1:'women/12', 2:'men/10', 3:'women/22', 4:'men/20', 5:'women/32', 6:'women/26', 7:'men/15', 8:'women/44', 9:'men/25', 10:'women/8' }
function creatorPhotoUrl(id) {
  const path = CREATOR_PHOTO_MAP[id] || `women/${((id * 7) % 49) + 1}`
  return `https://randomuser.me/api/portraits/${path}.jpg`
}

const PLATFORM_DOT_COLORS = {
  Instagram: '#E1306C',
  TikTok: '#000000',
  YouTube: '#FF0000',
  'Twitter/X': '#000000',
  Pinterest: '#E60023',
  Blog: '#FF6B35',
  Podcast: '#8B5CF6',
}

function GenerateModal({ onClose, onGenerate, existingClientIds }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const available = useMemo(() =>
    clientsData
      .filter(c => !existingClientIds.includes(c.id))
      .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.handle.toLowerCase().includes(search.toLowerCase())),
    [existingClientIds, search]
  )
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md flex flex-col overflow-hidden rounded-2xl" style={{ background: '#fff', border: '1px solid #EEEEEE', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', maxHeight: '80vh' }}>
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #EEEEEE' }}>
          <div className="flex items-center justify-between mb-1">
            <h2 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '1.5rem', color: '#111111', letterSpacing: '-0.01em' }}>Generate Media Kit</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#888888' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#888888' }}>Select a creator to auto-generate their media kit.</p>
        </div>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #EEEEEE' }}>
          <div className="relative">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#BBBBBB' }}>
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creators…"
              className="w-full pl-8 pr-4 py-2 text-sm focus:outline-none rounded-lg"
              style={{ background: '#F5F5F5', border: '1px solid #EEEEEE', color: '#111111' }}
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {available.length === 0 ? (
            <div className="py-10 text-center text-sm" style={{ color: '#BBBBBB' }}>
              {search ? 'No creators match your search.' : 'All creators already have media kits.'}
            </div>
          ) : available.map(c => (
            <button key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{ background: selected?.id === c.id ? '#F5F5F5' : 'transparent', borderBottom: '1px solid #EEEEEE' }}
              onMouseEnter={e => { if (selected?.id !== c.id) e.currentTarget.style.background = '#F5F5F5' }}
              onMouseLeave={e => { if (selected?.id !== c.id) e.currentTarget.style.background = 'transparent' }}
            >
              <img src={creatorPhotoUrl(c.id)} alt={c.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>{c.name}</p>
                <p className="text-xs truncate" style={{ color: '#888888' }}>{c.handle} · {c.primaryPlatform}</p>
              </div>
              {selected?.id === c.id && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" fill="#111111"/>
                  <path d="M4 7l2.5 2.5L10 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
        <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: '1px solid #EEEEEE' }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: '#888888' }}>Cancel</button>
          <button disabled={!selected} onClick={() => selected && onGenerate(selected.id)}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white"
            style={{ background: selected ? '#111111' : '#BBBBBB', cursor: selected ? 'pointer' : 'not-allowed' }}
          >Generate kit</button>
        </div>
      </div>
    </div>
  )
}

function MediaKitCard({ kit, client, onClick }) {
  const [hovered, setHovered] = useState(false)
  const photo = creatorPhotoUrl(client.id)
  const isLive = kit.status === 'Live'
  const platforms = client.platforms || []
  const updatedDate = kit.lastUpdated
    ? new Date(kit.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? '#CCCCCC' : '#EEEEEE'}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {/* Photo top */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <img
          src={photo}
          alt={client.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Status pill */}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 20,
            fontSize: 11,
            fontFamily: '"Inter", system-ui, sans-serif',
            fontWeight: 500,
            background: isLive ? '#EDFAF3' : '#F5F5F5',
            color: isLive ? '#1A7A4A' : '#888888',
            border: `1px solid ${isLive ? '#BBF7D0' : '#EEEEEE'}`,
          }}>
            <span style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: isLive ? '#1A7A4A' : '#AAAAAA',
              flexShrink: 0,
            }} />
            {kit.status}
          </span>
        </div>
        {/* Hover full-width button */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#111111',
          color: '#fff',
          fontFamily: '"Inter", system-ui, sans-serif',
          fontWeight: 600,
          fontSize: 13,
          padding: '12px 0',
          textAlign: 'center',
          transform: hovered ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.2s ease',
          pointerEvents: 'none',
          letterSpacing: '0.01em',
        }}>
          View Media Kit
        </div>
      </div>

      {/* Bottom info */}
      <div style={{ padding: '16px 20px 20px' }}>
        <p style={{
          fontFamily: '"Inter", system-ui, sans-serif',
          fontWeight: 700, fontSize: 16, color: '#111111',
          margin: 0, marginBottom: 2,
        }}>
          {client.name}
        </p>
        <p style={{
          fontFamily: '"Inter", system-ui, sans-serif',
          fontWeight: 400, fontSize: 13, color: '#999999',
          margin: 0, marginBottom: 12,
        }}>
          {client.handle}
        </p>

        {/* Platform badges */}
        {platforms.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
            {platforms.map(p => (
              <span key={p.name} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: '#F5F5F5',
                border: '1px solid #EEEEEE',
                borderRadius: 4,
                padding: '3px 7px',
                fontSize: 11,
                fontFamily: '"Inter", system-ui, sans-serif',
                color: '#666666',
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: PLATFORM_DOT_COLORS[p.name] || '#888888',
                  flexShrink: 0,
                }} />
                {p.name}
              </span>
            ))}
          </div>
        )}

        <p style={{
          fontFamily: '"Inter", system-ui, sans-serif',
          fontWeight: 400, fontSize: 11, color: '#BBBBBB',
          margin: 0,
        }}>
          Updated {updatedDate}
        </p>
      </div>
    </div>
  )
}

export default function MediaKits() {
  const navigate = useNavigate()
  const { mediaKits, generateMediaKit } = useMediaKits()
  const [showGenerate, setShowGenerate] = useState(false)
  const [search, setSearch] = useState('')
  const [showCopied, setShowCopied] = useState(false)

  const existingClientIds = mediaKits.map(m => m.clientId)

  const filtered = useMemo(() => {
    if (!search) return mediaKits
    const q = search.toLowerCase()
    return mediaKits.filter(kit => {
      const client = clientsData.find(c => c.id === kit.clientId)
      if (!client) return false
      return client.name.toLowerCase().includes(q) || client.handle.toLowerCase().includes(q)
    })
  }, [mediaKits, search])

  const liveCount = mediaKits.filter(m => m.status === 'Live').length
  const draftCount = mediaKits.filter(m => m.status === 'Draft').length

  function handleOpen(kit) {
    navigate(`/media-kits/view/${kit.shareToken}`)
  }

  function handleGenerate(clientId) {
    const kit = generateMediaKit(clientId)
    setShowGenerate(false)
    if (kit && kit.shareToken) {
      navigate(`/media-kits/view/${kit.shareToken}`)
    }
  }

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
      <PageHeader
        title="Media Kits"
        subtitle="Auto-generated creator profiles for brand pitching."
        action={
          <button
            onClick={() => setShowGenerate(true)}
            style={{
              background: '#111111',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: '"Inter", system-ui, sans-serif',
            }}
          >
            Generate Media Kit
          </button>
        }
      />

      {/* Stats + search bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#EDFAF3', color: '#1A7A4A', border: '1px solid #BBF7D0',
            borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 500,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1A7A4A' }} />
            {liveCount} Live
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#F5F5F5', color: '#888888', border: '1px solid #EEEEEE',
            borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 500,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#AAAAAA' }} />
            {draftCount} Draft
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#BBBBBB' }}>
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search kits…"
            style={{
              paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              fontSize: 13, border: '1px solid #EEEEEE', borderRadius: 8,
              background: '#FAFAFA', color: '#111111', outline: 'none',
              fontFamily: '"Inter", system-ui, sans-serif', width: 200,
            }}
          />
        </div>
      </div>

      {/* Copied banner */}
      {showCopied && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#111111', color: '#fff', borderRadius: 8,
          padding: '10px 20px', fontSize: 13, fontWeight: 500, zIndex: 100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          Link copied to clipboard
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {filtered.map(kit => {
          const client = clientsData.find(c => c.id === kit.clientId)
          if (!client) return null
          return (
            <MediaKitCard
              key={kit.id}
              kit={kit}
              client={client}
              onClick={() => handleOpen(kit)}
            />
          )
        })}

        {/* Add new card */}
        <button
          onClick={() => setShowGenerate(true)}
          style={{
            background: 'transparent',
            border: '1.5px dashed #DDDDDD',
            borderRadius: 12,
            minHeight: 280,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#AAAAAA'; e.currentTarget.style.background = '#FAFAFA' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDDDDD'; e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#F5F5F5', border: '1px solid #EEEEEE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="#AAAAAA" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, color: '#AAAAAA', fontFamily: '"Inter", system-ui, sans-serif' }}>
            Generate new kit
          </span>
        </button>
      </div>

      {filtered.length === 0 && search && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#BBBBBB', fontSize: 14 }}>
          No media kits match &ldquo;{search}&rdquo;
        </div>
      )}

      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onGenerate={handleGenerate}
          existingClientIds={existingClientIds}
        />
      )}
    </div>
  )
}
