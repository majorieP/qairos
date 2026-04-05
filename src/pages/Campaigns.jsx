import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCampaigns } from '../context/CampaignsContext'
import { useInvoices } from '../context/InvoicesContext'
import { usePayouts } from '../context/PayoutsContext'
import BrandLogo from '../components/BrandLogo'
import PageHeader from '../components/PageHeader'
import { creatorPhotoUrl } from '../lib/creatorHelpers'

// ─── Constants ────────────────────────────────────────────────────────────────

const KANBAN_STATUSES = [
  'Planned', 'Campaign Planning', 'Brief Sent', 'In Production',
  'Preview Submitted', 'Edits Requested', 'Approved', 'Live',
  'Follow-up Due', 'Completed', 'Invoiced', 'Paid',
]

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Podcast', 'Blog', 'Twitter/X', 'Pinterest']
const CONTENT_TYPES = ['Story', 'Reel', 'Post', 'Video', 'Integration', 'Dedicated Video', 'Series']
const MANAGERS = ['Sarah K.', 'Tom B.', 'Emma L.', 'Alex M.']
const PAYMENT_TERMS_OPTS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90', 'Upon Completion']

const STATUS_COLORS = {
  'Planned': { background: '#F3F3F3', color: '#666666' },
  'Campaign Planning': { background: '#F3F3F3', color: '#666666' },
  'Brief Sent': { background: '#EEF4FF', color: '#2D5BE3' },
  'In Production': { background: '#FFF4EC', color: '#C4622D' },
  'Preview Submitted': { background: '#F3F3F3', color: '#666666' },
  'Edits Requested': { background: '#FEE2E2', color: '#DC2626' },
  'Approved': { background: '#EDFAF3', color: '#1A7A4A' },
  'Live': { background: '#EDFAF3', color: '#1A7A4A' },
  'Follow-up Due': { background: '#FFF4EC', color: '#C4622D' },
  'Completed': { background: '#EDFAF3', color: '#1A7A4A' },
  'Invoiced': { background: '#EEF4FF', color: '#2D5BE3' },
  'Paid': { background: '#EDFAF3', color: '#1A7A4A' },
}

const NEXT_STATUS = {
  'Planned': 'Campaign Planning',
  'Campaign Planning': 'Brief Sent',
  'Brief Sent': 'In Production',
  'In Production': 'Preview Submitted',
  'Preview Submitted': 'Approved',
  'Edits Requested': 'In Production',
  'Approved': 'Live',
  'Live': 'Follow-up Due',
  'Follow-up Due': 'Completed',
  'Completed': 'Invoiced',
  'Invoiced': 'Paid',
  'Paid': null,
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const linkedDeals = [
  { id: 1, name: 'Sofia × Luminary Spring', creator: 'Sofia Chen', creatorId: 1, brand: 'Luminary Beauty', brandId: 1, platform: 'Instagram', amount: 12000, paymentTerms: 'Net 30' },
  { id: 2, name: 'Marcus × Peak Run Season', creator: 'Marcus Reid', creatorId: 2, brand: 'Peak Athletics', brandId: 2, platform: 'TikTok', amount: 8500, paymentTerms: 'Net 30' },
  { id: 3, name: 'Anika × Verdant Foods', creator: 'Anika Patel', creatorId: 3, brand: 'Verdant Foods', brandId: 3, platform: 'Instagram', amount: 5200, paymentTerms: 'Net 45' },
  { id: 4, name: 'James × TechFlow Q2', creator: 'James Ortiz', creatorId: 4, brand: 'TechFlow', brandId: 4, platform: 'YouTube', amount: 18000, paymentTerms: 'Net 30' },
  { id: 5, name: 'Lily × Solstice Travel', creator: 'Lily Nakamura', creatorId: 5, brand: 'Solstice Travel', brandId: 5, platform: 'Instagram', amount: 22000, paymentTerms: 'Net 45' },
]

const blankChecklist = { samplesSent: false, previewDateConfirmed: false, liveDateConfirmed: false, followUpDateConfirmed: false, briefReceivedFromBrand: false, briefSentToCreator: false }
const blankStats = { views: '', reach: '', likes: '', comments: '', shares: '', ctr: '', cvr: '', revenueGenerated: '', roi: '', engagementRate: '' }


// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmt(n) {
  if (n === '' || n === null || n === undefined) return '—'
  return '$' + Number(n).toLocaleString()
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtShort(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function calcPaymentDue(liveDate, terms) {
  if (!liveDate || !terms) return ''
  const match = terms.match(/Net (\d+)/)
  if (!match) return ''
  const [y, m, d] = liveDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + parseInt(match[1]))
  return date.toISOString().split('T')[0]
}

function getMonthLabel(dateStr) {
  if (!dateStr) return ''
  const [y, m] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function nowStamp() {
  return new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(2026, 2, 15) // demo "today" = Mar 15 2026
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.round((new Date(y, m - 1, d) - today) / 86400000)
}

function liveDateMonth(dateStr) {
  if (!dateStr) return null
  const [y, m] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' })
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SortIcon({ dir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-1 inline-block opacity-60">
      <path d={dir === 'asc' ? 'M5 8V2M2 5l3-3 3 3' : 'M5 2v6M2 5l3 3 3-3'} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{children}</p>
}

function Field({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  )
}

function LinkField({ label, value, onClick }) {
  if (!value) return null
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <button onClick={onClick} className="text-sm text-[#111111] hover:underline text-left transition-colors">
        {value}
      </button>
    </div>
  )
}

function EditInput({ label, field, form, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={form[field] ?? ''}
        placeholder={placeholder}
        onChange={e => onChange(field, e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
      />
    </div>
  )
}

function EditSelect({ label, field, form, onChange, options }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <select
        value={form[field] ?? ''}
        onChange={e => onChange(field, e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white"
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function ToggleField({ label, field, form, onChange }) {
  const on = !!form[field]
  return (
    <div className="flex items-center justify-between">
      <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</label>
      <button
        type="button"
        onClick={() => onChange(field, !on)}
        className={`relative w-9 h-5 rounded-full transition-colors ${on ? 'bg-[#111111]' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  )
}

function StatusBadge({ status }) {
  return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={STATUS_COLORS[status] || { background: '#F3F3F3', color: '#666666' }}>{status}</span>
}

function PlatformTag({ platform }) {
  const colors = {
    Instagram: { background: '#F3F3F3', color: '#666666' },
    TikTok: { background: '#F3F3F3', color: '#666666' },
    YouTube: { background: '#FEE2E2', color: '#DC2626' },
    Podcast: { background: '#FFF4EC', color: '#C4622D' },
    Blog: { background: '#EDFAF3', color: '#1A7A4A' },
    'Twitter/X': { background: '#EEF4FF', color: '#2D5BE3' },
    Pinterest: { background: '#FEE2E2', color: '#DC2626' },
  }
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium" style={colors[platform] || { background: '#F3F3F3', color: '#666666' }}>
      {platform}
    </span>
  )
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({ filters, setFilters, sort, setSort, campaigns }) {
  const creators = [...new Set(campaigns.map(c => c.creator))].sort()
  const brands = [...new Set(campaigns.map(c => c.brand))].sort()
  const managers = [...new Set(campaigns.map(c => c.manager).filter(Boolean))].sort()
  const sel = (field, value) => setFilters(f => ({ ...f, [field]: value }))

  const selectCls = 'px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-300'

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <input
        type="text"
        placeholder="Search campaigns…"
        value={filters.search}
        onChange={e => sel('search', e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 w-48"
      />
      <select value={filters.creator} onChange={e => sel('creator', e.target.value)} className={selectCls}>
        <option value="">All Creators</option>
        {creators.map(c => <option key={c}>{c}</option>)}
      </select>
      <select value={filters.brand} onChange={e => sel('brand', e.target.value)} className={selectCls}>
        <option value="">All Brands</option>
        {brands.map(b => <option key={b}>{b}</option>)}
      </select>
      <select value={filters.status} onChange={e => sel('status', e.target.value)} className={selectCls}>
        <option value="">All Statuses</option>
        {KANBAN_STATUSES.map(s => <option key={s}>{s}</option>)}
      </select>
      <select value={filters.platform} onChange={e => sel('platform', e.target.value)} className={selectCls}>
        <option value="">All Platforms</option>
        {PLATFORMS.map(p => <option key={p}>{p}</option>)}
      </select>
      <select value={filters.manager} onChange={e => sel('manager', e.target.value)} className={selectCls}>
        <option value="">All Managers</option>
        {managers.map(m => <option key={m}>{m}</option>)}
      </select>
      <div className="ml-auto flex items-center gap-2">
        <select value={sort} onChange={e => setSort(e.target.value)} className={selectCls}>
          <option value="liveDate-asc">Live Date ↑</option>
          <option value="liveDate-desc">Live Date ↓</option>
          <option value="amount-desc">Amount ↓</option>
          <option value="amount-asc">Amount ↑</option>
          <option value="creator-asc">Creator A–Z</option>
          <option value="status-asc">Status</option>
        </select>
      </div>
    </div>
  )
}

// ─── Table View ───────────────────────────────────────────────────────────────

function TableView({ campaigns, onSelect }) {
  const [sortField, setSortField] = useState('liveDate')
  const [sortDir, setSortDir] = useState('asc')

  const COLS = [
    { key: 'creator', label: 'Creator' },
    { key: 'brand', label: 'Brand' },
    { key: 'platform', label: 'Platform' },
    { key: 'contentType', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'liveDate', label: 'Live Date' },
    { key: 'paymentDueDate', label: 'Payment Due' },
    { key: 'manager', label: 'Manager' },
  ]

  const toggleSort = key => {
    if (sortField === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(key); setSortDir('asc') }
  }

  const sorted = [...campaigns].sort((a, b) => {
    let aV = sortField === 'amount' ? (Number(a.amount) || 0) : (a[sortField] ?? '')
    let bV = sortField === 'amount' ? (Number(b.amount) || 0) : (b[sortField] ?? '')
    const cmp = aV < bV ? -1 : aV > bV ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-max">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            {COLS.map(col => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap select-none"
              >
                {col.label}
                {sortField === col.key && <SortIcon dir={sortDir} />}
              </th>
            ))}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map(c => (
            <tr key={c.id} onClick={() => onSelect(c)} className="hover:bg-gray-50 transition-colors cursor-pointer group">
              <td className="px-4 py-3.5 whitespace-nowrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {creatorPhotoUrl(c.creatorId) && (
                    <img src={creatorPhotoUrl(c.creatorId)} alt={c.creator}
                      style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <span className="font-medium text-gray-800">{c.creator}</span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <BrandLogo name={c.brand} size={24} />
                  <span>{c.brand}</span>
                </div>
              </td>
              <td className="px-4 py-3.5"><PlatformTag platform={c.platform} /></td>
              <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{c.contentType}</td>
              <td className="px-4 py-3.5 font-medium text-gray-800 whitespace-nowrap">{formatAmt(c.amount)}</td>
              <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
              <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmtShort(c.liveDate) || '—'}</td>
              <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmtShort(c.paymentDueDate) || '—'}</td>
              <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{c.manager}</td>
              <td className="px-3 py-3.5 text-gray-300 group-hover:text-gray-400 transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={10} className="px-5 py-10 text-center text-sm text-gray-400">
                No campaigns match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Kanban View ──────────────────────────────────────────────────────────────

const PLATFORM_ACCENTS = {
  Instagram:   { border: '#ec4899', bg: '#fdf2f8', text: '#be185d' },
  TikTok:      { border: '#1d1d1f', bg: '#f4f4f5', text: '#18181b' },
  YouTube:     { border: '#ef4444', bg: '#fef2f2', text: '#b91c1c' },
  Podcast:     { border: '#f97316', bg: '#fff7ed', text: '#c2410c' },
  Blog:        { border: '#22c55e', bg: '#f0fdf4', text: '#166534' },
  'Twitter/X': { border: '#0ea5e9', bg: '#f0f9ff', text: '#0369a1' },
  Pinterest:   { border: '#f43f5e', bg: '#fff1f2', text: '#be123c' },
}

// creatorPhotoUrl imported from lib/creatorHelpers (see top of file)

function KanbanCard({ c, onDragStart, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const pc = PLATFORM_ACCENTS[c.platform] || { border: '#DDDDDD', text: '#666666' }
  const photo = creatorPhotoUrl(c.creatorId)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${hovered ? '#CCCCCC' : '#EEEEEE'}`,
        borderRadius: 10,
        padding: 16,
        cursor: 'pointer',
        userSelect: 'none',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Header: creator photo + name × brand + brand logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {photo && (
          <img src={photo} alt={c.creator}
            style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: '#111111', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: '"Inter", system-ui, sans-serif' }}>
          {c.creator} × {c.brand}
        </span>
        <BrandLogo name={c.brand} size={24} />
      </div>

      {/* Platform + content type + live date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: pc.text, background: '#FFFFFF',
          border: `1px solid ${pc.border}`, borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>
          {c.platform}
        </span>
        <span style={{ fontSize: 12, color: '#999999' }}>{c.contentType}</span>
        {c.liveDate && (
          <span style={{ fontSize: 12, color: '#BBBBBB', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            {fmtShort(c.liveDate)}
          </span>
        )}
      </div>

      {/* Status + amount */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StatusBadge status={c.status} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111111', fontFamily: '"Inter", system-ui, sans-serif' }}>
          {formatAmt(c.amount)}
        </span>
      </div>
    </div>
  )
}

function KanbanView({ campaigns, onSelect, onStatusChange }) {
  const dragId = useRef(null)

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '72vh' }}>
      {KANBAN_STATUSES.map(status => {
        const cols = campaigns.filter(c => c.status === status)
        const total = cols.reduce((s, c) => s + (Number(c.amount) || 0), 0)
        return (
          <div
            key={status}
            onDragOver={e => e.preventDefault()}
            onDrop={() => {
              if (dragId.current != null) { onStatusChange(dragId.current, status); dragId.current = null }
            }}
            style={{ flexShrink: 0, width: 280, background: '#FFFFFF', border: '1px solid #EEEEEE',
            borderRadius: 12, padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <div style={{ padding: '4px 8px 8px', borderBottom: '1px solid #F0F0F0', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#666666', textTransform: 'uppercase',
                  letterSpacing: '0.04em' }}>{status}</p>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#AAAAAA' }}>{cols.length}</span>
              </div>
              <p style={{ fontSize: 11, color: '#BBBBBB', marginTop: 2 }}>{formatAmt(total)}</p>
            </div>
            {cols.map(c => (
              <KanbanCard
                key={c.id}
                c={c}
                onDragStart={() => { dragId.current = c.id }}
                onSelect={() => onSelect(c)}
              />
            ))}
            {cols.length === 0 && (
              <div style={{ flex: 1, border: '1px dashed #EEEEEE', borderRadius: 8, display: 'flex',
                alignItems: 'center', justifyContent: 'center', minHeight: 64 }}>
                <p style={{ fontSize: 11, color: '#CCCCCC' }}>Drop here</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({ campaigns, onSelect }) {
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(2) // 0-indexed; 2 = March

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startPad = new Date(year, month, 1).getDay()
  const cells = [...Array(startPad).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  const eventsByDay = {}
  campaigns.forEach(c => {
    const push = (dateStr, type) => {
      if (!dateStr || !dateStr.startsWith(monthStr)) return
      const day = parseInt(dateStr.split('-')[2])
      if (!eventsByDay[day]) eventsByDay[day] = []
      eventsByDay[day].push({ campaign: c, type })
    }
    push(c.previewDueDate, 'preview')
    push(c.liveDate, 'live')
    push(c.followUpDate, 'followup')
    push(c.paymentDueDate, 'payment')
  })

  const eventCls = { preview: 'bg-gray-100 text-gray-700', live: 'bg-blue-100 text-blue-700', followup: 'bg-green-100 text-green-700', payment: 'bg-orange-100 text-orange-700' }
  const eventLabel = { preview: 'Preview', live: 'Live', followup: 'Follow-up', payment: 'Pmt Due' }

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <h3 className="text-sm font-semibold text-gray-800">{monthLabel}</h3>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <div className="flex items-center gap-4 px-6 py-2 border-b border-gray-100">
        {[['preview', 'bg-gray-500', 'Preview Due'], ['live', 'bg-blue-500', 'Live Date'], ['followup', 'bg-green-500', 'Follow-up'], ['payment', 'bg-orange-500', 'Payment Due']].map(([, color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[11px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="px-2 py-2 text-center text-[11px] font-medium text-gray-400 uppercase tracking-wide">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const isToday = day === 15 && month === 2 && year === 2026
          const events = day ? (eventsByDay[day] || []) : []
          return (
            <div
              key={i}
              className={`min-h-[88px] p-1.5 border-b border-r border-gray-100 ${!day ? 'bg-gray-50/50' : ''} ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}`}
            >
              {day && (
                <>
                  <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-1 ${isToday ? 'bg-[#111111] text-white' : 'text-gray-600'}`}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {events.slice(0, 3).map((ev, ei) => {
                      const evCampaign = ev.campaign
                      const evPhoto = creatorPhotoUrl(evCampaign.creatorId)
                      const dotColor = STATUS_COLORS[evCampaign.status]?.color || '#888888'
                      return (
                        <button
                          key={ei}
                          onClick={() => onSelect(evCampaign)}
                          className="w-full text-left hover:opacity-80 transition-opacity"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FFFFFF',
                            border: '1px solid #EEEEEE', borderRadius: 4, padding: '3px 5px' }}
                        >
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                          {evPhoto && (
                            <img src={evPhoto} alt={evCampaign.creator}
                              style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <span style={{ fontSize: 10, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {evCampaign.creator.split(' ')[0]} × {evCampaign.brand}
                          </span>
                        </button>
                      )
                    })}
                    {events.length > 3 && <p className="text-[10px] text-gray-400 px-1">+{events.length - 3} more</p>}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Monthly View ─────────────────────────────────────────────────────────────

function MonthlyView({ campaigns, onSelect }) {
  const groups = {}
  campaigns.forEach(c => {
    const key = c.liveDate ? c.liveDate.substring(0, 7) : 'no-date'
    if (!groups[key]) groups[key] = { label: c.liveDate ? getMonthLabel(c.liveDate) : 'No Live Date', campaigns: [], total: 0 }
    groups[key].campaigns.push(c)
    groups[key].total += Number(c.amount) || 0
  })
  const sortedKeys = Object.keys(groups).sort()

  return (
    <div className="space-y-6">
      {sortedKeys.map(key => {
        const g = groups[key]
        return (
          <div key={key}>
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="text-base font-semibold text-gray-800">{g.label}</h3>
              <p className="text-sm text-gray-500">{g.campaigns.length} campaign{g.campaigns.length !== 1 ? 's' : ''}</p>
              <p className="text-sm font-semibold text-gray-700 ml-auto">{formatAmt(g.total)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3 text-left font-medium">Creator</th>
                    <th className="px-5 py-3 text-left font-medium">Brand</th>
                    <th className="px-5 py-3 text-left font-medium">Platform</th>
                    <th className="px-5 py-3 text-left font-medium">Live Date</th>
                    <th className="px-5 py-3 text-left font-medium">Amount</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {g.campaigns.map(c => (
                    <tr key={c.id} onClick={() => onSelect(c)} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                      <td className="px-5 py-3">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {creatorPhotoUrl(c.creatorId) && (
                            <img src={creatorPhotoUrl(c.creatorId)} alt={c.creator}
                              style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <span className="font-medium text-gray-800">{c.creator}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{c.brand}</td>
                      <td className="px-5 py-3"><PlatformTag platform={c.platform} /></td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{fmtShort(c.liveDate) || '—'}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">{formatAmt(c.amount)}</td>
                      <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-gray-300 group-hover:text-gray-400">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Add Campaign Modal ────────────────────────────────────────────────────────

const emptyForm = {
  dealId: '', dealName: '', creator: '', creatorId: null, brand: '', brandId: null,
  platform: '', contentType: '', amount: '', manager: '', status: 'Planned',
  approvalRequired: false, approvalWaived: false,
  previewDueDate: '', liveDate: '', followUpDate: '',
  paymentTerms: 'Net 30', paymentDueDate: '',
  briefUrl: '', contentUrl: '', notes: '',
  checklist: { ...blankChecklist },
}

const checklistItems = [
  ['samplesSent', 'Samples confirmed/sent'],
  ['previewDateConfirmed', 'Preview date confirmed'],
  ['liveDateConfirmed', 'Live date confirmed'],
  ['followUpDateConfirmed', 'Follow-up date confirmed'],
  ['briefReceivedFromBrand', 'Brief received from brand'],
  ['briefSentToCreator', 'Brief sent to creator'],
]

function AddCampaignModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ ...emptyForm, checklist: { ...blankChecklist } })
  const [errors, setErrors] = useState({})

  const ch = (field, value) => {
    setErrors(p => ({ ...p, [field]: '' }))
    setForm(f => {
      const next = { ...f, [field]: value }
      if (field === 'liveDate' || field === 'paymentTerms') {
        next.paymentDueDate = calcPaymentDue(field === 'liveDate' ? value : f.liveDate, field === 'paymentTerms' ? value : f.paymentTerms)
      }
      return next
    })
  }

  const selectDeal = dealId => {
    const deal = linkedDeals.find(d => d.id === parseInt(dealId))
    if (!deal) { setForm(f => ({ ...f, dealId: '' })); return }
    setForm(f => ({
      ...f, dealId: deal.id, dealName: deal.name,
      creator: deal.creator, creatorId: deal.creatorId,
      brand: deal.brand, brandId: deal.brandId,
      platform: deal.platform, amount: deal.amount,
      paymentTerms: deal.paymentTerms,
      paymentDueDate: calcPaymentDue(f.liveDate, deal.paymentTerms),
    }))
  }

  const handleSubmit = () => {
    const errs = {}
    if (!form.creator?.trim()) errs.creator = true
    if (!form.brand?.trim()) errs.brand = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    onAdd({ ...form, id: Date.now() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="relative z-10 ml-auto w-[500px] h-full bg-white border-l border-gray-200 overflow-y-auto shadow-xl flex flex-col">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Add Campaign</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 space-y-5 flex-1">
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Link to Deal</label>
            <select
              value={form.dealId}
              onChange={e => selectDeal(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
            >
              <option value="">Select a deal (optional)…</option>
              {linkedDeals.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {form.dealId && <p className="text-[11px] text-gray-500 mt-1">Auto-filled from deal · Edit below if needed</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Creator <span className="text-red-400">*</span></label>
              <input value={form.creator ?? ''} onChange={e => ch('creator', e.target.value)} placeholder="Creator name" className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent ${errors.creator ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
              {errors.creator && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Brand <span className="text-red-400">*</span></label>
              <input value={form.brand ?? ''} onChange={e => ch('brand', e.target.value)} placeholder="Brand name" className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent ${errors.brand ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
              {errors.brand && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <EditSelect label="Platform" field="platform" form={form} onChange={ch} options={PLATFORMS} />
            <EditSelect label="Content Type" field="contentType" form={form} onChange={ch} options={CONTENT_TYPES} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <EditInput label="Amount ($)" field="amount" form={form} onChange={ch} type="number" />
            <EditSelect label="Manager" field="manager" form={form} onChange={ch} options={MANAGERS} />
          </div>
          <EditSelect label="Status" field="status" form={form} onChange={ch} options={KANBAN_STATUSES} />
          <div className="space-y-3 py-1 border-y border-gray-100">
            <ToggleField label="Approval Required" field="approvalRequired" form={form} onChange={ch} />
            <ToggleField label="Approval Waived" field="approvalWaived" form={form} onChange={ch} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {form.approvalRequired && !form.approvalWaived && (
              <EditInput label="Preview Due Date" field="previewDueDate" form={form} onChange={ch} type="date" />
            )}
            <EditInput label="Live Date" field="liveDate" form={form} onChange={ch} type="date" />
          </div>
          <EditInput label="Follow-up Date (optional)" field="followUpDate" form={form} onChange={ch} type="date" />
          <div className="grid grid-cols-2 gap-3">
            <EditSelect label="Payment Terms" field="paymentTerms" form={form} onChange={ch} options={PAYMENT_TERMS_OPTS} />
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Payment Due Date</label>
              <div className="px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-600">
                {form.paymentDueDate ? fmtDate(form.paymentDueDate) : 'Auto-calculated'}
              </div>
            </div>
          </div>
          <EditInput label="Brief URL" field="briefUrl" form={form} onChange={ch} placeholder="https://…" />
          <EditInput label="Content URL" field="contentUrl" form={form} onChange={ch} placeholder="https://…" />
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => ch('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Planning Checklist</label>
            <div className="space-y-2 bg-gray-50 rounded-xl p-3">
              {checklistItems.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.checklist[key]}
                    onChange={e => ch('checklist', { ...form.checklist, [key]: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-300"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={handleSubmit}
              className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}
            >
              Add Campaign
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ─── Campaign Detail ──────────────────────────────────────────────────────────

const statsFields = [
  ['views', 'Views'], ['reach', 'Reach'], ['likes', 'Likes'], ['comments', 'Comments'],
  ['shares', 'Shares'], ['ctr', 'CTR'], ['cvr', 'CVR'], ['revenueGenerated', 'Revenue'],
  ['roi', 'ROI'], ['engagementRate', 'Engagement Rate'],
]

function CampaignDetail({ campaign, onClose, onUpdate, onNavigate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ ...campaign })
  const [editStats, setEditStats] = useState(false)
  const [statsForm, setStatsForm] = useState({ ...campaign.stats })
  const [newTask, setNewTask] = useState('')
  const [tab, setTab] = useState('details')

  const ch = (field, value) => {
    setForm(f => {
      const next = { ...f, [field]: value }
      if (field === 'liveDate' || field === 'paymentTerms') {
        next.paymentDueDate = calcPaymentDue(field === 'liveDate' ? value : f.liveDate, field === 'paymentTerms' ? value : f.paymentTerms)
      }
      return next
    })
  }

  const handleSave = () => { onUpdate({ ...form }); setIsEditing(false) }
  const handleCancel = () => { setForm({ ...campaign }); setIsEditing(false) }

  const handleChecklistToggle = key => {
    onUpdate({ ...campaign, checklist: { ...campaign.checklist, [key]: !campaign.checklist[key] } })
  }

  const handleNextStatus = () => {
    const next = NEXT_STATUS[campaign.status]
    if (!next) return
    const log = [...campaign.activityLog, { action: `Status → ${next}`, timestamp: nowStamp() }]
    const updated = { ...campaign, status: next, activityLog: log }
    if (next === 'Completed' && !updated.invoiceId) updated.invoiceId = Date.now()
    onUpdate(updated)
  }

  const handleStatsSave = () => { onUpdate({ ...campaign, stats: { ...statsForm } }); setEditStats(false) }

  const handleAddTask = () => {
    if (!newTask.trim()) return
    onUpdate({ ...campaign, tasks: [...campaign.tasks, { id: Date.now(), text: newTask.trim(), done: false }] })
    setNewTask('')
  }

  const handleTaskToggle = taskId => {
    onUpdate({ ...campaign, tasks: campaign.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) })
  }

  const nextStat = NEXT_STATUS[campaign.status]
  const checklistDone = Object.values(campaign.checklist).filter(Boolean).length
  const checklistTotal = Object.keys(campaign.checklist).length

  const tabs = [
    { key: 'details', label: 'Details' },
    { key: 'stats', label: 'Stats' },
    { key: 'tasks', label: `Tasks (${campaign.tasks.length})` },
    { key: 'activity', label: 'Activity' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 ml-auto w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <StatusBadge status={campaign.status} />
              {nextStat && (
                <button
                  onClick={handleNextStatus}
                  className="text-xs font-medium text-[#111111] hover:underline px-2.5 py-1 rounded-md transition-colors border border-gray-300"
                >
                  → {nextStat}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              {creatorPhotoUrl(campaign.creatorId) && (
                <img src={creatorPhotoUrl(campaign.creatorId)} alt={campaign.creator}
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div>
                <h2 className="text-base font-semibold text-gray-900">{campaign.creator} × {campaign.brand}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{campaign.platform} · {campaign.contentType}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isEditing && (
              <button
                onClick={() => { setForm({ ...campaign }); setIsEditing(true) }}
                className="text-xs font-medium text-[#111111] hover:underline px-2.5 py-1 rounded-md transition-colors"
              >
                Edit
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-[#111111] text-[#111111]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Details ── */}
          {tab === 'details' && (
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <EditInput label="Creator" field="creator" form={form} onChange={ch} />
                    <EditInput label="Brand" field="brand" form={form} onChange={ch} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <EditSelect label="Platform" field="platform" form={form} onChange={ch} options={PLATFORMS} />
                    <EditSelect label="Content Type" field="contentType" form={form} onChange={ch} options={CONTENT_TYPES} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <EditInput label="Amount ($)" field="amount" form={form} onChange={ch} type="number" />
                    <EditSelect label="Manager" field="manager" form={form} onChange={ch} options={MANAGERS} />
                  </div>
                  <EditSelect label="Status" field="status" form={form} onChange={ch} options={KANBAN_STATUSES} />
                  <div className="space-y-3 py-1 border-y border-gray-100">
                    <ToggleField label="Approval Required" field="approvalRequired" form={form} onChange={ch} />
                    <ToggleField label="Approval Waived" field="approvalWaived" form={form} onChange={ch} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {form.approvalRequired && (
                      <EditInput label="Preview Due" field="previewDueDate" form={form} onChange={ch} type="date" />
                    )}
                    <EditInput label="Live Date" field="liveDate" form={form} onChange={ch} type="date" />
                  </div>
                  <EditInput label="Follow-up Date" field="followUpDate" form={form} onChange={ch} type="date" />
                  <div className="grid grid-cols-2 gap-3">
                    <EditSelect label="Payment Terms" field="paymentTerms" form={form} onChange={ch} options={PAYMENT_TERMS_OPTS} />
                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Payment Due</label>
                      <div className="px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-600">{form.paymentDueDate ? fmtDate(form.paymentDueDate) : '—'}</div>
                    </div>
                  </div>
                  <EditInput label="Brief URL" field="briefUrl" form={form} onChange={ch} />
                  <EditInput label="Content URL" field="contentUrl" form={form} onChange={ch} />
                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</label>
                    <textarea value={form.notes} onChange={e => ch('notes', e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={handleSave} className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>Save changes</button>
                    <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Key metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['Amount', formatAmt(campaign.amount), 'text-lg font-bold text-gray-900'],
                      ['Live Date', fmtShort(campaign.liveDate) || '—', 'text-sm font-semibold text-gray-700'],
                      ['Payment Due', fmtShort(campaign.paymentDueDate) || '—', 'text-sm font-semibold text-gray-700'],
                    ].map(([label, val, cls]) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                        <p className={cls}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    {campaign.dealName && (
                      <LinkField label="Linked Deal" value={campaign.dealName} onClick={() => onNavigate(`/deals?open=${campaign.dealId}`)} />
                    )}
                    <LinkField label="Creator" value={campaign.creator} onClick={() => onNavigate(`/roster?open=${campaign.creatorId}`)} />
                    <LinkField label="Brand" value={campaign.brand} onClick={() => onNavigate(`/contacts?tab=brands&open=${campaign.brandId}`)} />
                    <Field label="Content Type" value={campaign.contentType} />
                    <Field label="Manager" value={campaign.manager} />
                    <Field label="Payment Terms" value={campaign.paymentTerms} />
                    <Field label="Approval" value={campaign.approvalWaived ? 'Waived' : campaign.approvalRequired ? 'Required' : 'Not required'} />
                    {campaign.previewDueDate && <Field label="Preview Due" value={fmtDate(campaign.previewDueDate)} />}
                    {campaign.followUpDate && <Field label="Follow-up Date" value={fmtDate(campaign.followUpDate)} />}
                  </div>

                  {campaign.briefUrl && (
                    <div>
                      <FieldLabel>Brief URL</FieldLabel>
                      <a href={campaign.briefUrl} target="_blank" rel="noreferrer" className="text-sm text-[#111111] hover:underline break-all">{campaign.briefUrl}</a>
                    </div>
                  )}
                  {campaign.contentUrl && (
                    <div>
                      <FieldLabel>Content URL</FieldLabel>
                      <a href={campaign.contentUrl} target="_blank" rel="noreferrer" className="text-sm text-[#111111] hover:underline break-all">{campaign.contentUrl}</a>
                    </div>
                  )}
                  {campaign.notes && <Field label="Notes" value={campaign.notes} />}

                  {/* Linked records */}
                  {(campaign.invoiceId || campaign.payoutId) && (
                    <div className="flex gap-2">
                      {campaign.invoiceId && (
                        <button onClick={() => onNavigate(`/invoices?open=${campaign.invoiceId}`)} className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors" style={{ background: '#EEF4FF', color: '#2D5BE3' }}>
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 1h10v12H2V1zm2 3h6M4 7h6M4 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                          Invoice
                        </button>
                      )}
                      {campaign.payoutId && (
                        <button onClick={() => onNavigate(`/payouts?open=${campaign.payoutId}`)} className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors" style={{ background: '#EDFAF3', color: '#1A7A4A' }}>
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 4h10a1 1 0 011 1v5a1 1 0 01-1 1H2a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" /><circle cx="7" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.3" /></svg>
                          Payout
                        </button>
                      )}
                    </div>
                  )}

                  {/* Planning checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FieldLabel>Planning Checklist</FieldLabel>
                      <span className="text-[11px] text-gray-500">{checklistDone}/{checklistTotal}</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                      {checklistItems.map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!campaign.checklist[key]}
                            onChange={() => handleChecklistToggle(key)}
                            className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-300"
                          />
                          <span className={`text-sm ${campaign.checklist[key] ? 'line-through text-gray-400' : 'text-gray-700'}`}>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Stats ── */}
          {tab === 'stats' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Campaign Performance</h3>
                {!editStats ? (
                  <button onClick={() => { setStatsForm({ ...campaign.stats }); setEditStats(true) }} className="text-xs font-medium text-[#111111] hover:underline px-2.5 py-1 rounded-md transition-colors">Edit</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleStatsSave} className="text-xs font-medium text-[#111111] hover:underline px-2.5 py-1 rounded-md transition-colors">Save</button>
                    <button onClick={() => setEditStats(false)} className="text-xs font-medium text-gray-500 px-2.5 py-1 rounded-md hover:bg-gray-100 transition-colors">Cancel</button>
                  </div>
                )}
              </div>
              {!editStats ? (
                <div className="grid grid-cols-2 gap-3">
                  {statsFields.map(([key, label]) => (
                    <div key={key} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-lg font-bold text-gray-800">{campaign.stats[key] || '—'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {statsFields.map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</label>
                      <input
                        type="text"
                        value={statsForm[key] || ''}
                        onChange={e => setStatsForm(s => ({ ...s, [key]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                        placeholder="—"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tasks ── */}
          {tab === 'tasks' && (
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                  placeholder="Add a task…"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <button onClick={handleAddTask} className="px-3 py-2 rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>
                  <PlusIcon />
                </button>
              </div>
              {campaign.tasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No tasks yet. Add one above.</p>
              ) : (
                <div className="space-y-2">
                  {campaign.tasks.map(task => (
                    <label key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => handleTaskToggle(task.id)}
                        className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-300"
                      />
                      <span className={`text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{task.text}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Activity ── */}
          {tab === 'activity' && (
            <div className="p-6">
              {campaign.activityLog.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No activity yet.</p>
              ) : (
                <div className="space-y-4">
                  {[...campaign.activityLog].reverse().map((log, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700">{log.action}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{log.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Invoice Notification Modal ───────────────────────────────────────────────

function InvoiceNotificationModal({ prompt, onGenerateAnyway, onDismiss }) {
  const { campaign, completedCount, totalCount } = prompt
  const remaining = totalCount - completedCount
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onDismiss} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-[440px] p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#FFF4EC' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L1.5 14h13L8 1.5z" stroke="#C4622D" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M8 6v4M8 11.5v.5" stroke="#C4622D" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Invoice Pending</h3>
            <p className="text-sm text-gray-600">
              <strong>{completedCount} of {totalCount}</strong> campaigns completed for{' '}
              <strong>{campaign.brand}</strong>{campaign.month ? ` in ${campaign.month}` : ''}.{' '}
              Invoice will be generated automatically when all {totalCount} are done.
            </p>
            {remaining > 0 && (
              <p className="text-xs text-gray-400 mt-1.5">
                {remaining} campaign{remaining !== 1 ? 's' : ''} still in progress.
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onGenerateAnyway}
            className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}
          >
            Generate invoice anyway
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
          >
            Wait
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const defaultFilters = { search: '', creator: '', brand: '', status: '', platform: '', manager: '' }

export default function Campaigns() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { campaigns, setCampaigns } = useCampaigns()
  const { setInvoices } = useInvoices()
  const { setPayouts } = usePayouts()
  const [view, setView] = useState('table')
  const [filters, setFilters] = useState(defaultFilters)
  const [sort, setSort] = useState('liveDate-asc')
  const [selectedId, setSelectedId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [invoicePrompt, setInvoicePrompt] = useState(null) // { campaign, group, completedCount, totalCount, nextCampaigns }

  // Open campaign from ?open= URL param (e.g. navigated from Deals)
  useEffect(() => {
    const openId = parseInt(searchParams.get('open'))
    if (openId && campaigns.find(c => c.id === openId)) {
      setSelectedId(openId)
    }
  }, [searchParams, campaigns])

  const selected = campaigns.find(c => c.id === selectedId) ?? null

  const filtered = campaigns.filter(c => {
    const q = filters.search.toLowerCase()
    if (q && !`${c.creator} ${c.brand} ${c.dealName} ${c.platform} ${c.contentType}`.toLowerCase().includes(q)) return false
    if (filters.creator && c.creator !== filters.creator) return false
    if (filters.brand && c.brand !== filters.brand) return false
    if (filters.status && c.status !== filters.status) return false
    if (filters.platform && c.platform !== filters.platform) return false
    if (filters.manager && c.manager !== filters.manager) return false
    return true
  })

  const [sf, sd] = sort.split('-')
  const sorted = [...filtered].sort((a, b) => {
    const aV = sf === 'amount' ? (Number(a.amount) || 0) : (a[sf] ?? '')
    const bV = sf === 'amount' ? (Number(b.amount) || 0) : (b[sf] ?? '')
    const cmp = aV < bV ? -1 : aV > bV ? 1 : 0
    return sd === 'asc' ? cmp : -cmp
  })

  // ── Invoice generation ──────────────────────────────────────────────────────

  const doGenerateInvoice = (triggerCampaign, groupCampaigns, allCampaigns) => {
    // Build line items: group campaigns by platform+contentType
    const lineItemMap = {}
    groupCampaigns.forEach(c => {
      const key = `${c.platform}|${c.contentType}`
      if (!lineItemMap[key]) {
        lineItemMap[key] = { platform: c.platform, contentType: c.contentType, quantity: 0, rate: Number(c.amount) || 0, subtotal: 0 }
      }
      lineItemMap[key].quantity += 1
      lineItemMap[key].subtotal += Number(c.amount) || 0
    })
    const lineItems = Object.values(lineItemMap)
    const total = lineItems.reduce((s, li) => s + li.subtotal, 0)

    // Compute payment due date
    const paymentTerms = triggerCampaign.paymentTerms || 'Net 30'
    const termDays = parseInt(paymentTerms.replace('Net ', '')) || 30
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + termDays)
    const dueStr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const issuedStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    // Invoice ID (year + last 3 digits of timestamp)
    const ts = Date.now()
    const invSuffix = String(ts).slice(-3)
    const invNum = `INV-${new Date().getFullYear()}-${invSuffix}`

    const newInvoice = {
      id: ts,
      invoiceId: invNum,
      creator: triggerCampaign.creator,
      creatorId: triggerCampaign.creatorId,
      brand: triggerCampaign.brand,
      brandId: triggerCampaign.brandId,
      dealId: triggerCampaign.dealId || null,
      dealName: triggerCampaign.dealName || '',
      month: triggerCampaign.month || '',
      lineItems,
      amount: total,
      paymentTerms,
      issued: issuedStr,
      due: dueStr,
      status: 'Outstanding',
      notes: '',
    }

    // Payout
    const commRate = Number(triggerCampaign.commissionRate) || 15
    const commAmt = Math.round(total * commRate / 100)
    const netAmt = total - commAmt

    const newPayout = {
      id: ts + 1,
      creator: triggerCampaign.creator,
      creatorId: triggerCampaign.creatorId,
      deal: triggerCampaign.dealName || '',
      dealId: triggerCampaign.dealId || null,
      month: triggerCampaign.month || '',
      invoiceId: ts,
      gross: total,
      commission: commAmt,
      net: netAmt,
      commissionRate: commRate,
      date: dueStr,
      status: 'Pending',
      notes: '',
    }

    setInvoices(prev => [...prev, newInvoice])
    setPayouts(prev => [...prev, newPayout])

    // Stamp all campaigns in the group with invoiceId + payoutId, and advance to 'Invoiced'
    const updatedCampaigns = allCampaigns.map(c => {
      if (
        c.dealId === triggerCampaign.dealId &&
        c.month === triggerCampaign.month &&
        groupCampaigns.some(gc => gc.id === c.id)
      ) {
        return { ...c, invoiceId: ts, payoutId: ts + 1, status: 'Invoiced',
          activityLog: [...c.activityLog, { action: 'Invoice generated', timestamp: nowStamp() }] }
      }
      return c
    })
    setCampaigns(updatedCampaigns)
  }

  const handleCampaignCompleted = completedCampaign => {
    // Build next state with this campaign marked Completed
    const nextCampaigns = campaigns.map(c => c.id === completedCampaign.id ? completedCampaign : c)

    const { dealId, month } = completedCampaign

    // No deal or month → just update, no invoice logic
    if (!dealId || !month) {
      setCampaigns(nextCampaigns)
      return
    }

    // Find all campaigns in the same deal+month group
    const group = nextCampaigns.filter(c => c.dealId === dealId && c.month === month)
    const completedCount = group.filter(c => c.status === 'Completed').length
    const totalCount = group.length

    if (completedCount === totalCount) {
      // All done — generate invoice + payout immediately
      doGenerateInvoice(completedCampaign, group, nextCampaigns)
    } else {
      // Not all done — update state, show notification
      setCampaigns(nextCampaigns)
      setInvoicePrompt({ campaign: completedCampaign, group, completedCount, totalCount, nextCampaigns })
    }
  }

  const handleUpdate = updated => {
    const prev = campaigns.find(c => c.id === updated.id)
    if (updated.status === 'Completed' && prev?.status !== 'Completed') {
      handleCampaignCompleted(updated)
    } else {
      setCampaigns(prevList => prevList.map(c => c.id === updated.id ? updated : c))
    }
  }

  const handleAdd = newCampaign => {
    setCampaigns(prev => [...prev, {
      ...newCampaign,
      stats: { ...blankStats },
      tasks: [],
      activityLog: [{ action: 'Campaign created', timestamp: nowStamp() }],
      invoiceId: null,
      payoutId: null,
    }])
  }

  const handleStatusChange = (id, newStatus) => {
    const campaign = campaigns.find(c => c.id === id)
    if (!campaign) return
    const log = [...campaign.activityLog, { action: `Status → ${newStatus}`, timestamp: nowStamp() }]
    const updated = { ...campaign, status: newStatus, activityLog: log }
    handleUpdate(updated)
  }

  const handleGenerateAnyway = () => {
    if (!invoicePrompt) return
    const { campaign, group, nextCampaigns } = invoicePrompt
    // Generate invoice only for the completed campaigns in this group
    const completedGroup = group.filter(c => c.status === 'Completed')
    doGenerateInvoice(campaign, completedGroup, nextCampaigns)
    setInvoicePrompt(null)
  }

  const handleNavigate = path => {
    setSelectedId(null)
    navigate(path)
  }

  const totalValue = sorted.reduce((s, c) => s + (Number(c.amount) || 0), 0)

  const views = [
    {
      key: 'table',
      label: 'Table',
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M1 7h12M1 11h12M4.5 1v12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
    },
    {
      key: 'kanban',
      label: 'Kanban',
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="3" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="5.5" y="1" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="10" y="1" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" /></svg>,
    },
    {
      key: 'calendar',
      label: 'Calendar',
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M1 5.5h12M4.5 1v2.5M9.5 1v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
    },
    {
      key: 'monthly',
      label: 'Monthly',
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M1 7h8M1 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
    },
  ]

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Campaigns"
        subtitle={`${sorted.length} campaign${sorted.length !== 1 ? 's' : ''} · ${formatAmt(totalValue)} total value`}
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}
          >
            <PlusIcon />
            Add Campaign
          </button>
        }
      />

      {/* View toggle */}
      <div className="flex items-center gap-1 mb-4">
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#FFFFFF',
              border: `1px solid ${view === v.key ? '#111111' : '#EEEEEE'}`,
              borderRadius: 6,
              padding: '6px 14px',
              fontFamily: '"Inter", system-ui, sans-serif',
              fontWeight: 500,
              fontSize: 13,
              color: view === v.key ? '#111111' : '#888888',
              cursor: 'pointer',
            }}
          >
            {v.icon}
            {v.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <FilterBar filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} campaigns={campaigns} />

      {/* Views */}
      {view === 'table' && <TableView campaigns={sorted} onSelect={c => setSelectedId(c.id)} />}
      {view === 'kanban' && <KanbanView campaigns={sorted} onSelect={c => setSelectedId(c.id)} onStatusChange={handleStatusChange} />}
      {view === 'calendar' && <CalendarView campaigns={sorted} onSelect={c => setSelectedId(c.id)} />}
      {view === 'monthly' && <MonthlyView campaigns={sorted} onSelect={c => setSelectedId(c.id)} />}

      {/* Campaign detail */}
      {selected && (
        <CampaignDetail
          campaign={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={c => { handleUpdate(c); setSelectedId(c.id) }}
          onNavigate={handleNavigate}
        />
      )}

      {/* Add campaign modal */}
      {showAdd && (
        <AddCampaignModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
        />
      )}

      {/* Invoice notification modal */}
      {invoicePrompt && (
        <InvoiceNotificationModal
          prompt={invoicePrompt}
          onGenerateAnyway={handleGenerateAnyway}
          onDismiss={() => setInvoicePrompt(null)}
        />
      )}
    </div>
  )
}
