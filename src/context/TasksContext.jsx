import { createContext, useContext, useState, useEffect } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow } from '../lib/supabaseHelpers'

// All dates are ISO 'YYYY-MM-DD'. Reference "today" = 2026-03-16.
const initialTasks = [
  {
    id: 1,
    title: 'Send Spring Glow contract to Sofia',
    status: 'To Do', priority: 'High',
    assignee: 'Marjorie A.', assigneeId: 1,
    due: '2026-03-14', // overdue
    recurring: 'Single', recurringEnd: '', recurringCount: '',
    linkType: 'Deal', linkId: 1, linkLabel: 'Luminary Beauty × Sofia Q1', linkPath: '/deals?open=1',
    tags: ['contracts', 'urgent'],
    notes: 'Draft reviewed. Send via DocuSign once signed off.',
  },
  {
    id: 2,
    title: 'Issue invoice INV-2026-032 to Peak Athletics',
    status: 'To Do', priority: 'High',
    assignee: 'Rafi Okafor', assigneeId: 4,
    due: '2026-03-16', // due today
    recurring: 'Single', recurringEnd: '', recurringCount: '',
    linkType: 'Invoice', linkId: 4, linkLabel: 'INV-2026-032', linkPath: '/invoices?open=4',
    tags: ['invoicing', 'finance'],
    notes: '',
  },
  {
    id: 3,
    title: 'Follow up with Peak Athletics on usage rights',
    status: 'Doing', priority: 'Medium',
    assignee: 'Devon Park', assigneeId: 2,
    due: '2026-03-18',
    recurring: 'Single', recurringEnd: '', recurringCount: '',
    linkType: 'Deal', linkId: 6, linkLabel: 'Peak Athletics × Marcus Mar', linkPath: '/deals?open=6',
    tags: ['negotiations'],
    notes: 'Waiting on legal team to review clause 4b.',
  },
  {
    id: 4,
    title: 'Weekly creator check-in calls',
    status: 'To Do', priority: 'Medium',
    assignee: 'Marjorie A.', assigneeId: 1,
    due: '2026-03-17',
    recurring: 'Weekly', recurringEnd: '2026-06-30', recurringCount: '',
    linkType: 'None', linkId: null, linkLabel: '', linkPath: '',
    tags: ['recurring', 'calls'],
    notes: 'Every Monday 10am. Check in on active campaigns.',
  },
  {
    id: 5,
    title: 'Onboard Lily Nakamura to Solstice campaign',
    status: 'Doing', priority: 'Low',
    assignee: 'Sienna Moore', assigneeId: 3,
    due: '2026-04-05',
    recurring: 'Single', recurringEnd: '', recurringCount: '',
    linkType: 'Campaign', linkId: 9, linkLabel: 'Solstice Summer Escapes', linkPath: '/campaigns?open=9',
    tags: ['onboarding'],
    notes: '',
  },
  {
    id: 6,
    title: 'Review Verdant Foods proposal draft',
    status: 'Done', priority: 'Low',
    assignee: 'Marjorie A.', assigneeId: 1,
    due: '2026-03-15',
    recurring: 'Single', recurringEnd: '', recurringCount: '',
    linkType: 'Deal', linkId: 12, linkLabel: 'Verdant Foods × James May', linkPath: '/deals?open=12',
    tags: ['deals'],
    notes: 'Approved with minor edits to deliverables section.',
  },
  {
    id: 7,
    title: 'Process May payouts — James Ortiz & Anika Patel',
    status: 'To Do', priority: 'High',
    assignee: 'Rafi Okafor', assigneeId: 4,
    due: '2026-06-01',
    recurring: 'Single', recurringEnd: '', recurringCount: '',
    linkType: 'Payout', linkId: 12, linkLabel: 'Verdant Foods × James May', linkPath: '/payouts?open=12',
    tags: ['finance', 'payouts'],
    notes: 'Confirm invoices paid before releasing.',
  },
  {
    id: 8,
    title: 'Send monthly performance report to creators',
    status: 'To Do', priority: 'Medium',
    assignee: 'Devon Park', assigneeId: 2,
    due: '2026-03-31',
    recurring: 'Monthly', recurringEnd: '', recurringCount: '12',
    linkType: 'None', linkId: null, linkLabel: '', linkPath: '',
    tags: ['reporting', 'recurring'],
    notes: 'Include campaign metrics and payout summaries.',
  },
  {
    id: 9,
    title: 'Upload signed Luminary Beauty contract to system',
    status: 'Done', priority: 'High',
    assignee: 'Marjorie A.', assigneeId: 1,
    due: '2026-03-10',
    recurring: 'Single', recurringEnd: '', recurringCount: '',
    linkType: 'Creator', linkId: 1, linkLabel: 'Sofia Chen', linkPath: '/roster?open=1',
    tags: ['contracts'],
    notes: '',
  },
  {
    id: 10,
    title: 'Brief Sofia Chen for TechFlow collaboration',
    status: 'Doing', priority: 'High',
    assignee: 'Sienna Moore', assigneeId: 3,
    due: '2026-03-15', // overdue
    recurring: 'Single', recurringEnd: '', recurringCount: '',
    linkType: 'Creator', linkId: 1, linkLabel: 'Sofia Chen', linkPath: '/roster?open=1',
    tags: ['briefs', 'urgent'],
    notes: 'Need brand guidelines from TechFlow first.',
  },
  {
    id: 11,
    title: 'Confirm live dates with Anika Patel for Peak campaign',
    status: 'To Do', priority: 'Medium',
    assignee: 'Sienna Moore', assigneeId: 3,
    due: '2026-03-20',
    recurring: 'Single', recurringEnd: '', recurringCount: '',
    linkType: 'Campaign', linkId: 13, linkLabel: 'Peak Summer Campaign', linkPath: '/campaigns?open=13',
    tags: ['campaigns', 'scheduling'],
    notes: '',
  },
  {
    id: 12,
    title: 'Reconcile Q1 commission statements',
    status: 'To Do', priority: 'High',
    assignee: 'Rafi Okafor', assigneeId: 4,
    due: '2026-03-28',
    recurring: 'Single', recurringEnd: '', recurringCount: '',
    linkType: 'None', linkId: null, linkLabel: '', linkPath: '',
    tags: ['finance', 'quarterly'],
    notes: 'Cross-check payouts vs invoice records for Jan–Mar.',
  },
]

const TasksContext = createContext(null)

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const rows = await fetchAll('tasks')
        if (alive && rows && rows.length) setTasks(rows)
      } catch (e) {
        if (alive) setError(e.message || String(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  async function addTask(task) {
    const id = Math.max(0, ...tasks.map((t) => t.id)) + 1
    const optimistic = { ...task, id }
    setTasks((prev) => [...prev, optimistic])
    const saved = await insertRow('tasks', task)
    if (saved) setTasks((prev) => prev.map((t) => (t.id === id ? saved : t)))
    return (saved && saved.id) || id
  }

  async function updateTask(id, updates) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
    await updateRow('tasks', id, updates)
  }

  async function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await deleteRow('tasks', id)
  }

  // Cycles: To Do → Doing → Done → To Do
  function cycleStatus(id) {
    const current = tasks.find((t) => t.id === id)
    if (!current) return
    const next =
      current.status === 'To Do' ? 'Doing' : current.status === 'Doing' ? 'Done' : 'To Do'
    updateTask(id, { status: next })
  }

  return (
    <TasksContext.Provider value={{ tasks, loading, error, addTask, updateTask, deleteTask, cycleStatus }}>
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  return useContext(TasksContext)
}
