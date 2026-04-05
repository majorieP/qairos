import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { usePayouts } from '../context/PayoutsContext'
import { useInvoices, fmtInvoiceAmt } from '../context/InvoicesContext'
import BrandLogo from '../components/BrandLogo'

// ── Creator photos ─────────────────────────────────────────────────────────────
const CREATOR_PHOTO_MAP = { 1:'women/12', 2:'men/10', 3:'women/22', 4:'men/20', 5:'women/32', 6:'women/26', 7:'men/15', 8:'women/44', 9:'men/25', 10:'women/8' }
function creatorPhotoUrl(id) {
  const p = CREATOR_PHOTO_MAP[id]
  if (p) return `https://randomuser.me/api/portraits/${p}.jpg`
  if (!id) return null
  const n = ((id * 7) % 49) + 1
  return `https://randomuser.me/api/portraits/${id % 2 === 0 ? 'men' : 'women'}/${n}.jpg`
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  Paid:       { background: '#EDFAF3', color: '#1A7A4A' },
  Processing: { background: '#EEF4FF', color: '#2D5BE3' },
  Pending:    { background: '#FFF4EC', color: '#C4622D' },
}

const STATUS_DOT = {
  Paid:       'bg-emerald-500',
  Processing: 'bg-blue-500',
  Pending:    'bg-amber-400',
}

const STATUSES = ['Pending', 'Processing', 'Paid']

const VIEWS = [
  { id: 'table',   label: 'Table'      },
  { id: 'kanban',  label: 'Kanban'     },
  { id: 'monthly', label: 'Monthly'    },
  { id: 'creator', label: 'By Creator' },
]

const GROUP_BY_OPTIONS = ['None', 'Status', 'Month', 'Creator', 'Manager']

// ── Formatters ─────────────────────────────────────────────────────────────────

const $ = (n) => fmtInvoiceAmt(n)

function fmtTimestamp(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-400">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDown({ className = '' }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className}>
      <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRight({ className = '' }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className}>
      <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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

function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M8 1h3v3M5.5 6.5l5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BankIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="6" width="12" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 6l6-5 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.5" y="8" width="1.5" height="3" rx="0.5" fill="currentColor" />
      <rect x="6.25" y="8" width="1.5" height="3" rx="0.5" fill="currentColor" />
      <rect x="9" y="8" width="1.5" height="3" rx="0.5" fill="currentColor" />
    </svg>
  )
}

// ── Small reusable components ──────────────────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={STATUS_COLORS[status] || { background: '#F3F3F3', color: '#666666' }}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || 'bg-gray-400'}`} />
      {status}
    </span>
  )
}

function MetricCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? 'text-[#111111]' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function Field({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  )
}

function LinkField({ label, value, onClick }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 text-sm text-[#111111] hover:underline transition-colors"
      >
        {value}
        <LinkIcon />
      </button>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent cursor-pointer"
    >
      <option value="">{label}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function GroupHeader({ label, count, total, isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
    >
      <span className={`transition-transform duration-150 text-gray-400 ${isOpen ? 'rotate-90' : ''}`}>
        <ChevronRight />
      </span>
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      <span className="text-xs text-gray-400 ml-1">{count} payout{count !== 1 ? 's' : ''}</span>
      {total != null && (
        <span className="ml-auto text-xs font-medium text-gray-600">{$(total)}</span>
      )}
    </button>
  )
}

// ── Table View ─────────────────────────────────────────────────────────────────

function TableView({ payouts, onSelect, groupBy }) {
  const [openGroups, setOpenGroups] = useState({})
  const toggleGroup = (key) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))

  const cols = ['Creator', 'Brand', 'Campaign', 'Gross', 'Commission', 'Net to Creator', 'Status', 'Due Date', 'Paid Date', 'Manager']

  const tableHeader = (
    <thead>
      <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
        {cols.map((c) => (
          <th key={c} className={`px-5 py-3 font-medium ${['Gross','Commission','Net to Creator'].includes(c) ? 'text-right' : 'text-left'}`}>
            {c}
          </th>
        ))}
        <th className="px-4 py-3 w-8" />
      </tr>
    </thead>
  )

  function PayoutRow({ p }) {
    return (
      <tr
        key={p.id}
        onClick={() => onSelect(p)}
        className="border-t border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group"
      >
        <td className="px-5 py-3.5 whitespace-nowrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {creatorPhotoUrl(p.creatorId) && (
              <img src={creatorPhotoUrl(p.creatorId)} alt={p.creator}
                style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            )}
            <span className="font-medium text-gray-800">{p.creator}</span>
          </div>
        </td>
        <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <BrandLogo name={p.brand} size={24} />
            <span>{p.brand}</span>
          </div>
        </td>
        <td className="px-5 py-3.5 text-gray-500 text-xs max-w-[180px] truncate">{p.campaign}</td>
        <td className="px-5 py-3.5 text-right text-gray-700 tabular-nums">{$(p.gross)}</td>
        <td className="px-5 py-3.5 text-right text-gray-400 tabular-nums">{$(p.commission)}</td>
        <td className="px-5 py-3.5 text-right font-semibold text-gray-800 tabular-nums">{$(p.net)}</td>
        <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
        <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{p.dueDate || '—'}</td>
        <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{p.paidDate || '—'}</td>
        <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{p.manager}</td>
        <td className="px-4 py-3.5 text-gray-300 group-hover:text-gray-400 text-right">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </td>
      </tr>
    )
  }

  if (!groupBy || groupBy === 'None') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          {tableHeader}
          <tbody>
            {payouts.length === 0 ? (
              <tr><td colSpan={11} className="px-5 py-12 text-center text-sm text-gray-400">No payouts match your filters.</td></tr>
            ) : (
              payouts.map((p) => <PayoutRow key={p.id} p={p} />)
            )}
          </tbody>
        </table>
      </div>
    )
  }

  // Grouped table
  const groupKey = groupBy === 'Status' ? 'status' : groupBy === 'Month' ? 'month' : groupBy === 'Creator' ? 'creator' : 'manager'
  const groups = {}
  payouts.forEach((p) => {
    const k = p[groupKey] || 'Unknown'
    if (!groups[k]) groups[k] = []
    groups[k].push(p)
  })

  // Order groups
  const orderedKeys = groupBy === 'Status'
    ? STATUSES.filter((s) => groups[s])
    : Object.keys(groups).sort()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        {tableHeader}
        <tbody>
          {orderedKeys.map((key) => {
            const rows = groups[key]
            const isOpen = openGroups[key] !== false // default open
            const total = rows.reduce((s, p) => s + p.net, 0)
            return (
              <>
                <tr key={`group-${key}`}>
                  <td colSpan={11} className="p-0">
                    <GroupHeader
                      label={key}
                      count={rows.length}
                      total={total}
                      isOpen={isOpen}
                      onToggle={() => toggleGroup(key)}
                    />
                  </td>
                </tr>
                {isOpen && rows.map((p) => <PayoutRow key={p.id} p={p} />)}
              </>
            )
          })}
          {orderedKeys.length === 0 && (
            <tr><td colSpan={11} className="px-5 py-12 text-center text-sm text-gray-400">No payouts match your filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Kanban View ────────────────────────────────────────────────────────────────

function KanbanView({ payouts, onSelect }) {
  const columns = [
    { status: 'Pending',    label: 'Pending',    accentColor: '#C4622D', headStyle: { background: '#FFF4EC', color: '#C4622D' } },
    { status: 'Processing', label: 'Processing', accentColor: '#2D5BE3', headStyle: { background: '#EEF4FF', color: '#2D5BE3' } },
    { status: 'Paid',       label: 'Paid',       accentColor: '#1A7A4A', headStyle: { background: '#EDFAF3', color: '#1A7A4A' } },
  ]

  return (
    <div className="p-4 grid grid-cols-3 gap-4 min-h-[400px]">
      {columns.map(({ status, label, accentColor, headStyle }) => {
        const cards = payouts.filter((p) => p.status === status)
        const total = cards.reduce((s, p) => s + p.net, 0)
        return (
          <div key={status} className="flex flex-col">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-t-lg border-t-4 mb-2" style={{ ...headStyle, borderTopColor: accentColor }}>
              <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
              <span className="text-xs font-medium">{cards.length}</span>
            </div>
            {status === 'Pending' && total > 0 && (
              <div className="mb-2 px-3 py-1.5 rounded-lg text-center" style={{ background: '#FFF4EC', border: '1px solid #FDD5B8' }}>
                <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#C4622D' }}>Total owed</p>
                <p className="text-sm font-bold" style={{ color: '#C4622D' }}>{$(total)}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {cards.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="bg-white border border-gray-200 rounded-lg p-3.5 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{p.creator}</p>
                    <span className="text-sm font-bold text-gray-700 shrink-0 tabular-nums">{$(p.net)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BrandLogo name={p.brand} size={20} />
                    <span>{p.brand}</span>
                  </div>
                  {p.dueDate && (
                    <div className="flex items-center gap-1 mt-auto">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="text-gray-300">
                        <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      <span className="text-[10px] text-gray-400">Due {p.dueDate}</span>
                    </div>
                  )}
                </div>
              ))}
              {cards.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-6">No {label.toLowerCase()} payouts</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Monthly View ───────────────────────────────────────────────────────────────

function MonthlyView({ payouts, onSelect }) {
  const [openMonths, setOpenMonths] = useState({})
  const toggle = (m) => setOpenMonths((prev) => ({ ...prev, [m]: !prev[m] }))

  const groups = {}
  payouts.forEach((p) => {
    const k = p.month || 'Unknown'
    if (!groups[k]) groups[k] = []
    groups[k].push(p)
  })

  // Sort months chronologically
  const monthOrder = ['January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026', 'June 2026']
  const keys = Object.keys(groups).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b))

  return (
    <div className="divide-y divide-gray-100">
      {keys.map((month) => {
        const rows = groups[month]
        const isOpen = openMonths[month] !== false
        const totalNet = rows.reduce((s, p) => s + p.net, 0)
        const totalGross = rows.reduce((s, p) => s + p.gross, 0)
        const paidCount = rows.filter((p) => p.status === 'Paid').length
        const pendingCount = rows.filter((p) => p.status !== 'Paid').length

        return (
          <div key={month}>
            <button
              onClick={() => toggle(month)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <span className={`text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}>
                <ChevronRight />
              </span>
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-800">{month}</span>
                <span className="ml-3 text-xs text-gray-400">{rows.length} payout{rows.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {paidCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {paidCount} paid
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {pendingCount} pending
                  </span>
                )}
                <span className="font-semibold text-gray-700">{$(totalNet)} net</span>
                <span className="text-gray-400">{$(totalGross)} gross</span>
              </div>
            </button>

            {isOpen && (
              <div className="bg-gray-50/60 border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wide">
                      <th className="px-8 py-2 text-left font-medium">Creator</th>
                      <th className="px-5 py-2 text-left font-medium">Brand</th>
                      <th className="px-5 py-2 text-right font-medium">Gross</th>
                      <th className="px-5 py-2 text-right font-medium">Net to Creator</th>
                      <th className="px-5 py-2 text-left font-medium">Status</th>
                      <th className="px-5 py-2 text-left font-medium">Due Date</th>
                      <th className="px-5 py-2 text-left font-medium">Manager</th>
                      <th className="px-4 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => onSelect(p)}
                        className="hover:bg-white transition-colors cursor-pointer group"
                      >
                        <td className="px-8 py-3 font-medium text-gray-800">{p.creator}</td>
                        <td className="px-5 py-3 text-gray-500">{p.brand}</td>
                        <td className="px-5 py-3 text-right text-gray-600 tabular-nums">{$(p.gross)}</td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-800 tabular-nums">{$(p.net)}</td>
                        <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{p.dueDate || '—'}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{p.manager}</td>
                        <td className="px-4 py-3 text-gray-300 group-hover:text-gray-400 text-right">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
      {keys.length === 0 && (
        <p className="px-5 py-12 text-center text-sm text-gray-400">No payouts match your filters.</p>
      )}
    </div>
  )
}

// ── By Creator View ────────────────────────────────────────────────────────────

function CreatorView({ payouts, onSelect }) {
  const [openCreators, setOpenCreators] = useState({})
  const toggle = (c) => setOpenCreators((prev) => ({ ...prev, [c]: !prev[c] }))

  // Group by creator
  const groups = {}
  payouts.forEach((p) => {
    if (!groups[p.creator]) groups[p.creator] = []
    groups[p.creator].push(p)
  })

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  const creatorStats = Object.entries(groups).map(([creator, rows]) => {
    const totalPending = rows
      .filter((p) => p.status === 'Pending' || p.status === 'Processing')
      .reduce((s, p) => s + p.net, 0)
    const totalPaidThisMonth = rows
      .filter((p) => {
        if (p.status !== 'Paid' || !p.paidDate) return false
        const d = new Date(p.paidDate)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
      })
      .reduce((s, p) => s + p.net, 0)
    const totalPaidYTD = rows
      .filter((p) => p.status === 'Paid' && p.paidDate && new Date(p.paidDate).getFullYear() === thisYear)
      .reduce((s, p) => s + p.net, 0)
    const campaignsCompleted = rows.filter((p) => p.status === 'Paid').length
    return { creator, rows, totalPending, totalPaidThisMonth, totalPaidYTD, campaignsCompleted }
  }).sort((a, b) => b.totalPaidYTD - a.totalPaidYTD)

  return (
    <div className="divide-y divide-gray-100">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_48px] gap-0 px-5 py-2.5 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide font-medium">
        <span>Creator</span>
        <span className="text-right">Pending</span>
        <span className="text-right">Paid This Month</span>
        <span className="text-right">Paid YTD</span>
        <span className="text-right">Campaigns Done</span>
        <span />
      </div>

      {creatorStats.map(({ creator, rows, totalPending, totalPaidThisMonth, totalPaidYTD, campaignsCompleted }) => {
        const isOpen = openCreators[creator]
        const initials = creator.split(' ').map((w) => w[0]).join('').toUpperCase()

        return (
          <div key={creator}>
            <button
              onClick={() => toggle(creator)}
              className="w-full grid grid-cols-[2fr_1fr_1fr_1fr_1fr_48px] gap-0 px-5 py-4 hover:bg-gray-50 transition-colors text-left items-center"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold flex items-center justify-center shrink-0`}>
                  {initials}
                </div>
                <span className="text-sm font-semibold text-gray-800">{creator}</span>
                <span className="text-xs text-gray-400">{rows.length} payout{rows.length !== 1 ? 's' : ''}</span>
              </div>
              <span className={`text-sm font-medium text-right tabular-nums ${totalPending > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                {totalPending > 0 ? $(totalPending) : '—'}
              </span>
              <span className="text-sm font-medium text-right text-gray-700 tabular-nums">
                {totalPaidThisMonth > 0 ? $(totalPaidThisMonth) : '—'}
              </span>
              <span className="text-sm font-semibold text-right text-gray-800 tabular-nums">
                {totalPaidYTD > 0 ? $(totalPaidYTD) : '—'}
              </span>
              <span className="text-sm text-right text-gray-500">
                {campaignsCompleted} campaign{campaignsCompleted !== 1 ? 's' : ''}
              </span>
              <span className={`flex justify-end text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}>
                <ChevronRight />
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 bg-gray-50/30">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wide">
                      <th className="px-8 py-2 text-left font-medium">Brand</th>
                      <th className="px-5 py-2 text-left font-medium">Campaign</th>
                      <th className="px-5 py-2 text-left font-medium">Month</th>
                      <th className="px-5 py-2 text-right font-medium">Net to Creator</th>
                      <th className="px-5 py-2 text-left font-medium">Status</th>
                      <th className="px-5 py-2 text-left font-medium">Paid Date</th>
                      <th className="px-4 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => onSelect(p)}
                        className="hover:bg-white transition-colors cursor-pointer group"
                      >
                        <td className="px-8 py-3 text-gray-600">{p.brand}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs max-w-[160px] truncate">{p.campaign}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{p.month}</td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-800 tabular-nums">{$(p.net)}</td>
                        <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{p.paidDate || '—'}</td>
                        <td className="px-4 py-3 text-gray-300 group-hover:text-gray-400 text-right">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
      {creatorStats.length === 0 && (
        <p className="px-5 py-12 text-center text-sm text-gray-400">No payouts match your filters.</p>
      )}
    </div>
  )
}

// ── Detail Drawer ──────────────────────────────────────────────────────────────

function PayoutDrawer({ payout, invoices, onClose, onMarkAsPaid, onSave, addTask, toggleTask }) {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({})
  const [newTaskText, setNewTaskText] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const taskInputRef = useRef(null)

  useEffect(() => {
    setForm({ ...payout })
    setIsEditing(false)
    setShowAddTask(false)
    setNewTaskText('')
  }, [payout?.id])

  useEffect(() => {
    if (showAddTask) taskInputRef.current?.focus()
  }, [showAddTask])

  if (!payout) return null

  const handleChange = (field, val) => setForm((prev) => ({ ...prev, [field]: val }))

  const handleSave = () => {
    onSave(payout.id, form)
    setIsEditing(false)
  }

  const handleAddTask = () => {
    if (!newTaskText.trim()) return
    addTask(payout.id, newTaskText.trim())
    setNewTaskText('')
    setShowAddTask(false)
  }

  const linkedInvoice = payout.invoiceId ? invoices.find((inv) => inv.id === payout.invoiceId) : null
  const commRate = payout.commissionRate ?? 15

  const statusFlow = STATUSES

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Payout</p>
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {payout.creator} × {payout.brand}
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-3">
            {!isEditing && (
              <button
                onClick={() => { setForm({ ...payout }); setIsEditing(true) }}
                className="text-xs font-medium text-[#111111] hover:underline px-2.5 py-1 rounded-md transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Status flow */}
        <div className="flex items-center gap-0 px-6 pb-3">
          {statusFlow.map((s, i) => (
            <div key={s} className="flex items-center">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full transition-colors" style={
                s === payout.status
                  ? STATUS_COLORS[s]
                  : { color: '#D1D5DB' }
              }>
                {s}
              </span>
              {i < statusFlow.length - 1 && (
                <svg width="20" height="10" viewBox="0 0 20 10" fill="none" className="text-gray-200">
                  <path d="M2 5h16M14 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 overflow-y-auto">
        {isEditing ? (
          /* ── Edit mode ────────────────────────────────── */
          <div className="space-y-4">
            {[
              { label: 'Creator', field: 'creator' },
              { label: 'Brand', field: 'brand' },
              { label: 'Campaign', field: 'campaign' },
              { label: 'Due Date', field: 'dueDate' },
              { label: 'Notes', field: 'notes' },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</label>
                {field === 'notes' ? (
                  <textarea
                    value={form[field] ?? ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={form[field] ?? ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                )}
              </div>
            ))}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Status</label>
              <select
                value={form.status ?? ''}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={handleSave}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}
              >
                Save changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ── View mode ────────────────────────────────── */
          <div className="space-y-6">

            {/* Financial breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gross amount</span>
                <span className="font-medium text-gray-800 tabular-nums">{$(payout.gross)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Agency commission ({commRate}%)</span>
                <span className="text-rose-500 tabular-nums">− {$(payout.commission)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                <span className="font-semibold text-gray-700">Net to creator</span>
                <span className="font-bold text-emerald-700 text-base tabular-nums">{$(payout.net)}</span>
              </div>
            </div>

            {/* Banking details */}
            {payout.banking && (
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-400"><BankIcon /></span>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Banking Details</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-gray-400 mb-0.5">Account holder</p>
                    <p className="text-sm font-medium text-gray-800">{payout.banking.accountName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 mb-0.5">Bank</p>
                    <p className="text-sm font-medium text-gray-800">{payout.banking.bankName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 mb-0.5">Account</p>
                    <p className="text-sm font-medium text-gray-800 font-mono">••••&nbsp;{payout.banking.lastFour}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Linked records */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {payout.campaign && (
                <Field label="Campaign" value={payout.campaign} />
              )}
              {linkedInvoice && (
                <LinkField
                  label="Invoice"
                  value={linkedInvoice.invoiceId}
                  onClick={() => { onClose(); navigate(`/invoices?open=${payout.invoiceId}`) }}
                />
              )}
              {payout.dealId && (
                <LinkField
                  label="Deal"
                  value={payout.deal}
                  onClick={() => { onClose(); navigate(`/deals?open=${payout.dealId}`) }}
                />
              )}
              <LinkField
                label="Creator"
                value={payout.creator}
                onClick={() => { onClose(); navigate(`/roster?open=${payout.creatorId}`) }}
              />
            </div>

            {/* Meta fields */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Month" value={payout.month} />
              <Field label="Manager" value={payout.manager} />
              <Field label="Due Date" value={payout.dueDate} />
              {payout.paidDate && <Field label="Paid Date" value={payout.paidDate} />}
            </div>

            {payout.notes && <Field label="Notes" value={payout.notes} />}

            {/* Mark as Paid */}
            {payout.status !== 'Paid' && (
              <button
                onClick={() => onMarkAsPaid(payout.id)}
                className="w-full py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Mark as Paid
              </button>
            )}

            {/* Tasks */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Tasks</p>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex items-center gap-1 text-xs text-[#111111] hover:underline font-medium px-2 py-0.5 rounded transition-colors"
                >
                  <PlusIcon size={11} />
                  Add task
                </button>
              </div>
              <div className="space-y-1.5">
                {payout.tasks?.map((task) => (
                  <label key={task.id} className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(payout.id, task.id)}
                      className="mt-0.5 accent-gray-600"
                    />
                    <span className={`text-sm leading-snug ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.text}
                    </span>
                  </label>
                ))}
                {payout.tasks?.length === 0 && !showAddTask && (
                  <p className="text-xs text-gray-400 italic">No tasks yet.</p>
                )}
                {showAddTask && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      ref={taskInputRef}
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask()
                        if (e.key === 'Escape') { setShowAddTask(false); setNewTaskText('') }
                      }}
                      placeholder="Task description…"
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                    <button
                      onClick={handleAddTask}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setShowAddTask(false); setNewTaskText('') }}
                      className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Activity log */}
            {payout.activityLog?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Activity</p>
                <div className="space-y-3">
                  {[...payout.activityLog].reverse().map((entry, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5" />
                        {i < payout.activityLog.length - 1 && (
                          <div className="w-px flex-1 bg-gray-100 mt-1" />
                        )}
                      </div>
                      <div className="pb-3 min-w-0">
                        <p className="text-sm text-gray-700 leading-snug">{entry.action}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtTimestamp(entry.timestamp)} · {entry.by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  )
}

// ── Add Payout Modal ──────────────────────────────────────────────────────────

function AddPayoutModal({ onClose, onAdd }) {
  const CREATORS = ['Sofia Chen', 'Marcus Reid', 'Anika Patel', 'James Ortiz', 'Lily Nakamura']
  const BRANDS = ['Luminary Beauty', 'Peak Athletics', 'Verdant Foods', 'TechFlow', 'Solstice Travel']
  const STATUS_OPTS = ['Pending', 'Processing', 'Paid']
  const MANAGERS_LOCAL = ['Marjorie A.', 'Devon Park', 'Sienna Moore', 'Rafi Okafor']
  const MONTHS = ['January 2026','February 2026','March 2026','April 2026','May 2026','June 2026','July 2026','August 2026','September 2026','October 2026','November 2026','December 2026']

  const [form, setForm] = useState({
    creator: '', creatorId: null, brand: '', brandId: null,
    campaign: '', campaignId: null, deal: '', dealId: null,
    invoiceId: null, month: MONTHS[2], gross: '', commissionRate: 20,
    status: 'Pending', dueDate: '', paidDate: null,
    date: new Date().toISOString().split('T')[0],
    manager: 'Marjorie A.', notes: '',
    banking: { accountName: '', bankName: '', lastFour: '' },
  })
  const [errors, setErrors] = useState({})

  const ch = (field, val) => { setForm(p => ({ ...p, [field]: val })); setErrors(p => ({ ...p, [field]: '' })) }
  const chBanking = (field, val) => setForm(p => ({ ...p, banking: { ...p.banking, [field]: val } }))

  const commission = Math.round((Number(form.gross) || 0) * (Number(form.commissionRate) / 100))
  const net = Math.round((Number(form.gross) || 0) - commission)

  const inputCls = (field) => `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  const handleSubmit = () => {
    const errs = {}
    if (!form.creator.trim()) errs.creator = true
    if (!form.gross) errs.gross = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    onAdd({ ...form, gross: Number(form.gross), commission, net, commissionRate: Number(form.commissionRate) })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="relative z-10 ml-auto w-[520px] h-full bg-white border-l border-gray-200 overflow-y-auto shadow-xl flex flex-col">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Record Payout</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-5 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Creator <span className="text-red-400">*</span></label>
              <input list="payout-creators" value={form.creator} onChange={e => ch('creator', e.target.value)} placeholder="Sofia Chen" className={inputCls('creator')} />
              <datalist id="payout-creators">{CREATORS.map(c => <option key={c} value={c} />)}</datalist>
              {errors.creator && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Brand</label>
              <input list="payout-brands" value={form.brand} onChange={e => ch('brand', e.target.value)} placeholder="Luminary Beauty" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
              <datalist id="payout-brands">{BRANDS.map(b => <option key={b} value={b} />)}</datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Campaign</label>
              <input value={form.campaign} onChange={e => ch('campaign', e.target.value)} placeholder="Campaign name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Month</label>
              <select value={form.month} onChange={e => ch('month', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Gross ($) <span className="text-red-400">*</span></label>
              <input type="number" value={form.gross} onChange={e => ch('gross', e.target.value)} placeholder="10000" className={inputCls('gross')} />
              {errors.gross && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Commission (%)</label>
              <input type="number" value={form.commissionRate} onChange={e => ch('commissionRate', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Net (auto)</label>
              <div className="px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-600 font-medium">${net.toLocaleString()}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Status</label>
              <select value={form.status} onChange={e => ch('status', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Due Date</label>
              <input type="date" value={form.dueDate || ''} onChange={e => ch('dueDate', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
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
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => ch('date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
          </div>

          {/* Banking */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Banking Details</label>
            <div className="space-y-2">
              <input value={form.banking.accountName} onChange={e => chBanking('accountName', e.target.value)} placeholder="Account holder name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.banking.bankName} onChange={e => chBanking('bankName', e.target.value)} placeholder="Bank name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
                <input value={form.banking.lastFour} onChange={e => chBanking('lastFour', e.target.value)} placeholder="Last 4 digits" maxLength={4} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => ch('notes', e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button onClick={handleSubmit} className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>Record Payout</button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      </aside>
    </div>
  )
}


// ── Main Page ──────────────────────────────────────────────────────────────────

export default function Payouts() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { payouts, setPayouts, updatePayout, markAsPaid, addTask, toggleTask } = usePayouts()
  const { invoices } = useInvoices()

  const [view, setView] = useState('table')
  const [search, setSearch] = useState('')
  const [filterCreator, setFilterCreator] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterManager, setFilterManager] = useState('')
  const [groupBy, setGroupBy] = useState('None')
  const [selectedId, setSelectedId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  // Deep linking
  useEffect(() => {
    const openId = parseInt(searchParams.get('open'))
    if (openId && payouts.find((p) => p.id === openId)) setSelectedId(openId)
  }, [searchParams, payouts])

  const selected = payouts.find((p) => p.id === selectedId) ?? null

  const handleAdd = (newPayout) => {
    const id = Math.max(0, ...payouts.map(p => p.id)) + 1
    setPayouts(prev => [{
      ...newPayout,
      id,
      tasks: [],
      activityLog: [{ action: 'Payout recorded', timestamp: new Date().toLocaleString(), by: newPayout.manager || 'Marjorie A.' }],
    }, ...prev])
  }

  // Derive filter options
  const creators = useMemo(() => [...new Set(payouts.map((p) => p.creator))].sort(), [payouts])
  const brands   = useMemo(() => [...new Set(payouts.map((p) => p.brand))].sort(), [payouts])
  const managers = useMemo(() => [...new Set(payouts.map((p) => p.manager))].sort(), [payouts])

  // Apply filters
  const filtered = useMemo(() => {
    return payouts.filter((p) => {
      if (filterCreator && p.creator !== filterCreator) return false
      if (filterBrand && p.brand !== filterBrand) return false
      if (filterStatus && p.status !== filterStatus) return false
      if (filterManager && p.manager !== filterManager) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !p.creator.toLowerCase().includes(q) &&
          !p.brand.toLowerCase().includes(q) &&
          !p.campaign.toLowerCase().includes(q) &&
          !(p.manager || '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [payouts, filterCreator, filterBrand, filterStatus, filterManager, search])

  // Top metrics
  const metrics = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const totalPending = payouts
      .filter((p) => p.status === 'Pending' || p.status === 'Processing')
      .reduce((s, p) => s + p.net, 0)

    const paidThisMonth = payouts
      .filter((p) => p.status === 'Paid' && p.paidDate)
      .filter((p) => {
        const d = new Date(p.paidDate)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
      })
      .reduce((s, p) => s + p.net, 0)

    const paidPayouts = payouts.filter((p) => p.status === 'Paid' && p.paidDate && new Date(p.paidDate).getFullYear() === thisYear)
    const paidYTD = paidPayouts.reduce((s, p) => s + p.net, 0)

    const avgPayout = paidPayouts.length > 0 ? paidYTD / paidPayouts.length : 0

    return { totalPending, paidThisMonth, paidYTD, avgPayout }
  }, [payouts])

  const hasFilters = search || filterCreator || filterBrand || filterStatus || filterManager

  const clearFilters = () => {
    setSearch('')
    setFilterCreator('')
    setFilterBrand('')
    setFilterStatus('')
    setFilterManager('')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Payouts"
        subtitle="Creator payment records and commission splits."
        action={
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>
            <PlusIcon />
            Record Payout
          </button>
        }
      />

      {/* ── Top Metrics ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Pending"
          value={$(metrics.totalPending)}
          sub={`${payouts.filter((p) => p.status === 'Pending' || p.status === 'Processing').length} payouts outstanding`}
        />
        <MetricCard
          label="Paid This Month"
          value={$(metrics.paidThisMonth)}
          sub="Net paid to creators"
        />
        <MetricCard
          label="Paid YTD"
          value={$(metrics.paidYTD)}
          sub={`${payouts.filter((p) => p.status === 'Paid').length} payouts completed`}
          accent
        />
        <MetricCard
          label="Avg. Payout per Creator"
          value={$(Math.round(metrics.avgPayout))}
          sub="Per completed payout"
        />
      </div>

      {/* ── Main Panel ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

        {/* View tabs + filter bar */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
          {/* View switcher */}
          <div className="flex items-center gap-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${view === v.id ? '#111111' : '#EEEEEE'}`,
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontWeight: 500,
                  fontSize: 12,
                  color: view === v.id ? '#111111' : '#888888',
                  cursor: 'pointer',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{filtered.length} of {payouts.length}</span>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-[#111111] hover:underline font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex-wrap">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2"><SearchIcon /></span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search payouts…"
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white w-48"
            />
          </div>

          <FilterSelect label="Creator" value={filterCreator} onChange={setFilterCreator} options={creators} />
          <FilterSelect label="Brand"   value={filterBrand}   onChange={setFilterBrand}   options={brands} />
          <FilterSelect label="Status"  value={filterStatus}  onChange={setFilterStatus}  options={STATUSES} />
          <FilterSelect label="Manager" value={filterManager} onChange={setFilterManager} options={managers} />

          {/* Group by (table view only) */}
          {view === 'table' && (
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Group by</span>
              <FilterSelect
                label="None"
                value={groupBy}
                onChange={setGroupBy}
                options={GROUP_BY_OPTIONS.filter((o) => o !== 'None')}
              />
            </div>
          )}
        </div>

        {/* Content */}
        {view === 'table'   && <TableView   payouts={filtered} onSelect={(p) => setSelectedId(p.id)} groupBy={groupBy} />}
        {view === 'kanban'  && <KanbanView  payouts={filtered} onSelect={(p) => setSelectedId(p.id)} />}
        {view === 'monthly' && <MonthlyView payouts={filtered} onSelect={(p) => setSelectedId(p.id)} />}
        {view === 'creator' && <CreatorView payouts={filtered} onSelect={(p) => setSelectedId(p.id)} />}
      </div>

      {/* ── Backdrop ──────────────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${
          selectedId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSelectedId(null)}
      />

      {/* ── Detail Drawer ─────────────────────────────────────────────────────── */}
      <aside
        className={`fixed right-0 top-0 z-50 w-[480px] bg-white border-l border-gray-200 h-full overflow-y-auto shadow-xl transition-transform duration-300 ease-in-out ${
          selectedId ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selected && (
          <PayoutDrawer
            payout={selected}
            invoices={invoices}
            onClose={() => setSelectedId(null)}
            onMarkAsPaid={(id) => markAsPaid(id)}
            onSave={(id, updates) => updatePayout(id, updates)}
            addTask={addTask}
            toggleTask={toggleTask}
          />
        )}
      </aside>
      {showAdd && <AddPayoutModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}
