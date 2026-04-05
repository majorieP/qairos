import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProposals } from '../context/ProposalsContext'
import { clientsData } from './Roster'
import PageHeader from '../components/PageHeader'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES = ['Draft', 'Sent', 'Viewed', 'Won', 'Lost']

const STATUS_CFG = {
  Draft:  { bg: 'var(--surface)',   text: '#888888',               border: 'var(--border)' },
  Sent:   { bg: '#EEF4FF',          text: '#2D5BE3',               border: '#BFDBFE' },
  Viewed: { bg: '#F3F3F3',          text: '#666666',               border: '#E5E5E5' },
  Won:    { bg: '#EDFAF3',          text: '#1A7A4A',               border: '#BBF7D0' },
  Lost:   { bg: '#FEE2E2',          text: '#DC2626',               border: '#FECACA' },
}

const AVATAR_COLORS = ['#525252','#2563EB','#059669','#D97706','#E11D48','#0D9488','#0284C7','#DB2777','#0891B2','#EA580C']

const STEPS = ['Details', 'Creators', 'Cover', 'Notes', 'Preview']

const EMPTY_FORM = {
  name: '', brandTarget: '', status: 'Draft',
  coverPage: { title: '', brandName: '', tagline: '', date: 'March 2026' },
  creators: [],
}

function initials(name) { return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }
function avatarColor(id) { return AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length] }
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Proposals List ────────────────────────────────────────────────────────────

function ProposalsList({ proposals, onNew, onView }) {
  const counts = useMemo(() => {
    const c = {}
    STATUSES.forEach(s => { c[s] = 0 })
    proposals.forEach(p => { c[p.status] = (c[p.status] || 0) + 1 })
    return c
  }, [proposals])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Proposals"
        subtitle="Curated creator packages for brand pitches."
        action={
          <button onClick={onNew}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ background: '#111111', color: '#fff' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.6" strokeLinecap="round"/></svg>
            New Proposal
          </button>
        }
      />

      {/* Status chips */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {STATUSES.map(s => {
          const cfg = STATUS_CFG[s]
          return (
            <div key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
              {s} <span className="font-semibold tabular-nums">{counts[s]}</span>
            </div>
          )
        })}
      </div>

      {/* Proposal cards */}
      {proposals.length === 0 ? (
        <div className="py-20 text-center rounded-2xl" style={{ border: '2px dashed var(--border)' }}>
          <p className="text-sm mb-2" style={{ color: '#888888' }}>No proposals yet.</p>
          <button onClick={onNew} className="text-sm transition-colors" style={{ color: '#111111' }}>Create your first proposal →</button>
        </div>
      ) : (
        <div className="space-y-2">
          {proposals.map((proposal, i) => {
            const cfg = STATUS_CFG[proposal.status]
            const creators = proposal.creators.map(c => clientsData.find(cl => cl.id === c.clientId)).filter(Boolean)
            return (
              <div
                key={proposal.id}
                className={`flex items-center gap-5 px-6 py-4 rounded-2xl cursor-pointer transition-all fade-in-up delay-${Math.min(i + 1, 5)}`}
                style={{ background: '#fff', border: '1px solid var(--border)' }}
                onClick={() => onView(proposal)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#CCCCCC'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {/* Left: title + brand */}
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#111111', lineHeight: 1.3, marginBottom: 2 }}>
                    {proposal.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: '#888888' }}>{proposal.brandTarget || '—'}</p>
                </div>

                {/* Creators */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex -space-x-2.5">
                    {creators.slice(0, 4).map(c => (
                      <div key={c.id} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white" style={{ background: avatarColor(c.id) }} title={c.name}>
                        {initials(c.name)}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px]" style={{ color: '#BBBBBB' }}>{proposal.creators.length} creator{proposal.creators.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Date */}
                <span className="text-[11px] shrink-0" style={{ color: '#BBBBBB', minWidth: 80, textAlign: 'right' }}>{fmtDate(proposal.createdDate)}</span>

                {/* Status */}
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0" style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                  {proposal.status}
                </span>

                {/* Arrow */}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0" style={{ color: '#CCCCCC' }}>
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Create Flow ───────────────────────────────────────────────────────────────

function CreateFlow({ onSave, onCancel }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ ...EMPTY_FORM, coverPage: { ...EMPTY_FORM.coverPage }, creators: [] })
  const [creatorSearch, setCreatorSearch] = useState('')

  const filteredClients = useMemo(() => {
    if (!creatorSearch) return clientsData
    const q = creatorSearch.toLowerCase()
    return clientsData.filter(c => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q) || c.niches.some(n => n.toLowerCase().includes(q)))
  }, [creatorSearch])

  const selectedClients = form.creators.map(c => ({ ...c, client: clientsData.find(cl => cl.id === c.clientId) })).filter(c => c.client)

  const toggleCreator = (clientId) => {
    setForm(prev => ({
      ...prev,
      creators: prev.creators.some(c => c.clientId === clientId)
        ? prev.creators.filter(c => c.clientId !== clientId)
        : [...prev.creators, { clientId, notes: '' }],
    }))
  }

  const updateNotes = (clientId, notes) => setForm(prev => ({ ...prev, creators: prev.creators.map(c => c.clientId === clientId ? { ...c, notes } : c) }))
  const updateCover = (field, value) => setForm(prev => ({ ...prev, coverPage: { ...prev.coverPage, [field]: value } }))
  const canNext = () => { if (step === 0) return form.name.trim().length > 0; if (step === 1) return form.creators.length > 0; return true }

  const inputStyle = { width: '100%', padding: '10px 14px', fontSize: '14px', color: 'var(--ink)', background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', fontFamily: '"Inter", system-ui, sans-serif' }
  const labelStyle = { display: 'block', fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#BBBBBB', marginBottom: '8px' }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: 'var(--warm)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 shrink-0" style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: '#888888' }}
            onMouseEnter={e => e.currentTarget.style.color = '#111111'}
            onMouseLeave={e => e.currentTarget.style.color = '#888888'}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Cancel
          </button>
          <div className="w-px h-4" style={{ background: 'var(--border)' }} />
          <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#111111' }}>New Proposal</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors" style={{
                background: i === step ? 'var(--ink)' : i < step ? 'var(--surface)' : 'var(--surface)',
                color: i === step ? '#fff' : i < step ? '#1A7A4A' : '#BBBBBB',
                border: i < step ? '1px solid var(--edge)' : 'none',
              }}>
                {i < step && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {s}
              </div>
              {i < STEPS.length - 1 && <div className="w-3 h-px" style={{ background: 'var(--border)' }} />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm rounded-xl transition-colors" style={{ color: '#888888', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="px-4 py-2 text-sm font-medium rounded-xl text-white transition-opacity"
              style={{ background: canNext() ? 'var(--ink)' : '#BBBBBB', cursor: canNext() ? 'pointer' : 'not-allowed' }}
            >
              Next →
            </button>
          ) : (
            <button onClick={() => onSave(form)}
              className="px-4 py-2 text-sm font-medium rounded-xl text-white"
              style={{ background: 'var(--ink)' }}
            >
              Save Proposal
            </button>
          )}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">

        {/* Step 0: Details */}
        {step === 0 && (
          <div className="max-w-lg mx-auto px-8 py-14">
            <h2 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '1.5rem', color: 'var(--ink)', marginBottom: 8, letterSpacing: '-0.02em' }}>Name your proposal</h2>
            <p className="text-sm mb-10" style={{ color: '#888888' }}>Give it a working name and optionally a target brand.</p>
            <div className="space-y-5">
              <div>
                <label style={labelStyle}>Proposal Name *</label>
                <input type="text" placeholder="e.g. Luminary Beauty Q2 Pitch" value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  style={inputStyle} autoFocus
                  onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={labelStyle}>Target Brand <span style={{ color: '#BBBBBB', textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(optional)</span></label>
                <input type="text" placeholder="e.g. Luminary Beauty" value={form.brandTarget}
                  onChange={e => setForm(prev => ({ ...prev, brandTarget: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Select Creators */}
        {step === 1 && (
          <div className="flex h-full" style={{ minHeight: 'calc(100vh - 61px)' }}>
            <div className="flex-1 px-8 py-8 overflow-y-auto" style={{ borderRight: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '1.5rem', color: 'var(--ink)', marginBottom: 4, letterSpacing: '-0.02em' }}>Select creators</h2>
              <p className="text-sm mb-5" style={{ color: '#888888' }}>
                Choose from your client database.{form.creators.length > 0 && <span style={{ color: '#1A7A4A' }}> {form.creators.length} selected.</span>}
              </p>
              <div className="relative mb-4">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#BBBBBB' }}>
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <input type="text" placeholder="Search by name, handle, or niche…" value={creatorSearch}
                  onChange={e => setCreatorSearch(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 32 }}
                />
              </div>
              <div className="space-y-2">
                {filteredClients.map(client => {
                  const primaryP = client.platforms.find(p => p.name === client.primaryPlatform)
                  const isSelected = form.creators.some(c => c.clientId === client.id)
                  return (
                    <button key={client.id} onClick={() => toggleCreator(client.id)}
                      className="w-full flex items-center gap-3.5 p-3.5 rounded-xl text-left transition-all"
                      style={{ background: isSelected ? 'var(--surface)' : '#fff', border: `1px solid ${isSelected ? 'var(--ink)' : 'var(--border)'}` }}
                    >
                      <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors" style={{ borderColor: isSelected ? 'var(--ink)' : 'var(--border)', background: isSelected ? 'var(--ink)' : '#fff' }}>
                        {isSelected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: avatarColor(client.id) }}>
                        {initials(client.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{client.name}</span>
                          <span className="text-xs" style={{ color: '#888888' }}>{client.handle}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: '#888888' }}>{client.primaryPlatform}</span>
                          <span className="text-xs" style={{ color: '#888888' }}>{primaryP?.followers}</span>
                          <span style={{ color: 'var(--border)' }}>·</span>
                          <span className="text-xs" style={{ color: '#888888' }}>{primaryP?.engagement}% eng</span>
                          <span style={{ color: 'var(--border)' }}>·</span>
                          <span className="text-xs" style={{ color: '#888888' }}>{client.niches.join(', ')}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="w-72 shrink-0 px-6 py-8 flex flex-col" style={{ background: 'var(--surface)' }}>
              <h3 className="text-[10px] uppercase tracking-widest font-medium mb-4" style={{ color: '#BBBBBB' }}>Selected ({form.creators.length})</h3>
              {selectedClients.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-center" style={{ color: '#BBBBBB' }}>Select creators from the list.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedClients.map(({ client, clientId }) => (
                    <div key={clientId} className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: '#fff', border: '1px solid var(--border)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: avatarColor(client.id) }}>
                        {initials(client.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>{client.name}</p>
                        <p className="text-[10px]" style={{ color: '#888888' }}>{client.primaryPlatform}</p>
                      </div>
                      <button onClick={() => toggleCreator(clientId)} style={{ color: '#BBBBBB' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                        onMouseLeave={e => e.currentTarget.style.color = '#BBBBBB'}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Cover Page */}
        {step === 2 && (
          <div className="max-w-lg mx-auto px-8 py-14">
            <h2 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '1.5rem', color: 'var(--ink)', marginBottom: 8, letterSpacing: '-0.02em' }}>Cover page</h2>
            <p className="text-sm mb-10" style={{ color: '#888888' }}>This is the first thing the brand will see.</p>
            <div className="space-y-5">
              {[
                { field: 'title',     label: 'Document Title', placeholder: 'e.g. Creator Partnership Proposal' },
                { field: 'brandName', label: 'Brand Name',     placeholder: form.brandTarget || 'e.g. Luminary Beauty' },
                { field: 'tagline',   label: 'Tagline',        placeholder: 'e.g. Authentic voices for a radiant brand.' },
                { field: 'date',      label: 'Date',           placeholder: 'e.g. March 2026' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label style={labelStyle}>{label}</label>
                  <input type="text" placeholder={placeholder} value={form.coverPage[field]}
                    onChange={e => updateCover(field, e.target.value)}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Creator Notes */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto px-8 py-12">
            <h2 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '1.5rem', color: 'var(--ink)', marginBottom: 8, letterSpacing: '-0.02em' }}>Creator notes</h2>
            <p className="text-sm mb-10" style={{ color: '#888888' }}>Explain why each creator is a great fit. These appear in the proposal.</p>
            <div className="space-y-5">
              {selectedClients.map(({ client, notes, clientId }) => {
                const primaryP = client.platforms.find(p => p.name === client.primaryPlatform)
                return (
                  <div key={clientId} className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3.5 px-5 py-4" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: avatarColor(client.id) }}>
                        {initials(client.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{client.name}</p>
                        <p className="text-xs" style={{ color: '#888888' }}>{client.handle} · {client.primaryPlatform} · {primaryP?.followers} · {primaryP?.engagement}% eng</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <label style={labelStyle}>Why this creator?</label>
                      <textarea value={notes} onChange={e => updateNotes(clientId, e.target.value)} rows={3}
                        placeholder="Explain why this creator is a great fit — audience demographics, content alignment, past performance…"
                        style={{ ...inputStyle, resize: 'none' }}
                        onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div className="max-w-4xl mx-auto px-8 py-10">
            <h2 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '1.5rem', color: 'var(--ink)', marginBottom: 4, letterSpacing: '-0.02em' }}>Preview</h2>
            <p className="text-sm mb-8" style={{ color: '#888888' }}>This is how the brand will experience your proposal.</p>
            <ProposalPreview form={form} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Preview Component ─────────────────────────────────────────────────────────

function ProposalPreview({ form }) {
  const selectedClients = form.creators.map(c => ({ ...c, client: clientsData.find(cl => cl.id === c.clientId) })).filter(c => c.client)
  const coverBrand = form.coverPage.brandName || form.brandTarget || 'Brand Partner'

  return (
    <div className="space-y-4">
      {/* Cover preview */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--ink)', minHeight: 280 }}>
        <div className="px-12 py-12 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-auto">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 5L10 6.5V9.5L7 11L4 9.5V6.5L7 5Z" fill="#fff"/></svg>
            <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>Qairos</span>
          </div>
          <div className="py-8">
            <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{form.coverPage.title || 'Creator Partnership Proposal'}</p>
            <h1 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '2.5rem', color: '#fff', lineHeight: 1.1, marginBottom: 16 }}>
              {coverBrand}
            </h1>
            {form.coverPage.tagline && <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>"{form.coverPage.tagline}"</p>}
            <div className="h-px w-12 mb-6" style={{ background: 'rgba(255,255,255,0.3)' }} />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Prepared for</p>
              <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '1.3rem', color: 'rgba(255,255,255,0.7)' }}>{coverBrand}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{form.coverPage.date}</p>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{form.creators.length} creator{form.creators.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Creator previews */}
      {selectedClients.map(({ client, notes }) => {
        const primaryP = client.platforms.find(p => p.name === client.primaryPlatform)
        return (
          <div key={client.id} className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid var(--border)' }}>
            <div className="h-0.5" style={{ background: `linear-gradient(90deg, var(--border), transparent)` }} />
            <div className="flex">
              {/* Left: avatar */}
              <div className="w-2/5 flex items-center justify-center p-10" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3" style={{ background: avatarColor(client.id) }}>
                    {initials(client.name)}
                  </div>
                  <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '1.1rem', color: 'var(--ink)' }}>{client.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#888888' }}>{client.handle}</p>
                </div>
              </div>
              {/* Right: stats */}
              <div className="flex-1 p-8">
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {client.platforms.map(p => (
                    <span key={p.name} className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: 'var(--surface)', color: '#888888', border: '1px solid var(--border)' }}>{p.name} · {p.followers}</span>
                  ))}
                  {client.niches.map(n => (
                    <span key={n} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--surface)', color: '#888888', border: '1px solid var(--border)' }}>{n}</span>
                  ))}
                </div>
                {primaryP && (
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    {[
                      { label: `${client.primaryPlatform} Followers`, value: primaryP.followers },
                      { label: 'Engagement Rate',                     value: `${primaryP.engagement}%` },
                      { label: 'Avg Views',                           value: primaryP.avgViews },
                    ].map(s => (
                      <div key={s.label}>
                        <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#BBBBBB', fontWeight: 500 }}>{s.label}</p>
                        <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                {notes && (
                  <div className="pl-4 py-1" style={{ borderLeft: '2px solid var(--border)' }}>
                    <p className="text-[9px] uppercase tracking-widest font-medium mb-1" style={{ color: '#888888' }}>Why this creator</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>"{notes}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Proposals() {
  const navigate = useNavigate()
  const { proposals, addProposal } = useProposals()
  const [creating, setCreating] = useState(false)

  const handleSave = (form) => {
    const newProposal = addProposal(form)
    setCreating(false)
    navigate(`/proposals/view/${newProposal.shareToken}`)
  }

  const handleView = (proposal) => navigate(`/proposals/view/${proposal.shareToken}`)

  if (creating) return <CreateFlow onSave={handleSave} onCancel={() => setCreating(false)} />
  return <ProposalsList proposals={proposals} onNew={() => setCreating(true)} onView={handleView} />
}
