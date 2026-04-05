import { createContext, useContext, useState } from 'react'

const initialMediaKits = [
  {
    id: 1,
    clientId: 1,
    status: 'Live',
    shareToken: 'mk-sofia-chen',
    lastUpdated: '2026-03-15',
    demographics: {
      ageRange: '18–34',
      genderSplit: { female: 72, male: 22, other: 6 },
      topLocations: ['Los Angeles', 'New York', 'London', 'Sydney'],
    },
    contentShowcase: [],
  },
  {
    id: 2,
    clientId: 2,
    status: 'Live',
    shareToken: 'mk-marcus-reid',
    lastUpdated: '2026-03-12',
    demographics: {
      ageRange: '22–40',
      genderSplit: { female: 35, male: 60, other: 5 },
      topLocations: ['Portland', 'Seattle', 'Denver', 'Austin'],
    },
    contentShowcase: [],
  },
  {
    id: 3,
    clientId: 3,
    status: 'Draft',
    shareToken: 'mk-anika-patel',
    lastUpdated: '2026-03-10',
    demographics: {
      ageRange: '20–35',
      genderSplit: { female: 78, male: 18, other: 4 },
      topLocations: ['Austin', 'Dallas', 'New York', 'Chicago'],
    },
    contentShowcase: [],
  },
  {
    id: 4,
    clientId: 4,
    status: 'Live',
    shareToken: 'mk-james-ortiz',
    lastUpdated: '2026-03-08',
    demographics: {
      ageRange: '25–44',
      genderSplit: { female: 28, male: 68, other: 4 },
      topLocations: ['San Francisco', 'New York', 'London', 'Toronto'],
    },
    contentShowcase: [],
  },
  {
    id: 5,
    clientId: 5,
    status: 'Draft',
    shareToken: 'mk-lily-nakamura',
    lastUpdated: '2026-02-28',
    demographics: {
      ageRange: '24–38',
      genderSplit: { female: 65, male: 28, other: 7 },
      topLocations: ['Miami', 'Los Angeles', 'Tokyo', 'Paris'],
    },
    contentShowcase: [],
  },
]

// NOTE: No 'media_kits' table in the schema — this context remains in-memory for now.
const MediaKitsContext = createContext(null)

export function MediaKitsProvider({ children }) {
  const [mediaKits, setMediaKits] = useState(initialMediaKits)

  function generateMediaKit(clientId) {
    const existing = mediaKits.find(m => m.clientId === clientId)
    if (existing) return existing
    const id = Math.max(0, ...mediaKits.map(m => m.id)) + 1
    const shareToken = `mk-${clientId}-${Date.now().toString(36)}`
    const newKit = {
      id,
      clientId,
      status: 'Draft',
      shareToken,
      lastUpdated: '2026-03-16',
      demographics: {
        ageRange: '',
        genderSplit: { female: 50, male: 45, other: 5 },
        topLocations: [],
      },
      contentShowcase: [],
    }
    setMediaKits(prev => [...prev, newKit])
    return newKit
  }

  function updateMediaKit(id, updates) {
    setMediaKits(prev => prev.map(m => m.id === id
      ? { ...m, ...updates, lastUpdated: '2026-03-16' }
      : m
    ))
  }

  function publishMediaKit(id) {
    setMediaKits(prev => prev.map(m => m.id === id
      ? { ...m, status: 'Live', lastUpdated: '2026-03-16' }
      : m
    ))
  }

  function deleteMediaKit(id) {
    setMediaKits(prev => prev.filter(m => m.id !== id))
  }

  return (
    <MediaKitsContext.Provider value={{ mediaKits, generateMediaKit, updateMediaKit, publishMediaKit, deleteMediaKit }}>
      {children}
    </MediaKitsContext.Provider>
  )
}

export function useMediaKits() {
  return useContext(MediaKitsContext)
}
