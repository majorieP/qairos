import { useState, useMemo } from 'react'
import PageHeader from '../components/PageHeader'

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES          = ['Senior Manager', 'Manager', 'Junior Manager', 'Admin', 'Intern']
const CONTRACT_TYPES = ['Full-time', 'Part-time', 'Freelance', 'Intern']
const PTO_TYPES      = ['Vacation', 'Sick', 'Personal', 'Public Holiday']
const PTO_STATUSES   = ['Pending', 'Approved', 'Rejected']
const ACCESS_LEVELS  = ['Owner', 'Admin', 'Member']

// ─── Seed data ────────────────────────────────────────────────────────────────
const initialMembers = [
  {
    id: 1, name: 'Marjorie A.', fullName: 'Marjorie Adeyemi',
    role: 'Senior Manager', contractType: 'Full-time',
    email: 'marjorie@qairos.co', phone: '+1 (424) 555-0100',
    startDate: '2021-06-01', status: 'Owner', avatarIdx: 0,
    commissionSplit: 70,
    ytdCommission: 28400, commissionThisMonth: 1260,
    assignedClients: [
      { id: 1, name: 'Sofia Chen' },
      { id: 5, name: 'Lily Nakamura' },
      { id: 4, name: 'James Ortiz' },
    ],
    activeDealsData: [
      { id: 1, dealName: 'Spring Glow Collection',        creator: 'Sofia Chen',    brand: 'Luminary Beauty',  value: 9500,  status: 'Negotiating' },
      { id: 4, dealName: 'Q2 Tech Review Series',         creator: 'James Ortiz',   brand: 'TechFlow',         value: 18000, status: 'Signed'      },
      { id: 5, dealName: 'Golden Horizons Travel Series', creator: 'Lily Nakamura', brand: 'Solstice Travel',  value: 22000, status: 'Negotiating' },
    ],
    activeCampaignsData: [
      { id: 1, name: 'Sofia × Luminary Spring', creator: 'Sofia Chen',    brand: 'Luminary Beauty', status: 'In Production' },
      { id: 4, name: 'James × TechFlow Q2',     creator: 'James Ortiz',   brand: 'TechFlow',        status: 'Approved'      },
      { id: 5, name: 'Lily × Solstice Travel',  creator: 'Lily Nakamura', brand: 'Solstice Travel', status: 'Live'          },
    ],
    dealsClosed: 12, pipelineValue: 87500, campaignsCompleted: 18, avgDealSize: 11800,
    ptoAllowed: 20,
    ptoEntries: [
      { id: 1, startDate: '2026-01-06', endDate: '2026-01-10', type: 'Vacation',  status: 'Approved', notes: 'New Year trip',  days: 5 },
      { id: 2, startDate: '2026-02-17', endDate: '2026-02-17', type: 'Personal',  status: 'Approved', notes: '',              days: 1 },
    ],
    documents: [
      { id: 1, name: 'Employment Contract', type: 'Contract', uploadDate: 'Jun 1, 2021' },
      { id: 2, name: 'NDA Agreement',       type: 'NDA',      uploadDate: 'Jun 1, 2021' },
    ],
    notes: 'Agency founder and lead talent manager. Specialises in beauty and lifestyle verticals.',
  },
  {
    id: 2, name: 'Devon Park', fullName: 'Devon Park',
    role: 'Manager', contractType: 'Full-time',
    email: 'devon@qairos.co', phone: '+1 (424) 555-0101',
    startDate: '2022-03-14', status: 'Admin', avatarIdx: 1,
    commissionSplit: 55,
    ytdCommission: 14200, commissionThisMonth: 680,
    assignedClients: [
      { id: 2, name: 'Marcus Reid' },
    ],
    activeDealsData: [
      { id: 2, dealName: 'Run Season Ambassador',         creator: 'Marcus Reid', brand: 'Peak Athletics', value: 8500,  status: 'Signed'  },
      { id: 7, dealName: 'NutriBrand Protein Partnership',creator: 'Marcus Reid', brand: 'NutriBrand',      value: 12000, status: 'Signed'  },
    ],
    activeCampaignsData: [
      { id: 2, name: 'Marcus × Peak Run Season', creator: 'Marcus Reid', brand: 'Peak Athletics', status: 'Brief Sent' },
      { id: 7, name: 'Marcus × Peak Video 2',    creator: 'Marcus Reid', brand: 'Peak Athletics', status: 'Campaign Planning' },
    ],
    dealsClosed: 8, pipelineValue: 52000, campaignsCompleted: 11, avgDealSize: 9200,
    ptoAllowed: 15,
    ptoEntries: [
      { id: 1, startDate: '2026-03-18', endDate: '2026-03-19', type: 'Sick',    status: 'Approved', notes: '', days: 2 },
    ],
    documents: [
      { id: 1, name: 'Employment Contract', type: 'Contract', uploadDate: 'Mar 14, 2022' },
    ],
    notes: 'Brand partnerships specialist. Focuses on athletic and tech verticals.',
  },
  {
    id: 3, name: 'Sienna Moore', fullName: 'Sienna Moore',
    role: 'Junior Manager', contractType: 'Full-time',
    email: 'sienna@qairos.co', phone: '+1 (424) 555-0102',
    startDate: '2023-09-04', status: 'Member', avatarIdx: 2,
    commissionSplit: 40,
    ytdCommission: 7600, commissionThisMonth: 420,
    assignedClients: [
      { id: 3, name: 'Anika Patel'   },
      { id: 5, name: 'Lily Nakamura' },
    ],
    activeDealsData: [
      { id: 3, dealName: 'Plant-Forward Recipe Series', creator: 'Anika Patel', brand: 'Verdant Foods', value: 5200, status: 'Pitching' },
    ],
    activeCampaignsData: [
      { id: 3, name: 'Anika × Verdant Foods',       creator: 'Anika Patel',  brand: 'Verdant Foods',  status: 'Planned'  },
      { id: 5, name: 'Lily × Solstice (co-manage)', creator: 'Lily Nakamura',brand: 'Solstice Travel', status: 'Live'     },
    ],
    dealsClosed: 5, pipelineValue: 28000, campaignsCompleted: 7, avgDealSize: 6800,
    ptoAllowed: 15,
    ptoEntries: [
      { id: 1, startDate: '2026-03-24', endDate: '2026-03-28', type: 'Vacation', status: 'Pending', notes: 'Spring break', days: 5 },
    ],
    documents: [],
    notes: 'Campaign coordinator. Strong in social media strategy and creator briefing.',
  },
  {
    id: 4, name: 'Rafi Okafor', fullName: 'Rafi Okafor',
    role: 'Admin', contractType: 'Part-time',
    email: 'rafi@qairos.co', phone: '+1 (424) 555-0103',
    startDate: '2023-01-09', status: 'Member', avatarIdx: 3,
    commissionSplit: 0,
    ytdCommission: 0, commissionThisMonth: 0,
    assignedClients: [],
    activeDealsData: [],
    activeCampaignsData: [],
    dealsClosed: 0, pipelineValue: 0, campaignsCompleted: 0, avgDealSize: 0,
    ptoAllowed: 10,
    ptoEntries: [],
    documents: [
      { id: 1, name: 'Part-time Agreement', type: 'Contract', uploadDate: 'Jan 9, 2023' },
    ],
    notes: 'Finance and contracts admin. Handles invoicing, payouts, and contract management.',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtShortDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function calDays(start, end) {
  if (!start || !end) return 1
  const s = new Date(start), e = new Date(end)
  return Math.max(1, Math.round((e - s) / 86400000) + 1)
}
function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function ptoDaysThisWeek(member, weekStart, weekEnd) {
  return member.ptoEntries.some(e => e.status === 'Approved' && e.endDate >= weekStart && e.startDate <= weekEnd)
}

// ─── Style constants ──────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#F0F0F0', text: '#333333' },
  { bg: '#EEF4FF', text: '#2D5BE3' },
  { bg: '#EDFAF3', text: '#1A7A4A' },
  { bg: '#FFF4EC', text: '#C4622D' },
]
const STATUS_PILL = {
  Owner:  { bg: '#F3F3F3', text: '#444444' },
  Admin:  { bg: '#EEF4FF', text: '#2D5BE3' },
  Member: { bg: '#F3F3F3', text: '#666666' },
}
const PTO_STATUS_PILL = {
  Approved: { bg: '#EDFAF3', text: '#1A7A4A' },
  Pending:  { bg: '#FFF4EC', text: '#C4622D' },
  Rejected: { bg: '#FEE2E2', text: '#DC2626' },
}
const PTO_TYPE_COLOR = {
  Vacation:         { bg: '#EEF4FF', text: '#2D5BE3' },
  Sick:             { bg: '#FEE2E2', text: '#DC2626' },
  Personal:         { bg: '#F3F3F3', text: '#666666' },
  'Public Holiday': { bg: '#EDFAF3', text: '#1A7A4A' },
}
const DEAL_STATUS_PILL = {
  'New Inquiry': { bg: '#F3F3F3',  text: '#666666' },
  Pitching:      { bg: '#F3F3F3',  text: '#666666' },
  Negotiating:   { bg: '#FFF4EC',  text: '#C4622D' },
  'On Hold':     { bg: '#FFF8EC',  text: '#B45309' },
  Signed:        { bg: '#EDFAF3',  text: '#1A7A4A' },
  Lost:          { bg: '#FEE2E2',  text: '#DC2626' },
}
const CAMPAIGN_STATUS_PILL = {
  'Planned':           { bg: '#F3F3F3',  text: '#666666' },
  'Campaign Planning': { bg: '#F3F3F3',  text: '#666666' },
  'Brief Sent':        { bg: '#EEF4FF',  text: '#2D5BE3' },
  'In Production':     { bg: '#FFF4EC',  text: '#C4622D' },
  'Approved':          { bg: '#EEF4FF',  text: '#2D5BE3' },
  'Live':              { bg: '#EDFAF3',  text: '#1A7A4A' },
  'Completed':         { bg: '#EDFAF3',  text: '#1A7A4A' },
  'Invoiced':          { bg: '#F3F3F3',  text: '#666666' },
}
const CARD  = { background: '#fff', border: '1px solid #EEEEEE' }
const INK38 = { color: '#BBBBBB' }
const INK50 = { color: '#888888' }
const STITLE = { fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '0.875rem', color: '#111111', letterSpacing: '-0.01em' }

// ─── Tiny shared UI ───────────────────────────────────────────────────────────
function Avatar({ member, size = 44 }) {
  const c = AVATAR_COLORS[member.avatarIdx % AVATAR_COLORS.length]
  return (
    <div className="flex items-center justify-center rounded-full font-semibold flex-shrink-0"
      style={{ width: size, height: size, background: c.bg, color: c.text, fontSize: size * 0.34 }}>
      {getInitials(member.name)}
    </div>
  )
}
function Pill({ label, colors }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ background: colors.bg, color: colors.text }}>{label}</span>
  )
}
function SectionHead({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 style={STITLE}>{title}</h3>
      {action}
    </div>
  )
}
function LabelVal({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-widest mb-0.5" style={INK38}>{label}</p>
      <p className="text-sm" style={{ color: 'var(--ink)' }}>{value}</p>
    </div>
  )
}
function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
}
function ChevronLeft() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function PlusIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
}

function InlineSelect({ label, value, onChange, options }) {
  return (
    <div>
      {label && <label className="block text-[10px] font-medium uppercase tracking-widest mb-1" style={INK38}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg outline-none bg-white"
        style={{ border: '1px solid var(--border)', color: 'var(--ink)' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
function InlineInput({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      {label && <label className="block text-[10px] font-medium uppercase tracking-widest mb-1" style={INK38}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg outline-none"
        style={{ border: '1px solid var(--border)', color: 'var(--ink)' }} />
    </div>
  )
}

// ─── Team Overview Stats ──────────────────────────────────────────────────────
function TeamOverviewStats({ members }) {
  const totalPipeline     = members.reduce((s, m) => s + m.pipelineValue, 0)
  const totalCommMonth    = members.reduce((s, m) => s + m.commissionThisMonth, 0)
  const onPTOThisWeek     = members.filter(m => ptoDaysThisWeek(m, '2026-03-16', '2026-03-22'))

  const stats = [
    { label: 'Team Size',           value: members.length,                        sub: `${members.filter(m => m.contractType === 'Full-time').length} full-time` },
    { label: 'Pipeline Managed',    value: `$${totalPipeline.toLocaleString()}`,  sub: 'across all managers'  },
    { label: 'Commission This Month', value: `$${totalCommMonth.toLocaleString()}`, sub: 'total agency split' },
    { label: 'On PTO This Week',    value: onPTOThisWeek.length || '—',            sub: onPTOThisWeek.map(m => m.name).join(', ') || 'Everyone in office' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4 mb-7">
      {stats.map((s, i) => (
        <div key={s.label} className="rounded-xl p-5" style={CARD}>
          <p className="text-[10px] uppercase tracking-widest font-medium mb-3" style={INK38}>{s.label}</p>
          <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: '1.75rem', fontWeight: 600, color: '#111111', lineHeight: 1, letterSpacing: '-0.03em' }}>
            {s.value}
          </p>
          <p className="text-[11px] mt-1.5" style={INK38}>{s.sub}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Member Card ──────────────────────────────────────────────────────────────
function MemberCard({ member, onClick }) {
  return (
    <div onClick={onClick} className="rounded-xl p-5 cursor-pointer transition-shadow hover:shadow-md"
      style={{ ...CARD, borderLeft: `3px solid ${AVATAR_COLORS[member.avatarIdx % AVATAR_COLORS.length].text}` }}>
      <div className="flex items-start gap-4">
        <Avatar member={member} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{member.fullName}</p>
            <Pill label={member.status} colors={STATUS_PILL[member.status]} />
          </div>
          <p className="text-xs mt-0.5" style={INK50}>{member.role} · {member.contractType}</p>
          <p className="text-xs mt-0.5" style={INK38}>{member.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-medium mb-1" style={INK38}>Active Deals</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{member.activeDealsData.length}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-medium mb-1" style={INK38}>Campaigns</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{member.activeCampaignsData.length}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-medium mb-1" style={INK38}>Commission MTD</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
            {member.commissionThisMonth > 0 ? `$${member.commissionThisMonth.toLocaleString()}` : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── PTO Entry Row ────────────────────────────────────────────────────────────
function PTORow({ entry, onApprove, onReject }) {
  const typeColors = PTO_TYPE_COLOR[entry.type] || PTO_TYPE_COLOR.Vacation
  return (
    <div className="flex items-center gap-3 py-2.5 px-1" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {fmtShortDate(entry.startDate)}{entry.startDate !== entry.endDate ? ` – ${fmtShortDate(entry.endDate)}` : ''}
          </span>
          <span className="text-[11px]" style={INK50}>{entry.days} day{entry.days !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Pill label={entry.type}   colors={typeColors} />
          <Pill label={entry.status} colors={PTO_STATUS_PILL[entry.status]} />
          {entry.notes && <span className="text-[11px] italic" style={INK50}>{entry.notes}</span>}
        </div>
      </div>
      {entry.status === 'Pending' && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => onApprove(entry.id)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
            style={{ background: '#EDFAF4', color: '#166540', border: '1px solid #A7F3D0' }}>
            Approve
          </button>
          <button onClick={() => onReject(entry.id)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
            style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Add PTO Modal ────────────────────────────────────────────────────────────
function AddPTOModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ startDate: '', endDate: '', type: 'Vacation', notes: '' })
  const ch = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const days = form.startDate && form.endDate ? calDays(form.startDate, form.endDate) : 0
  function handleSubmit() {
    if (!form.startDate || !form.endDate) return
    onAdd({ ...form, id: Date.now(), status: 'Pending', days: calDays(form.startDate, form.endDate) })
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Add PTO Entry</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" style={{ color: '#888888' }}><CloseIcon /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InlineInput label="Start Date" type="date" value={form.startDate} onChange={v => ch('startDate', v)} />
            <InlineInput label="End Date"   type="date" value={form.endDate}   onChange={v => ch('endDate',   v)} />
          </div>
          {days > 0 && <p className="text-[11px] -mt-1" style={INK50}>{days} calendar day{days !== 1 ? 's' : ''}</p>}
          <InlineSelect label="Type" value={form.type} onChange={v => ch('type', v)} options={PTO_TYPES} />
          <InlineInput  label="Notes (optional)" value={form.notes} onChange={v => ch('notes', v)} placeholder="e.g. Family trip" />
          <div className="flex gap-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
            <button onClick={handleSubmit}
              className="flex-1 py-2 text-sm font-medium rounded-lg text-white transition-colors"
              style={{ background: 'var(--ink)' }}>
              Add Entry
            </button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: '#888888' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ fullName: '', role: 'Manager', contractType: 'Full-time', email: '', phone: '', status: 'Member', startDate: '' })
  const [errors, setErrors] = useState({})
  const ch = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: '' })) }
  function handleSubmit() {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = true
    if (!form.email.trim())    errs.email    = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    onAdd(form)
    onClose()
  }
  const inp = (field) => ({
    value: form[field] ?? '', onChange: v => ch(field, v),
    style: errors[field] ? { border: '1px solid #F87171', background: '#FFF5F5' } : {}
  })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Invite Team Member</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" style={{ color: '#888888' }}><CloseIcon /></button>
        </div>
        <div className="p-6 space-y-4">
          <InlineInput label="Full Name *" value={form.fullName} onChange={v => ch('fullName', v)} placeholder="e.g. Alex Kim" />
          {errors.fullName && <p className="text-xs text-red-500 -mt-2">Name is required</p>}
          <InlineInput label="Email *" type="email" value={form.email} onChange={v => ch('email', v)} placeholder="alex@qairos.co" />
          {errors.email && <p className="text-xs text-red-500 -mt-2">Email is required</p>}
          <InlineInput label="Phone" value={form.phone} onChange={v => ch('phone', v)} placeholder="+1 (424) 555-0000" />
          <div className="grid grid-cols-2 gap-3">
            <InlineSelect label="Role"          value={form.role}         onChange={v => ch('role', v)}         options={ROLES}          />
            <InlineSelect label="Contract Type" value={form.contractType} onChange={v => ch('contractType', v)} options={CONTRACT_TYPES}  />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InlineSelect label="Access Level"  value={form.status}    onChange={v => ch('status', v)}    options={['Admin', 'Member']} />
            <InlineInput  label="Start Date"    type="date" value={form.startDate} onChange={v => ch('startDate', v)} />
          </div>
          <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button onClick={handleSubmit}
              className="flex-1 py-2 text-sm font-medium rounded-lg text-white"
              style={{ background: 'var(--ink)' }}>
              Invite Member
            </button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border"
              style={{ borderColor: 'var(--border)', color: '#888888' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Team PTO Calendar ────────────────────────────────────────────────────────
function TeamPTOCalendar({ members, onClose }) {
  const [calMonth, setCalMonth] = useState({ year: 2026, month: 2 }) // 0-indexed March

  const { year, month } = calMonth
  const firstDay = new Date(year, month, 1)
  const dow = firstDay.getDay() // 0=Sun
  const startMon = new Date(firstDay)
  startMon.setDate(1 - (dow === 0 ? 6 : dow - 1))
  const days = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(startMon); d.setDate(startMon.getDate() + i); days.push(d)
  }

  function ptoOnDay(iso) {
    return members.flatMap(m =>
      m.ptoEntries
        .filter(e => e.status !== 'Rejected' && e.startDate <= iso && e.endDate >= iso)
        .map(e => ({ member: m, entry: e }))
    )
  }

  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function prev() {
    setCalMonth(p => {
      if (p.month === 0) return { year: p.year - 1, month: 11 }
      return { year: p.year, month: p.month - 1 }
    })
  }
  function next() {
    setCalMonth(p => {
      if (p.month === 11) return { year: p.year + 1, month: 0 }
      return { year: p.year, month: p.month + 1 }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-white z-10" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4">
            <h2 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#111111' }}>
              Team PTO Calendar
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={prev} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" style={{ color: '#888888' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <span className="text-sm font-medium px-2" style={{ color: 'var(--ink)' }}>{monthName}</span>
              <button onClick={next} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" style={{ color: '#888888' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: AVATAR_COLORS[m.avatarIdx % AVATAR_COLORS.length].text }} />
                <span className="text-[11px]" style={INK50}>{m.name}</span>
              </div>
            ))}
            <button onClick={onClose} className="ml-2 p-1.5 rounded-md hover:bg-gray-100 transition-colors" style={{ color: '#888888' }}>
              <CloseIcon />
            </button>
          </div>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 px-4 pt-3 pb-1">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="text-center text-[10px] font-medium uppercase tracking-widest" style={INK38}>{d}</div>
          ))}
        </div>
        {/* Days grid */}
        <div className="grid grid-cols-7 px-4 pb-4 gap-1">
          {days.map((day, i) => {
            const iso = toISO(day)
            const inMonth = day.getMonth() === month
            const isToday = iso === '2026-03-17'
            const ptoItems = ptoOnDay(iso)
            return (
              <div key={i} className="min-h-[72px] p-1.5 rounded-lg"
                style={{ background: isToday ? 'rgba(0,0,0,0.02)' : 'transparent', opacity: inMonth ? 1 : 0.35 }}>
                <div className="flex items-center justify-center mb-1">
                  <span className="text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full"
                    style={{ background: isToday ? 'var(--ink)' : 'transparent', color: isToday ? '#fff' : 'var(--ink)' }}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {ptoItems.map(({ member, entry }) => {
                    const ac = AVATAR_COLORS[member.avatarIdx % AVATAR_COLORS.length]
                    return (
                      <div key={`${member.id}-${entry.id}`}
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded truncate"
                        style={{ background: ac.bg, color: ac.text }}
                        title={`${member.name} — ${entry.type}${entry.status === 'Pending' ? ' (Pending)' : ''}`}>
                        {member.name.split(' ')[0]}
                        {entry.status === 'Pending' && ' ?'}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Member Detail Page ───────────────────────────────────────────────────────
function MemberDetail({ member, onBack, onUpdate }) {
  const [isEditing,  setIsEditing]  = useState(false)
  const [form,       setForm]       = useState({ ...member })
  const [showAddPTO, setShowAddPTO] = useState(false)

  const ch = (f, v) => setForm(p => ({ ...p, [f]: v }))

  function handleSave() {
    onUpdate(form)
    setIsEditing(false)
  }

  function handleAddPTO(entry) {
    const updated = { ...member, ptoEntries: [...member.ptoEntries, entry] }
    onUpdate(updated)
  }

  function handleApprove(entryId) {
    const updated = { ...member, ptoEntries: member.ptoEntries.map(e => e.id === entryId ? { ...e, status: 'Approved' } : e) }
    onUpdate(updated)
  }

  function handleReject(entryId) {
    const updated = { ...member, ptoEntries: member.ptoEntries.map(e => e.id === entryId ? { ...e, status: 'Rejected' } : e) }
    onUpdate(updated)
  }

  const ptoApproved = member.ptoEntries.filter(e => e.status === 'Approved').reduce((s, e) => s + e.days, 0)
  const ptoRemaining = member.ptoAllowed - ptoApproved
  const ptoBar = Math.min(100, Math.round((ptoApproved / member.ptoAllowed) * 100))

  const ac = AVATAR_COLORS[member.avatarIdx % AVATAR_COLORS.length]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top nav */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
          style={{ color: '#888888' }}>
          <ChevronLeft /> Back to Team
        </button>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button onClick={() => { setForm({ ...member }); setIsEditing(true) }}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ background: 'var(--ink)', color: '#fff' }}>
              Edit Profile
            </button>
          ) : (
            <>
              <button onClick={handleSave}
                className="text-sm font-medium px-4 py-2 rounded-lg text-white"
                style={{ background: 'var(--ink)' }}>
                Save Changes
              </button>
              <button onClick={() => setIsEditing(false)}
                className="text-sm font-medium px-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border)', color: '#888888' }}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* ── Left column ── */}
        <div className="col-span-1 flex flex-col gap-5">

          {/* Profile card */}
          <div className="rounded-xl p-5" style={CARD}>
            <div className="flex flex-col items-center text-center pb-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold mb-3"
                style={{ background: ac.bg, color: ac.text }}>
                {getInitials(member.fullName)}
              </div>
              <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>{member.fullName}</p>
              <p className="text-sm mt-0.5" style={INK50}>{member.role}</p>
              <div className="mt-2 flex items-center gap-2">
                <Pill label={member.status}       colors={STATUS_PILL[member.status]}  />
                <Pill label={member.contractType} colors={{ bg: '#F5F5F5', text: '#6B7280' }} />
              </div>
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <InlineInput label="Full Name"  value={form.fullName} onChange={v => ch('fullName', v)} />
                <InlineInput label="Email"      type="email" value={form.email} onChange={v => ch('email', v)} />
                <InlineInput label="Phone"      value={form.phone} onChange={v => ch('phone', v)} />
                <InlineInput label="Start Date" type="date" value={form.startDate} onChange={v => ch('startDate', v)} />
                <InlineSelect label="Role"          value={form.role}         onChange={v => ch('role', v)}         options={ROLES}         />
                <InlineSelect label="Contract Type" value={form.contractType} onChange={v => ch('contractType', v)} options={CONTRACT_TYPES} />
                <InlineSelect label="Access Level"  value={form.status}       onChange={v => ch('status', v)}       options={ACCESS_LEVELS}  />
              </div>
            ) : (
              <div className="space-y-3">
                <LabelVal label="Email"      value={member.email}      />
                <LabelVal label="Phone"      value={member.phone}      />
                <LabelVal label="Start Date" value={fmtDate(member.startDate)} />
              </div>
            )}
          </div>

          {/* Commission & Performance */}
          <div className="rounded-xl p-5" style={CARD}>
            <SectionHead title="Commission" />
            <div className="space-y-3">
              {isEditing ? (
                <InlineInput label="Commission Split %" value={form.commissionSplit} onChange={v => ch('commissionSplit', Number(v))} type="number" />
              ) : (
                <LabelVal label="Agency Split" value={`${member.commissionSplit}% of deal commission`} />
              )}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-lg p-3 text-center" style={{ background: '#FAFAF9' }}>
                  <p className="text-[10px] uppercase tracking-widest font-medium mb-1" style={INK38}>This Month</p>
                  <p className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                    {member.commissionThisMonth > 0 ? `$${member.commissionThisMonth.toLocaleString()}` : '—'}
                  </p>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ background: '#FAFAF9' }}>
                  <p className="text-[10px] uppercase tracking-widest font-medium mb-1" style={INK38}>YTD</p>
                  <p className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                    {member.ytdCommission > 0 ? `$${member.ytdCommission.toLocaleString()}` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Clients */}
          <div className="rounded-xl p-5" style={CARD}>
            <SectionHead title="Assigned Clients" />
            {member.assignedClients.length === 0 ? (
              <p className="text-sm" style={INK38}>No clients assigned</p>
            ) : (
              <div className="space-y-2">
                {member.assignedClients.map(c => (
                  <a key={c.id} href={`/roster?open=${c.id}`}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors hover:bg-gray-50 -mx-2"
                    style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: '#F0F0F0', color: '#333333' }}>
                      {c.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <span className="text-sm">{c.name}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto opacity-30"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="col-span-2 flex flex-col gap-5">

          {/* Performance metrics */}
          <div className="rounded-xl p-5" style={CARD}>
            <SectionHead title="Performance" />
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Deals Closed',       value: member.dealsClosed || '—'     },
                { label: 'Pipeline Managed',   value: member.pipelineValue > 0 ? `$${member.pipelineValue.toLocaleString()}` : '—' },
                { label: 'Campaigns Done',     value: member.campaignsCompleted || '—' },
                { label: 'Avg Deal Size',      value: member.avgDealSize > 0 ? `$${member.avgDealSize.toLocaleString()}` : '—' },
              ].map(s => (
                <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: '#FAFAF9' }}>
                  <p className="text-[10px] uppercase tracking-widest font-medium mb-1.5" style={INK38}>{s.label}</p>
                  <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: '1.5rem', fontWeight: 600, color: '#111111', lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Deals */}
          <div className="rounded-xl overflow-hidden" style={CARD}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 style={STITLE}>Active Deals</h3>
            </div>
            {member.activeDealsData.length === 0 ? (
              <div className="px-5 py-6 text-sm" style={INK38}>No active deals</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>{['Deal', 'Creator', 'Brand', 'Value', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 20px', textAlign: 'left', fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#BBBBBB', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {member.activeDealsData.map(d => (
                    <tr key={d.id} className="transition-colors cursor-pointer hover:bg-gray-50"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onClick={() => window.location.href = `/deals?open=${d.id}`}>
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>{d.dealName}</td>
                      <td className="px-5 py-3 text-sm" style={INK50}>{d.creator}</td>
                      <td className="px-5 py-3 text-sm" style={INK50}>{d.brand}</td>
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>${d.value.toLocaleString()}</td>
                      <td className="px-5 py-3"><Pill label={d.status} colors={DEAL_STATUS_PILL[d.status] || { bg: '#F5F5F5', text: '#6B7280' }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Active Campaigns */}
          <div className="rounded-xl overflow-hidden" style={CARD}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 style={STITLE}>Active Campaigns</h3>
            </div>
            {member.activeCampaignsData.length === 0 ? (
              <div className="px-5 py-6 text-sm" style={INK38}>No active campaigns</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>{['Campaign', 'Creator', 'Brand', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 20px', textAlign: 'left', fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#BBBBBB', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {member.activeCampaignsData.map(c => (
                    <tr key={c.id} className="transition-colors cursor-pointer hover:bg-gray-50"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onClick={() => window.location.href = `/campaigns?open=${c.id}`}>
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>{c.name}</td>
                      <td className="px-5 py-3 text-sm" style={INK50}>{c.creator}</td>
                      <td className="px-5 py-3 text-sm" style={INK50}>{c.brand}</td>
                      <td className="px-5 py-3"><Pill label={c.status} colors={CAMPAIGN_STATUS_PILL[c.status] || { bg: '#F5F5F5', text: '#6B7280' }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* PTO Tracker */}
          <div className="rounded-xl p-5" style={CARD}>
            <SectionHead
              title="PTO Tracker"
              action={
                <button onClick={() => setShowAddPTO(true)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}>
                  <PlusIcon /> Add PTO
                </button>
              }
            />
            {/* PTO bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs" style={INK50}>{ptoApproved} of {member.ptoAllowed} days used</span>
                <span className="text-xs font-medium" style={{ color: ptoRemaining < 3 ? '#DC2626' : 'var(--ink)' }}>{ptoRemaining} remaining</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${ptoBar}%`, background: ptoRemaining < 3 ? '#DC2626' : '#111111' }} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { label: 'Allowed',   value: member.ptoAllowed },
                  { label: 'Used',      value: ptoApproved       },
                  { label: 'Remaining', value: ptoRemaining       },
                ].map(s => (
                  <div key={s.label} className="text-center py-2 rounded-lg" style={{ background: '#FAFAF9' }}>
                    <p className="text-[10px] uppercase tracking-widest" style={INK38}>{s.label}</p>
                    <p className="text-lg font-semibold mt-0.5" style={{ color: s.label === 'Remaining' && s.value < 3 ? '#DC2626' : 'var(--ink)' }}>{s.value}</p>
                    <p className="text-[10px]" style={INK38}>days</p>
                  </div>
                ))}
              </div>
            </div>
            {/* PTO history */}
            {member.ptoEntries.length === 0 ? (
              <p className="text-sm py-2" style={INK38}>No PTO entries yet</p>
            ) : (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-medium mb-2" style={INK38}>History</p>
                {[...member.ptoEntries].reverse().map(entry => (
                  <PTORow key={entry.id} entry={entry} onApprove={handleApprove} onReject={handleReject} />
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="rounded-xl p-5" style={CARD}>
            <SectionHead title="Documents" />
            {member.documents.length === 0 ? (
              <p className="text-sm" style={INK38}>No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {member.documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: '#FAFAF9' }}>
                    <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#F3F3F3' }}>
                      <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M2 1h6l3 3v9H2V1z" stroke="#666666" strokeWidth="1.2"/><path d="M7 1v3h3" stroke="#666666" strokeWidth="1.2"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{doc.name}</p>
                      <p className="text-[11px]" style={INK38}>{doc.type} · Uploaded {doc.uploadDate}</p>
                    </div>
                    <button className="text-[11px] font-medium px-2.5 py-1 rounded" style={{ background: '#F3F3F3', color: '#444444' }}>
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="flex items-center gap-1.5 text-xs font-medium mt-3 px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: '#888888' }}>
              <PlusIcon /> Upload Document
            </button>
          </div>

          {/* Notes */}
          <div className="rounded-xl p-5" style={CARD}>
            <SectionHead title="Notes" />
            {isEditing ? (
              <textarea
                value={form.notes ?? ''}
                onChange={e => ch('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
                style={{ border: '1px solid var(--border)', color: 'var(--ink)' }}
                placeholder="Internal notes about this team member…"
              />
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: member.notes ? 'var(--ink)' : '#CCCCCC' }}>
                {member.notes || 'No notes added yet.'}
              </p>
            )}
          </div>

        </div>
      </div>

      {showAddPTO && <AddPTOModal onClose={() => setShowAddPTO(false)} onAdd={handleAddPTO} />}
    </div>
  )
}

// ─── Main Team Page ───────────────────────────────────────────────────────────
export default function Team() {
  const [members,     setMembers]     = useState(initialMembers)
  const [selectedId,  setSelectedId]  = useState(null)
  const [showAdd,     setShowAdd]     = useState(false)
  const [showCalendar,setShowCalendar]= useState(false)

  const selected = members.find(m => m.id === selectedId) ?? null

  function handleUpdate(updated) {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m))
  }

  function handleAddMember(data) {
    const id  = Math.max(0, ...members.map(m => m.id)) + 1
    const idx = members.length % AVATAR_COLORS.length
    const shortName = data.fullName.split(' ').map((w, i) => i === 0 ? w : w[0] + '.').join(' ')
    setMembers(prev => [...prev, {
      id, name: shortName, fullName: data.fullName,
      role: data.role, contractType: data.contractType,
      email: data.email, phone: data.phone ?? '',
      startDate: data.startDate ?? '', status: data.status, avatarIdx: idx,
      commissionSplit: 50, ytdCommission: 0, commissionThisMonth: 0,
      assignedClients: [], activeDealsData: [], activeCampaignsData: [],
      dealsClosed: 0, pipelineValue: 0, campaignsCompleted: 0, avgDealSize: 0,
      ptoAllowed: 15, ptoEntries: [], documents: [], notes: '',
    }])
  }

  if (selected) {
    return (
      <div className="p-8">
        <MemberDetail
          member={selected}
          onBack={() => setSelectedId(null)}
          onUpdate={updated => { handleUpdate(updated); setSelectedId(updated.id) }}
        />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Team"
        subtitle="Manage your agency team, performance & time off."
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCalendar(true)}
              className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg border transition-colors"
              style={{ borderColor: '#EEEEEE', color: '#666666', background: '#fff' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1 5.5h12M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              PTO Calendar
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
              style={{ background: '#111111', color: '#fff' }}>
              <PlusIcon /> Invite Member
            </button>
          </div>
        }
      />

      {/* Overview stats */}
      <TeamOverviewStats members={members} />

      {/* Member cards */}
      <div className="grid grid-cols-2 gap-4">
        {members.map(m => (
          <MemberCard key={m.id} member={m} onClick={() => setSelectedId(m.id)} />
        ))}
      </div>

      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onAdd={handleAddMember} />}
      {showCalendar && <TeamPTOCalendar members={members} onClose={() => setShowCalendar(false)} />}
    </div>
  )
}
