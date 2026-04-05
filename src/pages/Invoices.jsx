import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useInvoices, fmtInvoiceAmt } from '../context/InvoicesContext'
import { usePayouts } from '../context/PayoutsContext'
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

const STATUS_FLOW  = ['Draft', 'Sent', 'Paid']
const KANBAN_COLS  = ['Draft', 'Sent', 'Overdue', 'Paid']
const MANAGERS     = ['Marjorie A.', 'Alex Kim', 'Sam Reyes']

const STATUS_COLORS = {
  Paid:    { background: '#EDFAF3', color: '#1A7A4A' },
  Sent:    { background: '#EEF4FF', color: '#2D5BE3' },
  Overdue: { background: '#FEE2E2', color: '#DC2626' },
  Draft:   { background: '#F3F3F3', color: '#666666' },
}

const KANBAN_STYLE = {
  Draft:   { headerStyle: { background: '#F3F3F3', color: '#666666' },   dotColor: '#9CA3AF',  cntStyle: { background: '#E5E5E5', color: '#666666' } },
  Sent:    { headerStyle: { background: '#EEF4FF', color: '#2D5BE3' },   dotColor: '#2D5BE3',  cntStyle: { background: '#DBEAFE', color: '#2D5BE3' } },
  Overdue: { headerStyle: { background: '#DC2626', color: '#fff' },      dotColor: '#FECACA',  cntStyle: { background: '#F87171', color: '#fff' } },
  Paid:    { headerStyle: { background: '#EDFAF3', color: '#1A7A4A' },   dotColor: '#1A7A4A',  cntStyle: { background: '#BBFBE0', color: '#1A7A4A' } },
}

const GROUP_OPTIONS = [
  { value: 'none',    label: 'None'    },
  { value: 'status',  label: 'Status'  },
  { value: 'manager', label: 'Manager' },
  { value: 'month',   label: 'Month'   },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function nowStamp() {
  return new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).replace(',', ' ·')
}

function todayStr() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function dueDateMonth(inv) {
  if (!inv.due) return 'No Due Date'
  try {
    return new Date(inv.due).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch { return 'No Due Date' }
}

function groupInvoices(invoices, groupBy) {
  if (groupBy === 'none') return { All: invoices }
  const map = {}
  invoices.forEach((inv) => {
    let key = 'Other'
    if (groupBy === 'status')  key = inv.status  || 'Unknown'
    if (groupBy === 'manager') key = inv.manager  || 'Unassigned'
    if (groupBy === 'month')   key = dueDateMonth(inv)
    if (!map[key]) map[key] = []
    map[key].push(inv)
  })
  return map
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 2.5l4.5 4.5L5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ExternalLink() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="inline ml-0.5 opacity-50">
      <path d="M1 10L10 1M10 1H4M10 1v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Shared field components ────────────────────────────────────────────────────

function Field({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  )
}

function FieldLabel({ children }) {
  return <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{children}</p>
}

function LinkField({ label, value, onClick }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <button
        onClick={onClick}
        className="text-sm text-[#111111] hover:underline text-left transition-colors"
      >
        {value}<ExternalLink />
      </button>
    </div>
  )
}

function EditInput({ label, field, form, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={form[field] ?? ''}
        onChange={(e) => onChange(field, e.target.value)}
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
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

// ── Metrics bar ────────────────────────────────────────────────────────────────

function MetricsBar({ invoices }) {
  const now   = new Date()
  const month = now.getMonth()
  const year  = now.getFullYear()

  const outstanding = invoices
    .filter((inv) => inv.status === 'Sent' || inv.status === 'Overdue')
    .reduce((s, inv) => s + Number(inv.amount || 0), 0)

  const overdue = invoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((s, inv) => s + Number(inv.amount || 0), 0)

  const paidThisMonth = invoices
    .filter((inv) => {
      if (inv.status !== 'Paid' || !inv.paidDate) return false
      const d = new Date(inv.paidDate)
      return d.getMonth() === month && d.getFullYear() === year
    })
    .reduce((s, inv) => s + Number(inv.amount || 0), 0)

  const paidYTD = invoices
    .filter((inv) => {
      if (inv.status !== 'Paid' || !inv.paidDate) return false
      return new Date(inv.paidDate).getFullYear() === year
    })
    .reduce((s, inv) => s + Number(inv.amount || 0), 0)

  const cards = [
    { label: 'Outstanding',      value: fmtInvoiceAmt(outstanding),    color: '#2D5BE3', bg: '#EEF4FF' },
    { label: 'Overdue',          value: fmtInvoiceAmt(overdue),        color: '#DC2626', bg: '#FEE2E2' },
    { label: 'Paid This Month',  value: fmtInvoiceAmt(paidThisMonth),  color: '#1A7A4A', bg: '#EDFAF3' },
    { label: 'Paid YTD',         value: fmtInvoiceAmt(paidYTD),        color: '#111111', bg: '#F3F3F3' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl px-5 py-4" style={{ background: c.bg }}>
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">{c.label}</p>
          <p className="text-xl font-bold" style={{ color: c.color }}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Filter bar ─────────────────────────────────────────────────────────────────

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
    >
      <option value="">Any {label}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

function FilterBar({ search, setSearch, fCreator, setFCreator, fBrand, setFBrand,
                     fStatus, setFStatus, fManager, setFManager,
                     groupBy, setGroupBy, creators, brands, view }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoices…"
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>
      <FilterSelect label="Creator" value={fCreator} onChange={setFCreator} options={creators} />
      <FilterSelect label="Brand"   value={fBrand}   onChange={setFBrand}   options={brands}   />
      <FilterSelect label="Status"  value={fStatus}  onChange={setFStatus}  options={[...KANBAN_COLS]} />
      <FilterSelect label="Manager" value={fManager} onChange={setFManager} options={MANAGERS} />

      {/* Group by — only for table view */}
      {view === 'table' && (
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Group by</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {GROUP_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

// ── View toggle ────────────────────────────────────────────────────────────────

function ViewToggle({ view, setView }) {
  const tabs = [
    { id: 'table',   label: 'Table'   },
    { id: 'kanban',  label: 'Kanban'  },
    { id: 'monthly', label: 'Monthly' },
  ]
  return (
    <div className="flex items-center gap-1 mb-4">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setView(t.id)}
          style={{
            background: '#FFFFFF',
            border: `1px solid ${view === t.id ? '#111111' : '#EEEEEE'}`,
            borderRadius: 6,
            padding: '6px 14px',
            fontFamily: '"Inter", system-ui, sans-serif',
            fontWeight: 500,
            fontSize: 13,
            color: view === t.id ? '#111111' : '#888888',
            cursor: 'pointer',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={STATUS_COLORS[status] || { background: '#F3F3F3', color: '#666666' }}>
      {status}
    </span>
  )
}

// ── Table view ─────────────────────────────────────────────────────────────────

function TableHead() {
  return (
    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
      <th className="px-5 py-3 text-left font-medium">Invoice #</th>
      <th className="px-5 py-3 text-left font-medium">Creator</th>
      <th className="px-5 py-3 text-left font-medium">Brand</th>
      <th className="px-5 py-3 text-left font-medium">Amount</th>
      <th className="px-5 py-3 text-left font-medium">Status</th>
      <th className="px-5 py-3 text-left font-medium">Issued</th>
      <th className="px-5 py-3 text-left font-medium">Due</th>
      <th className="px-5 py-3 text-left font-medium">Paid</th>
      <th className="px-5 py-3 text-left font-medium">Manager</th>
      <th className="px-5 py-3" />
    </tr>
  )
}

function TableRows({ rows, onOpen }) {
  return rows.map((inv) => (
    <tr
      key={inv.id}
      onClick={() => onOpen(inv)}
      className="hover:bg-gray-50 transition-colors cursor-pointer group"
    >
      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{inv.invoiceId}</td>
      <td className="px-5 py-3.5">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {creatorPhotoUrl(inv.creatorId) && (
            <img src={creatorPhotoUrl(inv.creatorId)} alt={inv.creator}
              style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          )}
          <span className="font-medium text-gray-800">{inv.creator}</span>
        </div>
      </td>
      <td className="px-5 py-3.5 text-gray-600">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <BrandLogo name={inv.brand} size={24} />
          <span>{inv.brand}</span>
        </div>
      </td>
      <td className="px-5 py-3.5 font-semibold text-gray-800">{fmtInvoiceAmt(inv.amount)}</td>
      <td className="px-5 py-3.5"><StatusBadge status={inv.status} /></td>
      <td className="px-5 py-3.5 text-gray-500 text-sm">{inv.issued || '—'}</td>
      <td className={`px-5 py-3.5 text-sm font-medium ${inv.status === 'Overdue' ? 'text-red-600' : 'text-gray-500'}`}>
        {inv.due || '—'}
      </td>
      <td className="px-5 py-3.5 text-gray-500 text-sm">{inv.paidDate || '—'}</td>
      <td className="px-5 py-3.5 text-gray-500 text-sm">{inv.manager || '—'}</td>
      <td className="px-4 py-3.5 text-gray-300 group-hover:text-gray-400 transition-colors text-right">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </td>
    </tr>
  ))
}

function TableView({ invoices, groupBy, onOpen }) {
  const grouped = useMemo(() => groupInvoices(invoices, groupBy), [invoices, groupBy])
  const groupKeys = Object.keys(grouped)
  const showHeaders = groupBy !== 'none'

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead><TableHead /></thead>
        <tbody className="divide-y divide-gray-100">
          {groupKeys.map((key) => (
            <>
              {showHeaders && (
                <tr key={`hdr-${key}`} className="bg-gray-50/70 border-t border-gray-200">
                  <td colSpan={10} className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {key}
                    <span className="ml-2 font-normal text-gray-400">({grouped[key].length})</span>
                  </td>
                </tr>
              )}
              <TableRows key={`rows-${key}`} rows={grouped[key]} onOpen={onOpen} />
            </>
          ))}
          {invoices.length === 0 && (
            <tr>
              <td colSpan={10} className="px-5 py-12 text-center text-sm text-gray-400">
                No invoices match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Kanban view ────────────────────────────────────────────────────────────────

function KanbanCard({ inv, onOpen }) {
  const isOverdue = inv.status === 'Overdue'
  return (
    <div
      onClick={() => onOpen(inv)}
      className={`rounded-lg border p-3.5 cursor-pointer transition-shadow hover:shadow-md ${
        isOverdue
          ? 'bg-red-50 border-red-200 hover:border-red-300'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`text-xs font-mono ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>{inv.invoiceId}</p>
        <span className={`text-base font-bold leading-none ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
          {fmtInvoiceAmt(inv.amount)}
        </span>
      </div>
      <div className={`text-sm font-semibold leading-snug mb-0.5 ${isOverdue ? 'text-red-800' : 'text-gray-800'}`} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <BrandLogo name={inv.brand} size={24} />
        <span>{inv.brand}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {creatorPhotoUrl(inv.creatorId) && (
          <img src={creatorPhotoUrl(inv.creatorId)} alt={inv.creator}
            style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        )}
        <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>{inv.creator}</p>
      </div>
      <div className={`flex items-center justify-between text-[11px] ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
        <span>{inv.manager || '—'}</span>
        {inv.due && (
          <span className={`font-medium ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
            Due {inv.due}
          </span>
        )}
        {inv.paidDate && !inv.due && (
          <span>Paid {inv.paidDate}</span>
        )}
      </div>
    </div>
  )
}

function KanbanView({ invoices, onOpen }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {KANBAN_COLS.map((col) => {
        const cards  = invoices.filter((inv) => inv.status === col)
        const style  = KANBAN_STYLE[col]
        const total  = cards.reduce((s, inv) => s + Number(inv.amount || 0), 0)
        return (
          <div key={col} className="flex flex-col gap-2 min-h-[200px]">
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={style.headerStyle}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: style.dotColor }} />
                <span className="text-xs font-semibold">{col}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium" style={{ opacity: 0.75 }}>
                  {fmtInvoiceAmt(total)}
                </span>
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full" style={style.cntStyle}>
                  {cards.length}
                </span>
              </div>
            </div>
            {/* Cards */}
            <div className="flex flex-col gap-2">
              {cards.map((inv) => (
                <KanbanCard key={inv.id} inv={inv} onOpen={onOpen} />
              ))}
              {cards.length === 0 && (
                <p className="text-center text-xs text-gray-300 py-6">No invoices</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Monthly view ───────────────────────────────────────────────────────────────

function MonthlyView({ invoices, onOpen }) {
  const grouped = useMemo(() => {
    const map = {}
    invoices.forEach((inv) => {
      const key = dueDateMonth(inv)
      if (!map[key]) map[key] = []
      map[key].push(inv)
    })
    // Sort months chronologically (No Due Date goes last)
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'No Due Date') return 1
      if (b === 'No Due Date') return -1
      return new Date(a) - new Date(b)
    })
  }, [invoices])

  if (grouped.length === 0) {
    return <p className="text-center text-sm text-gray-400 py-12">No invoices match your filters.</p>
  }

  return (
    <div className="space-y-6">
      {grouped.map(([month, invs]) => {
        const total     = invs.reduce((s, inv) => s + Number(inv.amount || 0), 0)
        const overdueCnt = invs.filter((inv) => inv.status === 'Overdue').length
        return (
          <div key={month}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold text-gray-700">{month}</h3>
              <span className="text-xs text-gray-400">{invs.length} invoice{invs.length !== 1 ? 's' : ''}</span>
              <span className="text-xs font-semibold text-gray-700">{fmtInvoiceAmt(total)}</span>
              {overdueCnt > 0 && (
                <span className="text-[11px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  {overdueCnt} overdue
                </span>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><TableHead /></thead>
                <tbody className="divide-y divide-gray-100">
                  <TableRows rows={invs} onOpen={onOpen} />
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Line items table ───────────────────────────────────────────────────────────

function LineItemsTable({ lineItems = [], total }) {
  if (!lineItems.length) return null
  const computedTotal = total ?? lineItems.reduce((s, li) => s + (li.subtotal || 0), 0)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide text-[10px]">
            <th className="px-3 py-2 text-left font-medium">Campaign</th>
            <th className="px-3 py-2 text-left font-medium">Platform</th>
            <th className="px-3 py-2 text-left font-medium">Type</th>
            <th className="px-3 py-2 text-center font-medium">Qty × Rate</th>
            <th className="px-3 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lineItems.map((li, i) => (
            <tr key={i} className={i % 2 === 1 ? 'bg-gray-50/40' : ''}>
              <td className="px-3 py-2 text-gray-600 max-w-[140px] truncate">{li.campaign || '—'}</td>
              <td className="px-3 py-2 text-gray-700">{li.platform}</td>
              <td className="px-3 py-2 text-gray-600">{li.contentType}</td>
              <td className="px-3 py-2 text-center text-gray-600">{li.quantity}× {fmtInvoiceAmt(li.rate)}</td>
              <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmtInvoiceAmt(li.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200 bg-gray-50">
            <td colSpan={4} className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-right">Total</td>
            <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">{fmtInvoiceAmt(computedTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ── Invoice detail panel ───────────────────────────────────────────────────────

function InvoiceDetail({ invoice, onClose, onUpdate, payouts }) {
  const navigate   = useNavigate()
  const [tab, setTab]           = useState('details')
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm]         = useState({})
  const [newTask, setNewTask]   = useState('')

  useEffect(() => {
    if (invoice) setForm({ ...invoice })
    setIsEditing(false)
    setTab('details')
    setNewTask('')
  }, [invoice?.id])

  if (!invoice) return null

  const linked = payouts?.find((p) => p.invoiceId === invoice.id)

  // Status stepper
  const stepperPos = (s) => {
    if (s === 'Overdue') return STATUS_FLOW.indexOf('Sent')
    return STATUS_FLOW.indexOf(s)
  }
  const currentPos = stepperPos(invoice.status)

  const handleStatusStep = (newStatus) => {
    const updated = {
      ...invoice,
      status:   newStatus,
      paidDate: newStatus === 'Paid' ? todayStr() : invoice.paidDate,
      activityLog: [
        { action: `Status changed to ${newStatus}`, timestamp: nowStamp(), by: 'Marjorie A.' },
        ...(invoice.activityLog || []),
      ],
    }
    onUpdate(updated)
  }

  const handleMarkPaid = () => {
    const updated = {
      ...invoice,
      status:   'Paid',
      paidDate: todayStr(),
      activityLog: [
        { action: 'Invoice marked as paid', timestamp: nowStamp(), by: 'Marjorie A.' },
        ...(invoice.activityLog || []),
      ],
    }
    onUpdate(updated)
  }

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSave = () => {
    const updated = {
      ...form,
      activityLog: [
        { action: 'Invoice details updated', timestamp: nowStamp(), by: 'Marjorie A.' },
        ...(form.activityLog || []),
      ],
    }
    onUpdate(updated)
    setIsEditing(false)
  }

  const handleCancelEdit = () => { setForm({ ...invoice }); setIsEditing(false) }

  // Tasks
  const tasks      = invoice.tasks || []
  const doneTasks  = tasks.filter((t) => t.done).length
  const taskPct    = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0

  const handleToggleTask = (taskId) => {
    const updated = {
      ...invoice,
      tasks: tasks.map((t) => t.id === taskId ? { ...t, done: !t.done } : t),
    }
    onUpdate(updated)
  }

  const handleDeleteTask = (taskId) => {
    const updated = { ...invoice, tasks: tasks.filter((t) => t.id !== taskId) }
    onUpdate(updated)
  }

  const handleAddTask = () => {
    const text = newTask.trim()
    if (!text) return
    const newId   = Math.max(0, ...tasks.map((t) => t.id)) + 1
    const updated = {
      ...invoice,
      tasks: [...tasks, { id: newId, text, done: false, createdAt: todayStr() }],
      activityLog: [
        { action: `Task added: "${text}"`, timestamp: nowStamp(), by: 'Marjorie A.' },
        ...(invoice.activityLog || []),
      ],
    }
    onUpdate(updated)
    setNewTask('')
  }

  const statusPos = STATUS_FLOW.indexOf(invoice.status === 'Overdue' ? 'Sent' : invoice.status)
  const nextStatus = STATUS_FLOW[statusPos + 1]

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono text-sm font-semibold text-gray-900 truncate">{invoice.invoiceId}</span>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isEditing && (
            <button
              onClick={() => { setForm({ ...invoice }); setIsEditing(true) }}
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

      <div className="p-6">
        {/* Overdue warning */}
        {invoice.status === 'Overdue' && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3.5 py-2.5 rounded-lg mb-5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
              <circle cx="7" cy="7" r="6.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            This invoice is overdue. Due date was {invoice.due}.
          </div>
        )}

        {isEditing ? (
          /* ── Edit form ─────────────────────────────────────────────────── */
          <div className="space-y-4">
            <EditInput label="Invoice #"   field="invoiceId"   form={form} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
              <EditInput label="Creator"    field="creator"     form={form} onChange={handleChange} />
              <EditInput label="Brand"      field="brand"       form={form} onChange={handleChange} />
            </div>
            <EditInput label="Amount ($)"  field="amount"      form={form} onChange={handleChange} type="number" />
            <div className="grid grid-cols-2 gap-4">
              <EditInput label="Issued"     field="issued"      form={form} onChange={handleChange} />
              <EditInput label="Due Date"   field="due"         form={form} onChange={handleChange} />
            </div>
            <EditInput label="Paid Date"   field="paidDate"    form={form} onChange={handleChange} />
            <EditSelect label="Status"     field="status"      form={form} onChange={handleChange} options={KANBAN_COLS} />
            <EditSelect label="Manager"    field="manager"     form={form} onChange={handleChange} options={MANAGERS} />
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</label>
              <textarea
                value={form.notes ?? ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={handleSave}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}
              >
                Save changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ── Read-only detail ──────────────────────────────────────────── */
          <div>
            {/* Hero: amount + status stepper */}
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Amount Due</p>
                <p className="text-2xl font-bold text-gray-900">{fmtInvoiceAmt(invoice.amount)}</p>
              </div>
              {/* Mark as Paid */}
              {(invoice.status === 'Sent' || invoice.status === 'Overdue') && (
                <button
                  onClick={handleMarkPaid}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-white text-sm font-medium rounded-lg transition-colors" style={{ background: '#1A7A4A' }}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 7l3.5 3.5L11 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Mark as Paid
                </button>
              )}
            </div>

            {/* Status stepper */}
            <div className="flex items-center gap-0 mb-6">
              {STATUS_FLOW.map((s, i) => {
                const isActive  = s === (invoice.status === 'Overdue' ? 'Sent' : invoice.status)
                const isPast    = i < currentPos
                const canClick  = i === currentPos + 1 && invoice.status !== 'Paid' && invoice.status !== 'Overdue'
                return (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <button
                      onClick={() => canClick && handleStatusStep(s)}
                      disabled={!canClick}
                      className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${
                        canClick ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-colors ${
                        isActive ? 'bg-[#111111] border-[#111111] text-white'
                        : isPast  ? 'bg-gray-100 border-gray-300 text-gray-600'
                        : 'bg-white border-gray-200 text-gray-300'
                      }`}>
                        {isPast ? '✓' : i + 1}
                      </div>
                      <span className={`text-[10px] font-medium whitespace-nowrap ${
                        isActive ? 'text-gray-900'
                        : isPast  ? 'text-gray-400'
                        : 'text-gray-400'
                      }`}>{s}</span>
                    </button>
                    {i < STATUS_FLOW.length - 1 && (
                      <div className={`flex-1 h-px mx-1 ${i < currentPos ? 'bg-gray-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Quick advance */}
            {nextStatus && invoice.status !== 'Overdue' && (
              <button
                onClick={() => handleStatusStep(nextStatus)}
                className="w-full flex items-center justify-center gap-1.5 py-2 mb-5 text-xs font-medium text-[#111111] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Advance to {nextStatus}
                <ChevronRight />
              </button>
            )}

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-100 mb-5">
              {['details', 'tasks', 'activity'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                    tab === t ? 'text-[#111111] border-[#111111]' : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  {t}
                  {t === 'tasks' && tasks.length > 0 && (
                    <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full" style={
                      doneTasks === tasks.length ? { background: '#EDFAF3', color: '#1A7A4A' } : { background: '#F3F3F3', color: '#666666' }
                    }>
                      {doneTasks}/{tasks.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Details tab ─── */}
            {tab === 'details' && (
              <div className="space-y-5">
                {/* Bill To */}
                {invoice.billTo && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <FieldLabel>Bill To</FieldLabel>
                    <p className="text-sm font-semibold text-gray-800">{invoice.billTo.name}</p>
                    {invoice.billTo.address && (
                      <p className="text-sm text-gray-600">{invoice.billTo.address}</p>
                    )}
                    {invoice.billTo.city && (
                      <p className="text-sm text-gray-600">{invoice.billTo.city}</p>
                    )}
                    {invoice.billTo.email && (
                      <p className="text-sm text-gray-500 mt-0.5">{invoice.billTo.email}</p>
                    )}
                  </div>
                )}

                {/* Key fields */}
                <div className="grid grid-cols-2 gap-4">
                  <LinkField
                    label="Creator"
                    value={invoice.creator}
                    onClick={() => { onClose(); navigate(`/roster?open=${invoice.creatorId}`) }}
                  />
                  <LinkField
                    label="Brand"
                    value={invoice.brand}
                    onClick={() => { onClose(); navigate(`/contacts?tab=brands&open=${invoice.brandId}`) }}
                  />
                  {invoice.dealId && (
                    <LinkField
                      label="Deal"
                      value={invoice.dealName || `Deal #${invoice.dealId}`}
                      onClick={() => { onClose(); navigate(`/deals?open=${invoice.dealId}`) }}
                    />
                  )}
                  {invoice.month && <Field label="Month" value={invoice.month} />}
                  <Field label="Payment Terms" value={invoice.paymentTerms} />
                  <Field label="Manager"       value={invoice.manager} />
                  <Field label="Issued"        value={invoice.issued} />
                  <Field label="Due"           value={invoice.due} />
                  {invoice.paidDate && <Field label="Paid Date" value={invoice.paidDate} />}
                </div>

                {/* Line items */}
                {invoice.lineItems?.length > 0 && (
                  <div>
                    <FieldLabel>Line Items</FieldLabel>
                    <LineItemsTable lineItems={invoice.lineItems} total={invoice.amount} />
                  </div>
                )}

                {/* Linked payout */}
                {linked && (
                  <div>
                    <FieldLabel>Linked Payout</FieldLabel>
                    <div
                      onClick={() => { onClose(); navigate('/payouts') }}
                      className="flex items-center justify-between rounded-lg px-4 py-3 cursor-pointer transition-colors" style={{ background: '#EDFAF3', border: '1px solid #BBF7D0' }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#0F5132' }}>{invoice.creator}</p>
                        <p className="text-xs" style={{ color: '#1A7A4A' }}>
                          Gross: {fmtInvoiceAmt(linked.gross)}  ·  Commission: {fmtInvoiceAmt(linked.commission)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: '#0F5132' }}>{fmtInvoiceAmt(linked.net)}</p>
                        <p className="text-[11px]" style={{ color: '#6EBF96' }}>Net to creator</p>
                      </div>
                    </div>
                  </div>
                )}

                {invoice.notes && <Field label="Notes" value={invoice.notes} />}
              </div>
            )}

            {/* ── Tasks tab ─── */}
            {tab === 'tasks' && (
              <div className="space-y-4">
                {/* Progress bar */}
                {tasks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>{doneTasks} of {tasks.length} done</span>
                      <span>{taskPct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-[#111111] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${taskPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Task list */}
                <div className="space-y-1">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-2.5 group px-1 py-1.5 rounded-lg hover:bg-gray-50">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                          task.done
                            ? 'bg-[#111111] border-[#111111] text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {task.done && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4l2 2 3-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <span className={`flex-1 text-sm leading-snug ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {task.text}
                      </span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0"
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M2.5 2.5l8 8M10.5 2.5l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No tasks yet.</p>
                  )}
                </div>

                {/* Add task */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask() }}
                    placeholder="Add a task…"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  <button
                    onClick={handleAddTask}
                    className="px-3 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* ── Activity tab ─── */}
            {tab === 'activity' && (
              <div className="space-y-3">
                {(invoice.activityLog || []).map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{entry.action}</p>
                      <p className="text-xs text-gray-400">{entry.timestamp} · {entry.by}</p>
                    </div>
                  </div>
                ))}
                {(!invoice.activityLog || invoice.activityLog.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4">No activity yet.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── Add Invoice Modal ──────────────────────────────────────────────────────────

function AddInvoiceModal({ onClose, onAdd }) {
  const emptyRow = () => ({ id: Date.now() + Math.random(), campaign: '', platform: 'Instagram', contentType: 'Reel', quantity: 1, rate: 0, subtotal: 0 })
  const MONTHS = ['January 2026','February 2026','March 2026','April 2026','May 2026','June 2026','July 2026','August 2026','September 2026','October 2026','November 2026','December 2026']
  const PLATFORM_OPTS = ['Instagram', 'TikTok', 'YouTube', 'Podcast', 'Blog', 'Twitter/X', 'Pinterest']
  const CONTENT_OPTS = ['Story', 'Reel', 'Post', 'Video', 'Integration', 'Dedicated Video', 'Series']
  const PAYMENT_OPTS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90', 'Upon Completion']
  const STATUS_OPTS = ['Draft', 'Sent', 'Overdue', 'Paid']
  const MANAGERS_LOCAL = ['Marjorie A.', 'Devon Park', 'Sienna Moore', 'Rafi Okafor']

  const [form, setForm] = useState({
    creator: '', creatorId: null, brand: '', brandId: null,
    dealId: null, dealName: '', manager: 'Marjorie A.',
    month: MONTHS[2], status: 'Draft', paymentTerms: 'Net 30',
    issued: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    due: '', paidDate: null, notes: '',
    billTo: { name: '', address: '', city: '', email: '' },
  })
  const [lineItems, setLineItems] = useState([emptyRow()])
  const [errors, setErrors] = useState({})

  const ch = (field, val) => { setForm(p => ({ ...p, [field]: val })); setErrors(p => ({ ...p, [field]: '' })) }
  const chBillTo = (field, val) => setForm(p => ({ ...p, billTo: { ...p.billTo, [field]: val } }))

  const addRow = () => setLineItems(p => [...p, emptyRow()])
  const removeRow = (id) => setLineItems(p => p.filter(r => r.id !== id))
  const updateRow = (id, field, val) => setLineItems(p => p.map(r => {
    if (r.id !== id) return r
    const updated = { ...r, [field]: val }
    updated.subtotal = Number(updated.rate) * Number(updated.quantity || 1)
    return updated
  }))

  const total = lineItems.reduce((s, r) => s + (Number(r.rate) * Number(r.quantity || 1)), 0)
  const inputCls = (field) => `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  const handleSubmit = () => {
    const errs = {}
    if (!form.creator.trim()) errs.creator = true
    if (!form.brand.trim()) errs.brand = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    onAdd({ ...form, lineItems: lineItems.map(r => ({ ...r, subtotal: r.rate * (r.quantity || 1) })), amount: total })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="relative z-10 ml-auto w-[580px] h-full bg-white border-l border-gray-200 overflow-y-auto shadow-xl flex flex-col">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">New Invoice</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-5 flex-1">
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
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Month</label>
              <select value={form.month} onChange={e => ch('month', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
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
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Payment Terms</label>
              <select value={form.paymentTerms} onChange={e => ch('paymentTerms', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                {PAYMENT_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Issue Date</label>
              <input type="date" value={form.issued} onChange={e => ch('issued', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Due Date</label>
              <input type="date" value={form.due || ''} onChange={e => ch('due', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
          </div>

          {/* Bill To */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Bill To</label>
            <div className="space-y-2">
              <input value={form.billTo.name} onChange={e => chBillTo('name', e.target.value)} placeholder="Company name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
              <input value={form.billTo.address} onChange={e => chBillTo('address', e.target.value)} placeholder="Address" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.billTo.city} onChange={e => chBillTo('city', e.target.value)} placeholder="City, State ZIP" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
                <input type="email" value={form.billTo.email} onChange={e => chBillTo('email', e.target.value)} placeholder="billing@company.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide">Line Items</label>
              <button onClick={addRow} className="text-xs text-[#111111] hover:underline font-medium">+ Add row</button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['Campaign', 'Platform', 'Type', 'Qty', 'Rate ($)', 'Subtotal', ''].map(h => (
                      <th key={h} className="px-2 py-2 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map(row => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="px-2 py-1.5">
                        <input value={row.campaign} onChange={e => updateRow(row.id, 'campaign', e.target.value)} placeholder="Campaign name" className="w-24 text-xs border-none bg-transparent focus:outline-none" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={row.platform} onChange={e => updateRow(row.id, 'platform', e.target.value)} className="w-full text-xs border-none bg-transparent focus:outline-none">
                          {PLATFORM_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={row.contentType} onChange={e => updateRow(row.id, 'contentType', e.target.value)} className="w-full text-xs border-none bg-transparent focus:outline-none">
                          {CONTENT_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={row.quantity} onChange={e => updateRow(row.id, 'quantity', e.target.value)} className="w-10 text-xs border-none bg-transparent focus:outline-none" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={row.rate} onChange={e => updateRow(row.id, 'rate', e.target.value)} className="w-16 text-xs border-none bg-transparent focus:outline-none" />
                      </td>
                      <td className="px-2 py-1.5 text-gray-500">${(Number(row.rate) * Number(row.quantity || 1)).toLocaleString()}</td>
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
            {total > 0 && <p className="text-xs text-gray-500 mt-1.5">Total: <span className="font-semibold text-gray-800">${total.toLocaleString()}</span></p>}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => ch('notes', e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button onClick={handleSubmit} className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>Create Invoice</button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Invoices() {
  const [searchParams] = useSearchParams()
  const { invoices, setInvoices } = useInvoices()
  const { payouts }               = usePayouts()

  const [view,       setView]       = useState('table')
  const [selectedId, setSelectedId] = useState(null)
  const [showAdd,    setShowAdd]    = useState(false)
  const [search,     setSearch]     = useState('')
  const [fCreator,   setFCreator]   = useState('')
  const [fBrand,     setFBrand]     = useState('')
  const [fStatus,    setFStatus]    = useState('')
  const [fManager,   setFManager]   = useState('')
  const [groupBy,    setGroupBy]    = useState('none')

  // Deep-link: ?open=id
  useEffect(() => {
    const openId = parseInt(searchParams.get('open'))
    if (openId && invoices.find((inv) => inv.id === openId)) {
      setSelectedId(openId)
    }
  }, [searchParams, invoices])

  const selected = invoices.find((inv) => inv.id === selectedId) ?? null

  const openDrawer  = (inv) => setSelectedId(inv.id)
  const closeDrawer = () => setSelectedId(null)

  const handleUpdate = (updated) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)))
  }

  const handleAdd = (newInvoice) => {
    const id = Math.max(0, ...invoices.map(i => i.id)) + 1
    const invoiceId = `INV-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`
    setInvoices(prev => [{
      ...newInvoice,
      id,
      invoiceId,
      tasks: [],
      activityLog: [{ action: 'Invoice created', timestamp: new Date().toLocaleString(), by: newInvoice.manager || 'Marjorie A.' }],
    }, ...prev])
  }

  // Filter options (dynamic)
  const creators = useMemo(() => [...new Set(invoices.map((inv) => inv.creator))].sort(), [invoices])
  const brands   = useMemo(() => [...new Set(invoices.map((inv) => inv.brand))].sort(),   [invoices])

  // Filtered list
  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (search    && !`${inv.invoiceId} ${inv.creator} ${inv.brand}`.toLowerCase().includes(search.toLowerCase())) return false
      if (fCreator  && inv.creator !== fCreator)  return false
      if (fBrand    && inv.brand   !== fBrand)    return false
      if (fStatus   && inv.status  !== fStatus)   return false
      if (fManager  && inv.manager !== fManager)  return false
      return true
    })
  }, [invoices, search, fCreator, fBrand, fStatus, fManager])

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Invoices"
        subtitle="Track all outgoing invoices and payment status."
        action={
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            New Invoice
          </button>
        }
      />

      {/* Metrics */}
      <MetricsBar invoices={invoices} />

      {/* View toggle */}
      <ViewToggle view={view} setView={setView} />

      {/* Filters */}
      <FilterBar
        search={search}     setSearch={setSearch}
        fCreator={fCreator} setFCreator={setFCreator}
        fBrand={fBrand}     setFBrand={setFBrand}
        fStatus={fStatus}   setFStatus={setFStatus}
        fManager={fManager} setFManager={setFManager}
        groupBy={groupBy}   setGroupBy={setGroupBy}
        creators={creators} brands={brands}
        view={view}
      />

      {/* Views */}
      {view === 'table'   && <TableView   invoices={filtered} groupBy={groupBy} onOpen={openDrawer} />}
      {view === 'kanban'  && <KanbanView  invoices={filtered} onOpen={openDrawer} />}
      {view === 'monthly' && <MonthlyView invoices={filtered} onOpen={openDrawer} />}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${
          selectedId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
      />

      {/* Detail panel */}
      <aside
        className={`fixed right-0 top-0 z-50 w-[min(560px,92vw)] bg-white border-l border-gray-200 h-full overflow-y-auto shadow-xl transition-transform duration-300 ease-in-out ${
          selectedId ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selected && (
          <InvoiceDetail
            invoice={selected}
            onClose={closeDrawer}
            onUpdate={handleUpdate}
            payouts={payouts}
          />
        )}
      </aside>
      {showAdd && <AddInvoiceModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}
