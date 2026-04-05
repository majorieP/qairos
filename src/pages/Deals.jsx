import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCampaigns, blankCampaignChecklist, blankCampaignStats } from '../context/CampaignsContext'
import { useContracts } from '../context/ContractsContext'
import { useInvoices, fmtInvoiceAmt } from '../context/InvoicesContext'
import { usePayouts } from '../context/PayoutsContext'
import { clientsData } from './Roster'
import { brandsData } from './Contacts'
import BrandLogo from '../components/BrandLogo'
import PageHeader from '../components/PageHeader'

// ─── Constants ────────────────────────────────────────────────────────────────

const KANBAN_STATUSES = ['New Inquiry', 'Pitching', 'Negotiating', 'On Hold', 'Signed', 'Lost']
const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Podcast', 'Blog', 'Twitter/X', 'Pinterest']
const CONTENT_TYPES_LIST = ['Story', 'Reel', 'Post', 'Video', 'Integration', 'Dedicated Video', 'Series']
const PAYMENT_TERMS_OPTS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90', 'Upon Completion']
const DEAL_TYPES = ['inbound', 'outbound']
const MANAGERS = ['Marjorie A.', 'Alex Kim', 'Sam Reyes']

const DELIVERABLE_MONTHS = (() => {
  const result = []
  for (let year = 2026; year <= 2027; year++) {
    for (let month = 0; month < 12; month++) {
      result.push(new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
    }
  }
  return result
})()

const STATUS_COLORS = {
  'New Inquiry':  { background: '#F3F3F3', color: '#666666' },
  'Pitching':     { background: '#F3F3F3', color: '#666666' },
  'Negotiating':  { background: '#FFF4EC', color: '#C4622D' },
  'On Hold':      { background: '#FFF8EC', color: '#B45309' },
  'Signed':       { background: '#EDFAF3', color: '#1A7A4A' },
  'Lost':         { background: '#FEE2E2', color: '#DC2626' },
}

const PLATFORM_ACCENTS = {
  Instagram:   { border: '#ec4899', bg: '#fdf2f8', text: '#be185d' },
  TikTok:      { border: '#1d1d1f', bg: '#f4f4f5', text: '#18181b' },
  YouTube:     { border: '#ef4444', bg: '#fef2f2', text: '#b91c1c' },
  Podcast:     { border: '#f97316', bg: '#fff7ed', text: '#c2410c' },
  Blog:        { border: '#22c55e', bg: '#f0fdf4', text: '#166534' },
  'Twitter/X': { border: '#0ea5e9', bg: '#f0f9ff', text: '#0369a1' },
  Pinterest:   { border: '#f43f5e', bg: '#fff1f2', text: '#be123c' },
}

const PLATFORM_SHORT = {
  Instagram: 'IG', TikTok: 'TT', YouTube: 'YT',
  Podcast: 'POD', Blog: 'Blog', 'Twitter/X': 'X', Pinterest: 'PIN',
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const contactsData = [
  { id: 1, name: 'Emily Santos',  brandId: 1, title: 'Brand Partnerships' },
  { id: 2, name: 'Chris Park',    brandId: 2, title: 'Influencer Manager' },
  { id: 3, name: 'Priya Gupta',   brandId: 3, title: 'Content Lead' },
  { id: 4, name: 'Dan Miller',    brandId: 4, title: 'Marketing Director' },
  { id: 5, name: 'Yuki Tanaka',   brandId: 5, title: 'Creative Director' },
  { id: 6, name: 'Mia Chen',      brandId: 6, title: 'Partnerships Lead' },
  { id: 7, name: 'Ryan Lee',      brandId: 7, title: 'Brand Manager' },
]

const dealsData = [
  {
    id: 1, dealName: 'Spring Glow Collection',
    creator: 'Sofia Chen', creatorId: 1,
    brand: 'Luminary Beauty', brandId: 1,
    contact: 'Emily Santos', contactId: 1,
    deliverables: [
      { id: 11, platform: 'Instagram', contentType: 'Reel',  quantity: 2, rate: 3500, month: 'March 2026' },
      { id: 12, platform: 'Instagram', contentType: 'Story', quantity: 5, rate: 500,  month: 'April 2026' },
      { id: 13, platform: 'TikTok',    contentType: 'Video', quantity: 1, rate: 2500, month: 'April 2026' },
    ],
    commissionRate: 20, paymentTerms: 'Net 30',
    dealType: 'inbound', status: 'Negotiating', signedDate: '', isRebook: false,
    manager: 'Marjorie A.',
    notes: 'Brand reached out for spring collection. Discussing exclusivity clause.',
    tasks: [{ id: 101, text: 'Send revised rate card to Emily', done: false }],
    activityLog: [
      { action: 'Deal created', timestamp: '2026-02-10 09:00' },
      { action: 'Status → Negotiating', timestamp: '2026-02-18 11:00' },
    ],
    campaigns: [1], contractId: null, invoiceIds: [],
  },
  {
    id: 2, dealName: 'Run Season Ambassador',
    creator: 'Marcus Reid', creatorId: 2,
    brand: 'Peak Athletics', brandId: 2,
    contact: 'Chris Park', contactId: 2,
    deliverables: [
      { id: 21, platform: 'TikTok', contentType: 'Video', quantity: 2, rate: 3000, month: 'March 2026' },
      { id: 22, platform: 'TikTok', contentType: 'Post',  quantity: 5, rate: 500,  month: 'April 2026' },
    ],
    commissionRate: 20, paymentTerms: 'Net 30',
    dealType: 'inbound', status: 'Signed', signedDate: '2026-03-15', isRebook: false,
    manager: 'Alex Kim',
    notes: 'Signed for Q1/Q2 run season. Two deliverables.',
    tasks: [{ id: 102, text: 'Send contract to Marcus', done: true }],
    activityLog: [
      { action: 'Deal created', timestamp: '2026-02-20 10:00' },
      { action: 'Status → Signed', timestamp: '2026-03-15 14:00' },
    ],
    campaigns: [2, 7], contractId: 1, invoiceIds: [],
  },
  {
    id: 3, dealName: 'Plant-Forward Recipe Series',
    creator: 'Anika Patel', creatorId: 3,
    brand: 'Verdant Foods', brandId: 3,
    contact: 'Priya Gupta', contactId: 3,
    deliverables: [
      { id: 31, platform: 'Instagram', contentType: 'Post', quantity: 4, rate: 800,  month: 'May 2026' },
      { id: 32, platform: 'Instagram', contentType: 'Reel', quantity: 1, rate: 2000, month: 'May 2026' },
    ],
    commissionRate: 15, paymentTerms: 'Net 45',
    dealType: 'outbound', status: 'Pitching', signedDate: '', isRebook: false,
    manager: 'Sam Reyes',
    notes: 'We pitched Verdant Foods. Waiting on Q2 budget approval.',
    tasks: [{ id: 103, text: 'Follow up with Priya re: Q2 budget', done: false }],
    activityLog: [{ action: 'Deal created', timestamp: '2026-03-01 11:00' }],
    campaigns: [], contractId: null, invoiceIds: [],
  },
  {
    id: 4, dealName: 'Q2 Tech Review Series',
    creator: 'James Ortiz', creatorId: 4,
    brand: 'TechFlow', brandId: 4,
    contact: 'Dan Miller', contactId: 4,
    deliverables: [
      { id: 41, platform: 'YouTube', contentType: 'Integration',    quantity: 2, rate: 6000, month: 'April 2026' },
      { id: 42, platform: 'YouTube', contentType: 'Dedicated Video', quantity: 1, rate: 6000, month: 'June 2026'  },
    ],
    commissionRate: 20, paymentTerms: 'Net 30',
    dealType: 'outbound', status: 'Signed', signedDate: '2026-02-28', isRebook: false,
    manager: 'Marjorie A.',
    notes: '4-video integration series across Q2.',
    tasks: [],
    activityLog: [
      { action: 'Deal created', timestamp: '2026-01-15 09:00' },
      { action: 'Status → Signed', timestamp: '2026-02-28 16:00' },
    ],
    campaigns: [4], contractId: 2, invoiceIds: [1],
  },
  {
    id: 5, dealName: 'Golden Horizons Travel Series',
    creator: 'Lily Nakamura', creatorId: 5,
    brand: 'Solstice Travel', brandId: 5,
    contact: 'Yuki Tanaka', contactId: 5,
    deliverables: [
      { id: 51, platform: 'Instagram', contentType: 'Reel',  quantity: 4, rate: 4000, month: 'May 2026' },
      { id: 52, platform: 'Instagram', contentType: 'Story', quantity: 8, rate: 750,  month: 'May 2026' },
    ],
    commissionRate: 20, paymentTerms: 'Net 45',
    dealType: 'inbound', status: 'Negotiating', signedDate: '', isRebook: true,
    manager: 'Marjorie A.',
    notes: 'Second travel series with Solstice. Higher rate negotiated vs. last year.',
    tasks: [{ id: 104, text: 'Review revised contract terms with Lily', done: false }],
    activityLog: [
      { action: 'Deal created', timestamp: '2026-03-05 10:00' },
      { action: 'Status → Negotiating', timestamp: '2026-03-10 11:00' },
    ],
    campaigns: [], contractId: null, invoiceIds: [],
  },
  {
    id: 6, dealName: 'GlowLab Spring Edit',
    creator: 'Sofia Chen', creatorId: 1,
    brand: 'GlowLab', brandId: 6,
    contact: 'Mia Chen', contactId: 6,
    deliverables: [
      { id: 61, platform: 'Instagram', contentType: 'Reel',  quantity: 1, rate: 3500, month: 'April 2026' },
      { id: 62, platform: 'TikTok',    contentType: 'Video', quantity: 2, rate: 2000, month: 'April 2026' },
    ],
    commissionRate: 20, paymentTerms: 'Net 30',
    dealType: 'inbound', status: 'Pitching', signedDate: '', isRebook: false,
    manager: 'Alex Kim',
    notes: 'New skincare brand, first outreach. Promising fit.',
    tasks: [],
    activityLog: [{ action: 'Deal created', timestamp: '2026-03-12 14:00' }],
    campaigns: [], contractId: null, invoiceIds: [],
  },
  {
    id: 7, dealName: 'NutriBrand Protein Partnership',
    creator: 'Marcus Reid', creatorId: 2,
    brand: 'NutriBrand', brandId: 7,
    contact: 'Ryan Lee', contactId: 7,
    deliverables: [
      { id: 71, platform: 'TikTok',    contentType: 'Video', quantity: 2, rate: 3500, month: 'March 2026' },
      { id: 72, platform: 'Instagram', contentType: 'Post',  quantity: 5, rate: 1000, month: 'April 2026' },
    ],
    commissionRate: 20, paymentTerms: 'Net 30',
    dealType: 'outbound', status: 'Signed', signedDate: '2026-03-01', isRebook: false,
    manager: 'Sam Reyes',
    notes: 'Protein powder + pre-workout campaign, 4 pieces total.',
    tasks: [],
    activityLog: [
      { action: 'Deal created', timestamp: '2026-02-05 09:00' },
      { action: 'Status → Signed', timestamp: '2026-03-01 10:00' },
    ],
    campaigns: [], contractId: 3, invoiceIds: [2],
  },
  {
    id: 8, dealName: 'MediaTech Flagship Deal',
    creator: 'James Ortiz', creatorId: 4,
    brand: 'TechFlow', brandId: 4,
    contact: 'Dan Miller', contactId: 4,
    deliverables: [
      { id: 81, platform: 'YouTube', contentType: 'Dedicated Video', quantity: 2, rate: 12500, month: 'July 2026' },
    ],
    commissionRate: 20, paymentTerms: 'Net 60',
    dealType: 'outbound', status: 'Lost', signedDate: '', isRebook: false,
    manager: 'Marjorie A.',
    notes: 'Lost to competing agency. Budget cut at the last minute.',
    tasks: [],
    activityLog: [
      { action: 'Deal created', timestamp: '2026-01-20 09:00' },
      { action: 'Status → Lost', timestamp: '2026-02-15 14:00' },
    ],
    campaigns: [], contractId: null, invoiceIds: [],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function parseMonthStr(m) {
  if (!m) return new Date(0)
  const parts = m.split(' ')
  const monthIdx = MONTH_NAMES.indexOf(parts[0])
  return new Date(Number(parts[1]), monthIdx < 0 ? 0 : monthIdx, 1)
}

function formatAmt(n) {
  if (n === '' || n === null || n === undefined || isNaN(n)) return '—'
  return '$' + Number(n).toLocaleString()
}

function fmtShort(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function nowStamp() {
  return new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const TASK_PRIORITY_COLORS = { High: '#EF4444', Medium: '#F59E0B', Low: '#9CA3AF' }

function fmtDueDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date(); today.setHours(0,0,0,0)
  const diff  = Math.round((date - today) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function taskAssigneeInitials(name) {
  if (!name) return ''
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const CREATOR_PHOTO_MAP = { 1:'women/12', 2:'men/10', 3:'women/22', 4:'men/20', 5:'women/32', 6:'women/26', 7:'men/15', 8:'women/44', 9:'men/25', 10:'women/8' }
function creatorPhotoUrl(creator) {
  const p = CREATOR_PHOTO_MAP[creator.id]
  if (p) return `https://randomuser.me/api/portraits/${p}.jpg`
  const n = ((creator.id * 7) % 49) + 1
  return `https://randomuser.me/api/portraits/${creator.id % 2 === 0 ? 'men' : 'women'}/${n}.jpg`
}

function calcTotal(deliverables) {
  if (!deliverables?.length) return 0
  return deliverables.reduce((sum, d) => sum + (Number(d.quantity) || 0) * (Number(d.rate) || 0), 0)
}

function commissionAmt(total, rate) {
  if (!total || !rate) return '—'
  return formatAmt(Math.round(Number(total) * Number(rate) / 100))
}

function getCampaignMonths(deliverables) {
  const months = [...new Set((deliverables || []).map(d => d.month).filter(Boolean))]
  return months.sort((a, b) => parseMonthStr(a) - parseMonthStr(b))
}

function calcMonthValue(deal, month) {
  if (!month || month === 'No Month') return calcTotal(deal.deliverables)
  return calcTotal((deal.deliverables || []).filter(del => del.month === month))
}

function deliverableSummaryForMonth(deliverables, month) {
  if (!month || month === 'No Month') return deliverableSummary(deliverables)
  return deliverableSummary((deliverables || []).filter(d => d.month === month))
}

function deliverableSummary(deliverables) {
  if (!deliverables?.length) return '—'
  const groups = {}
  deliverables.forEach(d => {
    const key = `${PLATFORM_SHORT[d.platform] || d.platform} ${d.contentType}`
    if (!groups[key]) groups[key] = 0
    groups[key] += Number(d.quantity) || 1
  })
  return Object.entries(groups).map(([label, qty]) => `${qty}× ${label}`).join(' + ')
}

function getGroupKeys(deal, groupBy) {
  switch (groupBy) {
    case 'status':   return [deal.status]
    case 'manager':  return [deal.manager || 'Unassigned']
    case 'type':     return [deal.dealType ? deal.dealType.charAt(0).toUpperCase() + deal.dealType.slice(1) : 'Unknown']
    case 'platform': {
      const platforms = [...new Set((deal.deliverables || []).map(d => d.platform).filter(Boolean))]
      return platforms.length > 0 ? platforms : ['No Platform']
    }
    case 'month': {
      const months = getCampaignMonths(deal.deliverables)
      return months.length > 0 ? months : ['No Month']
    }
    default: return ['All Deals']
  }
}

function groupDeals(deals, groupBy) {
  const map = new Map()
  deals.forEach(deal => {
    getGroupKeys(deal, groupBy).forEach(key => {
      if (!map.has(key)) map.set(key, { key, label: key, deals: [] })
      map.get(key).deals.push(deal)
    })
  })
  const entries = [...map.entries()]
  if (groupBy === 'status') {
    entries.sort((a, b) => KANBAN_STATUSES.indexOf(a[0]) - KANBAN_STATUSES.indexOf(b[0]))
  } else if (groupBy === 'month') {
    entries.sort((a, b) => {
      if (a[0] === 'No Month') return -1
      if (b[0] === 'No Month') return 1
      return parseMonthStr(a[0]) - parseMonthStr(b[0])
    })
  } else {
    entries.sort((a, b) => a[0].localeCompare(b[0]))
  }
  return entries.map(([, g]) => g)
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

function ChevronIcon({ down }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${down ? 'rotate-180' : ''}`}>
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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

function EditInput({ label, value: valueProp, field, form, onChange, type = 'text', placeholder = '', error }) {
  const val = valueProp !== undefined ? valueProp : (form?.[field] ?? '')
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={val}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">This field is required</p>}
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
  const pc = PLATFORM_ACCENTS[platform] || { bg: '#F3F3F3', text: '#666666' }
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: pc.bg, color: pc.text }}>
      {platform}
    </span>
  )
}

function TypeBadge({ type }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide" style={type === 'inbound' ? { background: '#EEF4FF', color: '#2D5BE3' } : { background: '#F3F3F3', color: '#666666' }}>
      {type}
    </span>
  )
}

function RebookBadge({ isRebook }) {
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border" style={isRebook ? { background: '#FFF4EC', color: '#C4622D', borderColor: '#FDD5B8' } : { background: '#EDFAF3', color: '#1A7A4A', borderColor: '#BBF7D0' }}>
      {isRebook ? 'REBOOK' : 'NEW'}
    </span>
  )
}

// ─── Deliverables Table ───────────────────────────────────────────────────────

function DeliverablesTable({ rows = [], onChange }) {
  const isEditing = !!onChange

  const addRow = () => {
    onChange([...rows, { id: Date.now(), platform: 'Instagram', contentType: 'Reel', quantity: 1, rate: '', month: '' }])
  }

  const updateRow = (id, field, value) => {
    onChange(rows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const removeRow = id => onChange(rows.filter(r => r.id !== id))

  const total = calcTotal(rows)

  if (!isEditing) {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide text-[10px]">
              <th className="px-3 py-2 text-left font-medium">Platform</th>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="px-3 py-2 text-center font-medium">Qty</th>
              <th className="px-3 py-2 text-right font-medium">Rate</th>
              <th className="px-3 py-2 text-left font-medium">Month</th>
              <th className="px-3 py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 1 ? 'bg-gray-50/40' : ''}>
                <td className="px-3 py-2"><PlatformTag platform={r.platform} /></td>
                <td className="px-3 py-2 text-gray-700">{r.contentType}</td>
                <td className="px-3 py-2 text-center text-gray-600">{r.quantity}×</td>
                <td className="px-3 py-2 text-right text-gray-600">{formatAmt(r.rate)}</td>
                <td className="px-3 py-2 text-gray-500">{r.month || '—'}</td>
                <td className="px-3 py-2 text-right font-semibold text-gray-800">{formatAmt((Number(r.quantity) || 0) * (Number(r.rate) || 0))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50">
              <td colSpan={5} className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-right">Total</td>
              <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">{formatAmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-max">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide text-[10px]">
              <th className="px-2 py-2 text-left font-medium">Platform</th>
              <th className="px-2 py-2 text-left font-medium">Type</th>
              <th className="px-2 py-2 text-left font-medium">Qty</th>
              <th className="px-2 py-2 text-left font-medium">Rate ($)</th>
              <th className="px-2 py-2 text-left font-medium">Month</th>
              <th className="px-2 py-2 text-right font-medium">Subtotal</th>
              <th className="w-6" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(r => (
              <tr key={r.id}>
                <td className="px-2 py-1.5">
                  <select value={r.platform} onChange={e => updateRow(r.id, 'platform', e.target.value)}
                    className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300">
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <select value={r.contentType} onChange={e => updateRow(r.id, 'contentType', e.target.value)}
                    className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300">
                    {CONTENT_TYPES_LIST.map(c => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input type="number" min="1" value={r.quantity}
                    onChange={e => updateRow(r.id, 'quantity', Number(e.target.value))}
                    className="w-12 text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300 text-center" />
                </td>
                <td className="px-2 py-1.5">
                  <input type="number" min="0" value={r.rate} placeholder="0"
                    onChange={e => updateRow(r.id, 'rate', e.target.value)}
                    className="w-20 text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300" />
                </td>
                <td className="px-2 py-1.5">
                  <select value={r.month} onChange={e => updateRow(r.id, 'month', e.target.value)}
                    className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300">
                    <option value="">No month</option>
                    {DELIVERABLE_MONTHS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1.5 text-right font-semibold text-gray-700">
                  {formatAmt((Number(r.quantity) || 0) * (Number(r.rate) || 0))}
                </td>
                <td className="px-2 py-1.5">
                  <button onClick={() => removeRow(r.id)} className="text-gray-300 hover:text-rose-400 transition-colors p-0.5">
                    <CloseIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50">
              <td colSpan={5} className="px-2 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Total</td>
              <td className="px-2 py-2 text-right font-bold text-gray-800">{formatAmt(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <button onClick={addRow}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-[#111111] font-medium hover:bg-gray-50 transition-colors border-t border-gray-100">
        <PlusIcon size={11} /> Add deliverable
      </button>
    </div>
  )
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({ filters, setFilters, sort, setSort, groupBy, setGroupBy, deals }) {
  const creators = [...new Set(deals.map(d => d.creator))].sort()
  const brands   = [...new Set(deals.map(d => d.brand))].sort()
  const sel = (field, value) => setFilters(f => ({ ...f, [field]: value }))
  const cls = 'px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-300'

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <input
        type="text"
        placeholder="Search deals…"
        value={filters.search}
        onChange={e => sel('search', e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 w-48"
      />
      <select value={filters.creator} onChange={e => sel('creator', e.target.value)} className={cls}>
        <option value="">All Creators</option>
        {creators.map(c => <option key={c}>{c}</option>)}
      </select>
      <select value={filters.brand} onChange={e => sel('brand', e.target.value)} className={cls}>
        <option value="">All Brands</option>
        {brands.map(b => <option key={b}>{b}</option>)}
      </select>
      <select value={filters.status} onChange={e => sel('status', e.target.value)} className={cls}>
        <option value="">All Statuses</option>
        {KANBAN_STATUSES.map(s => <option key={s}>{s}</option>)}
      </select>
      <select value={filters.dealType} onChange={e => sel('dealType', e.target.value)} className={cls}>
        <option value="">All Types</option>
        <option value="inbound">Inbound</option>
        <option value="outbound">Outbound</option>
      </select>
      <select value={filters.platform} onChange={e => sel('platform', e.target.value)} className={cls}>
        <option value="">All Platforms</option>
        {PLATFORMS.map(p => <option key={p}>{p}</option>)}
      </select>
      <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className={cls}>
        <option value="none">No grouping</option>
        <option value="status">By Status</option>
        <option value="manager">By Manager</option>
        <option value="platform">By Platform</option>
        <option value="month">By Month</option>
        <option value="type">By Type</option>
      </select>
      <div className="ml-auto">
        <select value={sort} onChange={e => setSort(e.target.value)} className={cls}>
          <option value="totalValue-desc">Value ↓</option>
          <option value="totalValue-asc">Value ↑</option>
          <option value="signedDate-desc">Signed ↓</option>
          <option value="signedDate-asc">Signed ↑</option>
          <option value="creator-asc">Creator A–Z</option>
          <option value="status-asc">Status</option>
        </select>
      </div>
    </div>
  )
}

// ─── Table View ───────────────────────────────────────────────────────────────

function TableView({ deals, groupBy, onSelect }) {
  const [sortField, setSortField] = useState('totalValue')
  const [sortDir, setSortDir]     = useState('desc')

  const COLS = [
    { key: 'creator',        label: 'Creator' },
    { key: 'brand',          label: 'Brand' },
    { key: 'contact',        label: 'Contact' },
    { key: 'dealName',       label: 'Deal Name' },
    { key: 'deliverables',   label: 'Deliverables', noSort: true },
    { key: 'totalValue',     label: 'Value' },
    { key: 'commissionRate', label: 'Commission' },
    { key: 'paymentTerms',   label: 'Terms' },
    { key: 'manager',        label: 'Manager' },
    { key: 'dealType',       label: 'Type',   noSort: true },
    { key: 'isRebook',       label: 'Rebook', noSort: true },
    { key: 'status',         label: 'Status' },
    { key: 'signedDate',     label: 'Signed' },
  ]

  const toggleSort = key => {
    if (sortField === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(key); setSortDir('asc') }
  }

  const sortFn = (a, b) => {
    let aV, bV
    if (sortField === 'totalValue') { aV = calcTotal(a.deliverables); bV = calcTotal(b.deliverables) }
    else if (sortField === 'commissionRate') { aV = Number(a.commissionRate) || 0; bV = Number(b.commissionRate) || 0 }
    else { aV = a[sortField] ?? ''; bV = b[sortField] ?? '' }
    const cmp = aV < bV ? -1 : aV > bV ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  }

  const groups = groupBy === 'none'
    ? [{ key: 'all', label: null, deals: [...deals].sort(sortFn) }]
    : groupDeals([...deals].sort(sortFn), groupBy)

  const renderRow = d => (
    <tr key={d.id} onClick={() => onSelect(d)} className="hover:bg-gray-50 transition-colors cursor-pointer group">
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {creatorPhotoUrl({ id: d.creatorId }) && (
            <img src={creatorPhotoUrl({ id: d.creatorId })} alt={d.creator}
              style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          )}
          <span className="font-medium text-gray-800">{d.creator}</span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <BrandLogo name={d.brand} size={24} />
          <span>{d.brand}</span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{d.contact}</td>
      <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{d.dealName}</td>
      <td className="px-4 py-3.5 text-gray-500 text-xs max-w-[200px] truncate">{deliverableSummary(d.deliverables)}</td>
      <td className="px-4 py-3.5 font-semibold text-gray-800 whitespace-nowrap">{formatAmt(calcTotal(d.deliverables))}</td>
      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{d.commissionRate}% · {commissionAmt(calcTotal(d.deliverables), d.commissionRate)}</td>
      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{d.paymentTerms}</td>
      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{d.manager || '—'}</td>
      <td className="px-4 py-3.5"><TypeBadge type={d.dealType} /></td>
      <td className="px-4 py-3.5"><RebookBadge isRebook={d.isRebook} /></td>
      <td className="px-4 py-3.5"><StatusBadge status={d.status} /></td>
      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{fmtShort(d.signedDate) || '—'}</td>
      <td className="px-3 py-3.5 text-gray-300 group-hover:text-gray-400 transition-colors">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </td>
    </tr>
  )

  const thead = (
    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
      {COLS.map(col => (
        <th key={col.key}
          onClick={() => !col.noSort && toggleSort(col.key)}
          className={`px-4 py-3 text-left font-medium whitespace-nowrap select-none ${!col.noSort ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}>
          {col.label}
          {sortField === col.key && !col.noSort && <SortIcon dir={sortDir} />}
        </th>
      ))}
      <th className="px-4 py-3" />
    </tr>
  )

  if (groupBy === 'none') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-max">
          <thead>{thead}</thead>
          <tbody className="divide-y divide-gray-100">
            {groups[0].deals.map(renderRow)}
            {groups[0].deals.length === 0 && (
              <tr><td colSpan={14} className="px-5 py-10 text-center text-sm text-gray-400">No deals match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {groups.map(group => {
        const pipeline = group.deals.filter(d => d.status !== 'Lost').reduce((s, d) => s + calcTotal(d.deliverables), 0)
        return (
          <div key={group.key}>
            <div className="flex items-baseline gap-3 mb-2">
              <h3 className="text-sm font-semibold text-gray-700">{group.label}</h3>
              <span className="text-xs text-gray-400">{group.deals.length} deal{group.deals.length !== 1 ? 's' : ''}</span>
              <span className="text-xs font-semibold text-gray-500 ml-auto">{formatAmt(pipeline)} pipeline</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-max">
                <thead>{thead}</thead>
                <tbody className="divide-y divide-gray-100">
                  {group.deals.map(d => (
                    <tr key={`${group.key}-${d.id}`} onClick={() => onSelect(d)} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                      <td className="px-4 py-3.5 whitespace-nowrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {creatorPhotoUrl({ id: d.creatorId }) && (
            <img src={creatorPhotoUrl({ id: d.creatorId })} alt={d.creator}
              style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          )}
          <span className="font-medium text-gray-800">{d.creator}</span>
        </div>
      </td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <BrandLogo name={d.brand} size={24} />
          <span>{d.brand}</span>
        </div>
      </td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{d.contact}</td>
                      <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{d.dealName}</td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs max-w-[200px] truncate">{deliverableSummary(d.deliverables)}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800 whitespace-nowrap">{formatAmt(calcTotal(d.deliverables))}</td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{d.commissionRate}% · {commissionAmt(calcTotal(d.deliverables), d.commissionRate)}</td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{d.paymentTerms}</td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{d.manager || '—'}</td>
                      <td className="px-4 py-3.5"><TypeBadge type={d.dealType} /></td>
                      <td className="px-4 py-3.5"><RebookBadge isRebook={d.isRebook} /></td>
                      <td className="px-4 py-3.5"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{fmtShort(d.signedDate) || '—'}</td>
                      <td className="px-3 py-3.5 text-gray-300 group-hover:text-gray-400 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </td>
                    </tr>
                  ))}
                  {group.deals.length === 0 && (
                    <tr><td colSpan={14} className="px-5 py-6 text-center text-sm text-gray-400">No deals.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Kanban View ──────────────────────────────────────────────────────────────

const INTER = '"Inter", system-ui, sans-serif'

const KANBAN_DOT_COLOR = {
  'New Inquiry':  '#888888',
  'Pitching':     '#F97316',
  'Negotiating':  '#3B82F6',
  'On Hold':      '#F59E0B',
  'Signed':       '#22C55E',
  'Lost':         '#9CA3AF',
}

// Keep for status stepper elsewhere
const STATUS_HEADER_COLORS = {
  'New Inquiry':  '#666666',
  'Pitching':     '#666666',
  'Negotiating':  '#C4622D',
  'On Hold':      '#B45309',
  'Signed':       '#1A7A4A',
  'Lost':         '#DC2626',
}

function KanbanCard({ d, onDragStart, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const total = calcTotal(d.deliverables)

  const borderColor = hovered ? '#D0D0D0' : '#E8E8E8'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: INTER,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderTop: `1px solid ${borderColor}`,
        borderRight: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        borderLeft: `1px solid ${borderColor}`,
        padding: '16px 18px',
        cursor: 'pointer',
        userSelect: 'none',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Creator + Amount */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          {creatorPhotoUrl({ id: d.creatorId }) && (
            <img src={creatorPhotoUrl({ id: d.creatorId })} alt={d.creator}
              style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111111', lineHeight: 1.4, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.creator}
          </span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 400, color: '#999999', lineHeight: 1.4, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {formatAmt(total)}
        </span>
      </div>
      {/* Brand logo + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <BrandLogo name={d.brand} size={24} />
        <span style={{ fontSize: 13, fontWeight: 400, color: '#666666', lineHeight: 1.35 }}>{d.brand}</span>
      </div>

      {/* Footer pills — Manager + Month */}
      {(() => {
        const months = getCampaignMonths(d.deliverables)
        const monthLabel = months.length === 0
          ? null
          : months.length === 1
            ? months[0].split(' ')[0].slice(0, 3) + ' ' + months[0].split(' ')[1]
            : months.slice(0, 2).map(m => m.split(' ')[0].slice(0, 3)).join(' · ') + (months.length > 2 ? ` +${months.length - 2}` : '')
        const pill = {
          fontFamily: INTER, fontSize: 13, fontWeight: 400, color: '#666666',
          backgroundColor: '#EBEBEB', padding: '5px 12px', borderRadius: 20,
          whiteSpace: 'nowrap', lineHeight: 1,
        }
        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {d.manager && <span style={pill}>{d.manager}</span>}
            {monthLabel && <span style={pill}>{monthLabel}</span>}
          </div>
        )
      })()}
    </div>
  )
}

function KanbanView({ deals, groupBy, onSelect, onStatusChange }) {
  const dragId = useRef(null)
  const effectiveGroupBy = groupBy === 'none' ? 'status' : groupBy
  const groups = groupDeals(deals, effectiveGroupBy)
  const isStatus = effectiveGroupBy === 'status'

  return (
    <div style={{
      display: 'flex', gap: 16, overflowX: 'auto',
      padding: 20, borderRadius: 16, minHeight: '60vh',
      alignItems: 'flex-start', backgroundColor: '#F2F2F2',
    }}>
      {groups.map(group => {
        const dot = isStatus ? (KANBAN_DOT_COLOR[group.key] || '#CCCCCC') : '#CCCCCC'

        return (
          <div
            key={group.key}
            onDragOver={e => e.preventDefault()}
            onDrop={() => {
              if (dragId.current != null && isStatus) {
                onStatusChange(dragId.current, group.key)
                dragId.current = null
              }
            }}
            style={{
              fontFamily: INTER,
              flexShrink: 0,
              width: 340,
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              borderTop: '1px solid #E8E8E8',
              borderRight: '1px solid #E8E8E8',
              borderBottom: '1px solid #E8E8E8',
              borderLeft: '1px solid #E8E8E8',
              padding: '20px 16px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* Column header */}
            <div style={{ paddingBottom: 14, borderBottom: '1px solid #F0F0F0', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 9, height: 9, borderRadius: '50%',
                  backgroundColor: dot, flexShrink: 0, display: 'inline-block',
                }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#111111', flex: 1, lineHeight: 1 }}>
                  {group.label}
                </span>
                <span style={{ fontSize: 15, fontWeight: 400, color: '#AAAAAA', lineHeight: 1 }}>
                  {group.deals.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            {group.deals.map(d => (
              <KanbanCard
                key={d.id}
                d={d}
                onDragStart={() => { dragId.current = d.id }}
                onSelect={() => onSelect(d)}
              />
            ))}

            {/* Empty drop zone */}
            {group.deals.length === 0 && (
              <div style={{
                border: '1.5px dashed #E8E8E8', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80,
              }}>
                <span style={{ fontSize: 12, color: '#CCCCCC' }}>Drop here</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Monthly View ─────────────────────────────────────────────────────────────

function MonthlyView({ deals, groupBy, onSelect }) {
  const effectiveGroupBy = (groupBy === 'none' || groupBy === 'month') ? 'month' : groupBy
  const byMonth = effectiveGroupBy === 'month'
  const groups = groupDeals(deals, effectiveGroupBy)

  return (
    <div className="space-y-6">
      {groups.map(group => {
        const pipeline = group.deals
          .filter(d => d.status !== 'Lost')
          .reduce((s, d) => s + (byMonth ? calcMonthValue(d, group.key) : calcTotal(d.deliverables)), 0)
        return (
          <div key={group.key}>
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="text-base font-semibold text-gray-800">{group.label}</h3>
              <p className="text-sm text-gray-500">{group.deals.length} deal{group.deals.length !== 1 ? 's' : ''}</p>
              <p className="text-sm font-semibold text-gray-700 ml-auto">{formatAmt(pipeline)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3 text-left font-medium">Creator</th>
                    <th className="px-5 py-3 text-left font-medium">Brand</th>
                    <th className="px-5 py-3 text-left font-medium">Deal Name</th>
                    <th className="px-5 py-3 text-left font-medium">Deliverables</th>
                    <th className="px-5 py-3 text-left font-medium">{byMonth ? 'Month Value' : 'Value'}</th>
                    <th className="px-5 py-3 text-left font-medium">Manager</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {group.deals.map(d => {
                    const rowValue   = byMonth ? calcMonthValue(d, group.key) : calcTotal(d.deliverables)
                    const rowSummary = byMonth ? deliverableSummaryForMonth(d.deliverables, group.key) : deliverableSummary(d.deliverables)
                    return (
                      <tr key={`${group.key}-${d.id}`} onClick={() => onSelect(d)} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                        <td className="px-5 py-3">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {creatorPhotoUrl({ id: d.creatorId }) && (
                              <img src={creatorPhotoUrl({ id: d.creatorId })} alt={d.creator}
                                style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            )}
                            <span className="font-medium text-gray-800">{d.creator}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <BrandLogo name={d.brand} size={24} />
                            <span>{d.brand}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600 text-xs">{d.dealName}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{rowSummary}</td>
                        <td className="px-5 py-3 font-semibold text-gray-800">{formatAmt(rowValue)}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{d.manager || '—'}</td>
                        <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-gray-300 group-hover:text-gray-400 transition-colors">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Manager View ─────────────────────────────────────────────────────────────

function ManagerView({ deals, onSelect }) {
  const [expanded, setExpanded] = useState({})

  const mgrMap = {}
  deals.forEach(d => {
    const mgr = d.manager || 'Unassigned'
    if (!mgrMap[mgr]) mgrMap[mgr] = []
    mgrMap[mgr].push(d)
  })

  return (
    <div className="space-y-3">
      {Object.entries(mgrMap).sort((a, b) => a[0].localeCompare(b[0])).map(([name, mgrDeals]) => {
        const pipeline  = mgrDeals.filter(d => d.status !== 'Lost').reduce((s, d) => s + calcTotal(d.deliverables), 0)
        const signed    = mgrDeals.filter(d => d.status === 'Signed').reduce((s, d) => s + calcTotal(d.deliverables), 0)
        const totalComm = mgrDeals.filter(d => d.status !== 'Lost').reduce((s, d) => s + Math.round(calcTotal(d.deliverables) * (d.commissionRate || 0) / 100), 0)
        const isOpen    = expanded[name]
        const initials  = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

        return (
          <div key={name} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors select-none"
              onClick={() => setExpanded(e => ({ ...e, [name]: !e[name] }))}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: '#F0F0F0', color: '#333333' }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{name}</p>
                <p className="text-xs text-gray-400">{mgrDeals.length} deal{mgrDeals.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-800">{formatAmt(pipeline)}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">pipeline</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold" style={{ color: '#1A7A4A' }}>{formatAmt(signed)}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">signed</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-[#111111]">{formatAmt(totalComm)}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">commission</p>
              </div>
              <span className="text-gray-400 shrink-0"><ChevronIcon down={isOpen} /></span>
            </div>
            {isOpen && (() => {
              // Build month sub-groups for this manager
              const monthMap = {}
              mgrDeals.forEach(d => {
                const months = getCampaignMonths(d.deliverables)
                const keys = months.length > 0 ? months : ['No Month']
                keys.forEach(m => {
                  if (!monthMap[m]) monthMap[m] = []
                  monthMap[m].push(d)
                })
              })
              const sortedMonths = Object.keys(monthMap).sort((a, b) => {
                if (a === 'No Month') return -1
                if (b === 'No Month') return 1
                return parseMonthStr(a) - parseMonthStr(b)
              })

              return (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                  {sortedMonths.map(month => {
                    const monthDeals = monthMap[month]
                    const monthTotal = monthDeals
                      .filter(d => d.status !== 'Lost')
                      .reduce((s, d) => s + calcMonthValue(d, month), 0)
                    return (
                      <div key={month}>
                        <div className="flex items-center justify-between px-5 py-2 bg-gray-50/70">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{month}</p>
                          <p className="text-xs font-semibold text-gray-600">{formatAmt(monthTotal)}</p>
                        </div>
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-gray-100">
                            {monthDeals.map(d => {
                              const mv = calcMonthValue(d, month)
                              const ms = deliverableSummaryForMonth(d.deliverables, month)
                              return (
                                <tr key={`${month}-${d.id}`} onClick={() => onSelect(d)} className="hover:bg-gray-50 cursor-pointer group">
                                  <td className="px-5 py-2.5 w-36">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                      {creatorPhotoUrl({ id: d.creatorId }) && (
                                        <img src={creatorPhotoUrl({ id: d.creatorId })} alt={d.creator}
                                          style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                      )}
                                      <span className="font-medium text-gray-800 truncate">{d.creator}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-2.5 text-gray-600 w-32">{d.brand}</td>
                                  <td className="px-5 py-2.5 text-gray-500 text-xs">{d.dealName}</td>
                                  <td className="px-5 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{formatAmt(mv)}</td>
                                  <td className="px-5 py-2.5"><StatusBadge status={d.status} /></td>
                                  <td className="px-5 py-2.5 text-gray-500 text-xs">{ms}</td>
                                  <td className="px-4 py-2.5 text-gray-300 group-hover:text-gray-400 transition-colors">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )
      })}
    </div>
  )
}

// ─── Generate Campaigns Modal ────────────────────────────────────────────────

function GenerateCampaignsModal({ deal, pendingUpdate, onConfirm, onCancel }) {
  const totalCount = (pendingUpdate.deliverables || []).reduce((s, d) => s + (Number(d.quantity) || 1), 0)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 12L5.5 3 8 7.5 10.5 5 14 12H1z" stroke="#059669" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Generate Campaigns</h3>
            <p className="text-xs text-gray-500">from <span className="font-medium text-gray-700">{pendingUpdate.dealName}</span></p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          This will create <span className="font-semibold text-[#111111]">{totalCount} campaign card{totalCount !== 1 ? 's' : ''}</span> — one per deliverable unit:
        </p>
        <div className="space-y-1.5 mb-5 max-h-52 overflow-y-auto">
          {(pendingUpdate.deliverables || []).map((d, i) => {
            const qty = Number(d.quantity) || 1
            return (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <PlatformTag platform={d.platform} />
                  <span className="text-gray-700">{d.contentType}</span>
                  {qty > 1 && <span className="text-gray-400">{qty}× → {qty} cards</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {d.month && <span className="text-gray-400">{d.month}</span>}
                  <span className="font-semibold text-gray-800">{formatAmt(d.rate)}/ea</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onConfirm(deal, pendingUpdate)}
            className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }} x-placeholder="">
            Generate {totalCount} Campaign{totalCount !== 1 ? 's' : ''}
          </button>
          <button onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Searchable Dropdown ──────────────────────────────────────────────────────

function SearchableDropdown({ label, options, selected, onSelect, onAddNew, addNewLabel, placeholder, error, renderTrigger, renderOption }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = options.filter(o => {
    const label = typeof o === 'string' ? o : (o.name || '')
    return label.toLowerCase().includes(search.toLowerCase())
  })

  const triggerStyle = {
    width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${error ? '#EF4444' : '#E5E5E5'}`,
    borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 8, minHeight: 36,
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</label>}
      <div style={triggerStyle} onClick={() => setOpen(o => !o)}>
        <span style={{ flex: 1, overflow: 'hidden' }}>{selected ? renderTrigger(selected) : <span style={{ color: '#BBBBBB' }}>{placeholder}</span>}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: '#AAAAAA', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #E5E5E5', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '8px 8px 4px' }}>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid #EEEEEE', borderRadius: 6, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '10px 12px', fontSize: 12, color: '#BBBBBB', textAlign: 'center' }}>No results</div>
            )}
            {filtered.map((o, i) => (
              <div
                key={o.id ?? i}
                onClick={() => { onSelect(o); setOpen(false); setSearch('') }}
                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F5F5F5' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                {renderOption(o)}
              </div>
            ))}
          </div>
          {onAddNew && (
            <div
              onClick={() => { onAddNew(); setOpen(false); setSearch('') }}
              style={{ padding: '9px 12px', cursor: 'pointer', borderTop: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#111111' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              {addNewLabel}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Quick Add Creator Modal ──────────────────────────────────────────────────

function QuickAddCreatorModal({ onCreated, onClose }) {
  const [form, setForm] = useState({ name: '', handle: '', primaryPlatform: 'Instagram', email: '' })
  const [errors, setErrors] = useState({})

  const handleSubmit = () => {
    if (!form.name.trim()) { setErrors({ name: true }); return }
    onCreated({ id: Date.now(), name: form.name.trim(), handle: form.handle.trim() || `@${form.name.trim().toLowerCase().replace(/\s+/g, '')}`, primaryPlatform: form.primaryPlatform, email: form.email.trim() })
    onClose()
  }

  const inputStyle = err => ({ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${err ? '#EF4444' : '#E5E5E5'}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box' })
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-[400px] p-6" style={{ border: '1px solid #EEEEEE' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Add New Creator</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label style={labelStyle}>Name <span style={{ color: '#EF4444' }}>*</span></label>
            <input style={inputStyle(errors.name)} value={form.name} onChange={e => { setErrors({}); setForm(f => ({ ...f, name: e.target.value })) }} placeholder="e.g. Sofia Chen" />
          </div>
          <div>
            <label style={labelStyle}>Handle</label>
            <input style={inputStyle()} value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))} placeholder="@handle" />
          </div>
          <div>
            <label style={labelStyle}>Primary Platform</label>
            <select style={inputStyle()} value={form.primaryPlatform} onChange={e => setForm(f => ({ ...f, primaryPlatform: e.target.value }))}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" style={inputStyle()} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="creator@email.com" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSubmit} style={{ flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 500, background: '#111', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
              Add Creator
            </button>
            <button onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, background: '#fff', color: '#666', borderRadius: 8, border: '1px solid #E5E5E5', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Quick Add Brand Modal ────────────────────────────────────────────────────

function QuickAddBrandModal({ onCreated, onClose }) {
  const [form, setForm] = useState({ name: '', niche: '', website: '', billing_email: '' })
  const [errors, setErrors] = useState({})

  const NICHES = ['Beauty & Skincare', 'Sports & Fitness', 'Food & Wellness', 'Technology', 'Travel & Lifestyle', 'Fashion', 'Home & Living', 'Finance', 'Entertainment', 'Other']

  const handleSubmit = () => {
    if (!form.name.trim()) { setErrors({ name: true }); return }
    onCreated({ id: Date.now(), name: form.name.trim(), niche: form.niche || 'Other', website: form.website.trim(), billing_email: form.billing_email.trim() })
    onClose()
  }

  const inputStyle = err => ({ width: '100%', padding: '8px 12px', fontSize: 13, border: `1px solid ${err ? '#EF4444' : '#E5E5E5'}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box' })
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-[400px] p-6" style={{ border: '1px solid #EEEEEE' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Add New Brand</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label style={labelStyle}>Brand Name <span style={{ color: '#EF4444' }}>*</span></label>
            <input style={inputStyle(errors.name)} value={form.name} onChange={e => { setErrors({}); setForm(f => ({ ...f, name: e.target.value })) }} placeholder="e.g. Luminary Beauty" />
          </div>
          <div>
            <label style={labelStyle}>Niche</label>
            <select style={inputStyle()} value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}>
              <option value="">Select niche…</option>
              {NICHES.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Website</label>
            <input style={inputStyle()} value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="brandname.com" />
          </div>
          <div>
            <label style={labelStyle}>Billing Email</label>
            <input type="email" style={inputStyle()} value={form.billing_email} onChange={e => setForm(f => ({ ...f, billing_email: e.target.value }))} placeholder="billing@brand.com" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSubmit} style={{ flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 500, background: '#111', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
              Add Brand
            </button>
            <button onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, background: '#fff', color: '#666', borderRadius: 8, border: '1px solid #E5E5E5', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Add Deal Modal ────────────────────────────────────────────────────────────

const emptyDealForm = {
  dealName: '', creator: '', creatorId: null, brand: '', brandId: null,
  contact: '', contactId: null,
  commissionRate: '20', paymentTerms: 'Net 30',
  dealType: 'inbound', status: 'Pitching', signedDate: '',
  isRebook: false, notes: '', manager: '',
}

const defaultDeliverables = [
  { id: 1, platform: 'Instagram', contentType: 'Reel', quantity: 1, rate: '', month: '' },
]

function AddDealModal({ onClose, onAdd, deals }) {
  const [form, setForm]             = useState({ ...emptyDealForm })
  const [deliverables, setDeliv]    = useState(defaultDeliverables)
  const [errors, setErrors]         = useState({})
  const [localCreators, setLocalCreators] = useState([])
  const [localBrands, setLocalBrands]     = useState([])
  const [showAddCreator, setShowAddCreator] = useState(false)
  const [showAddBrand, setShowAddBrand]     = useState(false)

  const allCreators = [...clientsData, ...localCreators]
  const allBrands   = [...brandsData,  ...localBrands]

  const ch = (field, value) => {
    setErrors(p => ({ ...p, [field]: '' }))
    setForm(f => {
      const next = { ...f, [field]: value }
      if (field === 'brandId') { next.contact = ''; next.contactId = null }
      if ((field === 'creator' || field === 'brand') && next.creator && next.brand) {
        next.isRebook = deals.some(d => d.creator === next.creator && d.brand === next.brand)
      }
      return next
    })
  }

  const selectCreator = c => {
    setErrors(p => ({ ...p, creator: '' }))
    setForm(f => {
      const next = { ...f, creator: c.name, creatorId: c.id }
      if (next.brand) next.isRebook = deals.some(d => d.creator === c.name && d.brand === next.brand)
      return next
    })
  }

  const selectBrand = b => {
    setErrors(p => ({ ...p, brand: '' }))
    setForm(f => ({ ...f, brand: b.name, brandId: b.id, contact: '', contactId: null }))
  }

  const selectedCreatorObj = allCreators.find(c => c.id === form.creatorId) || (form.creator ? { name: form.creator } : null)
  const selectedBrandObj   = allBrands.find(b => b.id === form.brandId)   || (form.brand   ? { name: form.brand   } : null)
  const visibleContacts    = form.brandId ? contactsData.filter(c => c.brandId === form.brandId) : contactsData

  const total = calcTotal(deliverables)

  const handleSubmit = () => {
    const errs = {}
    if (!form.dealName?.trim()) errs.dealName = true
    if (!form.creator?.trim()) errs.creator = true
    if (!form.brand?.trim()) errs.brand = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    onAdd({ ...form, deliverables, totalValue: total })
    onClose()
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="relative z-10 ml-auto w-[540px] h-full bg-white border-l border-gray-200 overflow-y-auto shadow-xl flex flex-col">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Add Deal</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 space-y-5 flex-1">
          <EditInput label="Deal Name" field="dealName" form={form} onChange={ch} placeholder="e.g. Spring Glow Collection" error={errors.dealName} />
          <div className="grid grid-cols-2 gap-3">
            <SearchableDropdown
              label="Creator"
              options={allCreators}
              selected={selectedCreatorObj}
              onSelect={selectCreator}
              onAddNew={() => setShowAddCreator(true)}
              addNewLabel="Add new creator"
              placeholder="Select creator…"
              error={errors.creator}
              renderTrigger={c => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {'id' in c && <img src={creatorPhotoUrl(c)} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
                  <span style={{ fontSize: 13, color: '#111', fontWeight: 500 }}>{c.name}</span>
                </div>
              )}
              renderOption={c => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={creatorPhotoUrl(c)} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#AAAAAA' }}>{c.handle}</div>
                  </div>
                </div>
              )}
            />
            <SearchableDropdown
              label="Brand"
              options={allBrands}
              selected={selectedBrandObj}
              onSelect={selectBrand}
              onAddNew={() => setShowAddBrand(true)}
              addNewLabel="Add new brand"
              placeholder="Select brand…"
              error={errors.brand}
              renderTrigger={b => <span style={{ fontSize: 13, color: '#111', fontWeight: 500 }}>{b.name}</span>}
              renderOption={b => (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{b.name}</span>
                  {b.niche && <span style={{ fontSize: 11, padding: '1px 7px', background: '#F5F5F5', color: '#666', borderRadius: 10, flexShrink: 0 }}>{b.niche}</span>}
                </div>
              )}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Contact</label>
            <select
              value={form.contact}
              onChange={e => {
                const c = contactsData.find(ct => ct.name === e.target.value)
                ch('contact', e.target.value)
                if (c) ch('contactId', c.id)
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
            >
              <option value="">{form.brandId && visibleContacts.length === 0 ? 'No contacts for this brand' : 'Select contact…'}</option>
              {visibleContacts.map(c => <option key={c.id} value={c.name}>{c.name} — {c.title}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Deliverables</label>
            <DeliverablesTable rows={deliverables} onChange={setDeliv} />
            {total > 0 && (
              <p className="text-xs text-gray-500 mt-1.5">
                Total value: <span className="font-semibold text-gray-800">{formatAmt(total)}</span>
                {form.commissionRate && <> · Commission: <span className="font-semibold text-[#111111]">{commissionAmt(total, form.commissionRate)}</span></>}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <EditInput label="Commission Rate (%)" field="commissionRate" form={form} onChange={ch} type="number" />
            <EditSelect label="Payment Terms" field="paymentTerms" form={form} onChange={ch} options={PAYMENT_TERMS_OPTS} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Deal Type</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {DEAL_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => ch('dealType', t)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${form.dealType === t ? 'bg-[#111111] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <EditSelect label="Manager" field="manager" form={form} onChange={ch} options={MANAGERS} />
          </div>

          <EditSelect label="Status" field="status" form={form} onChange={ch} options={KANBAN_STATUSES} />
          <EditInput label="Signed Date" field="signedDate" form={form} onChange={ch} type="date" />

          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => ch('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
          </div>
          <div className="py-1 border-y border-gray-100">
            <ToggleField label="Is Rebook" field="isRebook" form={form} onChange={ch} />
            {form.isRebook && form.creator && form.brand && (
              <p className="text-[11px] text-amber-600 mt-1">Auto-detected: {form.creator} has worked with {form.brand} before.</p>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSubmit} className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>
              Add Deal
            </button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </aside>
    </div>
    {showAddCreator && (
      <QuickAddCreatorModal
        onCreated={c => { setLocalCreators(prev => [...prev, c]); selectCreator(c) }}
        onClose={() => setShowAddCreator(false)}
      />
    )}
    {showAddBrand && (
      <QuickAddBrandModal
        onCreated={b => { setLocalBrands(prev => [...prev, b]); selectBrand(b) }}
        onClose={() => setShowAddBrand(false)}
      />
    )}
    </>
  )
}

// ─── Status Step ──────────────────────────────────────────────────────────────

function StatusStep({ status, isCurrent, isPast, onClick }) {
  const [hovered, setHovered] = useState(false)

  let style
  if (isCurrent) {
    style = { ...(STATUS_COLORS[status] || { background: '#F3F3F3', color: '#666666' }), opacity: hovered ? 0.85 : 1 }
  } else if (isPast) {
    style = hovered
      ? { background: '#F0F0F0', color: '#555555' }
      : { color: '#BBBBBB' }
  } else {
    style = hovered
      ? { background: '#F5F5F5', color: '#888888' }
      : { color: '#CCCCCC' }
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`Set status: ${status}`}
      style={{
        ...style,
        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
        border: 'none', cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 3,
      }}
    >
      {isPast && (
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1.5 4.5l2.5 2.5 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {status}
    </button>
  )
}

// ─── Deal Detail ──────────────────────────────────────────────────────────────

function DealDetail({ deal, deals, invoices = [], payouts = [], onClose, onUpdate, onNavigate, successMsg, onDismissSuccess }) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm]           = useState({ ...deal, deliverables: deal.deliverables ? [...deal.deliverables] : [] })
  const [newTask, setNewTask]     = useState('')
  const [taskDraft, setTaskDraft] = useState(null) // null = closed, {...} = expanded form open
  const [tab, setTab]             = useState('details')

  const ch = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = () => {
    onUpdate({ ...form, totalValue: calcTotal(form.deliverables) })
    setIsEditing(false)
  }
  const handleCancel = () => {
    setForm({ ...deal, deliverables: deal.deliverables ? [...deal.deliverables] : [] })
    setIsEditing(false)
  }

  const handleStatusChange = newStatus => {
    const log = [...deal.activityLog, { action: `Status → ${newStatus}`, timestamp: nowStamp() }]
    onUpdate({ ...deal, status: newStatus, activityLog: log })
  }

  const handleOpenTaskForm = () => {
    if (!newTask.trim()) return
    setTaskDraft({ title: newTask.trim(), dueDate: '', priority: 'Medium', assignedTo: '', notes: '', showNotes: false })
  }

  const handleSaveTask = () => {
    if (!taskDraft?.title?.trim()) return
    const t = {
      id: Date.now(),
      text: taskDraft.title.trim(),
      done: false,
      dueDate: taskDraft.dueDate || '',
      priority: taskDraft.priority || 'Medium',
      assignedTo: taskDraft.assignedTo || '',
      notes: taskDraft.notes || '',
    }
    onUpdate({ ...deal, tasks: [...deal.tasks, t] })
    setTaskDraft(null)
    setNewTask('')
  }

  const handleTaskToggle = taskId => {
    onUpdate({ ...deal, tasks: deal.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) })
  }

  const isRebook = deal.isRebook || deals.some(d => d.id !== deal.id && d.creator === deal.creator && d.brand === deal.brand)
  const total    = calcTotal(deal.deliverables)
  const months   = getCampaignMonths(deal.deliverables)

  // Invoices and payouts linked to this deal, grouped by month
  const dealInvoices = invoices.filter(inv => inv.dealId === deal.id)
  const dealPayouts  = payouts.filter(p => p.dealId === deal.id)
  const billingMonths = [...new Set([
    ...dealInvoices.map(inv => inv.month),
    ...dealPayouts.map(p => p.month),
  ].filter(Boolean))].sort((a, b) => parseMonthStr(a) - parseMonthStr(b))

  // Status colors for invoices/payouts (inline since we're in this component)
  const invStatusCls = { Paid: { background: '#EDFAF3', color: '#1A7A4A' }, Outstanding: { background: '#EEF4FF', color: '#2D5BE3' }, Overdue: { background: '#FEE2E2', color: '#DC2626' }, Draft: { background: '#F3F3F3', color: '#666666' } }
  const payStatusCls = { Paid: { background: '#EDFAF3', color: '#1A7A4A' }, Scheduled: { background: '#EEF4FF', color: '#2D5BE3' }, Pending: { background: '#FFF4EC', color: '#C4622D' } }

  const tabs = [
    { key: 'details',  label: 'Details' },
    { key: 'tasks',    label: `Tasks (${deal.tasks.length})` },
    { key: 'activity', label: 'Activity' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 ml-auto w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <StatusBadge status={deal.status} />
              <RebookBadge isRebook={isRebook} />
              <TypeBadge type={deal.dealType} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              {creatorPhotoUrl({ id: deal.creatorId }) && (
                <img src={creatorPhotoUrl({ id: deal.creatorId })} alt={deal.creator}
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              )}
              <h2 className="text-base font-semibold text-gray-900" style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                {deal.creator} ×
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <BrandLogo name={deal.brand} size={20} />
                  {deal.brand}
                </span>
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{deal.dealName}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isEditing && (
              <button
                onClick={() => { setForm({ ...deal, deliverables: deal.deliverables ? [...deal.deliverables] : [] }); setIsEditing(true) }}
                className="text-xs font-medium text-[#111111] hover:text-[#111111] px-2.5 py-1 rounded-md hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Status stepper */}
        <div className="flex items-center gap-0.5 px-5 py-2 border-b border-gray-100 bg-gray-50/30 shrink-0 overflow-x-auto">
          {KANBAN_STATUSES.map((s, i) => {
            const currentIdx = KANBAN_STATUSES.indexOf(deal.status)
            const isCurrent  = deal.status === s
            const isPast     = currentIdx > i && deal.status !== 'Lost'
            return (
              <div key={s} className="flex items-center gap-0.5 shrink-0">
                {i > 0 && (
                  <div style={{ width: 12, height: 1, background: isPast ? '#DDDDDD' : '#EEEEEE', flexShrink: 0 }} />
                )}
                <StatusStep
                  status={s}
                  isCurrent={isCurrent}
                  isPast={isPast}
                  onClick={() => handleStatusChange(s)}
                />
              </div>
            )
          })}
        </div>

        {/* Success banner */}
        {successMsg && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl flex items-center justify-between shrink-0" style={{ background: '#EDFAF3', border: '1px solid #BBF7D0' }}>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#1A7A4A" strokeWidth="1.3" />
                <path d="M4.5 7l2 2 3-3" stroke="#1A7A4A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-medium" style={{ color: '#1A7A4A' }}>{successMsg.count} campaign{successMsg.count !== 1 ? 's' : ''} created.</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onNavigate('/campaigns')}
                className="text-xs font-semibold hover:underline" style={{ color: '#1A7A4A' }}>
                View Campaigns →
              </button>
              <button onClick={onDismissSuccess} style={{ color: '#6EBF96' }}>
                <CloseIcon />
              </button>
            </div>
          </div>
        )}

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
                  <EditInput label="Deal Name" field="dealName" form={form} onChange={ch} />
                  <div className="grid grid-cols-2 gap-3">
                    <EditInput label="Creator" field="creator" form={form} onChange={ch} />
                    <EditInput label="Brand" field="brand" form={form} onChange={ch} />
                  </div>
                  <EditInput label="Contact" field="contact" form={form} onChange={ch} />
                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Deliverables</label>
                    <DeliverablesTable rows={form.deliverables || []} onChange={v => ch('deliverables', v)} />
                    <p className="text-xs text-gray-500 mt-1.5">Total: <span className="font-semibold text-gray-800">{formatAmt(calcTotal(form.deliverables))}</span></p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <EditInput label="Commission (%)" field="commissionRate" form={form} onChange={ch} type="number" />
                    <EditSelect label="Payment Terms" field="paymentTerms" form={form} onChange={ch} options={PAYMENT_TERMS_OPTS} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Deal Type</label>
                      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                        {DEAL_TYPES.map(t => (
                          <button key={t} type="button" onClick={() => ch('dealType', t)}
                            className={`flex-1 py-2 text-sm font-medium transition-colors ${form.dealType === t ? 'bg-[#111111] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <EditSelect label="Manager" field="manager" form={form} onChange={ch} options={MANAGERS} />
                  </div>
                  <EditSelect label="Status" field="status" form={form} onChange={ch} options={KANBAN_STATUSES} />
                  <EditInput label="Signed Date" field="signedDate" form={form} onChange={ch} type="date" />
                  <div className="py-1 border-y border-gray-100">
                    <ToggleField label="Is Rebook" field="isRebook" form={form} onChange={ch} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</label>
                    <textarea value={form.notes} onChange={e => ch('notes', e.target.value)} rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={handleSave} className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }} x-placeholder="">Save changes</button>
                    <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Key metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['Total Value', formatAmt(total),                          'text-lg font-bold text-gray-900'],
                      ['Commission',  commissionAmt(total, deal.commissionRate),  'text-sm font-semibold text-gray-700'],
                      ['Signed',      fmtShort(deal.signedDate) || '—',           'text-sm font-semibold text-gray-700'],
                    ].map(([label, val, cls]) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                        <p className={cls}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <LinkField label="Creator" value={deal.creator} onClick={() => onNavigate(`/roster?open=${deal.creatorId}`)} />
                    <LinkField label="Brand"   value={deal.brand}   onClick={() => onNavigate(`/contacts?tab=brands&open=${deal.brandId}`)} />
                    <LinkField label="Contact" value={deal.contact} onClick={() => onNavigate(`/contacts?open=${deal.contactId}`)} />
                    <Field label="Payment Terms" value={deal.paymentTerms} />
                    <Field label="Commission Rate" value={`${deal.commissionRate}%`} />
                    <Field label="Deal Type" value={deal.dealType ? deal.dealType.charAt(0).toUpperCase() + deal.dealType.slice(1) : ''} />
                    <Field label="Manager" value={deal.manager} />
                    {months.length > 0 && (
                      <div>
                        <FieldLabel>Campaign Months</FieldLabel>
                        <p className="text-sm text-gray-800">{months.join(', ')}</p>
                      </div>
                    )}
                  </div>

                  {/* Deliverables */}
                  <div>
                    <FieldLabel>Deliverables</FieldLabel>
                    <div className="mt-1.5">
                      <DeliverablesTable rows={deal.deliverables || []} />
                    </div>
                  </div>

                  {deal.notes && <Field label="Notes" value={deal.notes} />}

                  {/* Generated Contract */}
                  {deal.contractId && (
                    <div>
                      <FieldLabel>Contract</FieldLabel>
                      <div
                        onClick={() => onNavigate(`/contracts?open=${deal.contractId}`)}
                        className="flex items-center justify-between px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                            <path d="M2 1h10v12H2V1zm2 3h6M4 7h6M4 10h3" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round" />
                          </svg>
                          <span className="text-xs font-medium text-blue-700">
                            {deal.dealName ? `${deal.creator} × ${deal.brand}` : `Contract #${deal.contractId}`}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-600">Draft</span>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-blue-300 group-hover:text-blue-500 transition-colors">
                          <path d="M4.5 2.5l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Generated Campaigns */}
                  {(deal.generatedCampaigns || []).length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <FieldLabel>Generated Campaigns</FieldLabel>
                        <button onClick={() => onNavigate('/campaigns')}
                          className="text-[11px] text-[#111111] hover:text-[#111111] font-medium hover:underline">
                          View all →
                        </button>
                      </div>
                      <div className="space-y-1">
                        {(deal.generatedCampaigns || []).map(c => (
                          <div key={c.id}
                            onClick={() => onNavigate(`/campaigns?open=${c.id}`)}
                            className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-2 min-w-0">
                              <PlatformTag platform={c.platform} />
                              <span className="text-xs text-gray-700">{c.contentType}</span>
                              {c.month && <span className="text-xs text-gray-400">{c.month}</span>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-semibold text-gray-800">{formatAmt(c.amount)}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">{c.status}</span>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-300 group-hover:text-gray-400 transition-colors">
                                <path d="M4.5 2.5l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Billing by month */}
                  {billingMonths.length > 0 && (
                    <div>
                      <FieldLabel>Billing by Month</FieldLabel>
                      <div className="space-y-3 mt-1.5">
                        {billingMonths.map(month => {
                          const monthInvoices = dealInvoices.filter(inv => inv.month === month)
                          const monthPayouts  = dealPayouts.filter(p => p.month === month)
                          return (
                            <div key={month} className="border border-gray-200 rounded-xl overflow-hidden">
                              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                                <span className="text-xs font-semibold text-gray-600">{month}</span>
                              </div>
                              <div className="divide-y divide-gray-100">
                                {monthInvoices.map(inv => (
                                  <div
                                    key={inv.id}
                                    onClick={() => onNavigate(`/invoices?open=${inv.id}`)}
                                    className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400">
                                        <path d="M2 1h8v10H2V1zm2 2h4M4 5h4M4 7.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                      </svg>
                                      <span className="text-xs font-mono text-gray-600">{inv.invoiceId}</span>
                                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={invStatusCls[inv.status] || { background: '#F3F3F3', color: '#666666' }}>
                                        {inv.status}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-gray-800">{fmtInvoiceAmt(inv.amount)}</span>
                                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-300 group-hover:text-gray-400">
                                        <path d="M3.5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </div>
                                  </div>
                                ))}
                                {monthPayouts.map(p => (
                                  <div
                                    key={p.id}
                                    onClick={() => onNavigate(`/payouts?open=${p.id}`)}
                                    className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-emerald-400">
                                        <path d="M6 1v10M3 4.5l3-3 3 3M3 8l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                      <span className="text-xs text-gray-600">Payout — {p.creator}</span>
                                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={payStatusCls[p.status] || { background: '#F3F3F3', color: '#666666' }}>
                                        {p.status}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold" style={{ color: '#1A7A4A' }}>{fmtInvoiceAmt(p.net)}</span>
                                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-300 group-hover:text-gray-400">
                                        <path d="M3.5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Linked records */}
                  {(deal.contractId || deal.invoiceIds?.length > 0 || deal.campaigns?.length > 0) && (
                    <div className="space-y-2">
                      <FieldLabel>Linked Records</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {deal.campaigns?.map(cId => (
                          <button key={cId} onClick={() => onNavigate(`/campaigns?open=${cId}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors" style={{ background: '#F3F3F3', color: '#666666' }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 9.5L5 2l2.5 4L9 4l2 5.5H1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                            Campaign #{cId}
                          </button>
                        ))}
                        {deal.contractId && (
                          <button onClick={() => onNavigate(`/contracts?open=${deal.contractId}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 1h8v10H2V1zm2 2h4M4 5.5h4M4 8h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                            Contract #{deal.contractId}
                          </button>
                        )}
                        {deal.invoiceIds?.map(iId => (
                          <button key={iId} onClick={() => onNavigate(`/invoices?open=${iId}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors" style={{ background: '#EEF4FF', color: '#2D5BE3' }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 1h8v10H2V1zm2 2h4M4 5h4M4 7.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                            Invoice #{iId}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Tasks ── */}
          {tab === 'tasks' && (
            <div className="p-6">
              {/* Add task input row */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleOpenTaskForm()}
                  placeholder="Add a task…"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                  disabled={!!taskDraft}
                />
                <button
                  onClick={handleOpenTaskForm}
                  disabled={!!taskDraft}
                  className="px-3 py-2 bg-[#111111] text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-40"
                >
                  <PlusIcon />
                </button>
              </div>

              {/* Expanded task form */}
              {taskDraft && (
                <div style={{ background: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  {/* Title */}
                  <div className="mb-3">
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Task Title</label>
                    <input
                      autoFocus
                      type="text"
                      value={taskDraft.title}
                      onChange={e => setTaskDraft(d => ({ ...d, title: e.target.value }))}
                      style={{ width: '100%', padding: '7px 11px', fontSize: 13, border: '1px solid #E5E5E5', borderRadius: 8, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Due Date + Priority row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Due Date</label>
                      <input
                        type="date"
                        value={taskDraft.dueDate}
                        onChange={e => setTaskDraft(d => ({ ...d, dueDate: e.target.value }))}
                        style={{ width: '100%', padding: '7px 11px', fontSize: 13, border: '1px solid #E5E5E5', borderRadius: 8, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Priority</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['High', 'Medium', 'Low'].map(p => {
                          const active = taskDraft.priority === p
                          const dotColor = TASK_PRIORITY_COLORS[p]
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setTaskDraft(d => ({ ...d, priority: p }))}
                              style={{
                                flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 600, borderRadius: 20, cursor: 'pointer', border: 'none',
                                background: active ? dotColor : '#EEEEEE',
                                color: active ? '#fff' : '#888888',
                                transition: 'all 0.12s',
                              }}
                            >
                              {p}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div className="mb-3">
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Assigned To</label>
                    <select
                      value={taskDraft.assignedTo}
                      onChange={e => setTaskDraft(d => ({ ...d, assignedTo: e.target.value }))}
                      style={{ width: '100%', padding: '7px 11px', fontSize: 13, border: '1px solid #E5E5E5', borderRadius: 8, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                    >
                      <option value="">Unassigned</option>
                      {MANAGERS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Notes (collapsible) */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setTaskDraft(d => ({ ...d, showNotes: !d.showNotes }))}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: '#AAAAAA', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: taskDraft.showNotes ? 6 : 0 }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: taskDraft.showNotes ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                        <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Notes (optional)
                    </button>
                    {taskDraft.showNotes && (
                      <textarea
                        value={taskDraft.notes}
                        onChange={e => setTaskDraft(d => ({ ...d, notes: e.target.value }))}
                        placeholder="Add notes…"
                        rows={2}
                        style={{ width: '100%', padding: '7px 11px', fontSize: 13, border: '1px solid #E5E5E5', borderRadius: 8, outline: 'none', background: '#fff', resize: 'none', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleSaveTask}
                      style={{ flex: 1, padding: '7px 0', fontSize: 13, fontWeight: 500, background: '#111', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                    >
                      Save Task
                    </button>
                    <button
                      onClick={() => { setTaskDraft(null); setNewTask('') }}
                      style={{ padding: '7px 16px', fontSize: 13, fontWeight: 500, background: '#fff', color: '#666', borderRadius: 8, border: '1px solid #E5E5E5', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Task list */}
              {deal.tasks.length === 0 && !taskDraft ? (
                <p className="text-sm text-gray-400 text-center py-10">No tasks yet. Add one above.</p>
              ) : (
                <div className="space-y-2">
                  {deal.tasks.map(task => {
                    const priorityColor = TASK_PRIORITY_COLORS[task.priority] || '#CCCCCC'
                    const hasMeta = task.dueDate || task.priority || task.assignedTo
                    return (
                      <div
                        key={task.id}
                        style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 10, padding: '10px 14px', opacity: task.done ? 0.6 : 1, transition: 'opacity 0.15s' }}
                      >
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => handleTaskToggle(task.id)}
                            style={{ marginTop: 2, width: 15, height: 15, accentColor: '#111', flexShrink: 0, cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 13, color: task.done ? '#AAAAAA' : '#111111', textDecoration: task.done ? 'line-through' : 'none', display: 'block', lineHeight: '1.4' }}>
                              {task.text}
                            </span>
                            {hasMeta && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                                {task.priority && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#888' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColor, display: 'inline-block', flexShrink: 0 }} />
                                    {task.priority}
                                  </span>
                                )}
                                {task.dueDate && (
                                  <span style={{ fontSize: 11, color: (() => { const [y,m,d] = task.dueDate.split('-').map(Number); const diff = Math.round((new Date(y,m-1,d) - new Date().setHours(0,0,0,0)) / 86400000); return !task.done && diff < 0 ? '#EF4444' : '#888888' })() }}>
                                    {fmtDueDate(task.dueDate)}
                                  </span>
                                )}
                                {task.assignedTo && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: '#F0F0F0', fontSize: 10, fontWeight: 700, color: '#555', flexShrink: 0 }} title={task.assignedTo}>
                                    {taskAssigneeInitials(task.assignedTo)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Activity ── */}
          {tab === 'activity' && (
            <div className="p-6">
              {deal.activityLog.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No activity yet.</p>
              ) : (
                <div className="space-y-4">
                  {[...deal.activityLog].reverse().map((log, i) => (
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

// ─── Main Page ────────────────────────────────────────────────────────────────

const defaultFilters = { search: '', creator: '', brand: '', status: '', dealType: '', platform: '' }

export default function Deals() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setCampaigns } = useCampaigns()
  const { setContracts } = useContracts()
  const { invoices } = useInvoices()
  const { payouts } = usePayouts()
  const [deals,      setDeals]      = useState(dealsData)
  const [view,       setView]       = useState('table')
  const [filters,    setFilters]    = useState(defaultFilters)
  const [sort,       setSort]       = useState('totalValue-desc')
  const [groupBy,    setGroupBy]    = useState('none')
  const [selectedId,    setSelectedId]    = useState(null)

  // Open deal from URL param ?open=ID (e.g. from dashboard navigation)
  useEffect(() => {
    const openId = searchParams.get('open')
    if (openId) {
      setSelectedId(Number(openId))
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])
  const [showAdd,       setShowAdd]       = useState(false)
  const [generateModal, setGenerateModal] = useState(null) // { deal, pendingUpdate }
  const [successMsg,    setSuccessMsg]    = useState(null) // { dealId, count }

  const selected = deals.find(d => d.id === selectedId) ?? null

  const filtered = deals.filter(d => {
    const q = filters.search.toLowerCase()
    if (q && !`${d.creator} ${d.brand} ${d.dealName} ${d.contact}`.toLowerCase().includes(q)) return false
    if (filters.creator  && d.creator  !== filters.creator)  return false
    if (filters.brand    && d.brand    !== filters.brand)    return false
    if (filters.status   && d.status   !== filters.status)   return false
    if (filters.dealType && d.dealType !== filters.dealType) return false
    if (filters.platform && !(d.deliverables || []).some(del => del.platform === filters.platform)) return false
    return true
  })

  const [sf, sd] = sort.split('-')
  const sorted = [...filtered].sort((a, b) => {
    let aV, bV
    if (sf === 'totalValue') { aV = calcTotal(a.deliverables); bV = calcTotal(b.deliverables) }
    else if (sf === 'commissionRate') { aV = Number(a[sf]) || 0; bV = Number(b[sf]) || 0 }
    else { aV = a[sf] ?? ''; bV = b[sf] ?? '' }
    const cmp = aV < bV ? -1 : aV > bV ? 1 : 0
    return sd === 'asc' ? cmp : -cmp
  })

  const handleUpdate = updated => {
    const prev = deals.find(d => d.id === updated.id)
    if (updated.status === 'Signed' && prev?.status !== 'Signed' && (updated.deliverables || []).length > 0) {
      setGenerateModal({ deal: prev, pendingUpdate: updated })
    } else {
      setDeals(ds => ds.map(d => d.id === updated.id ? updated : d))
    }
  }

  const handleAdd = newDeal => {
    setDeals(prev => [...prev, {
      ...newDeal,
      id: Date.now(),
      tasks: [],
      activityLog: [{ action: 'Deal created', timestamp: nowStamp() }],
      campaigns: [], contractId: null, invoiceIds: [],
    }])
  }

  const handleStatusChange = (id, newStatus) => {
    const deal = deals.find(d => d.id === id)
    if (!deal) return
    const log = [...deal.activityLog, { action: `Status → ${newStatus}`, timestamp: nowStamp() }]
    const updated = { ...deal, status: newStatus, activityLog: log }
    if (newStatus === 'Signed' && deal.status !== 'Signed' && (deal.deliverables || []).length > 0) {
      setGenerateModal({ deal, pendingUpdate: updated })
    } else {
      setDeals(ds => ds.map(d => d.id === id ? updated : d))
    }
  }

  const handleGenerate = (prevDeal, pendingUpdate) => {
    const baseId = Date.now()
    let idx = 0
    const newCampaigns = []
    pendingUpdate.deliverables.forEach(del => {
      for (let i = 0; i < (Number(del.quantity) || 1); i++) {
        newCampaigns.push({
          id: baseId + idx++,
          dealId: pendingUpdate.id,
          dealName: pendingUpdate.dealName,
          isRebook: pendingUpdate.isRebook ?? false,
          creator: pendingUpdate.creator, creatorId: pendingUpdate.creatorId,
          brand: pendingUpdate.brand, brandId: pendingUpdate.brandId,
          platform: del.platform, contentType: del.contentType,
          amount: Number(del.rate) || 0,
          month: del.month || '',
          status: 'Planned',
          manager: pendingUpdate.manager || '',
          paymentTerms: pendingUpdate.paymentTerms || '',
          commissionRate: Number(pendingUpdate.commissionRate) || 0,
          approvalRequired: false, approvalWaived: false,
          previewDueDate: '', liveDate: '', followUpDate: '', paymentDueDate: '',
          briefUrl: '', contentUrl: '', notes: '',
          checklist: { ...blankCampaignChecklist },
          stats: { ...blankCampaignStats },
          tasks: [],
          activityLog: [{ action: 'Campaign created from deal', timestamp: nowStamp() }],
          invoiceId: null, payoutId: null,
        })
      }
    })
    // Save to shared campaigns store so Campaigns page sees them immediately
    setCampaigns(prev => [...prev, ...newCampaigns])

    // Auto-generate one Contract record for this deal
    const contractId = baseId + 9000
    const totalValue = calcTotal(pendingUpdate.deliverables || [])
    const newContract = {
      id: contractId,
      title: `${pendingUpdate.creator} × ${pendingUpdate.brand}`,
      creator: pendingUpdate.creator, creatorId: pendingUpdate.creatorId,
      brand: pendingUpdate.brand, brandId: pendingUpdate.brandId,
      dealId: pendingUpdate.id, dealName: pendingUpdate.dealName,
      manager: pendingUpdate.manager || '',
      signedDate: pendingUpdate.signedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      expires: '',
      paymentTerms: pendingUpdate.paymentTerms || '',
      commissionRate: String(pendingUpdate.commissionRate || ''),
      deliverables: pendingUpdate.deliverables || [],
      totalValue,
      status: 'Draft',
      notes: '',
      createdAt: nowStamp(),
    }
    setContracts(prev => [...prev, newContract])

    const final = {
      ...pendingUpdate,
      contractId,
      generatedCampaigns: [...(pendingUpdate.generatedCampaigns || []), ...newCampaigns],
    }
    setDeals(ds => ds.map(d => d.id === final.id ? final : d))
    setSelectedId(final.id)
    setGenerateModal(null)
    setSuccessMsg({ dealId: final.id, count: newCampaigns.length })
    setTimeout(() => setSuccessMsg(null), 8000)
  }

  const handleNavigate = path => { setSelectedId(null); navigate(path) }

  const totalPipeline = sorted.filter(d => d.status !== 'Lost').reduce((s, d) => s + calcTotal(d.deliverables), 0)
  const totalSigned   = sorted.filter(d => d.status === 'Signed').reduce((s, d) => s + calcTotal(d.deliverables), 0)

  const views = [
    { key: 'table',    label: 'Table',
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M1 7h12M1 11h12M4.5 1v12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg> },
    { key: 'kanban',   label: 'Kanban',
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="3" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="5.5" y="1" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="10" y="1" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" /></svg> },
    { key: 'monthly',  label: 'Monthly',
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M1 7h8M1 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg> },
    { key: 'manager',  label: 'By Manager',
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M1.5 12.5c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg> },
  ]

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Deals"
        subtitle={`${sorted.length} deal${sorted.length !== 1 ? 's' : ''} · ${formatAmt(totalPipeline)} pipeline · ${formatAmt(totalSigned)} signed`}
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}
          >
            <PlusIcon />
            Add Deal
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
      <FilterBar
        filters={filters} setFilters={setFilters}
        sort={sort} setSort={setSort}
        groupBy={groupBy} setGroupBy={setGroupBy}
        deals={deals}
      />

      {/* Views */}
      {view === 'table'   && <TableView   deals={sorted} groupBy={groupBy} onSelect={d => setSelectedId(d.id)} />}
      {view === 'kanban'  && <KanbanView  deals={sorted} groupBy={groupBy} onSelect={d => setSelectedId(d.id)} onStatusChange={handleStatusChange} />}
      {view === 'monthly' && <MonthlyView deals={sorted} groupBy={groupBy} onSelect={d => setSelectedId(d.id)} />}
      {view === 'manager' && <ManagerView deals={sorted} onSelect={d => setSelectedId(d.id)} />}

      {/* Deal detail */}
      {selected && (
        <DealDetail
          deal={selected}
          deals={deals}
          invoices={invoices}
          payouts={payouts}
          onClose={() => setSelectedId(null)}
          onUpdate={d => { handleUpdate(d); setSelectedId(d.id) }}
          onNavigate={handleNavigate}
          successMsg={successMsg?.dealId === selected.id ? successMsg : null}
          onDismissSuccess={() => setSuccessMsg(null)}
        />
      )}
      {generateModal && (
        <GenerateCampaignsModal
          deal={generateModal.deal}
          pendingUpdate={generateModal.pendingUpdate}
          onConfirm={handleGenerate}
          onCancel={() => setGenerateModal(null)}
        />
      )}

      {/* Add deal modal */}
      {showAdd && (
        <AddDealModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
          deals={deals}
        />
      )}
    </div>
  )
}
