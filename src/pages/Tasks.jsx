import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useTasks } from '../context/TasksContext'
import { useCampaigns } from '../context/CampaignsContext'
import { useInvoices } from '../context/InvoicesContext'
import { usePayouts } from '../context/PayoutsContext'
import { creatorPhotoUrl } from '../lib/creatorHelpers'

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUSES   = ['To Do', 'Doing', 'Done']
const PRIORITIES = ['High', 'Medium', 'Low']
const ASSIGNEES  = ['Marjorie A.', 'Devon Park', 'Sienna Moore', 'Rafi Okafor']
const LINK_TYPES = ['None', 'Deal', 'Campaign', 'Creator', 'Brand', 'Invoice', 'Payout']
const RECURRINGS = ['Single', 'Daily', 'Weekly', 'Monthly']

const STATUS_COLORS = {
  'To Do': { background: '#F3F3F3', color: '#666666' },
  'Doing': { background: '#EEF4FF', color: '#2D5BE3' },
  'Done':  { background: '#EDFAF3', color: '#1A7A4A' },
}
const PRIORITY_COLORS = {
  High:   { background: '#FEE2E2', color: '#DC2626' },
  Medium: { background: '#FFF4EC', color: '#C4622D' },
  Low:    { background: '#F3F3F3', color: '#666666' },
}
const PRIORITY_DOT = {
  High: 'bg-red-500', Medium: 'bg-amber-400', Low: 'bg-gray-300',
}
const PRIORITY_CAL = {
  High: { background: '#FEE2E2', color: '#DC2626' }, Medium: { background: '#FFF4EC', color: '#C4622D' }, Low: { background: '#F3F3F3', color: '#666666' },
}

const VIEWS = [
  { id: 'all',      label: 'All Tasks'   },
  { id: 'status',   label: 'By Status'   },
  { id: 'priority', label: 'By Priority' },
  { id: 'calendar', label: 'Calendar'    },
  { id: 'project',  label: 'By Project'  },
]

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_ABBREVS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const ASSIGNEE_IDS = { 'Marjorie A.': 1, 'Devon Park': 2, 'Sienna Moore': 3, 'Rafi Okafor': 4 }

const STATIC_LINKS = {
  Creator: [
    { id: 1, label: 'Sofia Chen',    path: '/roster?open=1' },
    { id: 2, label: 'Marcus Reid',   path: '/roster?open=2' },
    { id: 3, label: 'James Ortiz',   path: '/roster?open=3' },
    { id: 4, label: 'Anika Patel',   path: '/roster?open=4' },
    { id: 5, label: 'Lily Nakamura', path: '/roster?open=5' },
  ],
  Brand: [
    { id: 1, label: 'Luminary Beauty', path: '/contacts' },
    { id: 2, label: 'TechFlow',        path: '/contacts' },
    { id: 3, label: 'Verdant Foods',   path: '/contacts' },
    { id: 4, label: 'Solstice Travel', path: '/contacts' },
    { id: 5, label: 'Peak Athletics',  path: '/contacts' },
  ],
  Deal: [
    { id: 1,  label: 'Luminary Beauty × Sofia Q1',  path: '/deals?open=1'  },
    { id: 2,  label: 'TechFlow × Marcus Q1',         path: '/deals?open=2'  },
    { id: 3,  label: 'Verdant Foods × James Q1',     path: '/deals?open=3'  },
    { id: 4,  label: 'Luminary Beauty × Anika Feb',  path: '/deals?open=4'  },
    { id: 5,  label: 'Solstice Travel × Sofia Mar',  path: '/deals?open=5'  },
    { id: 6,  label: 'Peak Athletics × Marcus Mar',  path: '/deals?open=6'  },
    { id: 7,  label: 'TechFlow × James Mar',         path: '/deals?open=7'  },
    { id: 8,  label: 'Verdant Foods × Anika Mar',    path: '/deals?open=8'  },
    { id: 9,  label: 'Solstice Travel × Lily Apr',   path: '/deals?open=9'  },
    { id: 10, label: 'Luminary Beauty × Sofia Apr',  path: '/deals?open=10' },
    { id: 11, label: 'TechFlow × Marcus May',        path: '/deals?open=11' },
    { id: 12, label: 'Verdant Foods × James May',    path: '/deals?open=12' },
    { id: 13, label: 'Peak Athletics × Anika May',   path: '/deals?open=13' },
  ],
}

export const EMPTY_TASK = {
  title: '', status: 'To Do', priority: 'Medium',
  assignee: 'Marjorie A.', assigneeId: 1,
  due: '', recurring: 'Single', recurringEnd: '', recurringCount: '',
  linkType: 'None', linkId: null, linkLabel: '', linkPath: '',
  tags: [], notes: '',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function countdown(dueDateStr) {
  if (!dueDateStr) return null
  const due = new Date(dueDateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((due - today) / 86400000)
  if (diff < 0)  return { label: `Overdue by ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''}`, urgent: true }
  if (diff === 0) return { label: 'Due today',    urgent: true  }
  if (diff === 1) return { label: 'Due tomorrow', urgent: false }
  return { label: `Due in ${diff} days`, urgent: false }
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getCalendarGrid(year, month) {
  const first = new Date(year, month, 1).getDay()
  const days  = new Date(year, month + 1, 0).getDate()
  const grid  = Array(first).fill(null)
  for (let d = 1; d <= days; d++) grid.push(d)
  while (grid.length % 7) grid.push(null)
  return grid
}

function nextOccurrence(task) {
  if (task.recurring === 'Single' || !task.due) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(task.due + 'T00:00:00')
  if (d >= today) return null
  while (d < today) {
    if (task.recurring === 'Daily')   d.setDate(d.getDate() + 1)
    if (task.recurring === 'Weekly')  d.setDate(d.getDate() + 7)
    if (task.recurring === 'Monthly') d.setMonth(d.getMonth() + 1)
  }
  return d.toISOString().slice(0, 10)
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function CloseIcon()  { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> }
function PlusIcon({ size = 14 }) { return <svg width={size} height={size} viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> }
function SearchIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-400"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
function ChevRight({ cls = '' }) { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={cls}><path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function RepeatIcon() { return <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="shrink-0 text-gray-400"><path d="M1 4h8M7 2l2 2-2 2M11 8H3M5 6l-2 2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function LinkIconSm() { return <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M8 1h3v3M5.5 6.5l5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }

// ── Small components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={STATUS_COLORS[status] || { background: '#F3F3F3', color: '#666666' }}>{status}</span>
}

function PriorityBadge({ priority }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={PRIORITY_COLORS[priority] || { background: '#F3F3F3', color: '#666666' }}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[priority] || 'bg-gray-300'}`} />
      {priority}
    </span>
  )
}

function CountdownBadge({ due, status }) {
  if (!due || status === 'Done') return null
  const cd = countdown(due)
  if (!cd) return null
  return (
    <span className={`text-xs font-medium whitespace-nowrap ${cd.urgent ? 'text-red-500' : 'text-gray-400'}`}>
      {cd.label}
    </span>
  )
}

function TaskCheckbox({ status, onCycle }) {
  const isDone  = status === 'Done'
  const isDoing = status === 'Doing'
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onCycle() }}
      title={`${status} — click to advance`}
      className={`shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
        isDone  ? 'bg-emerald-500 border-emerald-500'
        : isDoing ? 'border-blue-400 bg-blue-50'
        : 'border-gray-300 hover:border-gray-400'
      }`}
      style={{ width: 18, height: 18 }}
    >
      {isDone  && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {isDoing && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
    </button>
  )
}

function GroupHeader({ label, count, isOpen, onToggle, badge }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-2 mb-2 w-full text-left group">
      <span className={`text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}>
        <ChevRight />
      </span>
      {badge || <span className="text-xs font-semibold text-gray-600">{label}</span>}
      <span className="text-xs text-gray-400">{count}</span>
    </button>
  )
}

// ── Tag Input ──────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  const commit = () => {
    const t = input.trim().toLowerCase().replace(/,/g, '')
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Tags</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
            {t}
            <button onClick={() => onChange(tags.filter((x) => x !== t))} className="text-gray-400 hover:text-gray-700 leading-none">×</button>
          </span>
        ))}
      </div>
      <input
        type="text" value={input} onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() }
          if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1))
        }}
        onBlur={commit}
        placeholder="Add tag, press Enter…"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
    </div>
  )
}

// ── Task Row ───────────────────────────────────────────────────────────────────

function TaskRow({ task, onOpen, onCycle }) {
  return (
    <div
      onClick={() => onOpen(task)}
      className={`bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer ${task.status === 'Done' ? 'opacity-55' : ''}`}
    >
      <TaskCheckbox status={task.status} onCycle={() => onCycle(task.id)} />
      <span className={`flex-1 text-sm font-medium min-w-0 truncate ${task.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {task.title}
      </span>
      {task.recurring !== 'Single' && <RepeatIcon />}
      {task.tags?.slice(0, 2).map((t) => (
        <span key={t} className="hidden lg:inline px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500 shrink-0">{t}</span>
      ))}
      {task.linkType !== 'None' && task.linkLabel && (
        <span className="hidden xl:inline text-[10px] px-1.5 py-0.5 rounded-full shrink-0 max-w-[90px] truncate" style={{ background: '#F3F3F3', color: '#666666' }}>
          {task.linkType}
        </span>
      )}
      <PriorityBadge priority={task.priority} />
      <CountdownBadge due={task.due} status={task.status} />
      <span className="text-xs text-gray-400 shrink-0 min-w-[44px] text-right hidden sm:block">
        {task.assignee.split(' ')[0]}
      </span>
    </div>
  )
}

// ── View: All Tasks (flat, by due date) ────────────────────────────────────────

function AllTasksView({ tasks, onOpen, onCycle }) {
  const sorted = [...tasks].sort((a, b) => {
    if (!a.due && !b.due) return 0
    if (!a.due) return 1
    if (!b.due) return -1
    return a.due.localeCompare(b.due)
  })
  return (
    <div className="space-y-1.5">
      {sorted.length === 0
        ? <p className="text-sm text-gray-400 italic py-8 text-center">No tasks match your filters.</p>
        : sorted.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpen} onCycle={onCycle} />)
      }
    </div>
  )
}

// ── View: By Status (grouped, collapsible) ─────────────────────────────────────

function ByStatusView({ tasks, onOpen, onCycle }) {
  const [collapsed, setCollapsed] = useState({})
  const toggle = (s) => setCollapsed((p) => ({ ...p, [s]: !p[s] }))
  return (
    <div className="space-y-5">
      {STATUSES.map((status) => {
        const g = tasks.filter((t) => t.status === status)
        const isOpen = collapsed[status] !== true
        return (
          <div key={status}>
            <GroupHeader label={status} count={g.length} isOpen={isOpen} onToggle={() => toggle(status)} badge={<StatusBadge status={status} />} />
            {isOpen && (
              <div className="space-y-1.5">
                {g.length === 0
                  ? <p className="text-xs text-gray-400 italic pl-1 py-2">No tasks.</p>
                  : g.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpen} onCycle={onCycle} />)
                }
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── View: By Priority (grouped, collapsible) ───────────────────────────────────

function ByPriorityView({ tasks, onOpen, onCycle }) {
  const [collapsed, setCollapsed] = useState({})
  const toggle = (p) => setCollapsed((prev) => ({ ...prev, [p]: !prev[p] }))
  return (
    <div className="space-y-5">
      {PRIORITIES.map((priority) => {
        const g = tasks.filter((t) => t.priority === priority)
        const isOpen = collapsed[priority] !== true
        return (
          <div key={priority}>
            <GroupHeader label={priority} count={g.length} isOpen={isOpen} onToggle={() => toggle(priority)} badge={<PriorityBadge priority={priority} />} />
            {isOpen && (
              <div className="space-y-1.5">
                {g.length === 0
                  ? <p className="text-xs text-gray-400 italic pl-1 py-2">No tasks.</p>
                  : g.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpen} onCycle={onCycle} />)
                }
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── View: Calendar ─────────────────────────────────────────────────────────────

function CalendarView({ tasks, onOpen }) {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const grid = getCalendarGrid(year, month)

  const tasksByDay = useMemo(() => {
    const map = {}
    tasks.forEach((t) => {
      if (!t.due) return
      const d = new Date(t.due + 'T00:00:00')
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(t)
      }
    })
    return map
  }, [tasks, year, month])

  const todayDate = now.getDate()

  const prev = () => month === 0 ? (setYear((y) => y - 1), setMonth(11)) : setMonth((m) => m - 1)
  const next = () => month === 11 ? (setYear((y) => y + 1), setMonth(0)) : setMonth((m) => m + 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <p className="text-sm font-semibold text-gray-800">{MONTH_NAMES[month]} {year}</p>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_ABBREVS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
        {grid.map((day, i) => {
          const isToday = day === todayDate && year === now.getFullYear() && month === now.getMonth()
          const dayTasks = day ? (tasksByDay[day] || []) : []
          return (
            <div key={i} className={`min-h-[88px] p-2 ${day ? 'bg-white' : 'bg-gray-50/50'}`}>
              {day && (
                <>
                  <div className={`text-xs font-semibold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#111111] text-white' : 'text-gray-500'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onOpen(t)}
                        className={`w-full text-left text-[10px] leading-snug px-1.5 py-0.5 rounded truncate font-medium hover:opacity-75 transition-opacity ${t.status === 'Done' ? 'opacity-40 line-through' : ''}`}
                        style={PRIORITY_CAL[t.priority] || { background: '#F3F3F3', color: '#666666' }}
                      >
                        {t.title}
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="text-[10px] text-gray-400 pl-1">+{dayTasks.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── View: By Project/Link ──────────────────────────────────────────────────────

function ByProjectView({ tasks, onOpen, onCycle }) {
  const [collapsed, setCollapsed] = useState({})
  const toggle = (k) => setCollapsed((p) => ({ ...p, [k]: !p[k] }))

  const groups = {}
  tasks.forEach((t) => {
    const key = (!t.linkType || t.linkType === 'None' || !t.linkLabel)
      ? 'Standalone'
      : `${t.linkType}: ${t.linkLabel}`
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })

  const keys = Object.keys(groups).sort((a, b) => {
    if (a === 'Standalone') return 1
    if (b === 'Standalone') return -1
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-5">
      {keys.length === 0 && <p className="text-sm text-gray-400 italic py-8 text-center">No tasks match your filters.</p>}
      {keys.map((key) => {
        const g = groups[key]
        const isOpen = collapsed[key] !== true
        return (
          <div key={key}>
            <button onClick={() => toggle(key)} className="flex items-center gap-2 mb-2 w-full text-left">
              <span className={`text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}><ChevRight /></span>
              <span className="text-xs font-semibold text-gray-700">{key}</span>
              <span className="text-xs text-gray-400">{g.length}</span>
            </button>
            {isOpen && (
              <div className="space-y-1.5">
                {g.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpen} onCycle={onCycle} />)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Quick Add Bar ──────────────────────────────────────────────────────────────

function QuickAddBar({ onAdd, onExpand, onDismiss }) {
  const [title, setTitle]       = useState('')
  const [due, setDue]           = useState('')
  const [priority, setPriority] = useState('Medium')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = () => {
    if (!title.trim()) return
    onAdd({ title: title.trim(), due, priority })
    setTitle(''); setDue(''); setPriority('Medium')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5 mb-4 shadow-sm">
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 shrink-0" />
        <input
          ref={inputRef}
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onDismiss() }}
          placeholder="Task title…"
          className="flex-1 min-w-[160px] text-sm focus:outline-none text-gray-800 placeholder-gray-400"
        />
        <input
          type="date" value={due} onChange={(e) => setDue(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-600"
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={submit} disabled={!title.trim()}
          className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-40 transition-colors" style={{ background: '#111111', color: '#fff' }}
        >
          Add
        </button>
        <button onClick={() => onExpand({ title, due, priority })}
          className="text-xs text-[#111111] hover:underline font-medium"
        >
          More options →
        </button>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}

// ── Add Task Drawer ────────────────────────────────────────────────────────────

function AddTaskDrawer({ open, onClose, onAdd, prefill, campaigns, invoices, payouts }) {
  const [form, setForm] = useState({ ...EMPTY_TASK })
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (open) setForm({ ...EMPTY_TASK, ...prefill })
  }, [open, JSON.stringify(prefill)])

  const linkOptions = useMemo(() => {
    if (form.linkType === 'Campaign') return campaigns.map((c) => ({ id: c.id, label: c.dealName || `Campaign #${c.id}`, path: `/campaigns?open=${c.id}` }))
    if (form.linkType === 'Invoice')  return invoices.map((inv) => ({ id: inv.id, label: inv.invoiceId, path: `/invoices?open=${inv.id}` }))
    if (form.linkType === 'Payout')   return payouts.map((p) => ({ id: p.id, label: `${p.creator} × ${p.brand}`, path: `/payouts?open=${p.id}` }))
    return STATIC_LINKS[form.linkType] || []
  }, [form.linkType, campaigns, invoices, payouts])

  const handleLinkChange = (id) => {
    const opt = linkOptions.find((o) => String(o.id) === String(id))
    if (opt) setForm((p) => ({ ...p, linkId: opt.id, linkLabel: opt.label, linkPath: opt.path }))
    else     setForm((p) => ({ ...p, linkId: null, linkLabel: '', linkPath: '' }))
  }

  const handleAdd = () => {
    if (!form.title.trim()) return
    onAdd({ ...form, assigneeId: ASSIGNEE_IDS[form.assignee] ?? 1 })
    onClose()
  }

  if (!open) return null

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white'
  const labelCls = 'block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 w-[440px] bg-white border-l border-gray-200 h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4 z-10">
          <h2 className="text-sm font-semibold text-gray-900">New Task</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"><CloseIcon /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className={labelCls}>Title *</label>
            <textarea value={form.title} onChange={(e) => set('title', e.target.value)} rows={2}
              placeholder="What needs to be done?" className={`${inputCls} resize-none`} />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={inputCls}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Assigned to + Due */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Assigned to</label>
              <select value={form.assignee} onChange={(e) => set('assignee', e.target.value)} className={inputCls}>
                {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" value={form.due} onChange={(e) => set('due', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Recurring */}
          <div>
            <label className={labelCls}>Recurring</label>
            <select value={form.recurring} onChange={(e) => set('recurring', e.target.value)} className={inputCls}>
              {RECURRINGS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {form.recurring !== 'Single' && (
            <div className="grid grid-cols-2 gap-3 pl-3 border-l-2 border-gray-200">
              <div>
                <label className={labelCls}>End Date</label>
                <input type="date" value={form.recurringEnd} onChange={(e) => set('recurringEnd', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Max occurrences</label>
                <input type="number" value={form.recurringCount} onChange={(e) => set('recurringCount', e.target.value)}
                  placeholder="Unlimited" className={inputCls} min="1" />
              </div>
            </div>
          )}

          {/* Link type + record */}
          <div>
            <label className={labelCls}>Link to record</label>
            <select value={form.linkType}
              onChange={(e) => setForm((p) => ({ ...p, linkType: e.target.value, linkId: null, linkLabel: '', linkPath: '' }))}
              className={inputCls}
            >
              {LINK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {form.linkType !== 'None' && linkOptions.length > 0 && (
            <div>
              <label className={labelCls}>Linked Record</label>
              <select value={form.linkId ?? ''} onChange={(e) => handleLinkChange(e.target.value)} className={inputCls}>
                <option value="">— Select —</option>
                {linkOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
          )}

          <TagInput tags={form.tags} onChange={(t) => set('tags', t)} />

          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button onClick={handleAdd} disabled={!form.title.trim()}
              className="flex-1 py-2 text-sm font-medium rounded-lg disabled:opacity-40 transition-colors" style={{ background: '#111111', color: '#fff' }}>
              Add Task
            </button>
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

// ── Task Detail Drawer ─────────────────────────────────────────────────────────

function TaskDetailDrawer({ task, onClose, onUpdate }) {
  const navigate   = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({ ...task })
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  useEffect(() => { setForm({ ...task }); setEditing(false) }, [task?.id])

  if (!task) return null

  const save = () => { onUpdate(task.id, form); setEditing(false) }
  const nextOcc = nextOccurrence(task)
  const cd = task.status !== 'Done' ? countdown(task.due) : null

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white'
  const labelCls = 'block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1'

  return (
    <>
      <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Task</p>
          <h2 className="text-sm font-semibold text-gray-900 truncate">{task.title}</h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="text-xs font-medium text-[#111111] hover:underline px-2.5 py-1 rounded-md transition-colors">
              Edit
            </button>
          )}
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="p-6">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Title</label>
              <textarea value={form.title} onChange={(e) => set('title', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Status</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Priority</label>
                <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={inputCls}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Assigned to</label>
                <select value={form.assignee} onChange={(e) => set('assignee', e.target.value)} className={inputCls}>
                  {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Due Date</label>
                <input type="date" value={form.due} onChange={(e) => set('due', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Recurring</label>
              <select value={form.recurring} onChange={(e) => set('recurring', e.target.value)} className={inputCls}>
                {RECURRINGS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {form.recurring !== 'Single' && (
              <div className="grid grid-cols-2 gap-3 pl-3 border-l-2 border-gray-200">
                <div>
                  <label className={labelCls}>End Date</label>
                  <input type="date" value={form.recurringEnd} onChange={(e) => set('recurringEnd', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Max occurrences</label>
                  <input type="number" value={form.recurringCount} onChange={(e) => set('recurringCount', e.target.value)} placeholder="Unlimited" className={inputCls} min="1" />
                </div>
              </div>
            )}
            <TagInput tags={form.tags || []} onChange={(t) => set('tags', t)} />
            <div>
              <label className={labelCls}>Notes</label>
              <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button onClick={save} className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>Save changes</button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Badges + countdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {cd && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cd.urgent ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                  {cd.label}
                </span>
              )}
            </div>

            {/* Linked record chip */}
            {task.linkType !== 'None' && task.linkLabel && (() => {
              const isCreator = task.linkType === 'Creator'
              const creatorId = isCreator
                ? (STATIC_LINKS.Creator?.find(c => c.label === task.linkLabel)?.id ?? null)
                : null
              const photo = isCreator ? creatorPhotoUrl(creatorId) : null
              return (
                <button
                  onClick={() => { onClose(); navigate(task.linkPath) }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-medium transition-colors"
                  style={{ background: '#F3F3F3', color: '#666666' }}
                >
                  {photo ? (
                    <img src={photo} alt={task.linkLabel}
                      style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <LinkIconSm />
                  )}
                  {task.linkType}: {task.linkLabel}
                </button>
              )
            })()}

            {/* Meta fields */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className={labelCls}>Assigned to</p>
                <button
                  onClick={() => { onClose(); navigate(`/team?open=${task.assigneeId}`) }}
                  className="text-sm text-[#111111] hover:underline transition-colors"
                >
                  {task.assignee}
                </button>
              </div>
              <div>
                <p className={labelCls}>Due Date</p>
                <p className="text-sm text-gray-800">{fmtDate(task.due)}</p>
              </div>
              <div>
                <p className={labelCls}>Recurring</p>
                <div className="flex items-center gap-1.5">
                  {task.recurring !== 'Single' && <RepeatIcon />}
                  <p className="text-sm text-gray-800">{task.recurring}</p>
                </div>
              </div>
              {nextOcc && (
                <div>
                  <p className={labelCls}>Next occurrence</p>
                  <p className="text-sm text-gray-800">{fmtDate(nextOcc)}</p>
                </div>
              )}
              {task.recurringEnd && (
                <div>
                  <p className={labelCls}>Ends on</p>
                  <p className="text-sm text-gray-800">{fmtDate(task.recurringEnd)}</p>
                </div>
              )}
              {task.recurringCount && (
                <div>
                  <p className={labelCls}>Max occurrences</p>
                  <p className="text-sm text-gray-800">{task.recurringCount}</p>
                </div>
              )}
            </div>

            {task.tags?.length > 0 && (
              <div>
                <p className={labelCls}>Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map((t) => (
                    <span key={t} className="px-2.5 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {task.notes && (
              <div>
                <p className={labelCls}>Notes</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{task.notes}</p>
              </div>
            )}

            {/* Action button */}
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  const next = task.status === 'Done' ? 'To Do' : task.status === 'To Do' ? 'Doing' : 'Done'
                  onUpdate(task.id, { status: next })
                  if (next === 'Done') onClose()
                }}
                className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors border ${
                  task.status === 'Done'
                    ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    : 'border-green-200 text-green-700 hover:bg-green-50'
                }`}
              >
                {task.status === 'Done' ? 'Reopen task' : task.status === 'To Do' ? 'Start task →' : 'Mark as done ✓'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function Tasks() {
  const [searchParams]   = useSearchParams()
  const { tasks, addTask, updateTask, cycleStatus } = useTasks()
  const { campaigns }    = useCampaigns()
  const { invoices }     = useInvoices()
  const { payouts }      = usePayouts()

  const [view, setView]               = useState('all')
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus]     = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterTag, setFilterTag]           = useState('')
  const [showQuickAdd, setShowQuickAdd]     = useState(false)
  const [showAddDrawer, setShowAddDrawer]   = useState(false)
  const [addPrefill, setAddPrefill]         = useState({})
  const [selectedId, setSelectedId]         = useState(null)

  // Deep link support: /tasks?open=3
  useEffect(() => {
    const openId = parseInt(searchParams.get('open'))
    if (openId && tasks.find((t) => t.id === openId)) setSelectedId(openId)
  }, [searchParams, tasks])

  const selected = tasks.find((t) => t.id === selectedId) ?? null

  const allTags = useMemo(() => [...new Set(tasks.flatMap((t) => t.tags || []))].sort(), [tasks])

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus   && t.status   !== filterStatus)   return false
      if (filterPriority && t.priority !== filterPriority) return false
      if (filterAssignee && t.assignee !== filterAssignee) return false
      if (filterTag && !t.tags?.includes(filterTag))        return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.assignee.toLowerCase().includes(q) &&
          !(t.linkLabel || '').toLowerCase().includes(q) &&
          !t.tags?.some((tag) => tag.includes(q))
        ) return false
      }
      return true
    })
  }, [tasks, filterStatus, filterPriority, filterAssignee, filterTag, search])

  const hasFilters = search || filterStatus || filterPriority || filterAssignee || filterTag
  const clearFilters = () => { setSearch(''); setFilterStatus(''); setFilterPriority(''); setFilterAssignee(''); setFilterTag('') }

  const handleQuickAdd = ({ title, due, priority }) => {
    addTask({ ...EMPTY_TASK, title, due, priority })
    setShowQuickAdd(false)
  }

  const handleExpand = ({ title, due, priority }) => {
    setAddPrefill({ title, due, priority })
    setShowQuickAdd(false)
    setShowAddDrawer(true)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Tasks"
        subtitle="Track action items across your roster and deals."
        action={
          <button
            onClick={() => { setShowQuickAdd((v) => !v); setShowAddDrawer(false) }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}
          >
            <PlusIcon />
            New Task
          </button>
        }
      />

      {/* Quick Add */}
      {showQuickAdd && (
        <QuickAddBar
          onAdd={handleQuickAdd}
          onExpand={handleExpand}
          onDismiss={() => setShowQuickAdd(false)}
        />
      )}

      {/* Main panel */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
          <div className="flex items-center gap-1">
            {VIEWS.map((v) => (
              <button key={v.id} onClick={() => setView(v.id)}
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${view === v.id ? '#111111' : '#EEEEEE'}`,
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontWeight: 500,
                  fontSize: 12,
                  color: view === v.id ? '#111111' : '#888888',
                  cursor: 'pointer',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{filtered.length} of {tasks.length}</span>
            {hasFilters && <button onClick={clearFilters} className="text-[#111111] hover:underline font-medium">Clear filters</button>}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex-wrap">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"><SearchIcon /></span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white w-44"
            />
          </div>
          {[
            { label: 'Status',      value: filterStatus,   set: setFilterStatus,   opts: STATUSES   },
            { label: 'Priority',    value: filterPriority, set: setFilterPriority, opts: PRIORITIES },
            { label: 'Assigned to', value: filterAssignee, set: setFilterAssignee, opts: ASSIGNEES  },
          ].map(({ label, value, set, opts }) => (
            <select key={label} value={value} onChange={(e) => set(e.target.value)}
              className="text-sm px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="">{label}</option>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          {allTags.length > 0 && (
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}
              className="text-sm px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="">Tag</option>
              {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {/* Content */}
        <div className={view === 'calendar' ? 'p-4' : 'p-5'}>
          {view === 'all'      && <AllTasksView  tasks={filtered} onOpen={(t) => setSelectedId(t.id)} onCycle={cycleStatus} />}
          {view === 'status'   && <ByStatusView  tasks={filtered} onOpen={(t) => setSelectedId(t.id)} onCycle={cycleStatus} />}
          {view === 'priority' && <ByPriorityView tasks={filtered} onOpen={(t) => setSelectedId(t.id)} onCycle={cycleStatus} />}
          {view === 'calendar' && <CalendarView  tasks={filtered} onOpen={(t) => setSelectedId(t.id)} />}
          {view === 'project'  && <ByProjectView  tasks={filtered} onOpen={(t) => setSelectedId(t.id)} onCycle={cycleStatus} />}
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${selectedId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSelectedId(null)}
      />

      {/* Task Detail Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 w-[460px] bg-white border-l border-gray-200 h-full overflow-y-auto shadow-xl transition-transform duration-300 ease-in-out ${selectedId ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selected && (
          <TaskDetailDrawer
            task={selected}
            onClose={() => setSelectedId(null)}
            onUpdate={updateTask}
          />
        )}
      </aside>

      {/* Add Task Drawer */}
      <AddTaskDrawer
        open={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        onAdd={addTask}
        prefill={addPrefill}
        campaigns={campaigns}
        invoices={invoices}
        payouts={payouts}
      />
    </div>
  )
}
