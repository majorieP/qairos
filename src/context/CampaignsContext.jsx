import { createContext, useContext, useState, useEffect } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow } from '../lib/supabaseHelpers'

const blankChecklist = { samplesSent: false, previewDateConfirmed: false, liveDateConfirmed: false, followUpDateConfirmed: false, briefReceivedFromBrand: false, briefSentToCreator: false }
const blankStats = { views: '', reach: '', likes: '', comments: '', shares: '', ctr: '', cvr: '', revenueGenerated: '', roi: '', engagementRate: '' }

export const blankCampaignChecklist = blankChecklist
export const blankCampaignStats = blankStats

const initialCampaigns = [
  {
    id: 1, dealId: 1, dealName: 'Sofia × Luminary Spring', isRebook: true,
    creator: 'Sofia Chen', creatorId: 1, brand: 'Luminary Beauty', brandId: 1,
    platform: 'Instagram', contentType: 'Reel', amount: 12000, status: 'In Production',
    approvalRequired: true, approvalWaived: false,
    previewDueDate: '2026-03-20', liveDate: '2026-03-28', followUpDate: '2026-04-04',
    paymentTerms: 'Net 30', paymentDueDate: '2026-04-27', manager: 'Sarah K.',
    briefUrl: 'https://drive.google.com/luminary-spring-brief', contentUrl: '', notes: 'Spring collection. Morning routine angle.',
    checklist: { samplesSent: true, previewDateConfirmed: true, liveDateConfirmed: true, followUpDateConfirmed: false, briefReceivedFromBrand: true, briefSentToCreator: true },
    stats: { ...blankStats },
    tasks: [],
    activityLog: [{ action: 'Campaign created', timestamp: '2026-03-01 09:00' }, { action: 'Status → In Production', timestamp: '2026-03-10 14:30' }],
    invoiceId: null, payoutId: null,
  },
  {
    id: 2, dealId: 2, dealName: 'Marcus × Peak Run Season', isRebook: false,
    creator: 'Marcus Reid', creatorId: 2, brand: 'Peak Athletics', brandId: 2,
    platform: 'TikTok', contentType: 'Video', amount: 8500, status: 'Brief Sent',
    approvalRequired: false, approvalWaived: false,
    previewDueDate: '', liveDate: '2026-04-05', followUpDate: '2026-04-12',
    paymentTerms: 'Net 30', paymentDueDate: '2026-05-05', manager: 'Tom B.',
    briefUrl: '', contentUrl: '', notes: '',
    checklist: { samplesSent: true, previewDateConfirmed: false, liveDateConfirmed: true, followUpDateConfirmed: false, briefReceivedFromBrand: true, briefSentToCreator: true },
    stats: { ...blankStats },
    tasks: [],
    activityLog: [{ action: 'Campaign created', timestamp: '2026-03-05 10:00' }, { action: 'Status → Brief Sent', timestamp: '2026-03-12 11:00' }],
    invoiceId: null, payoutId: null,
  },
  {
    id: 3, dealId: 3, dealName: 'Anika × Verdant Foods', isRebook: true,
    creator: 'Anika Patel', creatorId: 3, brand: 'Verdant Foods', brandId: 3,
    platform: 'Instagram', contentType: 'Post', amount: 5200, status: 'Planned',
    approvalRequired: true, approvalWaived: false,
    previewDueDate: '2026-04-15', liveDate: '2026-04-20', followUpDate: '2026-04-27',
    paymentTerms: 'Net 45', paymentDueDate: '2026-06-04', manager: 'Sarah K.',
    briefUrl: '', contentUrl: '', notes: 'Plant-forward recipe integration.',
    checklist: { ...blankChecklist },
    stats: { ...blankStats },
    tasks: [],
    activityLog: [{ action: 'Campaign created', timestamp: '2026-03-08 09:30' }],
    invoiceId: null, payoutId: null,
  },
  {
    id: 4, dealId: 4, dealName: 'James × TechFlow Q2', isRebook: false,
    creator: 'James Ortiz', creatorId: 4, brand: 'TechFlow', brandId: 4,
    platform: 'YouTube', contentType: 'Integration', amount: 18000, status: 'Approved',
    approvalRequired: true, approvalWaived: false,
    previewDueDate: '2026-03-25', liveDate: '2026-04-01', followUpDate: '2026-04-08',
    paymentTerms: 'Net 30', paymentDueDate: '2026-05-01', manager: 'Emma L.',
    briefUrl: 'https://techflow.com/q2-creator-brief', contentUrl: '', notes: 'Q2 tech roundup, 60s integration.',
    checklist: { samplesSent: true, previewDateConfirmed: true, liveDateConfirmed: true, followUpDateConfirmed: true, briefReceivedFromBrand: true, briefSentToCreator: true },
    stats: { ...blankStats },
    tasks: [],
    activityLog: [{ action: 'Campaign created', timestamp: '2026-02-20 10:00' }, { action: 'Status → Approved', timestamp: '2026-03-14 15:00' }],
    invoiceId: null, payoutId: null,
  },
  {
    id: 5, dealId: 5, dealName: 'Lily × Solstice Travel', isRebook: true,
    creator: 'Lily Nakamura', creatorId: 5, brand: 'Solstice Travel', brandId: 5,
    platform: 'Instagram', contentType: 'Reel', amount: 22000, status: 'Live',
    approvalRequired: true, approvalWaived: false,
    previewDueDate: '2026-03-01', liveDate: '2026-03-10', followUpDate: '2026-03-17',
    paymentTerms: 'Net 45', paymentDueDate: '2026-04-24', manager: 'Alex M.',
    briefUrl: '', contentUrl: '', notes: 'Golden hour travel vibes.',
    checklist: { samplesSent: true, previewDateConfirmed: true, liveDateConfirmed: true, followUpDateConfirmed: true, briefReceivedFromBrand: true, briefSentToCreator: true },
    stats: { views: '284K', reach: '310K', likes: '18.2K', comments: '432', shares: '1.1K', ctr: '3.2%', cvr: '', revenueGenerated: '', roi: '', engagementRate: '6.8%' },
    tasks: [],
    activityLog: [{ action: 'Campaign created', timestamp: '2026-02-15 09:00' }, { action: 'Status → Live', timestamp: '2026-03-10 12:00' }],
    invoiceId: null, payoutId: null,
  },
  {
    id: 6, dealId: null, dealName: '', isRebook: false,
    creator: 'Sofia Chen', creatorId: 1, brand: 'Luminary Beauty', brandId: 1,
    platform: 'Instagram', contentType: 'Story', amount: 4500, status: 'Completed',
    approvalRequired: false, approvalWaived: false,
    previewDueDate: '', liveDate: '2026-02-14', followUpDate: '2026-02-21',
    paymentTerms: 'Net 30', paymentDueDate: '2026-03-16', manager: 'Sarah K.',
    briefUrl: '', contentUrl: '', notes: "Valentine's Day story set.",
    checklist: { samplesSent: true, previewDateConfirmed: true, liveDateConfirmed: true, followUpDateConfirmed: true, briefReceivedFromBrand: true, briefSentToCreator: true },
    stats: { views: '92K', reach: '105K', likes: '7.4K', comments: '198', shares: '340', ctr: '2.1%', cvr: '', revenueGenerated: '', roi: '', engagementRate: '7.3%' },
    tasks: [],
    activityLog: [{ action: 'Campaign created', timestamp: '2026-01-25 09:00' }, { action: 'Status → Completed', timestamp: '2026-02-25 10:00' }],
    invoiceId: 1, payoutId: 1,
  },
  {
    id: 7, dealId: 2, dealName: 'Marcus × Peak Run Season', isRebook: true,
    creator: 'Marcus Reid', creatorId: 2, brand: 'Peak Athletics', brandId: 2,
    platform: 'TikTok', contentType: 'Video', amount: 6000, status: 'Campaign Planning',
    approvalRequired: true, approvalWaived: false,
    previewDueDate: '2026-04-22', liveDate: '2026-04-30', followUpDate: '',
    paymentTerms: 'Net 30', paymentDueDate: '2026-05-30', manager: 'Tom B.',
    briefUrl: '', contentUrl: '', notes: 'Second video in run series.',
    checklist: { ...blankChecklist },
    stats: { ...blankStats },
    tasks: [],
    activityLog: [{ action: 'Campaign created', timestamp: '2026-03-14 08:00' }],
    invoiceId: null, payoutId: null,
  },
  {
    id: 8, dealId: null, dealName: '', isRebook: false,
    creator: 'Anika Patel', creatorId: 3, brand: 'Verdant Foods', brandId: 3,
    platform: 'Instagram', contentType: 'Reel', amount: 5200, status: 'Invoiced',
    approvalRequired: false, approvalWaived: true,
    previewDueDate: '', liveDate: '2026-02-20', followUpDate: '2026-02-27',
    paymentTerms: 'Net 45', paymentDueDate: '2026-04-06', manager: 'Sarah K.',
    briefUrl: '', contentUrl: '', notes: '',
    checklist: { samplesSent: true, previewDateConfirmed: true, liveDateConfirmed: true, followUpDateConfirmed: true, briefReceivedFromBrand: true, briefSentToCreator: true },
    stats: { views: '145K', reach: '160K', likes: '11K', comments: '287', shares: '890', ctr: '4.1%', cvr: '1.2%', revenueGenerated: '$6,240', roi: '20%', engagementRate: '7.6%' },
    tasks: [],
    activityLog: [{ action: 'Campaign created', timestamp: '2026-01-28 09:00' }, { action: 'Status → Invoiced', timestamp: '2026-03-01 11:00' }],
    invoiceId: 2, payoutId: null,
  },
]

const CampaignsContext = createContext(null)

export function CampaignsProvider({ children }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const rows = await fetchAll('campaigns')
        if (alive && rows && rows.length) setCampaigns(rows)
      } catch (e) {
        if (alive) setError(e.message || String(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  async function addCampaign(c) {
    const id = Math.max(0, ...campaigns.map(x => x.id)) + 1
    const optimistic = { ...c, id }
    setCampaigns(prev => [...prev, optimistic])
    const saved = await insertRow('campaigns', c)
    if (saved) setCampaigns(prev => prev.map(x => x.id === id ? saved : x))
    return (saved && saved.id) || id
  }

  async function updateCampaign(id, updates) {
    setCampaigns(prev => prev.map(x => x.id === id ? { ...x, ...updates } : x))
    await updateRow('campaigns', id, updates)
  }

  async function deleteCampaign(id) {
    setCampaigns(prev => prev.filter(x => x.id !== id))
    await deleteRow('campaigns', id)
  }

  return (
    <CampaignsContext.Provider value={{ campaigns, setCampaigns, loading, error, addCampaign, updateCampaign, deleteCampaign }}>
      {children}
    </CampaignsContext.Provider>
  )
}

export function useCampaigns() {
  return useContext(CampaignsContext)
}
