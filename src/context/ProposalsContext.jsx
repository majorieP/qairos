import { createContext, useContext, useState } from 'react'

const initialProposals = [
  {
    id: 1,
    name: 'Luminary Beauty Q2 Pitch',
    brandTarget: 'Luminary Beauty',
    createdDate: '2026-03-10',
    status: 'Sent',
    shareToken: 'lb-q2-pitch',
    coverPage: {
      title: 'Creator Partnership Proposal',
      brandName: 'Luminary Beauty',
      tagline: 'Authentic voices for a radiant brand.',
      date: 'March 2026',
    },
    creators: [
      { clientId: 1, notes: "Sofia is our top beauty creator — 2.4M Instagram followers, consistent 4%+ engagement, and a loyal skincare-obsessed audience. Natural fit for Luminary's brand positioning and product line." },
      { clientId: 10, notes: "Emma's authentic parenting voice reaches an engaged 25–40 female demographic perfectly aligned with Luminary's core customer profile." },
    ],
  },
  {
    id: 2,
    name: 'Peak Athletics Spring Lineup',
    brandTarget: 'Peak Athletics',
    createdDate: '2026-03-14',
    status: 'Draft',
    shareToken: 'peak-spring-lineup',
    coverPage: {
      title: 'Athlete Creator Lineup',
      brandName: 'Peak Athletics',
      tagline: 'Performance content at scale.',
      date: 'March 2026',
    },
    creators: [
      { clientId: 2, notes: "Marcus Reid is a top-tier fitness creator with 890K YouTube subscribers. His endurance content aligns directly with Peak's running and performance product range." },
      { clientId: 7, notes: "Ryan's entertainment-driven fitness content reaches a 18–28 demographic that Peak is actively targeting with their new apparel line." },
    ],
  },
  {
    id: 3,
    name: 'Verdant Foods Organic Campaign',
    brandTarget: 'Verdant Foods',
    createdDate: '2026-02-28',
    status: 'Won',
    shareToken: 'verdant-organic-2026',
    coverPage: {
      title: 'Organic Living Creator Package',
      brandName: 'Verdant Foods',
      tagline: 'Real food, real creators, real impact.',
      date: 'February 2026',
    },
    creators: [
      { clientId: 3, notes: "Anika's plant-based food content is a natural match — 1.1M TikTok followers, 7.3% engagement, and deep credibility in the healthy food community." },
      { clientId: 5, notes: "Lily's travel-meets-lifestyle aesthetic frequently features food and dining experiences, ideal for reaching health-conscious travelers." },
    ],
  },
  {
    id: 4,
    name: 'TechFlow Review Series',
    brandTarget: 'TechFlow',
    createdDate: '2026-03-05',
    status: 'Lost',
    shareToken: 'techflow-review-series',
    coverPage: {
      title: 'Tech Creator Showcase',
      brandName: 'TechFlow',
      tagline: 'Deep reviews. Trusted voices.',
      date: 'March 2026',
    },
    creators: [
      { clientId: 4, notes: "James Ortiz is one of the most respected tech reviewers on YouTube — 450K subscribers, authoritative voice, and a track record of influencing purchase decisions." },
    ],
  },
]

// NOTE: No 'proposals' table in the schema — this context remains in-memory for now.
const ProposalsContext = createContext(null)

export function ProposalsProvider({ children }) {
  const [proposals, setProposals] = useState(initialProposals)

  function addProposal(proposal) {
    const id = Math.max(0, ...proposals.map(p => p.id)) + 1
    const shareToken = `prop-${id}-${Date.now().toString(36)}`
    const newProposal = { ...proposal, id, shareToken, createdDate: '2026-03-16' }
    setProposals(prev => [...prev, newProposal])
    return newProposal
  }

  function updateProposal(id, updates) {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  function deleteProposal(id) {
    setProposals(prev => prev.filter(p => p.id !== id))
  }

  return (
    <ProposalsContext.Provider value={{ proposals, addProposal, updateProposal, deleteProposal }}>
      {children}
    </ProposalsContext.Provider>
  )
}

export function useProposals() {
  return useContext(ProposalsContext)
}
