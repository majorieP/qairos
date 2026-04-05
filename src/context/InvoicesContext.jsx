import { createContext, useContext, useState, useEffect } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow } from '../lib/supabaseHelpers'

// Shared formatter (imported by pages that need it)
export function fmtInvoiceAmt(n) {
  if (n === '' || n === null || n === undefined || isNaN(Number(n))) return '—'
  return '$' + Number(n).toLocaleString()
}

const initialInvoices = [
  {
    id: 1, invoiceId: 'INV-2026-001',
    creator: 'Sofia Chen', creatorId: 1,
    brand: 'Luminary Beauty', brandId: 1,
    dealId: 1, dealName: 'Spring Glow Collection',
    manager: 'Marjorie A.',
    month: 'February 2026',
    billTo: {
      name: 'Luminary Beauty LLC',
      address: '800 Fifth Ave, Suite 1200',
      city: 'New York, NY 10019',
      email: 'billing@luminarybeauty.com',
    },
    lineItems: [
      { campaign: 'Sofia × Luminary Feb', platform: 'Instagram', contentType: 'Story', quantity: 1, rate: 4500, subtotal: 4500 },
    ],
    amount: 4500,
    paymentTerms: 'Net 30',
    issued: 'Mar 2, 2026',
    due: 'Apr 1, 2026',
    paidDate: 'Mar 12, 2026',
    status: 'Paid',
    notes: 'February story set. Paid early.',
    tasks: [
      { id: 1, text: 'Confirm receipt with Luminary billing', done: true, createdAt: 'Mar 2, 2026' },
    ],
    activityLog: [
      { action: 'Invoice marked as paid', timestamp: 'Mar 12, 2026 · 11:00 AM', by: 'Marjorie A.' },
      { action: 'Invoice sent',           timestamp: 'Mar 2, 2026 · 9:00 AM',   by: 'Marjorie A.' },
      { action: 'Invoice created',        timestamp: 'Mar 2, 2026 · 8:45 AM',   by: 'Marjorie A.' },
    ],
  },
  {
    id: 2, invoiceId: 'INV-2026-002',
    creator: 'Anika Patel', creatorId: 3,
    brand: 'Verdant Foods', brandId: 3,
    dealId: null, dealName: '',
    manager: 'Marjorie A.',
    month: 'February 2026',
    billTo: {
      name: 'Verdant Foods Inc.',
      address: '220 Market Street',
      city: 'San Francisco, CA 94105',
      email: 'ap@verdantfoods.com',
    },
    lineItems: [
      { campaign: 'Anika × Verdant Feb', platform: 'Instagram', contentType: 'Reel', quantity: 1, rate: 5200, subtotal: 5200 },
    ],
    amount: 5200,
    paymentTerms: 'Net 45',
    issued: 'Mar 1, 2026',
    due: 'Mar 5, 2026',
    paidDate: null,
    status: 'Overdue',
    notes: 'Payment overdue. Follow up with Verdant AP team.',
    tasks: [
      { id: 1, text: 'Send overdue payment reminder',   done: true,  createdAt: 'Mar 6, 2026' },
      { id: 2, text: 'Escalate to brand contact if unpaid by Mar 20', done: false, createdAt: 'Mar 8, 2026' },
    ],
    activityLog: [
      { action: 'Invoice overdue (past Mar 5)',  timestamp: 'Mar 6, 2026 · 12:00 AM', by: 'System' },
      { action: 'Invoice sent',                  timestamp: 'Mar 1, 2026 · 10:00 AM', by: 'Marjorie A.' },
      { action: 'Invoice created',               timestamp: 'Mar 1, 2026 · 9:30 AM',  by: 'Marjorie A.' },
    ],
  },
  {
    id: 3, invoiceId: 'INV-2026-003',
    creator: 'Marcus Reid', creatorId: 2,
    brand: 'Peak Athletics', brandId: 2,
    dealId: 2, dealName: 'Run Season Ambassador',
    manager: 'Alex Kim',
    month: 'March 2026',
    billTo: {
      name: 'Peak Athletics Corp.',
      address: '1 Athlete Way',
      city: 'Portland, OR 97209',
      email: 'finance@peakathletics.com',
    },
    lineItems: [
      { campaign: 'Marcus × Peak Run Season', platform: 'TikTok',    contentType: 'Video', quantity: 4, rate: 2500, subtotal: 10000 },
      { campaign: 'Marcus × Peak Run Season', platform: 'Instagram', contentType: 'Story', quantity: 8, rate: 500,  subtotal: 4000  },
    ],
    amount: 14000,
    paymentTerms: 'Net 30',
    issued: 'Mar 15, 2026',
    due: 'Apr 15, 2026',
    paidDate: null,
    status: 'Sent',
    notes: 'March deliverables invoice per the ambassador contract.',
    tasks: [
      { id: 1, text: 'Confirm delivery of all 4 TikTok videos', done: true,  createdAt: 'Mar 15, 2026' },
      { id: 2, text: 'Send usage rights confirmation to Marcus', done: false, createdAt: 'Mar 15, 2026' },
    ],
    activityLog: [
      { action: 'Invoice sent', timestamp: 'Mar 15, 2026 · 2:00 PM', by: 'Alex Kim' },
      { action: 'Invoice created', timestamp: 'Mar 15, 2026 · 1:30 PM', by: 'Alex Kim' },
    ],
  },
  {
    id: 4, invoiceId: 'INV-2026-004',
    creator: 'James Ortiz', creatorId: 4,
    brand: 'TechFlow', brandId: 4,
    dealId: 4, dealName: 'Q2 Tech Review Series',
    manager: 'Sam Reyes',
    month: 'April 2026',
    billTo: {
      name: 'TechFlow Inc.',
      address: '100 Innovation Blvd',
      city: 'Austin, TX 78701',
      email: 'payments@techflow.io',
    },
    lineItems: [
      { campaign: 'James × TechFlow Q2', platform: 'YouTube', contentType: 'Integration', quantity: 3, rate: 6000, subtotal: 18000 },
    ],
    amount: 18000,
    paymentTerms: 'Net 60',
    issued: 'Mar 10, 2026',
    due: 'May 9, 2026',
    paidDate: null,
    status: 'Draft',
    notes: 'Draft for April YouTube integrations. Pending contract countersignature before sending.',
    tasks: [
      { id: 1, text: 'Wait for TechFlow contract signature before sending', done: false, createdAt: 'Mar 10, 2026' },
    ],
    activityLog: [
      { action: 'Invoice created', timestamp: 'Mar 10, 2026 · 11:00 AM', by: 'Sam Reyes' },
    ],
  },
  {
    id: 5, invoiceId: 'INV-2026-005',
    creator: 'Lily Nguyen', creatorId: 5,
    brand: 'Solstice Wellness', brandId: 5,
    dealId: 3, dealName: 'Spring Wellness Series',
    manager: 'Marjorie A.',
    month: 'February 2026',
    billTo: {
      name: 'Solstice Wellness Co.',
      address: '45 Serenity Lane',
      city: 'Boulder, CO 80302',
      email: 'ops@solsticewellness.com',
    },
    lineItems: [
      { campaign: 'Lily × Solstice Feb', platform: 'YouTube',   contentType: 'Dedicated Video', quantity: 2, rate: 8000, subtotal: 16000 },
      { campaign: 'Lily × Solstice Feb', platform: 'Instagram', contentType: 'Story',            quantity: 6, rate: 500,  subtotal: 3000  },
      { campaign: 'Lily × Solstice Feb', platform: 'Podcast',   contentType: 'Sponsorship',      quantity: 1, rate: 3000, subtotal: 3000  },
    ],
    amount: 22000,
    paymentTerms: 'Net 30',
    issued: 'Feb 28, 2026',
    due: 'Mar 3, 2026',
    paidDate: null,
    status: 'Overdue',
    notes: 'February multi-platform campaign. Significantly overdue — escalate immediately.',
    tasks: [
      { id: 1, text: 'Send overdue notice to Solstice legal',  done: true,  createdAt: 'Mar 4, 2026' },
      { id: 2, text: 'Schedule call with Solstice brand lead',  done: true,  createdAt: 'Mar 7, 2026' },
      { id: 3, text: 'Consider late payment clause',            done: false, createdAt: 'Mar 12, 2026' },
    ],
    activityLog: [
      { action: 'Invoice overdue (past Mar 3)', timestamp: 'Mar 4, 2026 · 12:00 AM',  by: 'System' },
      { action: 'Invoice sent',                 timestamp: 'Feb 28, 2026 · 4:00 PM', by: 'Marjorie A.' },
      { action: 'Invoice created',              timestamp: 'Feb 28, 2026 · 3:30 PM', by: 'Marjorie A.' },
    ],
  },
]

const InvoicesContext = createContext(null)

export function InvoicesProvider({ children }) {
  const [invoices, setInvoices] = useState(initialInvoices)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const rows = await fetchAll('invoices')
        if (alive && rows && rows.length) setInvoices(rows)
      } catch (e) {
        if (alive) setError(e.message || String(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  async function addInvoice(inv) {
    const id = Math.max(0, ...invoices.map(x => x.id)) + 1
    const optimistic = { ...inv, id }
    setInvoices(prev => [...prev, optimistic])
    const saved = await insertRow('invoices', inv)
    if (saved) setInvoices(prev => prev.map(x => x.id === id ? saved : x))
    return (saved && saved.id) || id
  }

  async function updateInvoice(id, updates) {
    setInvoices(prev => prev.map(x => x.id === id ? { ...x, ...updates } : x))
    await updateRow('invoices', id, updates)
  }

  async function deleteInvoice(id) {
    setInvoices(prev => prev.filter(x => x.id !== id))
    await deleteRow('invoices', id)
  }

  return (
    <InvoicesContext.Provider value={{ invoices, setInvoices, loading, error, addInvoice, updateInvoice, deleteInvoice }}>
      {children}
    </InvoicesContext.Provider>
  )
}

export function useInvoices() {
  return useContext(InvoicesContext)
}
