import { useState, useMemo, useEffect, useRef, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useExpenses, CATEGORIES, CATEGORY_COLORS, CATEGORY_CHART_COLORS } from '../context/ExpensesContext'

// ── Constants ──────────────────────────────────────────────────────────────────

const MANAGERS    = ['Marjorie A.', 'Alex Kim', 'Sam Reyes']
const GROUP_OPTIONS = [
  { value: 'none',     label: 'None'     },
  { value: 'category', label: 'Category' },
  { value: 'month',    label: 'Month'    },
  { value: 'manager',  label: 'Manager'  },
]
const KNOWN_DEALS = [
  { id: 1, name: 'Spring Glow Collection'   },
  { id: 2, name: 'Run Season Ambassador'    },
  { id: 3, name: 'Spring Wellness Series'   },
  { id: 4, name: 'Q2 Tech Review Series'    },
  { id: 5, name: 'Lily × Solstice Series'   },
  { id: 6, name: 'Anika × Verdant Foods'    },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtAmt(n) {
  if (n == null || n === '' || isNaN(Number(n))) return '—'
  return '$' + Number(n).toLocaleString()
}

function nowStamp() {
  return new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).replace(',', ' ·')
}

function todayStr() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function expenseMonthLabel(e) {
  try {
    return new Date(e.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch { return 'Unknown' }
}

function groupExpenses(expenses, groupBy) {
  if (groupBy === 'none') return { All: expenses }
  const map = {}
  expenses.forEach((e) => {
    let key = 'Other'
    if (groupBy === 'category') key = e.category  || 'Uncategorized'
    if (groupBy === 'month')    key = expenseMonthLabel(e)
    if (groupBy === 'manager')  key = e.manager    || 'Unassigned'
    if (!map[key]) map[key] = []
    map[key].push(e)
  })
  return map
}

function sortedGroupKeys(grouped, groupBy) {
  const keys = Object.keys(grouped)
  if (groupBy === 'month') {
    return keys.sort((a, b) => {
      if (a === 'Unknown') return 1
      if (b === 'Unknown') return -1
      return new Date(a) - new Date(b)
    })
  }
  return keys
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="inline ml-0.5 opacity-50">
      <path d="M1 10L10 1M10 1H4M10 1v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="1" width="11" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 4.5h6M4 7h6M4 9.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

// ── Shared field components ────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{children}</p>
}

function Field({ label, value }) {
  if (!value && value !== 0) return null
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
      <button
        onClick={onClick}
        className="text-sm text-[#111111] hover:underline text-left transition-colors"
      >
        {value}<ExternalLinkIcon />
      </button>
    </div>
  )
}

function EditInput({ label, field, form, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={form[field] ?? ''}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
      />
    </div>
  )
}

function EditSelect({ label, field, form, onChange, options, placeholder }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <select
        value={form[field] ?? ''}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── Category badge ─────────────────────────────────────────────────────────────

function CategoryBadge({ category }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-600'}`}>
      {category}
    </span>
  )
}

// ── Metrics bar ────────────────────────────────────────────────────────────────

function MetricsBar({ expenses }) {
  const now   = new Date()
  const month = now.getMonth()
  const year  = now.getFullYear()

  const thisMonth = useMemo(() =>
    expenses.filter((e) => {
      const d = new Date(e.date)
      return d.getMonth() === month && d.getFullYear() === year
    }).reduce((s, e) => s + Number(e.amount || 0), 0),
  [expenses, month, year])

  const ytd = useMemo(() =>
    expenses.filter((e) => new Date(e.date).getFullYear() === year)
             .reduce((s, e) => s + Number(e.amount || 0), 0),
  [expenses, year])

  const byCategory = useMemo(() => {
    const map = {}
    CATEGORIES.forEach((c) => (map[c] = 0))
    expenses.filter((e) => new Date(e.date).getFullYear() === year)
            .forEach((e) => { if (map[e.category] !== undefined) map[e.category] += Number(e.amount || 0) })
    return map
  }, [expenses, year])

  const catEntries = CATEGORIES.map((c) => ({ cat: c, total: byCategory[c] }))
                                .filter((x) => x.total > 0)
                                .sort((a, b) => b.total - a.total)

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {/* This Month */}
      <div className="rounded-xl px-5 py-4" style={{ background: '#F3F3F3' }}>
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">This Month</p>
        <p className="text-xl font-bold" style={{ color: '#111111' }}>{fmtAmt(thisMonth)}</p>
      </div>

      {/* YTD */}
      <div className="bg-gray-50 rounded-xl px-5 py-4">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">Total YTD</p>
        <p className="text-xl font-bold text-gray-800">{fmtAmt(ytd)}</p>
      </div>

      {/* Category breakdown — spans 2 cols */}
      <div className="col-span-2 bg-white border border-gray-200 rounded-xl px-5 py-4">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-3">YTD by Category</p>
        {catEntries.length === 0 ? (
          <p className="text-xs text-gray-400">No data</p>
        ) : (
          <div className="space-y-2">
            {catEntries.slice(0, 4).map(({ cat, total }) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="w-[80px] text-[11px] text-gray-500 truncate shrink-0">{cat}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(total / ytd) * 100}%`, background: CATEGORY_CHART_COLORS[cat] || '#888888' }}
                  />
                </div>
                <span className="w-[52px] text-[11px] font-semibold text-gray-700 text-right shrink-0">{fmtAmt(total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
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
        <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </option>
      ))}
    </select>
  )
}

function FilterBar({ search, setSearch, fCategory, setFCategory, fManager, setFManager,
                     groupBy, setGroupBy, view }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search expenses…"
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>
      <FilterSelect label="Category" value={fCategory} onChange={setFCategory} options={CATEGORIES} />
      <FilterSelect label="Manager"  value={fManager}  onChange={setFManager}  options={MANAGERS}   />

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
    { id: 'table',    label: 'Table'       },
    { id: 'monthly',  label: 'Monthly'     },
    { id: 'category', label: 'By Category' },
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

// ── Table head ─────────────────────────────────────────────────────────────────

function TableHead() {
  return (
    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
      <th className="px-5 py-3 text-left font-medium">Name</th>
      <th className="px-5 py-3 text-left font-medium">Category</th>
      <th className="px-5 py-3 text-left font-medium">Amount</th>
      <th className="px-5 py-3 text-left font-medium">Date</th>
      <th className="px-5 py-3 text-left font-medium">Linked Deal</th>
      <th className="px-5 py-3 text-left font-medium">Receipt</th>
      <th className="px-5 py-3 text-left font-medium">Manager</th>
      <th className="px-5 py-3" />
    </tr>
  )
}

function TableRows({ rows, onOpen }) {
  return (
    <>
    {rows.map((e) => (
    <tr
      key={e.id}
      onClick={() => onOpen(e)}
      className="hover:bg-gray-50 transition-colors cursor-pointer group"
    >
      <td className="px-5 py-3.5 font-medium text-gray-800">{e.name}</td>
      <td className="px-5 py-3.5"><CategoryBadge category={e.category} /></td>
      <td className="px-5 py-3.5 font-semibold text-gray-800">{fmtAmt(e.amount)}</td>
      <td className="px-5 py-3.5 text-gray-500 text-sm">{e.date}</td>
      <td className="px-5 py-3.5 text-sm text-[#111111] truncate max-w-[140px]">{e.dealName || '—'}</td>
      <td className="px-5 py-3.5">
        {e.receipt ? (
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#1A7A4A' }}>
            <ReceiptIcon />
            Yes
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-gray-500 text-sm">{e.manager || '—'}</td>
      <td className="px-4 py-3.5 text-gray-300 group-hover:text-gray-400 transition-colors text-right">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </td>
    </tr>
  ))}
    </>
  )
}

// ── Table view ─────────────────────────────────────────────────────────────────

function TableView({ expenses, groupBy, onOpen }) {
  const grouped  = useMemo(() => groupExpenses(expenses, groupBy), [expenses, groupBy])
  const groupKeys = useMemo(() => sortedGroupKeys(grouped, groupBy), [grouped, groupBy])
  const showHeaders = groupBy !== 'none'

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead><TableHead /></thead>
        <tbody className="divide-y divide-gray-100">
          {groupKeys.map((key) => (
            <Fragment key={key}>
              {showHeaders && (
                <tr className="bg-gray-50/70 border-t border-gray-200">
                  <td colSpan={8} className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {key}
                    <span className="ml-2 font-normal text-gray-400">
                      ({grouped[key].length}) · {fmtAmt(grouped[key].reduce((s, e) => s + Number(e.amount || 0), 0))}
                    </span>
                  </td>
                </tr>
              )}
              {grouped[key].map((e) => (
                <tr
                  key={e.id}
                  onClick={() => onOpen(e)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5 font-medium text-gray-800">{e.name}</td>
                  <td className="px-5 py-3.5"><CategoryBadge category={e.category} /></td>
                  <td className="px-5 py-3.5 font-semibold text-gray-800">{fmtAmt(e.amount)}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-sm">{e.date}</td>
                  <td className="px-5 py-3.5 text-sm text-[#111111] truncate max-w-[140px]">{e.dealName || '—'}</td>
                  <td className="px-5 py-3.5">
                    {e.receipt
                      ? <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#1A7A4A' }}><ReceiptIcon />Yes</span>
                      : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-sm">{e.manager || '—'}</td>
                  <td className="px-4 py-3.5 text-gray-300 group-hover:text-gray-400 transition-colors text-right">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
          {expenses.length === 0 && (
            <tr>
              <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">
                No expenses match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Monthly view ───────────────────────────────────────────────────────────────

function MonthlyView({ expenses, onOpen }) {
  const grouped = useMemo(() => {
    const map = {}
    expenses.forEach((e) => {
      const key = expenseMonthLabel(e)
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'Unknown') return 1
      if (b === 'Unknown') return -1
      return new Date(a) - new Date(b)
    })
  }, [expenses])

  if (grouped.length === 0) {
    return <p className="text-center text-sm text-gray-400 py-12">No expenses match your filters.</p>
  }

  return (
    <div className="space-y-6">
      {grouped.map(([month, exps]) => {
        const total = exps.reduce((s, e) => s + Number(e.amount || 0), 0)
        return (
          <div key={month}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold text-gray-700">{month}</h3>
              <span className="text-xs text-gray-400">{exps.length} expense{exps.length !== 1 ? 's' : ''}</span>
              <span className="text-xs font-semibold text-gray-700">{fmtAmt(total)}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><TableHead /></thead>
                <tbody className="divide-y divide-gray-100">
                  <TableRows rows={exps} onOpen={onOpen} />
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── By Category view ───────────────────────────────────────────────────────────

function CategoryView({ expenses, onOpen }) {
  const grouped = useMemo(() => {
    const map = {}
    CATEGORIES.forEach((c) => (map[c] = []))
    expenses.forEach((e) => {
      const key = CATEGORIES.includes(e.category) ? e.category : 'Other'
      map[key].push(e)
    })
    // Only show categories with entries, sorted by total desc
    return Object.entries(map)
      .filter(([, exps]) => exps.length > 0)
      .sort(([, a], [, b]) =>
        b.reduce((s, e) => s + Number(e.amount || 0), 0) -
        a.reduce((s, e) => s + Number(e.amount || 0), 0)
      )
  }, [expenses])

  if (grouped.length === 0) {
    return <p className="text-center text-sm text-gray-400 py-12">No expenses match your filters.</p>
  }

  return (
    <div className="space-y-6">
      {grouped.map(([cat, exps]) => {
        const total = exps.reduce((s, e) => s + Number(e.amount || 0), 0)
        const color = CATEGORY_CHART_COLORS[cat] || '#6b7280'
        return (
          <div key={cat}>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <h3 className="text-sm font-semibold text-gray-700">{cat}</h3>
              <span className="text-xs text-gray-400">{exps.length} expense{exps.length !== 1 ? 's' : ''}</span>
              <span className="text-xs font-semibold text-gray-700">{fmtAmt(total)}</span>
              <CategoryBadge category={cat} />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><TableHead /></thead>
                <tbody className="divide-y divide-gray-100">
                  <TableRows rows={exps} onOpen={onOpen} />
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Add Expense Modal ──────────────────────────────────────────────────────────

function AddExpenseModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '', amount: '', date: todayStr(), category: 'Software',
    dealId: '', dealName: '', receipt: null, manager: 'Marjorie A.', notes: '',
  })
  const fileRef = useRef(null)

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleDealChange = (name) => {
    const deal = KNOWN_DEALS.find((d) => d.name === name)
    setForm((prev) => ({
      ...prev,
      dealName: name,
      dealId: deal ? deal.id : null,
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleChange('receipt', file.name)
  }

  const handleSubmit = () => {
    if (!form.name.trim() || !form.amount) return
    onAdd({
      ...form,
      amount: Number(form.amount),
      dealId: form.dealId || null,
      dealName: form.dealName || '',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Log Expense</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <EditInput label="Expense Name" field="name"   form={form} onChange={handleChange} placeholder="e.g. Adobe Creative Cloud" />

          <div className="grid grid-cols-2 gap-4">
            <EditInput label="Amount ($)" field="amount" form={form} onChange={handleChange} type="number" placeholder="0" />
            <EditInput label="Date"       field="date"   form={form} onChange={handleChange} placeholder="Mar 16, 2026" />
          </div>

          <EditSelect
            label="Category"
            field="category"
            form={form}
            onChange={handleChange}
            options={CATEGORIES}
          />

          {/* Linked deal — searchable with datalist */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
              Linked Deal <span className="normal-case text-gray-300">(optional)</span>
            </label>
            <input
              list="deals-datalist"
              value={form.dealName}
              onChange={(e) => handleDealChange(e.target.value)}
              placeholder="Search deals…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <datalist id="deals-datalist">
              {KNOWN_DEALS.map((d) => (
                <option key={d.id} value={d.name} />
              ))}
            </datalist>
          </div>

          {/* Receipt upload */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
              Receipt <span className="normal-case text-gray-300">(optional)</span>
            </label>
            {form.receipt ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#EDFAF3', border: '1px solid #BBF7D0' }}>
                <ReceiptIcon />
                <span className="text-sm flex-1 truncate" style={{ color: '#1A7A4A' }}>{form.receipt}</span>
                <button
                  onClick={() => handleChange('receipt', null)}
                  className="transition-colors" style={{ color: '#6EBF96' }}
                >
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
              >
                <ReceiptIcon />
                Upload receipt
              </button>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
          </div>

          <EditSelect
            label="Manager"
            field="manager"
            form={form}
            onChange={handleChange}
            options={MANAGERS}
          />

          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Optional notes…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || !form.amount}
            className="flex-1 py-2 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors" style={{ background: '#111111', color: '#fff' }}
          >
            Log Expense
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Expense detail panel ───────────────────────────────────────────────────────

function ExpenseDetail({ expense, onClose, onUpdate }) {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm]           = useState({})
  const fileRef = useRef(null)

  // Reset when switching expenses
  useEffect(() => {
    if (expense) setForm({ ...expense })
    setIsEditing(false)
  }, [expense?.id])

  if (!expense) return null

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleDealChange = (name) => {
    const deal = KNOWN_DEALS.find((d) => d.name === name)
    setForm((prev) => ({ ...prev, dealName: name, dealId: deal ? deal.id : null }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleChange('receipt', file.name)
  }

  const handleSave = () => {
    const updated = {
      ...form,
      amount: Number(form.amount),
      dealId: form.dealId || null,
      dealName: form.dealName || '',
      activityLog: [
        { action: 'Expense updated', timestamp: nowStamp(), by: 'Marjorie A.' },
        ...(form.activityLog || []),
      ],
    }
    onUpdate(updated)
    setIsEditing(false)
  }

  const handleCancelEdit = () => { setForm({ ...expense }); setIsEditing(false) }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-sm font-semibold text-gray-900 truncate">{expense.name}</span>
          <CategoryBadge category={expense.category} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isEditing && (
            <button
              onClick={() => { setForm({ ...expense }); setIsEditing(true) }}
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
        {isEditing ? (
          /* ── Edit form ─────────────────────────────────────────────────── */
          <div className="space-y-4">
            <EditInput label="Name"       field="name"    form={form} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
              <EditInput label="Amount ($)" field="amount" form={form} onChange={handleChange} type="number" />
              <EditInput label="Date"       field="date"   form={form} onChange={handleChange} />
            </div>
            <EditSelect label="Category" field="category" form={form} onChange={handleChange} options={CATEGORIES} />

            {/* Linked deal */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Linked Deal</label>
              <input
                list="edit-deals-datalist"
                value={form.dealName ?? ''}
                onChange={(e) => handleDealChange(e.target.value)}
                placeholder="Search deals…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <datalist id="edit-deals-datalist">
                {KNOWN_DEALS.map((d) => <option key={d.id} value={d.name} />)}
              </datalist>
            </div>

            {/* Receipt */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Receipt</label>
              {form.receipt ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#EDFAF3', border: '1px solid #BBF7D0' }}>
                  <ReceiptIcon />
                  <span className="text-sm flex-1 truncate" style={{ color: '#1A7A4A' }}>{form.receipt}</span>
                  <button onClick={() => handleChange('receipt', null)} style={{ color: '#6EBF96' }}>
                    <CloseIcon />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                >
                  <ReceiptIcon />
                  Upload receipt
                </button>
              )}
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
            </div>

            <EditSelect label="Manager" field="manager" form={form} onChange={handleChange} options={MANAGERS} />

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
          <div className="space-y-5">
            {/* Amount hero */}
            <div className="bg-gray-50 rounded-xl px-5 py-4">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Amount</p>
              <p className="text-2xl font-bold text-gray-900">{fmtAmt(expense.amount)}</p>
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date"    value={expense.date} />
              <Field label="Manager" value={expense.manager} />
              {expense.dealName && (
                <LinkField
                  label="Linked Deal"
                  value={expense.dealName}
                  onClick={() => { onClose(); navigate(`/deals?open=${expense.dealId}`) }}
                />
              )}
            </div>

            {/* Receipt preview */}
            {expense.receipt ? (
              <div>
                <FieldLabel>Receipt</FieldLabel>
                <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-3" style={{ background: '#EDFAF3', border: '1px solid #BBF7D0' }}>
                  <span style={{ color: '#6EBF96' }}><ReceiptIcon /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#0F5132' }}>{expense.receipt}</p>
                    <p className="text-xs" style={{ color: '#6EBF96' }}>Receipt on file</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <FieldLabel>Receipt</FieldLabel>
                <p className="text-sm text-gray-400 italic">No receipt attached</p>
              </div>
            )}

            {expense.notes && <Field label="Notes" value={expense.notes} />}

            {/* Activity log */}
            {(expense.activityLog || []).length > 0 && (
              <div>
                <FieldLabel>Activity</FieldLabel>
                <div className="space-y-3 mt-1">
                  {expense.activityLog.map((entry, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{entry.action}</p>
                        <p className="text-xs text-gray-400">{entry.timestamp} · {entry.by}</p>
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

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Expenses() {
  const { expenses, setExpenses } = useExpenses()

  const [view,       setView]       = useState('table')
  const [selectedId, setSelectedId] = useState(null)
  const [showAdd,    setShowAdd]    = useState(false)
  const [search,     setSearch]     = useState('')
  const [fCategory,  setFCategory]  = useState('')
  const [fManager,   setFManager]   = useState('')
  const [groupBy,    setGroupBy]    = useState('none')

  const selected = expenses.find((e) => e.id === selectedId) ?? null

  const openDrawer  = (exp) => setSelectedId(exp.id)
  const closeDrawer = () => setSelectedId(null)

  const handleUpdate = (updated) => {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }

  const handleAdd = (newExp) => {
    const id = Math.max(0, ...expenses.map((e) => e.id)) + 1
    setExpenses((prev) => [
      {
        ...newExp,
        id,
        activityLog: [
          { action: 'Expense logged', timestamp: nowStamp(), by: newExp.manager || 'Marjorie A.' },
        ],
      },
      ...prev,
    ])
  }

  // Filtered list
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (search    && !`${e.name} ${e.category} ${e.dealName}`.toLowerCase().includes(search.toLowerCase())) return false
      if (fCategory && e.category !== fCategory) return false
      if (fManager  && e.manager  !== fManager)  return false
      return true
    })
  }, [expenses, search, fCategory, fManager])

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Expenses"
        subtitle="Agency operational expenses and overhead."
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Log Expense
          </button>
        }
      />

      {/* Metrics */}
      <MetricsBar expenses={expenses} />

      {/* View toggle */}
      <ViewToggle view={view} setView={setView} />

      {/* Filters */}
      <FilterBar
        search={search}       setSearch={setSearch}
        fCategory={fCategory} setFCategory={setFCategory}
        fManager={fManager}   setFManager={setFManager}
        groupBy={groupBy}     setGroupBy={setGroupBy}
        view={view}
      />

      {/* Views */}
      {view === 'table'    && <TableView    expenses={filtered} groupBy={groupBy} onOpen={openDrawer} />}
      {view === 'monthly'  && <MonthlyView  expenses={filtered} onOpen={openDrawer} />}
      {view === 'category' && <CategoryView expenses={filtered} onOpen={openDrawer} />}

      {/* Add modal */}
      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${
          selectedId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
      />

      {/* Detail panel */}
      <aside
        className={`fixed right-0 top-0 z-50 w-[min(480px,92vw)] bg-white border-l border-gray-200 h-full overflow-y-auto shadow-xl transition-transform duration-300 ease-in-out ${
          selectedId ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selected && (
          <ExpenseDetail
            expense={selected}
            onClose={closeDrawer}
            onUpdate={handleUpdate}
          />
        )}
      </aside>
    </div>
  )
}
