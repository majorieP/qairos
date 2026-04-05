import { createContext, useContext, useState, useEffect } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow } from '../lib/supabaseHelpers'

export const CATEGORIES = ['Software', 'Travel', 'Legal', 'Marketing', 'Office', 'Contractor', 'Other']

export const CATEGORY_COLORS = {
  Software:   'bg-gray-100 text-gray-700',
  Travel:     'bg-blue-50 text-blue-700',
  Legal:      'bg-red-50 text-red-600',
  Marketing:  'bg-amber-50 text-amber-700',
  Office:     'bg-gray-100 text-gray-600',
  Contractor: 'bg-emerald-50 text-emerald-700',
  Other:      'bg-orange-50 text-orange-600',
}

export const CATEGORY_CHART_COLORS = {
  Software:   '#888888',
  Travel:     '#3b82f6',
  Legal:      '#ef4444',
  Marketing:  '#f59e0b',
  Office:     '#6b7280',
  Contractor: '#10b981',
  Other:      '#f97316',
}

const initialExpenses = [
  // ── January 2026 ──────────────────────────────────────────────────────────
  {
    id: 1,
    name: 'Adobe Creative Cloud',
    category: 'Software',
    amount: 599,
    date: 'Jan 1, 2026',
    dealId: null, dealName: '',
    receipt: null,
    manager: 'Marjorie A.',
    notes: 'Annual subscription renewed automatically.',
    activityLog: [
      { action: 'Expense logged', timestamp: 'Jan 1, 2026 · 9:00 AM', by: 'Marjorie A.' },
    ],
  },

  // ── February 2026 ─────────────────────────────────────────────────────────
  {
    id: 2,
    name: 'Adobe Creative Cloud',
    category: 'Software',
    amount: 599,
    date: 'Feb 1, 2026',
    dealId: null, dealName: '',
    receipt: null,
    manager: 'Marjorie A.',
    notes: 'Monthly subscription.',
    activityLog: [
      { action: 'Expense logged', timestamp: 'Feb 1, 2026 · 9:00 AM', by: 'Marjorie A.' },
    ],
  },
  {
    id: 3,
    name: 'Contract Template Lawyer Review',
    category: 'Legal',
    amount: 850,
    date: 'Feb 5, 2026',
    dealId: null, dealName: '',
    receipt: 'legal-invoice-feb2026.pdf',
    manager: 'Marjorie A.',
    notes: 'Annual contract template review with outside counsel. Covers standard creator agreement language.',
    activityLog: [
      { action: 'Receipt uploaded', timestamp: 'Feb 6, 2026 · 2:30 PM', by: 'Marjorie A.' },
      { action: 'Expense logged',   timestamp: 'Feb 5, 2026 · 5:00 PM', by: 'Marjorie A.' },
    ],
  },
  {
    id: 4,
    name: 'Creator Summit Tickets (x3)',
    category: 'Marketing',
    amount: 1200,
    date: 'Feb 20, 2026',
    dealId: null, dealName: '',
    receipt: 'summit-tickets-receipt.png',
    manager: 'Alex Kim',
    notes: 'Conference tickets for Marcus, Sofia, and Anika. Networking and brand partnership opportunity.',
    activityLog: [
      { action: 'Receipt uploaded', timestamp: 'Feb 20, 2026 · 3:00 PM', by: 'Alex Kim' },
      { action: 'Expense logged',   timestamp: 'Feb 20, 2026 · 1:00 PM', by: 'Alex Kim' },
    ],
  },
  {
    id: 5,
    name: 'Figma Teams Plan',
    category: 'Software',
    amount: 192,
    date: 'Feb 15, 2026',
    dealId: null, dealName: '',
    receipt: null,
    manager: 'Sam Reyes',
    notes: 'Design collaboration tool for campaign decks.',
    activityLog: [
      { action: 'Expense logged', timestamp: 'Feb 15, 2026 · 10:00 AM', by: 'Sam Reyes' },
    ],
  },

  // ── March 2026 ────────────────────────────────────────────────────────────
  {
    id: 6,
    name: 'Notion Teams Plan',
    category: 'Software',
    amount: 192,
    date: 'Mar 1, 2026',
    dealId: null, dealName: '',
    receipt: null,
    manager: 'Sam Reyes',
    notes: 'Monthly workspace subscription.',
    activityLog: [
      { action: 'Expense logged', timestamp: 'Mar 1, 2026 · 9:00 AM', by: 'Sam Reyes' },
    ],
  },
  {
    id: 7,
    name: 'Office Supplies',
    category: 'Office',
    amount: 145,
    date: 'Mar 8, 2026',
    dealId: null, dealName: '',
    receipt: 'office-supplies-mar.jpg',
    manager: 'Marjorie A.',
    notes: 'Printer cartridges, notebooks, and desk supplies.',
    activityLog: [
      { action: 'Receipt uploaded', timestamp: 'Mar 8, 2026 · 4:30 PM', by: 'Marjorie A.' },
      { action: 'Expense logged',   timestamp: 'Mar 8, 2026 · 4:00 PM', by: 'Marjorie A.' },
    ],
  },
  {
    id: 8,
    name: 'NY Client Dinner — Peak Athletics',
    category: 'Travel',
    amount: 340,
    date: 'Mar 5, 2026',
    dealId: 2, dealName: 'Run Season Ambassador',
    receipt: 'dinner-receipt-mar5.jpg',
    manager: 'Alex Kim',
    notes: 'Client dinner ahead of ambassador contract signing. Attended by Alex and Marcus.',
    activityLog: [
      { action: 'Receipt uploaded',  timestamp: 'Mar 6, 2026 · 9:00 AM',  by: 'Alex Kim' },
      { action: 'Expense logged',    timestamp: 'Mar 5, 2026 · 11:30 PM', by: 'Alex Kim' },
    ],
  },
  {
    id: 9,
    name: 'TechFlow Contract Legal Review',
    category: 'Legal',
    amount: 600,
    date: 'Mar 12, 2026',
    dealId: 4, dealName: 'Q2 Tech Review Series',
    receipt: 'techflow-legal-review.pdf',
    manager: 'Sam Reyes',
    notes: 'Outside counsel review of Q2 contract terms and exclusivity window language.',
    activityLog: [
      { action: 'Receipt uploaded', timestamp: 'Mar 13, 2026 · 10:00 AM', by: 'Sam Reyes' },
      { action: 'Expense logged',   timestamp: 'Mar 12, 2026 · 5:00 PM',  by: 'Sam Reyes' },
    ],
  },

  // ── April 2026 ────────────────────────────────────────────────────────────
  {
    id: 10,
    name: 'Influencer Database Platform',
    category: 'Software',
    amount: 299,
    date: 'Apr 1, 2026',
    dealId: null, dealName: '',
    receipt: null,
    manager: 'Marjorie A.',
    notes: 'Monthly SaaS subscription for influencer discovery and vetting.',
    activityLog: [
      { action: 'Expense logged', timestamp: 'Apr 1, 2026 · 9:00 AM', by: 'Marjorie A.' },
    ],
  },
  {
    id: 11,
    name: 'LA Brand Summit — Flights & Hotel',
    category: 'Travel',
    amount: 875,
    date: 'Apr 7, 2026',
    dealId: null, dealName: '',
    receipt: 'la-summit-travel.pdf',
    manager: 'Marjorie A.',
    notes: 'Return flights LAX + 2 nights hotel for brand summit. Met with 4 prospective brand partners.',
    activityLog: [
      { action: 'Receipt uploaded', timestamp: 'Apr 9, 2026 · 11:00 AM', by: 'Marjorie A.' },
      { action: 'Expense logged',   timestamp: 'Apr 7, 2026 · 8:00 PM',  by: 'Marjorie A.' },
    ],
  },
  {
    id: 12,
    name: 'Freelance Video Editor',
    category: 'Contractor',
    amount: 1500,
    date: 'Apr 14, 2026',
    dealId: 1, dealName: 'Spring Glow Collection',
    receipt: 'contractor-invoice-apr14.pdf',
    manager: 'Marjorie A.',
    notes: 'Freelance edit for Sofia × Luminary Beauty campaign content. 3 deliverables.',
    activityLog: [
      { action: 'Receipt uploaded', timestamp: 'Apr 15, 2026 · 10:00 AM', by: 'Marjorie A.' },
      { action: 'Expense logged',   timestamp: 'Apr 14, 2026 · 6:00 PM',  by: 'Marjorie A.' },
    ],
  },

  // ── May 2026 ──────────────────────────────────────────────────────────────
  {
    id: 13,
    name: 'Google Workspace',
    category: 'Software',
    amount: 144,
    date: 'May 1, 2026',
    dealId: null, dealName: '',
    receipt: null,
    manager: 'Sam Reyes',
    notes: 'Monthly email and drive subscription.',
    activityLog: [
      { action: 'Expense logged', timestamp: 'May 1, 2026 · 9:00 AM', by: 'Sam Reyes' },
    ],
  },
  {
    id: 14,
    name: 'Social Media Analytics Tool',
    category: 'Marketing',
    amount: 450,
    date: 'May 10, 2026',
    dealId: null, dealName: '',
    receipt: null,
    manager: 'Alex Kim',
    notes: 'Monthly analytics and social listening dashboard — covers all 5 active creators.',
    activityLog: [
      { action: 'Expense logged', timestamp: 'May 10, 2026 · 2:00 PM', by: 'Alex Kim' },
    ],
  },
]

const ExpensesContext = createContext(null)

export function ExpensesProvider({ children }) {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const rows = await fetchAll('expenses')
        if (alive && rows && rows.length) setExpenses(rows)
      } catch (e) {
        if (alive) setError(e.message || String(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  async function addExpense(e) {
    const id = Math.max(0, ...expenses.map(x => x.id)) + 1
    const optimistic = { ...e, id }
    setExpenses(prev => [...prev, optimistic])
    const saved = await insertRow('expenses', e)
    if (saved) setExpenses(prev => prev.map(x => x.id === id ? saved : x))
    return (saved && saved.id) || id
  }

  async function updateExpense(id, updates) {
    setExpenses(prev => prev.map(x => x.id === id ? { ...x, ...updates } : x))
    await updateRow('expenses', id, updates)
  }

  async function deleteExpense(id) {
    setExpenses(prev => prev.filter(x => x.id !== id))
    await deleteRow('expenses', id)
  }

  return (
    <ExpensesContext.Provider value={{ expenses, setExpenses, loading, error, addExpense, updateExpense, deleteExpense }}>
      {children}
    </ExpensesContext.Provider>
  )
}

export function useExpenses() {
  return useContext(ExpensesContext)
}
