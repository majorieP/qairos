import { useState, useMemo, Fragment } from 'react'
import PageHeader from '../components/PageHeader'
import { useExpenses, CATEGORIES, CATEGORY_CHART_COLORS } from '../context/ExpensesContext'
import { usePayouts } from '../context/PayoutsContext'

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n >= 1000
    ? '$' + (n / 1000 % 1 === 0 ? (n / 1000).toFixed(0) : (n / 1000).toFixed(1)) + 'k'
    : '$' + n.toLocaleString()

const fmtFull = (n) => '$' + n.toLocaleString()

const fmtPct = (n) => n.toFixed(1) + '%'

function computeRow(d) {
  const commissions = d.invoiced * 0.15
  // Net Profit = Revenue − Payouts − Expenses
  const netProfit = d.invoiced - d.payouts - d.expenses
  const margin = commissions > 0 ? (netProfit / commissions) * 100 : 0
  return { commissions, netProfit, margin }
}

function computeYTDTotals(data) {
  const invoiced = data.reduce((s, d) => s + d.invoiced, 0)
  const payouts = data.reduce((s, d) => s + d.payouts, 0)
  const expenses = data.reduce((s, d) => s + d.expenses, 0)
  const commissions = invoiced * 0.15
  // Net Profit = Revenue − Payouts − Expenses
  const netProfit = invoiced - payouts - expenses
  const margin = commissions > 0 ? (netProfit / commissions) * 100 : 0
  return { invoiced, payouts, expenses, commissions, netProfit, margin }
}

function delta(curr, prev) {
  if (!prev) return null
  const pct = ((curr - prev) / prev) * 100
  return { pct: Math.abs(pct).toFixed(1), positive: pct >= 0 }
}

// ── Data ───────────────────────────────────────────────────────────────────

const monthlyData2026 = [
  { month: 'Jan', invoiced: 31500, expenses: 599,  payouts: 26775 },
  { month: 'Feb', invoiced: 24000, expenses: 2841, payouts: 20400 },
  { month: 'Mar', invoiced: 43700, expenses: 337,  payouts: 37145 },
  { month: 'Apr', invoiced: 5200,  expenses: 0,    payouts: 4420  },
  { month: 'May', invoiced: 0,     expenses: 0,    payouts: 0     },
  { month: 'Jun', invoiced: 0,     expenses: 0,    payouts: 0     },
  { month: 'Jul', invoiced: 0,     expenses: 0,    payouts: 0     },
  { month: 'Aug', invoiced: 0,     expenses: 0,    payouts: 0     },
  { month: 'Sep', invoiced: 0,     expenses: 0,    payouts: 0     },
  { month: 'Oct', invoiced: 0,     expenses: 0,    payouts: 0     },
  { month: 'Nov', invoiced: 0,     expenses: 0,    payouts: 0     },
  { month: 'Dec', invoiced: 0,     expenses: 0,    payouts: 0     },
]

const monthlyData2025 = [
  { month: 'Jan', invoiced: 18000, expenses: 599,  payouts: 15300 },
  { month: 'Feb', invoiced: 15000, expenses: 850,  payouts: 12750 },
  { month: 'Mar', invoiced: 29000, expenses: 600,  payouts: 24650 },
  { month: 'Apr', invoiced: 22000, expenses: 400,  payouts: 18700 },
  { month: 'May', invoiced: 31000, expenses: 800,  payouts: 26350 },
  { month: 'Jun', invoiced: 27000, expenses: 1200, payouts: 22950 },
  { month: 'Jul', invoiced: 19000, expenses: 500,  payouts: 16150 },
  { month: 'Aug', invoiced: 33000, expenses: 750,  payouts: 28050 },
  { month: 'Sep', invoiced: 28000, expenses: 900,  payouts: 23800 },
  { month: 'Oct', invoiced: 41000, expenses: 1100, payouts: 34850 },
  { month: 'Nov', invoiced: 38000, expenses: 650,  payouts: 32300 },
  { month: 'Dec', invoiced: 52000, expenses: 2200, payouts: 44200 },
]

const monthlyDetails = {
  Jan: {
    invoices: [
      { id: 'INV-2026-001', creator: 'Sofia Chen',   amount: 12000, status: 'Paid' },
      { id: 'INV-2026-002', creator: 'Marcus Reid',  amount: 8500,  status: 'Paid' },
      { id: 'INV-2026-003', creator: 'James Ortiz',  amount: 11000, status: 'Paid' },
    ],
    payouts: [
      { creator: 'Sofia Chen',  gross: 12000, commission: 1800, net: 10200 },
      { creator: 'Marcus Reid', gross: 8500,  commission: 1275, net: 7225  },
      { creator: 'James Ortiz', gross: 11000, commission: 1650, net: 9350  },
    ],
    expenses: [
      { description: 'Adobe Creative Cloud', category: 'Software', amount: 599 },
    ],
  },
  Feb: {
    invoices: [
      { id: 'INV-2026-010', creator: 'Anika Patel', amount: 24000, status: 'Paid' },
    ],
    payouts: [
      { creator: 'Anika Patel', gross: 24000, commission: 3600, net: 20400 },
    ],
    expenses: [
      { description: 'Contract Lawyer Review', category: 'Legal',    amount: 850  },
      { description: 'Creator Summit (x3)',    category: 'Events',   amount: 1200 },
      { description: 'Adobe Creative Cloud',   category: 'Software', amount: 599  },
      { description: 'Miscellaneous',          category: 'Other',    amount: 192  },
    ],
  },
  Mar: {
    invoices: [
      { id: 'INV-2026-031', creator: 'Sofia Chen',  amount: 12000, status: 'Paid'        },
      { id: 'INV-2026-032', creator: 'Marcus Reid', amount: 8500,  status: 'Outstanding' },
      { id: 'INV-2026-033', creator: 'James Ortiz', amount: 18000, status: 'Overdue'     },
      { id: 'INV-2026-034', creator: 'Anika Patel', amount: 5200,  status: 'Draft'       },
    ],
    payouts: [
      { creator: 'Sofia Chen',  gross: 12000, commission: 1800, net: 10200 },
      { creator: 'Marcus Reid', gross: 8500,  commission: 1275, net: 7225  },
      { creator: 'James Ortiz', gross: 18000, commission: 2700, net: 15300 },
      { creator: 'Anika Patel', gross: 5200,  commission: 780,  net: 4420  },
    ],
    expenses: [
      { description: 'Notion Teams Plan', category: 'Software',   amount: 192 },
      { description: 'Office Supplies',   category: 'Operations', amount: 145 },
    ],
  },
  Apr: {
    invoices: [
      { id: 'INV-2026-035', creator: 'Anika Patel', amount: 5200, status: 'Draft' },
    ],
    payouts: [],
    expenses: [],
  },
}

const topCreators = [
  { name: 'James Ortiz',   revenue: 47000, deals: 3, commission: 7050, avatar: 'JO' },
  { name: 'Anika Patel',   revenue: 34400, deals: 2, commission: 5160, avatar: 'AP' },
  { name: 'Sofia Chen',    revenue: 36000, deals: 3, commission: 5400, avatar: 'SC' },
  { name: 'Lily Nakamura', revenue: 22000, deals: 1, commission: 3300, avatar: 'LN' },
  { name: 'Marcus Reid',   revenue: 17000, deals: 2, commission: 2550, avatar: 'MR' },
]

const topBrands = [
  { name: 'Luminary Beauty', spend: 36000, deals: 2 },
  { name: 'TechFlow',        spend: 29000, deals: 2 },
  { name: 'Verdant Foods',   spend: 29200, deals: 2 },
  { name: 'Solstice Travel', spend: 22000, deals: 1 },
  { name: 'Peak Athletics',  spend: 17000, deals: 2 },
]

const topManagers = [
  { name: 'Marjorie A.', commission: 11700, creators: 5 },
  { name: 'Devon Park',  commission: 5460,  creators: 2 },
  { name: 'Sienna Moore', commission: 3300, creators: 1 },
]

const pipelineData = {
  totalPipelineValue: 55700,
  closingThisMonth: 20500,
  outstandingInvoices: 26500,
  pendingPayouts: 22525,
}

const revenueByCreator = [
  { name: 'James Ortiz',   value: 47000, color: '#111111' },
  { name: 'Sofia Chen',    value: 36000, color: '#444444' },
  { name: 'Anika Patel',   value: 34400, color: '#666666' },
  { name: 'Lily Nakamura', value: 22000, color: '#999999' },
  { name: 'Marcus Reid',   value: 17000, color: '#BBBBBB' },
]

// ── Shared field components ────────────────────────────────────────────────

const statusColors = {
  Paid:        { background: '#EDFAF3', color: '#1A7A4A' },
  Outstanding: { background: '#EEF4FF', color: '#2D5BE3' },
  Overdue:     { background: '#FEE2E2', color: '#DC2626' },
  Draft:       { background: '#F3F3F3', color: '#666666' },
  Signed:      { background: '#EDFAF3', color: '#1A7A4A' },
  Proposal:    { background: '#F3F3F3', color: '#666666' },
  Negotiation: { background: '#FFF4EC', color: '#C4622D' },
  Closed:      { background: '#EDFAF3', color: '#1A7A4A' },
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{children}</h2>
  )
}

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? 'text-[#111111] font-bold' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function BarChart({ data, highlightMonth }) {
  const W = 720, H = 130, PAD_LEFT = 46, PAD_BOT = 22, PAD_TOP = 8
  const plotW = W - PAD_LEFT
  const plotH = H - PAD_BOT - PAD_TOP
  const maxVal = Math.max(...data.map(d => d.invoiced), 1) * 1.15
  const slotW = plotW / 12
  const barW = slotW * 0.52
  const expW = slotW * 0.22

  const yTicks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      {yTicks.map((frac) => {
        const y = PAD_TOP + plotH * (1 - frac)
        return (
          <g key={frac}>
            <line x1={PAD_LEFT} y1={y} x2={W} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PAD_LEFT - 5} y={y + 3.5} textAnchor="end" fontSize="8.5" fill="#9ca3af">
              {fmt(maxVal * frac)}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const slotX = PAD_LEFT + slotW * i
        const barX = slotX + (slotW - barW) / 2
        const expX = barX - expW - 2
        const invoicedH = d.invoiced > 0 ? Math.max((d.invoiced / maxVal) * plotH, 3) : 0
        const expH = d.expenses > 0 ? Math.max((d.expenses / maxVal) * plotH, 2) : 0
        const isHighlight = d.month === highlightMonth
        return (
          <g key={d.month}>
            {invoicedH > 0 && (
              <rect
                x={barX}
                y={PAD_TOP + plotH - invoicedH}
                width={barW}
                height={invoicedH}
                rx="2"
                fill={isHighlight ? '#111111' : '#888888'}
              />
            )}
            {expH > 0 && (
              <rect
                x={expX}
                y={PAD_TOP + plotH - expH}
                width={expW}
                height={expH}
                rx="2"
                fill="#fca5a5"
              />
            )}
            <text
              x={slotX + slotW / 2}
              y={H - 5}
              textAnchor="middle"
              fontSize="8.5"
              fill={isHighlight ? '#111111' : '#9ca3af'}
              fontWeight={isHighlight ? '600' : '400'}
            >
              {d.month}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({ data }) {
  const cx = 72, cy = 72, r = 52
  const circumference = 2 * Math.PI * r
  const total = data.reduce((s, d) => s + d.value, 0)

  let cumulativeDash = 0
  const slices = data.map((d) => {
    const dash = (d.value / total) * circumference
    const offset = circumference / 4 - cumulativeDash
    cumulativeDash += dash
    return { ...d, dash, offset }
  })

  return (
    <svg viewBox="0 0 144 144" className="w-full" style={{ height: 144 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="22" />
      {slices.map((s) => (
        <circle
          key={s.name}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="22"
          strokeDasharray={`${s.dash} ${circumference - s.dash}`}
          strokeDashoffset={s.offset}
        />
      ))}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize="16" fontWeight="600" fill="#111827">
        {fmt(total)}
      </text>
      <text x={cx} y={cx + 10} textAnchor="middle" fontSize="9" fill="#9ca3af">
        YTD Revenue
      </text>
    </svg>
  )
}

function MonthExpandPanel({ month, liveExpenses }) {
  const detail = monthlyDetails[month]
  const expenses = liveExpenses ?? detail?.expenses ?? []

  if (!detail && expenses.length === 0) {
    return (
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 italic">
        No detail data available for {month}.
      </div>
    )
  }

  return (
    <div className="bg-gray-50/60 border-t border-gray-100 px-6 py-5">
      <div className="grid grid-cols-2 gap-6 mb-4">
        {/* Invoices */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Invoices</p>
          {!detail || detail.invoices.length === 0 ? (
            <p className="text-xs text-gray-400 italic">None</p>
          ) : (
            <div className="space-y-2">
              {detail.invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-[10px] text-gray-400 shrink-0">{inv.id}</span>
                  <span className="text-gray-600 flex-1 truncate">{inv.creator}</span>
                  <span className="font-medium text-gray-800 shrink-0">{fmtFull(inv.amount)}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0" style={statusColors[inv.status] ?? { background: '#F3F3F3', color: '#666666' }}>
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Payouts */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Payouts</p>
          {!detail || detail.payouts.length === 0 ? (
            <p className="text-xs text-gray-400 italic">None</p>
          ) : (
            <div className="space-y-2">
              {detail.payouts.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-gray-700 flex-1">{p.creator}</span>
                  <span className="text-gray-400">Gross {fmtFull(p.gross)}</span>
                  <span className="text-[#111111] font-medium">−{fmtFull(p.commission)}</span>
                  <span className="font-medium text-gray-800">Net {fmtFull(p.net)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Expenses — live from context */}
      {expenses.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Expenses</p>
          <div className="flex flex-wrap gap-2">
            {expenses.map((e, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: CATEGORY_CHART_COLORS[e.category] || '#6b7280' }}
                />
                {e.name ?? e.description}
                <span className="font-medium text-gray-800">{fmtFull(e.amount)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function YearlySummary({ data, year, compareData }) {
  const totals = computeYTDTotals(data)
  const prevTotals = compareData ? computeYTDTotals(compareData) : null

  const metrics = [
    { label: 'Revenue',     curr: totals.invoiced,    prev: prevTotals?.invoiced    },
    { label: 'Commissions', curr: totals.commissions, prev: prevTotals?.commissions },
    { label: 'Expenses',    curr: totals.expenses,    prev: prevTotals?.expenses    },
    { label: 'Net Profit',  curr: totals.netProfit,   prev: prevTotals?.netProfit   },
  ]

  return (
    <div>
      {prevTotals && (
        <div className="grid grid-cols-4 gap-4 mb-5">
          {metrics.map((m) => {
            const d = delta(m.curr, m.prev)
            return (
              <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{m.label}</p>
                <p className="text-lg font-semibold text-gray-900">{fmt(m.curr)}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-xs text-gray-400">vs {fmt(m.prev)}</p>
                  {d && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={
                      d.positive ? { background: '#EDFAF3', color: '#1A7A4A' } : { background: '#FEE2E2', color: '#DC2626' }
                    }>
                      {d.positive ? '+' : '−'}{d.pct}%
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 text-left font-medium">Month</th>
              <th className="px-5 py-3 text-right font-medium">Invoiced</th>
              <th className="px-5 py-3 text-right font-medium">Commission</th>
              <th className="px-5 py-3 text-right font-medium">Payouts</th>
              <th className="px-5 py-3 text-right font-medium">Expenses</th>
              <th className="px-5 py-3 text-right font-medium">Net Profit</th>
              <th className="px-5 py-3 text-right font-medium">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((d) => {
              const row = computeRow(d)
              const isEmpty = d.invoiced === 0 && d.expenses === 0
              return (
                <tr key={d.month} className={isEmpty ? 'opacity-35' : ''}>
                  <td className="px-5 py-3 text-gray-700 font-medium">{d.month} {year}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{d.invoiced > 0 ? fmtFull(d.invoiced) : '—'}</td>
                  <td className="px-5 py-3 text-right text-[#111111]">{d.invoiced > 0 ? fmtFull(row.commissions) : '—'}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{d.payouts > 0 ? fmtFull(d.payouts) : '—'}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{d.expenses > 0 ? fmtFull(d.expenses) : '—'}</td>
                  <td className={`px-5 py-3 text-right font-medium ${!isEmpty ? (row.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500') : 'text-gray-400'}`}>
                    {d.invoiced > 0 ? fmtFull(row.netProfit) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">{d.invoiced > 0 ? fmtPct(row.margin) : '—'}</td>
                </tr>
              )
            })}
            <tr className="bg-gray-50 border-t-2 border-gray-200">
              <td className="px-5 py-3 text-sm font-semibold text-gray-800">Total {year}</td>
              <td className="px-5 py-3 text-right text-sm font-semibold text-gray-800">{fmtFull(totals.invoiced)}</td>
              <td className="px-5 py-3 text-right text-sm font-semibold text-[#111111]">{fmtFull(totals.commissions)}</td>
              <td className="px-5 py-3 text-right text-sm font-semibold text-gray-600">{fmtFull(totals.payouts)}</td>
              <td className="px-5 py-3 text-right text-sm font-semibold text-gray-600">{fmtFull(totals.expenses)}</td>
              <td className={`px-5 py-3 text-right text-sm font-semibold ${totals.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {fmtFull(totals.netProfit)}
              </td>
              <td className="px-5 py-3 text-right text-sm font-semibold text-gray-600">{fmtPct(totals.margin)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

const avatarColors = [
  'bg-gray-100 text-gray-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

function TopPerformers() {
  const [perfTab, setPerfTab] = useState('creators')

  const tabs = [
    { id: 'creators', label: 'Creators' },
    { id: 'brands',   label: 'Brands'   },
    { id: 'managers', label: 'Managers' },
  ]

  const rows = perfTab === 'creators' ? topCreators
             : perfTab === 'brands'   ? topBrands
             : topManagers

  const valKey = perfTab === 'creators' ? 'revenue'
               : perfTab === 'brands'   ? 'spend'
               : 'commission'

  const subLabel = perfTab === 'creators' ? (r) => `${r.deals} deal${r.deals !== 1 ? 's' : ''} · ${fmtFull(r.commission)} commission`
                 : perfTab === 'brands'   ? (r) => `${r.deals} deal${r.deals !== 1 ? 's' : ''}`
                 : (r) => `${r.creators} creator${r.creators !== 1 ? 's' : ''}`

  const maxVal = Math.max(...rows.map(r => r[valKey]))

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-gray-800">Top Performers</p>
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setPerfTab(t.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                perfTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {rows.map((r, i) => (
          <div key={r.name} className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500 flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            {perfTab !== 'brands' && (
              <span className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                {r.avatar ?? r.name.split(' ').map(w => w[0]).join('').toUpperCase()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                <span className="text-sm font-semibold text-gray-700 shrink-0">{fmt(r[valKey])}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-400 transition-all duration-500"
                    style={{ width: `${(r[valKey] / maxVal) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 min-w-[80px] text-right">
                  {subLabel(r)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PipelineSection() {
  const borderColors = {
    gray:   'border-l-gray-400',
    amber:  'border-l-amber-400',
    red:    'border-l-red-400',
    blue:   'border-l-blue-400',
  }

  const cards = [
    { label: 'Total Pipeline',       value: fmt(pipelineData.totalPipelineValue), sub: 'Proposal + Negotiation + Signed', color: 'gray'   },
    { label: 'Closing This Month',   value: fmt(pipelineData.closingThisMonth),   sub: '2 deals due in March',            color: 'amber'  },
    { label: 'Outstanding Invoices', value: fmt(pipelineData.outstandingInvoices),sub: '2 invoices overdue or unpaid',    color: 'red'    },
    { label: 'Pending Payouts',      value: fmt(pipelineData.pendingPayouts),     sub: '3 payouts to process',            color: 'blue'   },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm font-semibold text-gray-800 mb-5">Pipeline</p>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className={`border border-gray-100 border-l-4 ${borderColors[c.color]} rounded-lg p-4`}>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">{c.label}</p>
            <p className="text-xl font-semibold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function BusinessPerformance() {
  const [expandedMonth, setExpandedMonth] = useState(null)
  const [viewYear, setViewYear] = useState(2026)
  const { expenses } = useExpenses()
  const { payouts } = usePayouts()

  // ── Derive live expense data from context ────────────────────────────────
  // Map from 3-char month abbrev → total amount (2026 only)
  const expenseByMonth = useMemo(() => {
    const map = {}
    expenses.forEach((e) => {
      const d = new Date(e.date)
      if (d.getFullYear() !== 2026) return
      const abbrev = e.date.slice(0, 3) // 'Jan', 'Feb', etc.
      map[abbrev] = (map[abbrev] || 0) + Number(e.amount || 0)
    })
    return map
  }, [expenses])

  // Map from 3-char month abbrev → array of expense objects (for expand panel)
  const expenseByMonthArr = useMemo(() => {
    const map = {}
    expenses.forEach((e) => {
      const d = new Date(e.date)
      if (d.getFullYear() !== 2026) return
      const abbrev = e.date.slice(0, 3)
      if (!map[abbrev]) map[abbrev] = []
      map[abbrev].push(e)
    })
    return map
  }, [expenses])

  // Map from category → total (2026 YTD)
  const expenseByCategory = useMemo(() => {
    const map = {}
    CATEGORIES.forEach((c) => (map[c] = 0))
    expenses.forEach((e) => {
      if (new Date(e.date).getFullYear() !== 2026) return
      if (map[e.category] !== undefined) map[e.category] += Number(e.amount || 0)
    })
    return map
  }, [expenses])

  // Map from 3-char month abbrev → net payout total (2026 paid payouts only)
  const payoutByMonth = useMemo(() => {
    const map = {}
    payouts.forEach((p) => {
      if (p.status !== 'Paid' || !p.paidDate) return
      const d = new Date(p.paidDate)
      if (d.getFullYear() !== 2026) return
      const abbrev = p.paidDate.slice(0, 3) // 'Jan', 'Feb', etc.
      map[abbrev] = (map[abbrev] || 0) + Number(p.net || 0)
    })
    return map
  }, [payouts])

  // Live 2026 monthly data — overrides hardcoded expenses & payouts with context values
  const liveMonthlyData2026 = useMemo(() =>
    monthlyData2026.map((d) => ({
      ...d,
      expenses: expenseByMonth[d.month] ?? 0,
      payouts:  payoutByMonth[d.month]  ?? d.payouts,
    })),
  [expenseByMonth, payoutByMonth])

  const activeData = viewYear === 2026 ? liveMonthlyData2026 : monthlyData2025
  const ytd = computeYTDTotals(liveMonthlyData2026)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Business Performance"
        subtitle="Year-to-date financial overview and agency analytics."
      />

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <KpiCard
          label="Total Revenue YTD"
          value={fmtFull(ytd.invoiced)}
          sub="Gross invoiced to brands"
        />
        <KpiCard
          label="Commissions YTD"
          value={fmtFull(ytd.commissions)}
          sub={`15% of ${fmtFull(ytd.invoiced)}`}
        />
        <KpiCard
          label="Payouts to Creators"
          value={fmtFull(ytd.payouts)}
          sub="Net paid out after commission"
        />
        <KpiCard
          label="Expenses YTD"
          value={fmtFull(ytd.expenses)}
          sub="Agency overhead"
        />
        <KpiCard
          label="Net Profit"
          value={fmtFull(ytd.netProfit)}
          sub="Revenue − Payouts − Expenses"
          accent
        />
        <KpiCard
          label="Profit Margin"
          value={fmtPct(ytd.margin)}
          sub="Of gross commissions"
          accent
        />
      </div>

      {/* ── Expenses by Category ───────────────────────────────────────────── */}
      {(() => {
        const catEntries = CATEGORIES
          .map((c) => ({ cat: c, total: expenseByCategory[c] || 0 }))
          .filter((x) => x.total > 0)
          .sort((a, b) => b.total - a.total)
        const ytdExpenses = catEntries.reduce((s, x) => s + x.total, 0)
        if (catEntries.length === 0) return null
        return (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">Expenses by Category</p>
                <p className="text-xs text-gray-400 mt-0.5">2026 YTD · {fmtFull(ytdExpenses)} total</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
              {catEntries.map(({ cat, total }) => (
                <div key={cat} className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: CATEGORY_CHART_COLORS[cat] || '#6b7280' }}
                  />
                  <span className="text-xs text-gray-600 w-[88px] shrink-0">{cat}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(total / ytdExpenses) * 100}%`, background: CATEGORY_CHART_COLORS[cat] || '#6b7280' }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-[60px] text-right shrink-0">{fmtFull(total)}</span>
                  <span className="text-[10px] text-gray-400 w-[32px] text-right shrink-0">
                    {((total / ytdExpenses) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Charts row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {/* Bar chart — spans 2 cols */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Monthly Revenue</p>
              <p className="text-xs text-gray-400 mt-0.5">2026 year-to-date</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-gray-500 inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-300 inline-block" />
                Expenses
              </span>
            </div>
          </div>
          <BarChart data={liveMonthlyData2026} highlightMonth={expandedMonth} />
        </div>

        {/* Donut chart — 1 col */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-800 mb-0.5">Revenue by Creator</p>
          <p className="text-xs text-gray-400 mb-3">2026 YTD share</p>
          <DonutChart data={revenueByCreator} />
          <div className="mt-3 space-y-2">
            {revenueByCreator.map((d) => {
              const total = revenueByCreator.reduce((s, x) => s + x.value, 0)
              const pct = ((d.value / total) * 100).toFixed(0)
              return (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-gray-600">{d.name}</span>
                  </span>
                  <span className="text-gray-400">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Monthly Breakdown ──────────────────────────────────────────────── */}
      <SectionTitle>Monthly Breakdown</SectionTitle>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 text-left font-medium">Month</th>
              <th className="px-5 py-3 text-right font-medium">Invoiced</th>
              <th className="px-5 py-3 text-right font-medium">Commission</th>
              <th className="px-5 py-3 text-right font-medium">Payouts</th>
              <th className="px-5 py-3 text-right font-medium">Expenses</th>
              <th className="px-5 py-3 text-right font-medium">Net Profit</th>
              <th className="px-5 py-3 text-right font-medium">Margin</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {liveMonthlyData2026.map((d) => {
              const row = computeRow(d)
              const isExpanded = expandedMonth === d.month
              const hasData = d.invoiced > 0 || d.expenses > 0
              return (
                <Fragment key={d.month}>
                  <tr
                    onClick={() => hasData && setExpandedMonth(isExpanded ? null : d.month)}
                    className={`border-t border-gray-100 transition-colors ${
                      hasData ? 'cursor-pointer hover:bg-gray-50' : 'opacity-35'
                    } ${isExpanded ? 'bg-gray-50/70' : ''}`}
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-800">{d.month} 2026</td>
                    <td className="px-5 py-3.5 text-right text-gray-700">
                      {d.invoiced > 0 ? fmtFull(d.invoiced) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#111111] font-medium">
                      {d.invoiced > 0 ? fmtFull(row.commissions) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-500">
                      {d.payouts > 0 ? fmtFull(d.payouts) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-500">
                      {d.expenses > 0 ? fmtFull(d.expenses) : '—'}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-medium ${
                      hasData ? (row.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500') : 'text-gray-400'
                    }`}>
                      {d.invoiced > 0 ? fmtFull(row.netProfit) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-500">
                      {d.invoiced > 0 ? fmtPct(row.margin) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {hasData && (
                        <svg
                          width="14" height="14" viewBox="0 0 14 14" fill="none"
                          className={`inline-block text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        >
                          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <MonthExpandPanel month={d.month} liveExpenses={expenseByMonthArr[d.month]} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Yearly Summary ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Yearly Summary</SectionTitle>
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 -mt-4">
          {[2026, 2025].map((y) => (
            <button
              key={y}
              onClick={() => setViewYear(y)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewYear === y ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-8">
        <YearlySummary
          data={activeData}
          year={viewYear}
          compareData={viewYear === 2026 ? monthlyData2025 : null}
        />
      </div>

      {/* ── Top Performers + Pipeline ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-5">
        <TopPerformers />
        <PipelineSection />
      </div>
    </div>
  )
}
