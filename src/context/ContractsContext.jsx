import { createContext, useContext, useState, useEffect } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow } from '../lib/supabaseHelpers'

const initialContracts = [
  {
    id: 1,
    title: 'Ambassador Agreement — Peak Athletics',
    creator: 'Marcus Reid', creatorId: 2,
    brand: 'Peak Athletics', brandId: 2,
    dealId: 2, dealName: 'Run Season Ambassador',
    manager: 'Alex Kim',
    createdDate: 'Feb 20, 2026',
    signedDate: 'Mar 15, 2026',
    expires: 'Mar 14, 2027',
    paymentTerms: 'Net 30',
    commissionRate: '15',
    deliverables: [
      { id: 1, platform: 'TikTok',    contentType: 'Video', quantity: 4, rate: 2500, month: 'March 2026' },
      { id: 2, platform: 'TikTok',    contentType: 'Video', quantity: 4, rate: 2500, month: 'April 2026' },
      { id: 3, platform: 'Instagram', contentType: 'Story', quantity: 8, rate: 500,  month: 'March 2026' },
      { id: 4, platform: 'Instagram', contentType: 'Story', quantity: 8, rate: 500,  month: 'April 2026' },
    ],
    totalValue: 28000,
    status: 'Signed',
    notes: 'Exclusive ambassador deal for the spring running season. Marcus will feature Peak Athletics gear in all training content.',
    campaignIds: [2],
    campaignNames: ['Marcus × Peak Run Season'],
    tasks: [
      { id: 1, text: 'Confirm deliverable schedule with Marcus', done: true,  createdAt: 'Feb 20, 2026' },
      { id: 2, text: 'Send usage rights addendum',               done: false, createdAt: 'Mar 10, 2026' },
    ],
    activityLog: [
      { action: 'Contract signed',        timestamp: 'Mar 15, 2026 · 2:14 PM',  by: 'Alex Kim' },
      { action: 'Sent for signature',     timestamp: 'Mar 8, 2026 · 10:30 AM',  by: 'Alex Kim' },
      { action: 'Contract created',       timestamp: 'Feb 20, 2026 · 9:00 AM',  by: 'Alex Kim' },
    ],
  },
  {
    id: 2,
    title: 'Spring Glow Sponsored Post',
    creator: 'Sofia Chen', creatorId: 1,
    brand: 'Luminary Beauty', brandId: 1,
    dealId: 1, dealName: 'Spring Glow Collection',
    manager: 'Marjorie A.',
    createdDate: 'Feb 25, 2026',
    signedDate: 'Mar 2, 2026',
    expires: 'Apr 30, 2026',
    paymentTerms: 'Net 30',
    commissionRate: '20',
    deliverables: [
      { id: 1, platform: 'Instagram', contentType: 'Reel',  quantity: 2, rate: 3500, month: 'March 2026' },
      { id: 2, platform: 'Instagram', contentType: 'Story', quantity: 5, rate: 500,  month: 'March 2026' },
      { id: 3, platform: 'TikTok',    contentType: 'Video', quantity: 1, rate: 2500, month: 'April 2026' },
    ],
    totalValue: 12000,
    status: 'Signed',
    notes: 'Spring collection collaboration. All content must be brand-approved before posting.',
    campaignIds: [1],
    campaignNames: ['Sofia × Luminary Spring'],
    tasks: [
      { id: 1, text: 'Review brand guidelines deck',     done: true,  createdAt: 'Feb 25, 2026' },
      { id: 2, text: 'Schedule preview submission dates', done: true,  createdAt: 'Feb 26, 2026' },
      { id: 3, text: 'Confirm April posting calendar',   done: false, createdAt: 'Mar 2, 2026' },
    ],
    activityLog: [
      { action: 'Contract signed',         timestamp: 'Mar 2, 2026 · 11:45 AM',   by: 'Marjorie A.' },
      { action: 'Draft reviewed by brand', timestamp: 'Feb 28, 2026 · 3:20 PM',   by: 'Marjorie A.' },
      { action: 'Contract sent',           timestamp: 'Feb 26, 2026 · 9:15 AM',   by: 'Marjorie A.' },
      { action: 'Contract created',        timestamp: 'Feb 25, 2026 · 4:00 PM',   by: 'Marjorie A.' },
    ],
  },
  {
    id: 3,
    title: 'Tech Review Series S2',
    creator: 'James Ortiz', creatorId: 4,
    brand: 'TechFlow', brandId: 4,
    dealId: 4, dealName: 'Q2 Tech Review Series',
    manager: 'Sam Reyes',
    createdDate: 'Feb 18, 2026',
    signedDate: null,
    expires: 'May 31, 2026',
    paymentTerms: 'Net 60',
    commissionRate: '15',
    deliverables: [
      { id: 1, platform: 'YouTube', contentType: 'Integration', quantity: 3, rate: 6000, month: 'April 2026' },
      { id: 2, platform: 'YouTube', contentType: 'Integration', quantity: 3, rate: 6000, month: 'May 2026' },
    ],
    totalValue: 36000,
    status: 'Sent',
    notes: 'Season 2 of the ongoing tech review series. Awaiting countersignature from TechFlow legal.',
    campaignIds: [4],
    campaignNames: ['James × TechFlow Q2'],
    tasks: [
      { id: 1, text: 'Follow up with TechFlow legal team', done: false, createdAt: 'Mar 5, 2026' },
      { id: 2, text: 'Confirm exclusivity window dates',   done: false, createdAt: 'Feb 28, 2026' },
    ],
    activityLog: [
      { action: 'Contract sent for signature', timestamp: 'Feb 28, 2026 · 8:00 AM',  by: 'Sam Reyes' },
      { action: 'Contract created',            timestamp: 'Feb 18, 2026 · 11:30 AM', by: 'Sam Reyes' },
    ],
  },
  {
    id: 4,
    title: 'Plant Forward Integration',
    creator: 'Anika Patel', creatorId: 3,
    brand: 'Verdant Foods', brandId: 3,
    dealId: null, dealName: '',
    manager: 'Marjorie A.',
    createdDate: 'Mar 10, 2026',
    signedDate: null,
    expires: null,
    paymentTerms: 'Net 45',
    commissionRate: '20',
    deliverables: [
      { id: 1, platform: 'Instagram', contentType: 'Reel', quantity: 2, rate: 2600, month: 'April 2026' },
      { id: 2, platform: 'Instagram', contentType: 'Post', quantity: 3, rate: 1200, month: 'April 2026' },
    ],
    totalValue: 8800,
    status: 'Draft',
    notes: 'New partnership with Verdant Foods. Focus on plant-based recipes and sustainable living.',
    campaignIds: [3],
    campaignNames: ['Anika × Verdant Foods'],
    tasks: [
      { id: 1, text: 'Define content requirements with brand', done: false, createdAt: 'Mar 10, 2026' },
      { id: 2, text: 'Send draft to Anika for review',         done: false, createdAt: 'Mar 10, 2026' },
    ],
    activityLog: [
      { action: 'Contract created', timestamp: 'Mar 10, 2026 · 2:30 PM', by: 'Marjorie A.' },
    ],
  },
]

const ContractsContext = createContext(null)

export function ContractsProvider({ children }) {
  const [contracts, setContracts] = useState(initialContracts)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const rows = await fetchAll('contracts')
        if (alive && rows && rows.length) setContracts(rows)
      } catch (e) {
        if (alive) setError(e.message || String(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  async function addContract(c) {
    const id = Math.max(0, ...contracts.map(x => x.id)) + 1
    const optimistic = { ...c, id }
    setContracts(prev => [...prev, optimistic])
    const saved = await insertRow('contracts', c)
    if (saved) setContracts(prev => prev.map(x => x.id === id ? saved : x))
    return (saved && saved.id) || id
  }

  async function updateContract(id, updates) {
    setContracts(prev => prev.map(x => x.id === id ? { ...x, ...updates } : x))
    await updateRow('contracts', id, updates)
  }

  async function deleteContract(id) {
    setContracts(prev => prev.filter(x => x.id !== id))
    await deleteRow('contracts', id)
  }

  return (
    <ContractsContext.Provider value={{ contracts, setContracts, loading, error, addContract, updateContract, deleteContract }}>
      {children}
    </ContractsContext.Provider>
  )
}

export function useContracts() {
  return useContext(ContractsContext)
}
