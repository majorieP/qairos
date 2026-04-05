import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTasks } from '../context/TasksContext'
import { useInvoices } from '../context/InvoicesContext'
import { useCampaigns } from '../context/CampaignsContext'
import { useContracts } from '../context/ContractsContext'
import { usePayouts } from '../context/PayoutsContext'
import BrandLogo from '../components/BrandLogo'

const _now = new Date()
const TODAY = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`

// ─── Deals (dashboard-local sample) ──────────────────────────────────────────
const INITIAL_DEALS = [
  { id: 1,  dealName: 'Spring Glow Collection',        creator: 'Sofia Chen',    creatorId: 1, brand: 'Luminary Beauty', status: 'Negotiating', value: 9500,  signedDate: null },
  { id: 2,  dealName: 'Run Season Ambassador',         creator: 'Marcus Reid',   creatorId: 2, brand: 'Peak Athletics',  status: 'Signed',      value: 8500,  signedDate: '2026-03-12' },
  { id: 3,  dealName: 'Plant-Forward Recipe Series',   creator: 'Anika Patel',   creatorId: 3, brand: 'Verdant Foods',   status: 'Pitching',    value: 5200,  signedDate: null },
  { id: 4,  dealName: 'Q2 Tech Review Series',         creator: 'James Ortiz',   creatorId: 4, brand: 'TechFlow',        status: 'Signed',      value: 18000, signedDate: '2026-03-08' },
  { id: 5,  dealName: 'Golden Horizons Travel Series', creator: 'Lily Nakamura', creatorId: 5, brand: 'Solstice Travel', status: 'Negotiating', value: 22000, signedDate: null },
  { id: 6,  dealName: 'GlowLab Spring Edit',           creator: 'Sofia Chen',    creatorId: 1, brand: 'GlowLab',         status: 'New Inquiry', value: 7500,  signedDate: null },
  { id: 7,  dealName: 'NutriBrand Protein Partnership',creator: 'Marcus Reid',   creatorId: 2, brand: 'NutriBrand',      status: 'Signed',      value: 12000, signedDate: '2026-03-22' },
  { id: 8,  dealName: 'MediaTech Flagship Deal',       creator: 'James Ortiz',   creatorId: 4, brand: 'MediaTech',       status: 'New Inquiry', value: 15000, signedDate: null },
  { id: 9,  dealName: 'Wellness Boutique Launch',      creator: 'Emma Walsh',    creatorId: 10,brand: 'Bloom Wellness',  status: 'New Inquiry', value: 6800,  signedDate: null },
  { id: 10, dealName: 'Summer Denim Edit',             creator: 'Zoe Martinez',  creatorId: 6, brand: 'CloudDenim',      status: 'Signed',      value: 9800,  signedDate: '2026-04-01' },
  { id: 11, dealName: 'Fall Skincare Launch',          creator: 'Sofia Chen',    creatorId: 1, brand: 'Fenty Beauty',    status: 'Signed',      value: 14500, signedDate: '2026-03-28' },
]

// ─── Design tokens ────────────────────────────────────────────────────────────
const STATUS_DOT_COLOR = { 'To Do': '#E5E5E5', 'Doing': '#FDE68A', 'Done': '#BBF7D0' }
const TASK_STATUS_CYCLE = { 'To Do': 'Doing', 'Doing': 'Done', 'Done': 'To Do' }
const PRIORITY_DOT = { High: '#EF4444', Medium: '#F97316', Low: '#9CA3AF' }
const PLATFORM_PILL = {
  Instagram:   { text: '#BE185D', border: '#FCE7F3' },
  TikTok:      { text: '#FFFFFF', border: '#1D1D1F', bg: '#1D1D1F' },
  YouTube:     { text: '#B91C1C', border: '#FECACA' },
  Podcast:     { text: '#C2410C', border: '#FED7AA' },
  Blog:        { text: '#166534', border: '#BBF7D0' },
  'Twitter/X': { text: '#0369A1', border: '#BAE6FD' },
}
const CAMPAIGN_STATUS_DOT = {
  'Live': '#1A7A4A', 'Completed': '#888888', 'In Production': '#2D5BE3',
  'Approved': '#2D5BE3', 'Brief Sent': '#C4622D', 'Planned': '#DDDDDD',
  'Campaign Planning': '#DDDDDD', 'Invoiced': '#BBBBBB',
}

// ─── Creator photos ───────────────────────────────────────────────────────────
const CREATOR_PHOTO_MAP = { 1:'women/12', 2:'men/10', 3:'women/22', 4:'men/20', 5:'women/32', 6:'women/26', 7:'men/15', 8:'women/44', 9:'men/25', 10:'women/8' }
function creatorPhotoUrl(id) {
  const p = CREATOR_PHOTO_MAP[id]
  if (p) return `https://randomuser.me/api/portraits/${p}.jpg`
  if (!id) return null
  const n = ((id * 7) % 49) + 1
  return `https://randomuser.me/api/portraits/${id % 2 === 0 ? 'men' : 'women'}/${n}.jpg`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtShort(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function daysBetween(isoA, isoB) {
  const a = new Date(isoA + 'T00:00:00')
  const b = new Date(isoB + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}
function fmtMoney(n) {
  return '$' + Number(n || 0).toLocaleString()
}

// ─── Atomic components ───────────────────────────────────────────────────────
function Section({ children, style }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 12, overflow: 'hidden', ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ title, right }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <h2 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 700, fontSize: 16, color: '#111111', letterSpacing: '-0.01em', margin: 0 }}>{title}</h2>
      {right}
    </div>
  )
}

function ViewAllLink({ onClick }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12, color: '#888888', background: 'transparent', border: 'none',
      cursor: 'pointer', padding: 0, transition: 'color 0.1s',
    }}
      onMouseEnter={e => e.currentTarget.style.color = '#111111'}
      onMouseLeave={e => e.currentTarget.style.color = '#888888'}
    >View all →</button>
  )
}

function EmptyState({ msg }) {
  return <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 12, color: '#BBBBBB' }}>{msg}</div>
}

function SegmentedControl({ options, value, onChange, size = 'sm' }) {
  const h = size === 'sm' ? 22 : 26
  return (
    <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #EEEEEE' }}>
      {options.map(([v, label]) => (
        <button key={v}
          onClick={() => onChange(v)}
          style={{
            fontSize: 11, fontWeight: 500, padding: `0 8px`, height: h, border: 'none',
            background: value === v ? '#111111' : '#fff', color: value === v ? '#fff' : '#888888',
            cursor: 'pointer',
          }}
        >{label}</button>
      ))}
    </div>
  )
}

// ─── New Dropdown ─────────────────────────────────────────────────────────────
function NewDropdown({ navigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])
  const items = [
    { label: 'Add Task', path: '/tasks?new=1' },
    { label: 'Add Deal', path: '/deals?new=1' },
    { label: 'Add Campaign', path: '/campaigns?new=1' },
    { label: 'Add Expense', path: '/expenses?new=1' },
  ]
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#111111', color: '#fff', border: 'none', borderRadius: 8,
          padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>＋</span> New
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 2, opacity: 0.7 }}>
          <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#fff', border: '1px solid #EEEEEE', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: 4,
          minWidth: 160, zIndex: 50,
        }}>
          {items.map(it => (
            <button key={it.label}
              onClick={() => { setOpen(false); navigate(it.path) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', fontSize: 13, color: '#111111',
                background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{it.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Generic row container ────────────────────────────────────────────────────
function RowButton({ onClick, children, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 16px', height: 44,
        cursor: onClick ? 'pointer' : 'default',
        borderBottom: '1px solid #F3F3F3',
        transition: 'background 0.1s',
        ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >{children}</div>
  )
}

function SmallButton({ onClick, children, colorSet }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{
        fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 6,
        whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
        transition: 'opacity 0.15s',
        ...colorSet,
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >{children}</button>
  )
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────
function TasksTab({ tasks, updateTask, addTask, navigate }) {
  const [view, setView] = useState('today')
  const [addingNew, setAddingNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [hoveredRowId, setHoveredRowId] = useState(null)

  const weekDays = useMemo(() => {
    const today = new Date()
    const dow = today.getDay()
    const mon = new Date(today); mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
  }, [])
  const weekISO = useMemo(() => weekDays.map(toISO), [weekDays])

  const listAll = useMemo(() => {
    const seen = new Set()
    const pickUnique = arr => arr.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true })
    if (view === 'today') {
      return pickUnique([
        ...tasks.filter(t => t.due < TODAY && t.status !== 'Done'),
        ...tasks.filter(t => t.due === TODAY),
      ])
    }
    return pickUnique(tasks.filter(t => weekISO.includes(t.due)))
      .sort((a, b) => (a.due || '').localeCompare(b.due || ''))
  }, [tasks, view, weekISO])

  const visibleTasks = listAll.slice(0, 8)
  const overflow = listAll.length - visibleTasks.length

  function cycleStatus(e, task) {
    e.stopPropagation()
    updateTask(task.id, { status: TASK_STATUS_CYCLE[task.status] || 'To Do' })
  }

  function handleQuickAdd() {
    if (!newTitle.trim()) return
    addTask({
      title: newTitle.trim(), status: 'To Do', priority: 'Medium',
      assignee: 'Marjorie A.', assigneeId: 1, due: TODAY,
      recurring: 'Single', recurringEnd: '', recurringCount: '',
      linkType: 'None', linkId: null, linkLabel: '', linkPath: '', tags: [], notes: '',
    })
    setNewTitle(''); setAddingNew(false)
  }

  return (
    <div>
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderBottom: '1px solid #F3F3F3' }}>
        <SegmentedControl options={[['today','Today'],['week','Week']]} value={view} onChange={setView} />
      </div>

      {visibleTasks.length === 0 && <EmptyState msg="No tasks ✓" />}
      {visibleTasks.map(task => {
        const isDone = task.status === 'Done'
        const isHovered = hoveredRowId === task.id
        const statusDot = STATUS_DOT_COLOR[task.status] || '#E5E5E5'
        const priorityDot = PRIORITY_DOT[task.priority] || '#9CA3AF'
        const isOverdue = task.due < TODAY && task.status !== 'Done'
        return (
          <div key={task.id}
            style={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 16px', height: 36,
              background: isHovered ? '#FAFAFA' : 'transparent', cursor: 'pointer',
              borderBottom: '1px solid #F3F3F3', transition: 'background 0.1s',
              overflow: 'hidden',
            }}
            onMouseEnter={() => setHoveredRowId(task.id)}
            onMouseLeave={() => setHoveredRowId(null)}
            onClick={() => navigate(`/tasks?open=${task.id}`)}
          >
            <button
              onClick={e => cycleStatus(e, task)}
              title={`${task.status} → ${TASK_STATUS_CYCLE[task.status]}`}
              style={{
                width: 11, height: 11, borderRadius: '50%', background: statusDot,
                border: `1.5px solid ${statusDot === '#E5E5E5' ? '#C8C8C8' : statusDot === '#FDE68A' ? '#F0C400' : '#6EE7B7'}`,
                flexShrink: 0, cursor: 'pointer', padding: 0, transition: 'transform 0.12s',
              }}
              onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.transform = 'scale(1.3)' }}
              onMouseLeave={e => { e.stopPropagation(); e.currentTarget.style.transform = 'scale(1)' }}
            />
            <span style={{
              flex: 1, minWidth: 0, fontSize: 13, fontWeight: 400, lineHeight: 1.4,
              color: isDone ? '#BBBBBB' : '#111111',
              textDecoration: isDone ? 'line-through' : 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{task.title}</span>
            {task.linkLabel && (
              <span style={{ fontSize: 11, color: '#CCCCCC', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {task.linkLabel}
              </span>
            )}
            {task.due && task.due !== TODAY && (
              <span style={{ fontSize: 11, flexShrink: 0, whiteSpace: 'nowrap', color: isOverdue ? '#EF4444' : '#CCCCCC' }}>
                {fmtShort(task.due)}
              </span>
            )}
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: priorityDot, flexShrink: 0 }} />
          </div>
        )
      })}

      {overflow > 0 && (
        <button onClick={() => navigate('/tasks')}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '9px 16px', fontSize: 12, color: '#888888',
            background: 'transparent', border: 'none', borderBottom: '1px solid #F3F3F3',
            cursor: 'pointer', transition: 'color 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#111111'}
          onMouseLeave={e => e.currentTarget.style.color = '#888888'}
        >View all {listAll.length} →</button>
      )}

      {addingNew ? (
        <div style={{ padding: '8px 16px' }}>
          <input autoFocus
            style={{ width: '100%', fontSize: 13, outline: 'none', border: 'none', background: 'transparent', color: '#111111', borderBottom: '1px solid #EEEEEE', paddingBottom: 3 }}
            placeholder="Task title…"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleQuickAdd()
              if (e.key === 'Escape') { setAddingNew(false); setNewTitle('') }
            }}
            onBlur={() => setTimeout(() => { setAddingNew(false); setNewTitle('') }, 160)}
          />
        </div>
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '9px 16px', fontSize: 12, color: '#CCCCCC',
            background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#888888'}
          onMouseLeave={e => e.currentTarget.style.color = '#CCCCCC'}
        >+ New task</button>
      )}
    </div>
  )
}

// ─── Invoices Tab ─────────────────────────────────────────────────────────────
function InvoicesTab({ items, navigate }) {
  if (items.length === 0) return <EmptyState msg="All campaigns invoiced ✓" />
  return (
    <div>
      {items.slice(0, 5).map(c => {
        const photo = creatorPhotoUrl(c.creatorId)
        return (
          <RowButton key={c.id} onClick={() => navigate(`/campaigns?open=${c.id}`)}>
            {photo && <img src={photo} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.creator} × {c.brand}
            </span>
            <span style={{ fontSize: 11, color: '#999999', flexShrink: 0, whiteSpace: 'nowrap' }}>Live {fmtShort(c.liveDate)}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111111', flexShrink: 0 }}>{fmtMoney(c.amount)}</span>
            <SmallButton
              onClick={() => navigate('/invoices?new=1')}
              colorSet={{ background: '#FFF4EC', color: '#C4622D', border: '1px solid #F5D6B8' }}
            >Generate Invoice</SmallButton>
          </RowButton>
        )
      })}
      {items.length > 5 && (
        <button onClick={() => navigate('/invoices')}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px', fontSize: 12, color: '#888888', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >View all {items.length} →</button>
      )}
    </div>
  )
}

// ─── Payouts Tab ──────────────────────────────────────────────────────────────
function PayoutsTab({ items, navigate, updatePayout }) {
  if (items.length === 0) return <EmptyState msg="No payouts pending ✓" />
  return (
    <div>
      {items.slice(0, 5).map(p => {
        const photo = creatorPhotoUrl(p.creatorId)
        return (
          <RowButton key={p.id} onClick={() => navigate(`/payouts?open=${p.id}`)}>
            {photo && <img src={photo} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.creator}
            </span>
            <span style={{ fontSize: 11, color: '#999999', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
              {p.brand || p.campaign || '—'}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111111', flexShrink: 0 }}>{fmtMoney(p.net)}</span>
            <SmallButton
              onClick={() => { if (updatePayout) updatePayout(p.id, { status: 'Paid' }); else navigate(`/payouts?open=${p.id}`) }}
              colorSet={{ background: '#EEF4FF', color: '#2D5BE3', border: '1px solid #BFDBFE' }}
            >Mark Paid</SmallButton>
          </RowButton>
        )
      })}
      {items.length > 5 && (
        <button onClick={() => navigate('/payouts')}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px', fontSize: 12, color: '#888888', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >View all {items.length} →</button>
      )}
    </div>
  )
}

// ─── Late Payments Tab ────────────────────────────────────────────────────────
function LatePaymentsTab({ items, navigate }) {
  if (items.length === 0) return <EmptyState msg="No late payments ✓" />
  return (
    <div>
      {items.slice(0, 5).map(inv => {
        let daysLate = 0
        if (inv.due) {
          const dueISO = typeof inv.due === 'string' && inv.due.includes('-') ? inv.due : null
          if (dueISO) daysLate = Math.max(0, daysBetween(dueISO, TODAY))
        }
        return (
          <RowButton key={inv.id} onClick={() => navigate(`/invoices?open=${inv.id}`)}>
            <BrandLogo name={inv.brand} size={20} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {inv.brand}
            </span>
            <span style={{ fontSize: 11, color: '#999999', flexShrink: 0, whiteSpace: 'nowrap' }}>{inv.invoiceId}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111111', flexShrink: 0 }}>{fmtMoney(inv.amount)}</span>
            {daysLate > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {daysLate}d overdue
              </span>
            )}
            <SmallButton
              onClick={() => navigate(`/invoices?open=${inv.id}`)}
              colorSet={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}
            >Send Reminder</SmallButton>
          </RowButton>
        )
      })}
      {items.length > 5 && (
        <button onClick={() => navigate('/invoices')}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px', fontSize: 12, color: '#888888', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >View all {items.length} →</button>
      )}
    </div>
  )
}

// ─── Contracts Tab ────────────────────────────────────────────────────────────
function ContractsTab({ items, navigate }) {
  if (items.length === 0) return <EmptyState msg="No draft contracts ✓" />
  return (
    <div>
      {items.slice(0, 5).map(c => (
        <RowButton key={c.id} onClick={() => navigate(`/contracts?open=${c.id}`)}>
          <span style={{ flex: '0 0 auto', fontSize: 13, fontWeight: 500, color: '#111111', whiteSpace: 'nowrap' }}>
            {c.creator} × {c.brand}
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 11, color: '#999999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.title || c.dealName || ''}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111111', flexShrink: 0 }}>{fmtMoney(c.value)}</span>
          <SmallButton
            onClick={() => navigate(`/contracts?open=${c.id}`)}
            colorSet={{ background: '#F3F3F3', color: '#444444', border: '1px solid #E5E5E5' }}
          >Send</SmallButton>
        </RowButton>
      ))}
      {items.length > 5 && (
        <button onClick={() => navigate('/contracts')}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px', fontSize: 12, color: '#888888', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >View all {items.length} →</button>
      )}
    </div>
  )
}

// ─── To Do Box (5 tabs) ───────────────────────────────────────────────────────
function ToDoBox({ tasks, updateTask, addTask, invoices, campaigns, contracts, payouts, updatePayout, navigate }) {
  const [tab, setTab] = useState(0)

  const invoicesNeeded   = useMemo(() => campaigns.filter(c => ['Live','Completed'].includes(c.status) && !c.invoiceId), [campaigns])
  const latePayments     = useMemo(() => invoices.filter(i => i.status === 'Overdue'), [invoices])
  const duePayouts       = useMemo(() => payouts.filter(p => ['Pending','Processing'].includes(p.status)), [payouts])
  const draftContracts   = useMemo(() => contracts.filter(c => c.status === 'Draft'), [contracts])

  const openTaskCount = useMemo(() =>
    tasks.filter(t => (t.due < TODAY && t.status !== 'Done') || t.due === TODAY).length,
    [tasks]
  )

  const TABS = [
    { label: 'Tasks',         count: openTaskCount,         badge: { bg: '#F3F3F3', color: '#666666' } },
    { label: 'Invoices',      count: invoicesNeeded.length, badge: { bg: '#FFF4EC', color: '#C4622D' } },
    { label: 'Payouts',       count: duePayouts.length,     badge: { bg: '#EEF4FF', color: '#2D5BE3' } },
    { label: 'Late Payments', count: latePayments.length,   badge: { bg: '#FEE2E2', color: '#DC2626' } },
    { label: 'Contracts',     count: draftContracts.length, badge: { bg: '#F3F3F3', color: '#444444' } },
  ]

  return (
    <Section style={{ display: 'flex', flexDirection: 'column' }}>
      <SectionTitle title="To Do" />
      <div style={{ display: 'flex', borderBottom: '1px solid #EEEEEE', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t.label}
            onClick={() => setTab(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px', whiteSpace: 'nowrap',
              borderBottom: tab === i ? '2px solid #111111' : '2px solid transparent',
              color: tab === i ? '#111111' : '#888888',
              fontWeight: tab === i ? 600 : 400, fontSize: 12,
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
                minWidth: 18, textAlign: 'center', background: t.badge.bg, color: t.badge.color,
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        {tab === 0 && <TasksTab tasks={tasks} updateTask={updateTask} addTask={addTask} navigate={navigate} />}
        {tab === 1 && <InvoicesTab items={invoicesNeeded} navigate={navigate} />}
        {tab === 2 && <PayoutsTab items={duePayouts} navigate={navigate} updatePayout={updatePayout} />}
        {tab === 3 && <LatePaymentsTab items={latePayments} navigate={navigate} />}
        {tab === 4 && <ContractsTab items={draftContracts} navigate={navigate} />}
      </div>
    </Section>
  )
}

// ─── Campaigns Box ────────────────────────────────────────────────────────────
function CampaignsBox({ campaigns, navigate }) {
  const [view, setView] = useState('week')

  const weekISO = useMemo(() => {
    const today = new Date()
    const dow = today.getDay()
    const mon = new Date(today); mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return toISO(d) })
  }, [])

  const filtered = useMemo(() => {
    const now = new Date()
    const mPrefix = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    if (view === 'today') return campaigns.filter(c => c.liveDate === TODAY)
    if (view === 'week')  return campaigns.filter(c => weekISO.includes(c.liveDate))
    return campaigns.filter(c => c.liveDate && c.liveDate.startsWith(mPrefix))
  }, [campaigns, view, weekISO])

  const sorted = [...filtered].sort((a, b) => (a.liveDate || '').localeCompare(b.liveDate || ''))
  const visible = sorted.slice(0, 5)

  return (
    <Section>
      <SectionTitle title="Campaigns & Deadlines"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SegmentedControl options={[['today','Today'],['week','Week'],['month','Month']]} value={view} onChange={setView} />
            <ViewAllLink onClick={() => navigate('/campaigns')} />
          </div>
        }
      />
      {visible.length === 0 ? <EmptyState msg="No campaigns for this period" /> : visible.map(c => {
        const photo = creatorPhotoUrl(c.creatorId)
        const pp = PLATFORM_PILL[c.platform] || { text: '#666666', border: '#EEEEEE' }
        const dot = CAMPAIGN_STATUS_DOT[c.status] || '#DDDDDD'
        return (
          <RowButton key={c.id} onClick={() => navigate(`/campaigns?open=${c.id}`)}>
            {photo && <img src={photo} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.creator} × {c.brand}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 500, color: pp.text,
              background: pp.bg || '#FFFFFF', border: `1px solid ${pp.border}`,
              borderRadius: 3, padding: '1px 6px', flexShrink: 0, whiteSpace: 'nowrap',
            }}>{c.platform}</span>
            {c.liveDate && <span style={{ fontSize: 11, color: '#999999', flexShrink: 0, whiteSpace: 'nowrap' }}>{fmtShort(c.liveDate)}</span>}
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
            {c.amount != null && <span style={{ fontSize: 13, fontWeight: 600, color: '#111111', flexShrink: 0 }}>{fmtMoney(c.amount)}</span>}
          </RowButton>
        )
      })}
    </Section>
  )
}

// ─── Deals Box ────────────────────────────────────────────────────────────────
function DealsBox({ deals, navigate }) {
  const [tab, setTab] = useState(0)

  const newInquiries = useMemo(() => deals.filter(d => d.status === 'New Inquiry'), [deals])
  const recentlySigned = useMemo(() =>
    deals.filter(d => d.status === 'Signed' && d.signedDate)
      .sort((a, b) => (b.signedDate || '').localeCompare(a.signedDate || ''))
      .slice(0, 5),
    [deals]
  )

  const items = tab === 0 ? newInquiries : recentlySigned
  const emptyMsg = tab === 0 ? 'No new inquiries' : 'No signed deals yet'

  return (
    <Section>
      <SectionTitle title="Deals" right={<ViewAllLink onClick={() => navigate('/deals')} />} />
      <div style={{ display: 'flex', borderBottom: '1px solid #EEEEEE' }}>
        {['New Inquiries', 'Recently Signed'].map((label, i) => (
          <button key={label}
            onClick={() => setTab(i)}
            style={{
              padding: '10px 14px',
              borderBottom: tab === i ? '2px solid #111111' : '2px solid transparent',
              color: tab === i ? '#111111' : '#888888',
              fontWeight: tab === i ? 600 : 400, fontSize: 12,
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}
          >{label}</button>
        ))}
      </div>
      {items.length === 0 ? <EmptyState msg={emptyMsg} /> : items.slice(0, 5).map(d => {
        const photo = creatorPhotoUrl(d.creatorId)
        return (
          <RowButton key={d.id} onClick={() => navigate(`/deals?open=${d.id}`)}>
            {photo && <img src={photo} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
            <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 500, color: '#111111', whiteSpace: 'nowrap' }}>
              {d.creator}
            </span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: '#999999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.brand}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111111', flexShrink: 0 }}>{fmtMoney(d.value)}</span>
            {tab === 0 ? (
              <SmallButton
                onClick={() => navigate(`/deals?open=${d.id}`)}
                colorSet={{ background: '#111111', color: '#fff', border: '1px solid #111111' }}
              >Open</SmallButton>
            ) : (
              <span style={{ fontSize: 11, color: '#999999', flexShrink: 0, whiteSpace: 'nowrap', minWidth: 56, textAlign: 'right' }}>
                {fmtShort(d.signedDate)}
              </span>
            )}
          </RowButton>
        )
      })}
    </Section>
  )
}

// ─── Metrics Row ──────────────────────────────────────────────────────────────
function MetricsRow({ deals, invoices, payouts, navigate }) {
  const totalPipeline = deals
    .filter(d => !['Lost','Signed'].includes(d.status))
    .reduce((s, d) => s + d.value, 0)

  const thisMonth = TODAY.slice(0, 7)
  const signedThisMonth = deals
    .filter(d => d.status === 'Signed' && (d.signedDate || '').startsWith(thisMonth))
    .reduce((s, d) => s + d.value, 0)

  const outstandingInvoices = invoices
    .filter(i => ['Outstanding','Overdue','Sent'].includes(i.status))
    .reduce((s, i) => s + Number(i.amount || 0), 0)

  const pendingPayouts = payouts
    .filter(p => ['Pending','Processing'].includes(p.status))
    .reduce((s, p) => s + Number(p.net || 0), 0)

  // Rough YTD net profit: invoices paid - payouts paid - est expenses
  const paidInvoices = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + Number(i.amount || 0), 0)
  const paidPayouts  = payouts.filter(p => p.status === 'Paid').reduce((s, p) => s + Number(p.net || 0), 0)
  const netProfit    = paidInvoices - paidPayouts

  const pills = [
    { label: 'Total Pipeline',      value: fmtMoney(totalPipeline),       path: '/deals' },
    { label: 'Signed This Month',   value: fmtMoney(signedThisMonth),     path: '/deals' },
    { label: 'Outstanding Invoices',value: fmtMoney(outstandingInvoices), path: '/invoices' },
    { label: 'Pending Payouts',     value: fmtMoney(pendingPayouts),      path: '/payouts' },
    { label: 'Net Profit YTD',      value: fmtMoney(netProfit),           path: '/business-performance' },
  ]

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      background: '#fff', border: '1px solid #EEEEEE', borderRadius: 12, overflow: 'hidden',
    }}>
      {pills.map((p, i) => (
        <button key={p.label}
          onClick={() => navigate(p.path)}
          style={{
            textAlign: 'left', padding: '14px 16px',
            background: 'transparent', border: 'none',
            borderRight: i < pills.length - 1 ? '1px solid #EEEEEE' : 'none',
            cursor: 'pointer', transition: 'background 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <p style={{ fontSize: 11, fontWeight: 500, color: '#888888', margin: 0, marginBottom: 4, letterSpacing: '0.01em' }}>{p.label}</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#111111', margin: 0, letterSpacing: '-0.01em' }}>{p.value}</p>
        </button>
      ))}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate          = useNavigate()
  const { tasks, updateTask, addTask } = useTasks()
  const { invoices }      = useInvoices()
  const { campaigns }     = useCampaigns()
  const { contracts }     = useContracts()
  const payoutsCtx        = usePayouts()
  const payouts           = payoutsCtx.payouts
  const updatePayout      = payoutsCtx.updatePayout

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div style={{ padding: 32, maxWidth: 1280, margin: '0 auto' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontWeight: 600, fontSize: '1.5rem', color: '#111111', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
            Command Center
          </h1>
          <p style={{ fontSize: 13, marginTop: 4, color: '#888888', margin: 0 }}>{dateStr}</p>
        </div>
        <NewDropdown navigate={navigate} />
      </div>

      {/* Top section — 60/40 */}
      <div style={{ display: 'grid', gridTemplateColumns: '60fr 40fr', gap: 24, marginBottom: 24, alignItems: 'stretch' }}>
        <ToDoBox
          tasks={tasks} updateTask={updateTask} addTask={addTask}
          invoices={invoices} campaigns={campaigns} contracts={contracts}
          payouts={payouts} updatePayout={updatePayout}
          navigate={navigate}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <CampaignsBox campaigns={campaigns} navigate={navigate} />
          <DealsBox deals={INITIAL_DEALS} navigate={navigate} />
        </div>
      </div>

      {/* Metrics row */}
      <MetricsRow deals={INITIAL_DEALS} invoices={invoices} payouts={payouts} navigate={navigate} />

    </div>
  )
}
