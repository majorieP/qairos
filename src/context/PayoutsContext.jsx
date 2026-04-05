import { createContext, useContext, useState, useEffect } from 'react'
import { fetchAll, updateRow, deleteRow, insertRow } from '../lib/supabaseHelpers'

const initialPayouts = [
  // ── January 2026 ────────────────────────────────────────────────────────────
  {
    id: 1,
    creator: 'Sofia Chen',   creatorId: 1,
    brand: 'Luminary Beauty', brandId: 1,
    campaign: 'Spring Glow Campaign',    campaignId: 1,
    deal: 'Luminary Beauty × Sofia Q1',  dealId: 1,
    invoiceId: 1,
    month: 'January 2026',
    gross: 12000, commission: 1800, commissionRate: 15, net: 10200,
    status: 'Paid',
    dueDate: 'Feb 1, 2026', paidDate: 'Jan 28, 2026', date: 'Jan 15, 2026',
    manager: 'Marjorie A.',
    notes: 'Paid via ACH transfer.',
    banking: { accountName: 'Sofia Chen', bankName: 'Chase', lastFour: '4892' },
    tasks: [],
    activityLog: [
      { action: 'Payout created', timestamp: '2026-01-15T10:00:00', by: 'Marjorie A.' },
      { action: 'Status changed to Processing', timestamp: '2026-01-20T09:00:00', by: 'Marjorie A.' },
      { action: 'Status changed to Paid', timestamp: '2026-01-28T14:30:00', by: 'Marjorie A.' },
    ],
  },
  {
    id: 2,
    creator: 'Marcus Reid',  creatorId: 2,
    brand: 'TechFlow',        brandId: 2,
    campaign: 'TechFlow Product Launch', campaignId: 2,
    deal: 'TechFlow × Marcus Q1',        dealId: 2,
    invoiceId: 2,
    month: 'January 2026',
    gross: 8500, commission: 1275, commissionRate: 15, net: 7225,
    status: 'Paid',
    dueDate: 'Feb 1, 2026', paidDate: 'Jan 30, 2026', date: 'Jan 15, 2026',
    manager: 'Marjorie A.',
    notes: '',
    banking: { accountName: 'Marcus Reid', bankName: 'Bank of America', lastFour: '7341' },
    tasks: [],
    activityLog: [
      { action: 'Payout created', timestamp: '2026-01-15T10:05:00', by: 'Marjorie A.' },
      { action: 'Status changed to Paid', timestamp: '2026-01-30T11:00:00', by: 'Marjorie A.' },
    ],
  },
  {
    id: 3,
    creator: 'James Ortiz',  creatorId: 3,
    brand: 'Verdant Foods',   brandId: 3,
    campaign: 'Verdant Spring Recipes', campaignId: 3,
    deal: 'Verdant Foods × James Q1',   dealId: 3,
    invoiceId: 3,
    month: 'January 2026',
    gross: 11000, commission: 1650, commissionRate: 15, net: 9350,
    status: 'Paid',
    dueDate: 'Feb 5, 2026', paidDate: 'Feb 3, 2026', date: 'Jan 20, 2026',
    manager: 'Devon Park',
    notes: '',
    banking: { accountName: 'James Ortiz', bankName: 'Wells Fargo', lastFour: '2218' },
    tasks: [],
    activityLog: [
      { action: 'Payout created', timestamp: '2026-01-20T09:00:00', by: 'Devon Park' },
      { action: 'Status changed to Paid', timestamp: '2026-02-03T16:00:00', by: 'Devon Park' },
    ],
  },
  // ── February 2026 ───────────────────────────────────────────────────────────
  {
    id: 4,
    creator: 'Anika Patel',  creatorId: 4,
    brand: 'Luminary Beauty', brandId: 1,
    campaign: 'Luminary Skincare Series', campaignId: 4,
    deal: 'Luminary Beauty × Anika Feb',  dealId: 4,
    invoiceId: 4,
    month: 'February 2026',
    gross: 24000, commission: 3600, commissionRate: 15, net: 20400,
    status: 'Paid',
    dueDate: 'Mar 1, 2026', paidDate: 'Feb 27, 2026', date: 'Feb 5, 2026',
    manager: 'Marjorie A.',
    notes: 'Largest single payout this quarter.',
    banking: { accountName: 'Anika Patel', bankName: 'Citi', lastFour: '9034' },
    tasks: [],
    activityLog: [
      { action: 'Payout created', timestamp: '2026-02-05T10:00:00', by: 'Marjorie A.' },
      { action: 'Status changed to Processing', timestamp: '2026-02-20T10:00:00', by: 'Marjorie A.' },
      { action: 'Status changed to Paid', timestamp: '2026-02-27T13:00:00', by: 'Marjorie A.' },
    ],
  },
  // ── March 2026 ──────────────────────────────────────────────────────────────
  {
    id: 5,
    creator: 'Sofia Chen',   creatorId: 1,
    brand: 'Solstice Travel', brandId: 4,
    campaign: 'Solstice Spring Destinations', campaignId: 5,
    deal: 'Solstice Travel × Sofia Mar',      dealId: 5,
    invoiceId: 5,
    month: 'March 2026',
    gross: 12000, commission: 1800, commissionRate: 15, net: 10200,
    status: 'Paid',
    dueDate: 'Apr 1, 2026', paidDate: 'Mar 28, 2026', date: 'Mar 5, 2026',
    manager: 'Marjorie A.',
    notes: '',
    banking: { accountName: 'Sofia Chen', bankName: 'Chase', lastFour: '4892' },
    tasks: [],
    activityLog: [
      { action: 'Payout created', timestamp: '2026-03-05T10:00:00', by: 'Marjorie A.' },
      { action: 'Status changed to Paid', timestamp: '2026-03-28T10:00:00', by: 'Marjorie A.' },
    ],
  },
  {
    id: 6,
    creator: 'Marcus Reid',  creatorId: 2,
    brand: 'Peak Athletics',  brandId: 5,
    campaign: 'Peak Spring Training', campaignId: 6,
    deal: 'Peak Athletics × Marcus Mar', dealId: 6,
    invoiceId: null,
    month: 'March 2026',
    gross: 8500, commission: 1275, commissionRate: 15, net: 7225,
    status: 'Paid',
    dueDate: 'Apr 5, 2026', paidDate: 'Apr 1, 2026', date: 'Mar 10, 2026',
    manager: 'Devon Park',
    notes: '',
    banking: { accountName: 'Marcus Reid', bankName: 'Bank of America', lastFour: '7341' },
    tasks: [],
    activityLog: [
      { action: 'Payout created', timestamp: '2026-03-10T10:00:00', by: 'Devon Park' },
      { action: 'Status changed to Paid', timestamp: '2026-04-01T09:00:00', by: 'Devon Park' },
    ],
  },
  {
    id: 7,
    creator: 'James Ortiz', creatorId: 3,
    brand: 'TechFlow',       brandId: 2,
    campaign: 'TechFlow Q2 Integration', campaignId: 7,
    deal: 'TechFlow × James Mar',        dealId: 7,
    invoiceId: null,
    month: 'March 2026',
    gross: 18000, commission: 2700, commissionRate: 15, net: 15300,
    status: 'Paid',
    dueDate: 'Apr 5, 2026', paidDate: 'Apr 2, 2026', date: 'Mar 12, 2026',
    manager: 'Devon Park',
    notes: '',
    banking: { accountName: 'James Ortiz', bankName: 'Wells Fargo', lastFour: '2218' },
    tasks: [],
    activityLog: [
      { action: 'Payout created', timestamp: '2026-03-12T11:00:00', by: 'Devon Park' },
      { action: 'Status changed to Paid', timestamp: '2026-04-02T10:30:00', by: 'Devon Park' },
    ],
  },
  {
    id: 8,
    creator: 'Anika Patel', creatorId: 4,
    brand: 'Verdant Foods',  brandId: 3,
    campaign: 'Verdant Summer Preview', campaignId: 8,
    deal: 'Verdant Foods × Anika Mar',  dealId: 8,
    invoiceId: null,
    month: 'March 2026',
    gross: 5200, commission: 780, commissionRate: 15, net: 4420,
    status: 'Paid',
    dueDate: 'Apr 10, 2026', paidDate: 'Apr 7, 2026', date: 'Mar 15, 2026',
    manager: 'Sienna Moore',
    notes: '',
    banking: { accountName: 'Anika Patel', bankName: 'Citi', lastFour: '9034' },
    tasks: [],
    activityLog: [
      { action: 'Payout created', timestamp: '2026-03-15T10:00:00', by: 'Sienna Moore' },
      { action: 'Status changed to Paid', timestamp: '2026-04-07T14:00:00', by: 'Sienna Moore' },
    ],
  },
  // ── April 2026 — Processing ─────────────────────────────────────────────────
  {
    id: 9,
    creator: 'Lily Nakamura', creatorId: 5,
    brand: 'Solstice Travel',  brandId: 4,
    campaign: 'Solstice Summer Escapes', campaignId: 9,
    deal: 'Solstice Travel × Lily Apr',  dealId: 9,
    invoiceId: null,
    month: 'April 2026',
    gross: 6600, commission: 990, commissionRate: 15, net: 5610,
    status: 'Processing',
    dueDate: 'May 1, 2026', paidDate: null, date: 'Apr 10, 2026',
    manager: 'Sienna Moore',
    notes: 'Wire transfer initiated.',
    banking: { accountName: 'Lily Nakamura', bankName: 'US Bank', lastFour: '5576' },
    tasks: [
      { id: 1, text: 'Confirm wire transfer received', done: false, createdAt: '2026-04-10T10:00:00' },
    ],
    activityLog: [
      { action: 'Payout created', timestamp: '2026-04-10T10:00:00', by: 'Sienna Moore' },
      { action: 'Status changed to Processing', timestamp: '2026-04-12T09:00:00', by: 'Sienna Moore' },
    ],
  },
  {
    id: 10,
    creator: 'Sofia Chen',   creatorId: 1,
    brand: 'Luminary Beauty', brandId: 1,
    campaign: 'Luminary Summer Glow', campaignId: 10,
    deal: 'Luminary Beauty × Sofia Apr', dealId: 10,
    invoiceId: null,
    month: 'April 2026',
    gross: 7800, commission: 1170, commissionRate: 15, net: 6630,
    status: 'Processing',
    dueDate: 'May 5, 2026', paidDate: null, date: 'Apr 12, 2026',
    manager: 'Marjorie A.',
    notes: '',
    banking: { accountName: 'Sofia Chen', bankName: 'Chase', lastFour: '4892' },
    tasks: [],
    activityLog: [
      { action: 'Payout created', timestamp: '2026-04-12T09:30:00', by: 'Marjorie A.' },
      { action: 'Status changed to Processing', timestamp: '2026-04-14T11:00:00', by: 'Marjorie A.' },
    ],
  },
  // ── May 2026 — Pending ──────────────────────────────────────────────────────
  {
    id: 11,
    creator: 'Marcus Reid', creatorId: 2,
    brand: 'TechFlow',       brandId: 2,
    campaign: 'TechFlow May Promo', campaignId: 11,
    deal: 'TechFlow × Marcus May',   dealId: 11,
    invoiceId: null,
    month: 'May 2026',
    gross: 5000, commission: 750, commissionRate: 15, net: 4250,
    status: 'Pending',
    dueDate: 'Jun 1, 2026', paidDate: null, date: 'May 1, 2026',
    manager: 'Devon Park',
    notes: '',
    banking: { accountName: 'Marcus Reid', bankName: 'Bank of America', lastFour: '7341' },
    tasks: [
      { id: 1, text: 'Verify invoice paid before releasing payout', done: false, createdAt: '2026-05-01T10:00:00' },
    ],
    activityLog: [
      { action: 'Payout created', timestamp: '2026-05-01T10:00:00', by: 'Devon Park' },
    ],
  },
  {
    id: 12,
    creator: 'James Ortiz', creatorId: 3,
    brand: 'Verdant Foods',  brandId: 3,
    campaign: 'Verdant May Series', campaignId: 12,
    deal: 'Verdant Foods × James May', dealId: 12,
    invoiceId: null,
    month: 'May 2026',
    gross: 10000, commission: 1500, commissionRate: 15, net: 8500,
    status: 'Pending',
    dueDate: 'Jun 5, 2026', paidDate: null, date: 'May 3, 2026',
    manager: 'Devon Park',
    notes: 'Waiting for brand to confirm receipt.',
    banking: { accountName: 'James Ortiz', bankName: 'Wells Fargo', lastFour: '2218' },
    tasks: [],
    activityLog: [
      { action: 'Payout created', timestamp: '2026-05-03T10:00:00', by: 'Devon Park' },
    ],
  },
  {
    id: 13,
    creator: 'Anika Patel', creatorId: 4,
    brand: 'Peak Athletics', brandId: 5,
    campaign: 'Peak Summer Campaign', campaignId: 13,
    deal: 'Peak Athletics × Anika May',  dealId: 13,
    invoiceId: null,
    month: 'May 2026',
    gross: 15000, commission: 2250, commissionRate: 15, net: 12750,
    status: 'Pending',
    dueDate: 'Jun 10, 2026', paidDate: null, date: 'May 5, 2026',
    manager: 'Marjorie A.',
    notes: '',
    banking: { accountName: 'Anika Patel', bankName: 'Citi', lastFour: '9034' },
    tasks: [],
    activityLog: [
      { action: 'Payout created', timestamp: '2026-05-05T10:00:00', by: 'Marjorie A.' },
    ],
  },
]

const PayoutsContext = createContext(null)

export function PayoutsProvider({ children }) {
  const [payouts, setPayouts] = useState(initialPayouts)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const rows = await fetchAll('payouts')
        if (alive && rows && rows.length) setPayouts(rows)
      } catch (e) {
        if (alive) setError(e.message || String(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  async function addPayout(p) {
    const id = Math.max(0, ...payouts.map(x => x.id)) + 1
    const optimistic = { ...p, id }
    setPayouts(prev => [...prev, optimistic])
    const saved = await insertRow('payouts', p)
    if (saved) setPayouts(prev => prev.map(x => x.id === id ? saved : x))
    return (saved && saved.id) || id
  }

  async function deletePayout(id) {
    setPayouts(prev => prev.filter(x => x.id !== id))
    await deleteRow('payouts', id)
  }

  function updatePayout(id, updates) {
    setPayouts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const updated = { ...p, ...updates }
        return updated
      })
    )
    updateRow('payouts', id, updates)
  }

  function markAsPaid(id) {
    const now = new Date()
    const paidDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const timestamp = now.toISOString()
    setPayouts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        return {
          ...p,
          status: 'Paid',
          paidDate,
          activityLog: [
            ...(p.activityLog || []),
            { action: 'Status changed to Paid', timestamp, by: 'Marjorie A.' },
          ],
        }
      })
    )
    updateRow('payouts', id, { status: 'Paid', paidAt: timestamp })
  }

  function addTask(payoutId, text) {
    const now = new Date().toISOString()
    setPayouts((prev) =>
      prev.map((p) => {
        if (p.id !== payoutId) return p
        const newTask = { id: Date.now(), text, done: false, createdAt: now }
        return { ...p, tasks: [...(p.tasks || []), newTask] }
      })
    )
  }

  function toggleTask(payoutId, taskId) {
    setPayouts((prev) =>
      prev.map((p) => {
        if (p.id !== payoutId) return p
        return {
          ...p,
          tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
        }
      })
    )
  }

  return (
    <PayoutsContext.Provider value={{ payouts, setPayouts, loading, error, addPayout, deletePayout, updatePayout, markAsPaid, addTask, toggleTask }}>
      {children}
    </PayoutsContext.Provider>
  )
}

export function usePayouts() {
  return useContext(PayoutsContext)
}
