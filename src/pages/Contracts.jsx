import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useContracts } from '../context/ContractsContext'
import PageHeader from '../components/PageHeader'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_FLOW  = ['Draft', 'Sent', 'Signed']
const KANBAN_COLS  = ['Draft', 'Sent', 'Signed', 'Expired']
const ALL_STATUSES = ['Draft', 'Sent', 'Signed', 'Expired']
const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90', 'Upon Completion']

const STATUS_COLORS = {
  Draft:   { background: '#F3F3F3', color: '#666666' },
  Sent:    { background: '#EEF4FF', color: '#2D5BE3' },
  Signed:  { background: '#EDFAF3', color: '#1A7A4A' },
  Expired: { background: '#FEE2E2', color: '#DC2626' },
}

const KANBAN_STYLE = {
  Draft:   { headerStyle: { background: '#F3F3F3', color: '#666666' },   dotColor: '#9CA3AF',  cntStyle: { background: '#E5E5E5', color: '#666666' } },
  Sent:    { headerStyle: { background: '#EEF4FF', color: '#2D5BE3' },   dotColor: '#2D5BE3',  cntStyle: { background: '#DBEAFE', color: '#2D5BE3' } },
  Signed:  { headerStyle: { background: '#EDFAF3', color: '#1A7A4A' },   dotColor: '#1A7A4A',  cntStyle: { background: '#BBFBE0', color: '#1A7A4A' } },
  Expired: { headerStyle: { background: '#FEE2E2', color: '#DC2626' },   dotColor: '#F87171',  cntStyle: { background: '#FECACA', color: '#DC2626' } },
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtAmt = n =>
  n != null && n !== '' && !isNaN(Number(n)) && Number(n) > 0
    ? `$${Number(n).toLocaleString()}`
    : '—'

const nowStamp = () => {
  const d = new Date()
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

const parseDate = str => {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d) ? null : d
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const XIcon       = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
const ChevRight   = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
const CheckIcon   = () => <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
const PlusIcon    = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
const TrashIcon   = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 3h10M4 3V2h4v1M5 5.5v3M7 5.5v3M2 3l.8 7.5h6.4L10 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
const DocLinkIcon = () => <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 1h10v12H2V1zm2 3h6M4 7h6M4 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const SearchIcon  = () => <svg className="text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>

// ─── Primitives ──────────────────────────────────────────────────────────────

function PlatformTag({ platform }) {
  const a = PLATFORM_ACCENTS[platform] || { border: '#9ca3af', bg: '#f9fafb', text: '#6b7280' }
  return (
    <span style={{ background: a.bg, color: a.text, border: `1px solid ${a.border}` }}
      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap">
      {platform}
    </span>
  )
}

function StatusBadge({ status }) {
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium" style={STATUS_COLORS[status] || { background: '#F3F3F3', color: '#666666' }}>
      {status}
    </span>
  )
}

function Label({ children }) {
  return <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{children}</p>
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white transition-colors cursor-pointer ${
        value ? 'border-gray-400 text-[#111111] bg-gray-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
    >
      <option value="">Any {label}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function EditInput({ label, field, form, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[field] ?? ''}
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
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ─── Deliverables Table ──────────────────────────────────────────────────────

function DeliverablesTable({ deliverables, totalValue }) {
  if (!deliverables?.length) return (
    <div className="border-2 border-dashed border-gray-100 rounded-xl p-5 text-center text-sm text-gray-400">
      No deliverables defined
    </div>
  )
  const rows = deliverables.map(d => ({ ...d, subtotal: (Number(d.quantity) || 0) * (Number(d.rate) || 0) }))
  const computed = rows.reduce((s, d) => s + d.subtotal, 0)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {[['Platform','left'], ['Type','left'], ['Qty','right'], ['Rate','right'], ['Month','left'], ['Subtotal','right']].map(([h, align]) => (
              <th key={h} className={`px-3 py-2.5 text-gray-500 font-semibold uppercase tracking-wide text-${align}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((d, i) => (
            <tr key={d.id || i} className="bg-white hover:bg-gray-50/50 transition-colors">
              <td className="px-3 py-2.5"><PlatformTag platform={d.platform} /></td>
              <td className="px-3 py-2.5 text-gray-700">{d.contentType}</td>
              <td className="px-3 py-2.5 text-gray-600 text-right">{d.quantity}×</td>
              <td className="px-3 py-2.5 text-gray-600 text-right">{fmtAmt(d.rate)}</td>
              <td className="px-3 py-2.5 text-gray-500">{d.month || '—'}</td>
              <td className="px-3 py-2.5 text-gray-800 font-semibold text-right">{fmtAmt(d.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t border-gray-200">
            <td colSpan={5} className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
              Total Contract Value
            </td>
            <td className="px-3 py-2.5 text-sm font-bold text-gray-900 text-right">
              {fmtAmt(totalValue || computed)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── TABLE VIEW ──────────────────────────────────────────────────────────────

function TableRows({ contracts, onSelect, selectedId }) {
  if (!contracts.length) return (
    <tr>
      <td colSpan={9} className="px-5 py-14 text-center text-sm text-gray-400">
        No contracts match your filters
      </td>
    </tr>
  )
  return contracts.map(c => (
    <tr
      key={c.id}
      onClick={() => onSelect(c)}
      className={`hover:bg-gray-50 transition-colors cursor-pointer group ${selectedId === c.id ? 'bg-gray-50/80' : ''}`}
    >
      <td className="px-5 py-3.5">
        <div className="font-semibold text-gray-900 text-sm leading-snug">{c.creator}</div>
        <div className="text-xs text-gray-400 truncate max-w-[150px] mt-0.5">{c.title}</div>
      </td>
      <td className="px-5 py-3.5 text-sm text-gray-600">{c.brand}</td>
      <td className="px-5 py-3.5 text-sm text-gray-500 max-w-[140px] truncate">{c.dealName || '—'}</td>
      <td className="px-5 py-3.5 text-sm text-gray-700 font-semibold text-right tabular-nums">{fmtAmt(c.totalValue)}</td>
      <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
      <td className="px-5 py-3.5 text-xs text-gray-400">{c.createdDate || '—'}</td>
      <td className="px-5 py-3.5 text-xs text-gray-400">{c.signedDate || '—'}</td>
      <td className="px-5 py-3.5 text-sm text-gray-500">{c.manager || '—'}</td>
      <td className="px-4 py-3.5 text-right text-gray-300 group-hover:text-gray-400 transition-colors">
        <ChevRight />
      </td>
    </tr>
  ))
}

const TABLE_COLS = ['Creator', 'Brand', 'Deal', 'Value', 'Status', 'Created', 'Signed', 'Manager', '']

function TableHead() {
  return (
    <thead>
      <tr className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wide border-b border-gray-200">
        {TABLE_COLS.map((h, i) => (
          <th key={i} className={`px-5 py-3 font-semibold ${h === 'Value' ? 'text-right' : 'text-left'}`}>{h}</th>
        ))}
      </tr>
    </thead>
  )
}

function TableView({ contracts, onSelect, selectedId, groupBy }) {
  const wrap = rows => (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <TableHead />
        <tbody className="divide-y divide-gray-100">
          <TableRows contracts={rows} onSelect={onSelect} selectedId={selectedId} />
        </tbody>
      </table>
    </div>
  )

  if (groupBy === 'status') {
    const groups = ALL_STATUSES.map(s => ({ key: s, rows: contracts.filter(c => c.status === s) })).filter(g => g.rows.length)
    return (
      <div className="space-y-5">
        {groups.map(({ key, rows }) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2.5">
              <StatusBadge status={key} />
              <span className="text-xs text-gray-400">{rows.length}</span>
            </div>
            {wrap(rows)}
          </div>
        ))}
        {!groups.length && wrap([])}
      </div>
    )
  }

  if (groupBy === 'manager') {
    const managers = [...new Set(contracts.map(c => c.manager || 'Unassigned'))]
    return (
      <div className="space-y-5">
        {managers.map(m => {
          const rows = contracts.filter(c => (c.manager || 'Unassigned') === m)
          return (
            <div key={m}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm font-semibold text-gray-700">{m}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{rows.length}</span>
              </div>
              {wrap(rows)}
            </div>
          )
        })}
        {!managers.length && wrap([])}
      </div>
    )
  }

  return wrap(contracts)
}

// ─── KANBAN VIEW ─────────────────────────────────────────────────────────────

function KanbanCard({ contract, onSelect }) {
  return (
    <div
      onClick={() => onSelect(contract)}
      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
    >
      <p className="text-[13px] font-semibold text-gray-900 leading-snug mb-0.5">
        {contract.creator} <span className="text-gray-400 font-normal">×</span> {contract.brand}
      </p>
      <p className="text-xs text-gray-500 mb-3 line-clamp-1">{contract.title}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-800">{fmtAmt(contract.totalValue)}</span>
        <span className="text-[11px] text-gray-400">
          {contract.signedDate || contract.createdDate || '—'}
        </span>
      </div>
      {contract.dealName && (
        <p className="text-[11px] text-gray-500 mt-2 font-medium truncate">↗ {contract.dealName}</p>
      )}
    </div>
  )
}

function KanbanView({ contracts, onSelect }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {KANBAN_COLS.map(col => {
        const s = KANBAN_STYLE[col]
        const cards = contracts.filter(c => c.status === col)
        return (
          <div key={col} className="min-h-[240px]">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={s.headerStyle}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.dotColor }} />
              <span className="text-xs font-bold uppercase tracking-wide flex-1">{col}</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={s.cntStyle}>{cards.length}</span>
            </div>
            <div className="space-y-3">
              {cards.map(c => <KanbanCard key={c.id} contract={c} onSelect={onSelect} />)}
              {!cards.length && (
                <div className="border-2 border-dashed border-gray-100 rounded-xl p-6 text-center">
                  <p className="text-xs text-gray-300">No contracts</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── MONTHLY VIEW ────────────────────────────────────────────────────────────

function MonthlyView({ contracts, onSelect, selectedId }) {
  const groups = useMemo(() => {
    const g = {}
    contracts.forEach(c => {
      let key = 'No Signed Date'
      if (c.signedDate) {
        const d = parseDate(c.signedDate)
        key = d ? d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : c.signedDate
      }
      if (!g[key]) g[key] = []
      g[key].push(c)
    })
    return g
  }, [contracts])

  const sortedKeys = useMemo(() =>
    Object.keys(groups).sort((a, b) => {
      if (a === 'No Signed Date') return 1
      if (b === 'No Signed Date') return -1
      return new Date(b) - new Date(a)
    }),
    [groups]
  )

  if (!sortedKeys.length) return (
    <div className="text-center py-16 text-sm text-gray-400">No contracts match your filters</div>
  )

  return (
    <div className="space-y-6">
      {sortedKeys.map(month => (
        <div key={month}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-bold text-gray-700">{month}</h3>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {groups[month].length}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wide border-b border-gray-200">
                  {['Creator', 'Brand', 'Deal', 'Value', 'Status', 'Signed', 'Manager', ''].map((h, i) => (
                    <th key={i} className={`px-5 py-2.5 font-semibold ${h === 'Value' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groups[month].map(c => (
                  <tr key={c.id} onClick={() => onSelect(c)}
                    className={`hover:bg-gray-50 transition-colors cursor-pointer group ${selectedId === c.id ? 'bg-gray-50/80' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{c.creator}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[130px]">{c.title}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{c.brand}</td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-[130px] truncate">{c.dealName || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-700 font-semibold text-right tabular-nums">{fmtAmt(c.totalValue)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{c.signedDate || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{c.manager || '—'}</td>
                    <td className="px-4 py-3.5 text-right text-gray-300 group-hover:text-gray-400 transition-colors"><ChevRight /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── CONTRACT DETAIL PANEL ───────────────────────────────────────────────────

function ContractDetail({ contract, onClose, onUpdate }) {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm]           = useState({})
  const [newTask, setNewTask]     = useState('')

  // Re-initialise only when the selected contract changes
  useEffect(() => {
    if (contract) setForm({ ...contract })
    setIsEditing(false)
    setNewTask('')
  }, [contract?.id])

  if (!contract) return null

  const handleChange = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  const handleSave = () => {
    onUpdate({
      ...form,
      activityLog: [
        { action: 'Contract details updated', timestamp: nowStamp(), by: form.manager || 'Manager' },
        ...(form.activityLog || []),
      ],
    })
    setIsEditing(false)
  }

  const handleStatusStep = newStatus => {
    if (newStatus === contract.status) return
    onUpdate({
      ...contract,
      status: newStatus,
      signedDate:
        newStatus === 'Signed' && !contract.signedDate
          ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : contract.signedDate,
      activityLog: [
        { action: `Status → ${newStatus}`, timestamp: nowStamp(), by: contract.manager || 'Manager' },
        ...(contract.activityLog || []),
      ],
    })
  }

  const handleAddTask = () => {
    const text = newTask.trim()
    if (!text) return
    const task = {
      id: Date.now(),
      text,
      done: false,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    onUpdate({
      ...contract,
      tasks: [...(contract.tasks || []), task],
      activityLog: [
        { action: `Task added: "${text}"`, timestamp: nowStamp(), by: contract.manager || 'Manager' },
        ...(contract.activityLog || []),
      ],
    })
    setNewTask('')
  }

  const handleToggleTask = id =>
    onUpdate({ ...contract, tasks: (contract.tasks || []).map(t => t.id === id ? { ...t, done: !t.done } : t) })

  const handleDeleteTask = id =>
    onUpdate({ ...contract, tasks: (contract.tasks || []).filter(t => t.id !== id) })

  const currentIdx    = STATUS_FLOW.indexOf(contract.status)
  const nextStep      = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null
  const commission    = contract.commissionRate && contract.totalValue > 0
    ? Math.round(Number(contract.totalValue) * Number(contract.commissionRate) / 100)
    : null
  const tasks         = contract.tasks || []
  const doneTasks     = tasks.filter(t => t.done).length
  const activityLog   = contract.activityLog || []

  return (
    <aside className="flex flex-col h-full w-[min(760px,88vw)] bg-white border-l border-gray-200 shadow-2xl">

      {/* ── Panel header ── */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
        <div className="min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Contract</span>
            <StatusBadge status={contract.status} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">
            {contract.creator}
            <span className="text-gray-400 font-light mx-1.5">×</span>
            {contract.brand}
          </h2>
          {contract.title && (
            <p className="text-sm text-gray-500 mt-0.5">{contract.title}</p>
          )}
          {contract.manager && (
            <p className="text-xs text-gray-400 mt-1">
              <span className="text-gray-300">Manager:</span> {contract.manager}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!isEditing && (
            <button
              onClick={() => { setForm({ ...contract }); setIsEditing(true) }}
              className="text-xs font-semibold text-[#111111] hover:opacity-70 px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XIcon />
          </button>
        </div>
      </div>

      {/* ── Status stepper ── */}
      {!isEditing && STATUS_FLOW.includes(contract.status) && (
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            {STATUS_FLOW.map((s, i) => {
              const isCurrent = s === contract.status
              const isDone    = currentIdx > i
              const btnStyle = isCurrent
                ? STATUS_COLORS[s] || { background: '#F3F3F3', color: '#666666' }
                : isDone
                  ? { background: '#EDFAF3', color: '#1A7A4A' }
                  : { color: '#9CA3AF' }
              return (
                <div key={s} className="flex items-center gap-1.5">
                  {i > 0 && <div className="w-8 h-px" style={{ background: isDone ? '#86EFAC' : '#E5E7EB' }} />}
                  <button
                    onClick={() => handleStatusStep(s)}
                    className="px-3 py-1 rounded-full text-[11px] font-semibold transition-colors"
                    style={btnStyle}
                  >
                    {isDone && <span className="mr-1" style={{ color: '#1A7A4A' }}>✓</span>}
                    {s}
                  </button>
                </div>
              )
            })}
          </div>
          {nextStep && (
            <button
              onClick={() => handleStatusStep(nextStep)}
              className="text-[11px] font-semibold text-[#111111] hover:opacity-70 px-3 py-1 rounded-full hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              → {nextStep}
            </button>
          )}
        </div>
      )}

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        {isEditing ? (

          /* ══ EDIT MODE ══ */
          <div className="p-6 space-y-4">
            <EditInput label="Contract Title" field="title" form={form} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-3">
              <EditInput label="Creator" field="creator" form={form} onChange={handleChange} />
              <EditInput label="Brand"   field="brand"   form={form} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <EditInput   label="Manager"    field="manager"    form={form} onChange={handleChange} />
              <EditSelect  label="Status"     field="status"     form={form} onChange={handleChange} options={ALL_STATUSES} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <EditInput  label="Commission Rate (%)" field="commissionRate" form={form} onChange={handleChange} />
              <EditSelect label="Payment Terms"       field="paymentTerms"  form={form} onChange={handleChange} options={PAYMENT_TERMS} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <EditInput label="Signed Date" field="signedDate" form={form} onChange={handleChange} placeholder="e.g. Mar 15, 2026" />
              <EditInput label="Expires"     field="expires"    form={form} onChange={handleChange} placeholder="e.g. Mar 14, 2027" />
            </div>
            <EditInput label="Deal Name" field="dealName" form={form} onChange={handleChange} />
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</label>
              <textarea
                value={form.notes ?? ''}
                onChange={e => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={handleSave}
                className="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}
              >
                Save changes
              </button>
              <button
                onClick={() => { setForm({ ...contract }); setIsEditing(false) }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

        ) : (

          /* ══ READ MODE ══ */
          <div className="p-6 space-y-7">

            {/* Key metric cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1.5">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">{fmtAmt(contract.totalValue)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1.5">
                  Commission{contract.commissionRate ? ` (${contract.commissionRate}%)` : ''}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {commission !== null ? fmtAmt(commission) : '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1.5">Payment Terms</p>
                <p className="text-xl font-bold text-gray-900">{contract.paymentTerms || '—'}</p>
              </div>
            </div>

            {/* Meta fields */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {contract.createdDate && (
                <div><Label>Created</Label><p className="text-sm text-gray-700">{contract.createdDate}</p></div>
              )}
              {contract.signedDate && (
                <div><Label>Signed</Label><p className="text-sm text-gray-700">{contract.signedDate}</p></div>
              )}
              {contract.expires && (
                <div><Label>Expires</Label><p className="text-sm text-gray-700">{contract.expires}</p></div>
              )}
              <div>
                <Label>Creator</Label>
                <button
                  onClick={() => { onClose(); navigate(`/roster?open=${contract.creatorId}`) }}
                  className="text-sm text-[#111111] hover:underline transition-colors"
                >
                  {contract.creator}
                </button>
              </div>
              <div>
                <Label>Brand</Label>
                <button
                  onClick={() => { onClose(); navigate(`/contacts?tab=brands&open=${contract.brandId}`) }}
                  className="text-sm text-[#111111] hover:underline transition-colors"
                >
                  {contract.brand}
                </button>
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <Label>Deliverables</Label>
              <DeliverablesTable deliverables={contract.deliverables} totalValue={contract.totalValue} />
            </div>

            {/* Linked deal */}
            {contract.dealName && (
              <div>
                <Label>Linked Deal</Label>
                <button
                  onClick={() => { onClose(); navigate(`/deals?open=${contract.dealId}`) }}
                  className="flex items-center gap-2 text-sm text-[#111111] hover:underline transition-colors group"
                >
                  <DocLinkIcon />
                  <span>{contract.dealName}</span>
                  <span className="text-gray-300 group-hover:text-gray-600 transition-colors"><ChevRight /></span>
                </button>
              </div>
            )}

            {/* Linked campaigns */}
            {contract.campaignIds?.length > 0 && (
              <div>
                <Label>Linked Campaigns ({contract.campaignIds.length})</Label>
                <div className="space-y-1">
                  {(contract.campaignNames || []).map((name, i) => (
                    <button
                      key={contract.campaignIds[i]}
                      onClick={() => { onClose(); navigate('/campaigns') }}
                      className="flex items-center gap-2 text-sm text-[#111111] hover:underline transition-colors w-full text-left"
                    >
                      <span className="text-gray-300">›</span>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {contract.notes && (
              <div>
                <Label>Notes</Label>
                <p className="text-sm text-gray-600 leading-relaxed rounded-xl p-4" style={{ background: '#FAFAF8', border: '1px solid #EEEEEE' }}>
                  {contract.notes}
                </p>
              </div>
            )}

            {/* ── Tasks ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Label>Tasks</Label>
                {tasks.length > 0 && (
                  <span className="text-[11px] text-gray-400 -mt-1.5">
                    {doneTasks}/{tasks.length} done
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {tasks.length > 0 && (
                <div className="h-1 bg-gray-100 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500" style={{ background: '#1A7A4A' }}
                    style={{ width: `${tasks.length ? (doneTasks / tasks.length) * 100 : 0}%` }}
                  />
                </div>
              )}

              <div className="space-y-1 mb-3">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 group px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-4 h-4 rounded border-[1.5px] shrink-0 flex items-center justify-center transition-colors ${
                        task.done
                          ? 'text-white'
                          : 'border-gray-300 hover:border-gray-400 bg-white'
                      }`}
                      style={task.done ? { background: '#1A7A4A', borderColor: '#1A7A4A' } : {}}
                    >
                      {task.done && <CheckIcon />}
                    </button>
                    <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.text}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
                {!tasks.length && (
                  <p className="text-sm text-gray-400 px-3 py-1">No tasks yet</p>
                )}
              </div>

              {/* Add task */}
              <div className="flex items-center gap-2">
                <input
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                  placeholder="Add a task…"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                />
                <button
                  onClick={handleAddTask}
                  disabled={!newTask.trim()}
                  className="px-3 py-2 text-[#111111] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <PlusIcon size={12} />
                </button>
              </div>
            </div>

            {/* ── Activity log ── */}
            {activityLog.length > 0 && (
              <div>
                <Label>Activity</Label>
                <div className="space-y-3.5">
                  {activityLog.map((log, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-[7px] shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700">{log.action}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {log.timestamp}{log.by ? ` · ${log.by}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </aside>
  )
}

// ─── ADD CONTRACT MODAL ──────────────────────────────────────────────────────

function AddContractModal({ onClose, onAdd }) {
  const DELIVERABLE_MONTHS_LOCAL = (() => {
    const result = []
    for (let year = 2026; year <= 2027; year++) {
      for (let m = 0; m < 12; m++) {
        result.push(new Date(year, m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
      }
    }
    return result
  })()

  const emptyRow = () => ({ id: Date.now() + Math.random(), platform: 'Instagram', contentType: 'Reel', quantity: 1, rate: 0, month: DELIVERABLE_MONTHS_LOCAL[0] })
  const [form, setForm] = useState({
    title: '', creator: '', creatorId: null, brand: '', brandId: null,
    dealId: null, dealName: '', manager: 'Marjorie A.',
    createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    signedDate: null, expires: null,
    paymentTerms: 'Net 30', commissionRate: '20', status: 'Draft', notes: '',
  })
  const [deliverables, setDeliverables] = useState([emptyRow()])
  const [errors, setErrors] = useState({})

  const ch = (field, val) => { setForm(p => ({ ...p, [field]: val })); setErrors(p => ({ ...p, [field]: '' })) }
  const totalValue = deliverables.reduce((sum, r) => sum + (Number(r.rate) * Number(r.quantity || 1)), 0)

  const addRow = () => setDeliverables(p => [...p, emptyRow()])
  const removeRow = (id) => setDeliverables(p => p.filter(r => r.id !== id))
  const updateRow = (id, field, val) => setDeliverables(p => p.map(r => r.id === id ? { ...r, [field]: val } : r))

  const PLATFORM_OPTS = ['Instagram', 'TikTok', 'YouTube', 'Podcast', 'Blog', 'Twitter/X', 'Pinterest']
  const CONTENT_TYPE_OPTS = ['Story', 'Reel', 'Post', 'Video', 'Integration', 'Dedicated Video', 'Series']
  const PAYMENT_OPTS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90', 'Upon Completion']
  const MANAGERS_LOCAL = ['Marjorie A.', 'Devon Park', 'Sienna Moore', 'Rafi Okafor']
  const STATUS_OPTS = ['Draft', 'Sent', 'Signed', 'Expired']

  const inputCls = (field) => `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  const handleSubmit = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = true
    if (!form.creator.trim()) errs.creator = true
    if (!form.brand.trim()) errs.brand = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    onAdd({ ...form, deliverables, totalValue })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="relative z-10 ml-auto w-[560px] h-full bg-white border-l border-gray-200 overflow-y-auto shadow-xl flex flex-col">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">New Contract</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-5 flex-1">
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Contract Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={e => ch('title', e.target.value)} placeholder="e.g. Q2 2026 Partnership Agreement" className={inputCls('title')} />
            {errors.title && <p className="text-xs text-red-500 mt-1">Title is required</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Creator <span className="text-red-400">*</span></label>
              <input value={form.creator} onChange={e => ch('creator', e.target.value)} placeholder="Sofia Chen" className={inputCls('creator')} />
              {errors.creator && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Brand <span className="text-red-400">*</span></label>
              <input value={form.brand} onChange={e => ch('brand', e.target.value)} placeholder="Luminary Beauty" className={inputCls('brand')} />
              {errors.brand && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Manager</label>
              <select value={form.manager} onChange={e => ch('manager', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                {MANAGERS_LOCAL.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Status</label>
              <select value={form.status} onChange={e => ch('status', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Commission Rate (%)</label>
              <input type="number" value={form.commissionRate} onChange={e => ch('commissionRate', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Payment Terms</label>
              <select value={form.paymentTerms} onChange={e => ch('paymentTerms', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                {PAYMENT_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Signed Date</label>
              <input type="date" value={form.signedDate || ''} onChange={e => ch('signedDate', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Expires</label>
              <input type="date" value={form.expires || ''} onChange={e => ch('expires', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide">Deliverables</label>
              <button onClick={addRow} className="text-xs text-[#111111] hover:opacity-70 font-medium">+ Add row</button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['Platform', 'Content Type', 'Qty', 'Rate ($)', 'Month', ''].map(h => (
                      <th key={h} className="px-2 py-2 text-left font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deliverables.map(row => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="px-2 py-1.5">
                        <select value={row.platform} onChange={e => updateRow(row.id, 'platform', e.target.value)} className="w-full text-xs border-none bg-transparent focus:outline-none">
                          {PLATFORM_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={row.contentType} onChange={e => updateRow(row.id, 'contentType', e.target.value)} className="w-full text-xs border-none bg-transparent focus:outline-none">
                          {CONTENT_TYPE_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={row.quantity} onChange={e => updateRow(row.id, 'quantity', e.target.value)} className="w-12 text-xs border-none bg-transparent focus:outline-none" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={row.rate} onChange={e => updateRow(row.id, 'rate', e.target.value)} className="w-20 text-xs border-none bg-transparent focus:outline-none" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={row.month} onChange={e => updateRow(row.id, 'month', e.target.value)} className="w-full text-xs border-none bg-transparent focus:outline-none">
                          {DELIVERABLE_MONTHS_LOCAL.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeRow(row.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalValue > 0 && <p className="text-xs text-gray-500 mt-1.5">Total value: <span className="font-semibold text-gray-800">${totalValue.toLocaleString()}</span></p>}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => ch('notes', e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button onClick={handleSubmit} className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>Create Contract</button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Contracts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { contracts, setContracts } = useContracts()
  const [showAdd, setShowAdd] = useState(false)

  // View
  const [view,    setView]    = useState('table')
  const [groupBy, setGroupBy] = useState('none')

  // Filters
  const [search,         setSearch]         = useState('')
  const [filterCreator,  setFilterCreator]  = useState('')
  const [filterBrand,    setFilterBrand]    = useState('')
  const [filterStatus,   setFilterStatus]   = useState('')
  const [filterManager,  setFilterManager]  = useState('')
  const [dateFrom,       setDateFrom]       = useState('')
  const [dateTo,         setDateTo]         = useState('')

  // Detail panel
  const [selectedId, setSelectedId] = useState(null)
  const selected = contracts.find(c => c.id === selectedId) ?? null

  // Open via ?open= URL param
  useEffect(() => {
    const openId = parseInt(searchParams.get('open'))
    if (openId && contracts.find(c => c.id === openId)) setSelectedId(openId)
  }, [searchParams, contracts])

  const handleSelect = contract => setSelectedId(contract.id)

  const handleClose = () => {
    setSelectedId(null)
    if (searchParams.get('open')) setSearchParams({})
  }

  const handleUpdate = updated =>
    setContracts(prev => prev.map(c => c.id === updated.id ? updated : c))

  const handleAdd = (newContract) => {
    const id = Math.max(0, ...contracts.map(c => c.id)) + 1
    const invoiceId = `CTR-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`
    setContracts(prev => [{
      ...newContract,
      id,
      tasks: [],
      activityLog: [{ action: 'Contract created', timestamp: new Date().toLocaleString(), by: newContract.manager || 'Marjorie A.' }],
      campaignIds: [],
      campaignNames: [],
    }, ...prev])
  }

  // Unique options for dropdowns
  const uniqueCreators = useMemo(() => [...new Set(contracts.map(c => c.creator).filter(Boolean))].sort(), [contracts])
  const uniqueBrands   = useMemo(() => [...new Set(contracts.map(c => c.brand).filter(Boolean))].sort(), [contracts])
  const uniqueManagers = useMemo(() => [...new Set(contracts.map(c => c.manager).filter(Boolean))].sort(), [contracts])

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return contracts.filter(c => {
      if (q && !`${c.creator} ${c.brand} ${c.title} ${c.dealName} ${c.manager}`.toLowerCase().includes(q)) return false
      if (filterCreator && c.creator !== filterCreator)         return false
      if (filterBrand   && c.brand   !== filterBrand)           return false
      if (filterStatus  && c.status  !== filterStatus)          return false
      if (filterManager && (c.manager || '') !== filterManager) return false
      if (dateFrom) {
        const d = parseDate(c.signedDate || c.createdDate)
        if (!d || d < new Date(dateFrom)) return false
      }
      if (dateTo) {
        const d = parseDate(c.signedDate || c.createdDate)
        if (!d || d > new Date(dateTo)) return false
      }
      return true
    })
  }, [contracts, search, filterCreator, filterBrand, filterStatus, filterManager, dateFrom, dateTo])

  const hasFilters  = search || filterCreator || filterBrand || filterStatus || filterManager || dateFrom || dateTo
  const clearAll    = () => { setSearch(''); setFilterCreator(''); setFilterBrand(''); setFilterStatus(''); setFilterManager(''); setDateFrom(''); setDateTo('') }
  const totalValue  = filtered.reduce((s, c) => s + (Number(c.totalValue) || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="p-6 max-w-7xl mx-auto">

        <PageHeader
          title="Contracts"
          subtitle={`${filtered.length} contract${filtered.length !== 1 ? 's' : ''}${totalValue > 0 ? ` · $${totalValue.toLocaleString()} total value` : ''}`}
          action={
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>
              <PlusIcon size={12} />
              New Contract
            </button>
          }
        />

        {/* ── View toggle ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {[
              ['table',   'Table'],
              ['kanban',  'Kanban'],
              ['monthly', 'Monthly'],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${view === v ? '#111111' : '#EEEEEE'}`,
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontWeight: 500,
                  fontSize: 13,
                  color: view === v ? '#111111' : '#888888',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {view === 'table' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Group by</span>
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value)}
                className="h-8 pl-2.5 pr-7 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none"
              >
                <option value="none">None</option>
                <option value="status">Status</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          )}
        </div>

        {/* ── Filter bar ── */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contracts…"
              className="h-8 pl-8 pr-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 w-48"
            />
          </div>
          <FilterSelect label="Creator" value={filterCreator} onChange={setFilterCreator} options={uniqueCreators} />
          <FilterSelect label="Brand"   value={filterBrand}   onChange={setFilterBrand}   options={uniqueBrands} />
          <FilterSelect label="Status"  value={filterStatus}  onChange={setFilterStatus}  options={ALL_STATUSES} />
          <FilterSelect label="Manager" value={filterManager} onChange={setFilterManager} options={uniqueManagers} />
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-600"
            />
            <span>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-600"
            />
          </div>
          {hasFilters && (
            <button onClick={clearAll} className="h-8 px-2.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Clear all
            </button>
          )}
          <span className="text-xs text-gray-400 ml-1">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* ── Main view ── */}
        {view === 'table'   && <TableView   contracts={filtered} onSelect={handleSelect} selectedId={selectedId} groupBy={groupBy} />}
        {view === 'kanban'  && <KanbanView  contracts={filtered} onSelect={handleSelect} />}
        {view === 'monthly' && <MonthlyView contracts={filtered} onSelect={handleSelect} selectedId={selectedId} />}

      </div>

      {/* ── Backdrop ── */}
      {selectedId && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* ── Detail panel ── */}
      <div
        className={`fixed right-0 top-0 z-50 h-full transition-transform duration-300 ease-out ${
          selected ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selected && (
          <ContractDetail
            contract={selected}
            onClose={handleClose}
            onUpdate={handleUpdate}
          />
        )}
      </div>
      {showAdd && <AddContractModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}
