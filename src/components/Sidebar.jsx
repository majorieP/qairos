import { NavLink } from 'react-router-dom'

const navItems = [
  {
    section: 'Main',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
      { to: '/roster', label: 'Clients', icon: RosterIcon },
      { to: '/contacts', label: 'Contacts', icon: ContactsIcon },
    ],
  },
  {
    section: 'Business',
    links: [
      { to: '/deals', label: 'Deals', icon: DealsIcon },
      { to: '/campaigns', label: 'Campaigns', icon: CampaignsIcon },
      { to: '/contracts', label: 'Contracts', icon: ContractsIcon },
    ],
  },
  {
    section: 'Finance',
    links: [
      { to: '/invoices', label: 'Invoices', icon: InvoicesIcon },
      { to: '/payouts', label: 'Payouts', icon: PayoutsIcon },
      { to: '/expenses', label: 'Expenses', icon: ExpensesIcon },
    ],
  },
  {
    section: 'Pitching',
    links: [
      { to: '/proposals', label: 'Proposals', icon: ProposalsIcon },
      { to: '/media-kits', label: 'Media Kits', icon: MediaKitsIcon },
    ],
  },
  {
    section: 'Analytics',
    links: [
      { to: '/analytics/business-performance', label: 'Business Performance', icon: AnalyticsIcon },
    ],
  },
  {
    section: 'Workspace',
    links: [
      { to: '/team', label: 'Team', icon: TeamIcon },
      { to: '/tasks', label: 'Tasks', icon: TasksIcon },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside
      className="w-56 flex flex-col shrink-0"
      style={{ background: '#FFFFFF', borderRight: '1px solid #EEEEEE' }}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-5" style={{ borderBottom: '1px solid #EEEEEE' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#111111" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M7 5L10 6.5V9.5L7 11L4 9.5V6.5L7 5Z" fill="#111111" />
            </svg>
          </div>
          <span
            className="text-[#111111] text-base tracking-tight"
            style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600 }}
          >
            Qairos
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-5 px-3">
        {navItems.map((group) => (
          <div key={group.section} className="mb-5">
            <p
              className="px-2 mb-1.5 uppercase text-[9px]"
              style={{ color: '#BBBBBB', fontWeight: 500, letterSpacing: '0.12em' }}
            >
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.links.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) => isActive ? '_active' : '_inactive'}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? '#FFFFFF' : '#666666',
                      background: isActive ? '#111111' : 'transparent',
                      transition: 'color 0.15s, background 0.15s',
                      textDecoration: 'none',
                    })}
                    onMouseEnter={e => {
                      if (!e.currentTarget.classList.contains('_active')) {
                        e.currentTarget.style.color = '#111111'
                        e.currentTarget.style.background = '#F5F5F5'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!e.currentTarget.classList.contains('_active')) {
                        e.currentTarget.style.color = '#666666'
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <Icon />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom user area */}
      <div className="px-4 py-3.5" style={{ borderTop: '1px solid #EEEEEE' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
            style={{ background: '#F0F0F0', color: '#111111' }}
          >
            MA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: '#111111' }}>Marjorie A.</p>
            <p className="text-[10px] truncate" style={{ color: '#888888' }}>Talent Manager</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── Icons ──────────────────────────────────────────────

function DashboardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65, color: 'currentcolor' }}>
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function RosterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65 }}>
      <circle cx="7.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 13c0-3.037 2.462-5.5 5.5-5.5S13 9.963 13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ContactsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65 }}>
      <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="5.5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 11.5c0-1.657 1.343-3 3-3s3 1.343 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9 5h3.5M9 7.5h2.5M9 10h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function DealsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65 }}>
      <path d="M2 8L7.5 2.5L13 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 6.5V13H11V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 13V9.5H9V13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CampaignsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65 }}>
      <path d="M2.5 10V5L11 2.5V12.5L2.5 10Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M2.5 7.5H1M11 7.5H13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2.5 10L1.5 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ContractsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65 }}>
      <rect x="2" y="1" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 5h5M5 7.5h5M5 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function InvoicesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65 }}>
      <rect x="1.5" y="1" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 5.5h5M5 8h5M5 10.5h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9 10.5h1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function PayoutsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65 }}>
      <rect x="1" y="4" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 7h13" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="4.5" cy="9.5" r="1" fill="currentColor" />
      <path d="M3 3h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ExpensesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65 }}>
      <path d="M7.5 1v13M4.5 3.5C4.5 2.672 5.172 2 6 2h3c.828 0 1.5.672 1.5 1.5S9.828 5 9 5H6C5.172 5 4.5 5.672 4.5 6.5S5.172 8 6 8h3c.828 0 1.5.672 1.5 1.5S9.828 11 9 11H5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function TeamIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65 }}>
      <circle cx="5.5" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10.5" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 12c0-2.485 2.015-4.5 4.5-4.5S10 9.515 10 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.5 7.5c2.485 0 4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function TasksIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65 }}>
      <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 7.5l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AnalyticsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65 }}>
      <path d="M1 13.5h13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="2" y="8.5" width="2.5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="6.25" y="5.5" width="2.5" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="10.5" y="2.5" width="2.5" height="11" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function ProposalsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65 }}>
      <rect x="1.5" y="1" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 4.5h5M4 7h5M4 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="11.5" cy="11.5" r="2.5" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10.5 11.5h2M11.5 10.5v2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function MediaKitsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0" style={{ opacity: 0.65 }}>
      <rect x="1" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 6.5h4M8 8h3M8 9.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M4 3.5V2.5A.5.5 0 014.5 2h6a.5.5 0 01.5.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
