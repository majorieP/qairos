import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProposals } from '../context/ProposalsContext'
import { clientsData } from './Roster'

const AVATAR_PALETTE = [
  'bg-gray-500', 'bg-pink-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-gray-600', 'bg-teal-500',
  'bg-orange-500', 'bg-cyan-500',
]
function avatarBg(id) { return AVATAR_PALETTE[(id - 1) % AVATAR_PALETTE.length] }

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const PLATFORM_COLORS = {
  Instagram: 'bg-pink-100 text-pink-700',
  TikTok: 'bg-slate-100 text-slate-700',
  YouTube: 'bg-red-100 text-red-700',
}

function fmtNum(n) {
  if (!n) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

export default function ProposalView() {
  const { token } = useParams()
  const { proposals } = useProposals()
  const [copied, setCopied] = useState(false)

  const proposal = proposals.find(p => p.shareToken === token)

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-800 mb-2">Proposal not found</p>
          <p className="text-gray-500 mb-6">This link may be invalid or the proposal has been removed.</p>
          <Link to="/proposals" className="text-[#111111] hover:underline text-sm font-medium">
            ← Back to Proposals
          </Link>
        </div>
      </div>
    )
  }

  const creators = proposal.creators
    .map(c => ({ ...clientsData.find(cl => cl.id === c.clientId), notes: c.notes }))
    .filter(Boolean)

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Action bar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <Link
          to="/proposals"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Proposals
        </Link>
        <div className="w-px h-4 bg-gray-200" />
        <span className="text-sm font-medium text-gray-800 flex-1 truncate">{proposal.name}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 6.5l3 3 6-6" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-green-700">Copied!</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M9 4V2.5A1.5 1.5 0 007.5 1h-5A1.5 1.5 0 001 2.5v5A1.5 1.5 0 002.5 9H4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Share link
              </>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors font-medium" style={{ background: '#111111', color: '#fff' }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M3 4.5V1.5A.5.5 0 013.5 1h6a.5.5 0 01.5.5V4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <rect x="1" y="4" width="11" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M3 10v1.5a.5.5 0 00.5.5h6a.5.5 0 00.5-.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="9.5" cy="7" r=".75" fill="currentColor"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="max-w-3xl mx-auto py-10 px-4 print:py-0 print:px-0 print:max-w-none space-y-6 print:space-y-0">

        {/* Cover Page */}
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden print:rounded-none print:shadow-none flex min-h-[640px] print:min-h-screen">
          {/* Left accent bar */}
          <div className="w-2 bg-gradient-to-b from-[#111111] to-[#444444] shrink-0" />

          <div className="flex-1 flex flex-col px-12 py-14 print:px-16 print:py-20">
            {/* Agency logo area */}
            <div className="flex items-center gap-3 mb-auto">
              <div className="w-9 h-9 rounded-xl bg-[#111111] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M7 5L10 6.5V9.5L7 11L4 9.5V6.5L7 5Z" fill="white"/>
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-[15px] tracking-tight">Qairos</span>
            </div>

            {/* Main content */}
            <div className="py-16">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                {proposal.coverPage.title || 'Creator Partnership Proposal'}
              </p>
              <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
                {proposal.coverPage.brandName}
              </h1>
              {proposal.coverPage.tagline && (
                <p className="text-lg text-gray-500 italic mb-10">
                  "{proposal.coverPage.tagline}"
                </p>
              )}
              <div className="w-16 h-0.5 bg-gray-400 mb-10" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Prepared for</p>
                <p className="text-xl font-semibold text-gray-800">{proposal.coverPage.brandName}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-end justify-between mt-auto pt-8 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">{proposal.coverPage.date}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{creators.length} creator{creators.length !== 1 ? 's' : ''} selected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Creator Pages */}
        {creators.map((creator, i) => {
          const primaryPlatform = creator.platforms?.find(p => p.name === creator.primaryPlatform) || creator.platforms?.[0]
          return (
            <div
              key={creator.id}
              className="bg-white shadow-sm rounded-2xl overflow-hidden print:rounded-none print:shadow-none print:page-break-before"
              style={{ breakBefore: i === 0 ? 'auto' : 'page' }}
            >
              {/* Top gradient bar */}
              <div className="h-1.5 bg-gradient-to-r from-[#111111] via-[#444444] to-[#999999]" />

              <div className="px-10 py-10 print:px-12 print:py-12">
                {/* Creator header */}
                <div className="flex items-start gap-6 mb-8">
                  <div className={`w-20 h-20 rounded-2xl ${avatarBg(creator.id)} flex items-center justify-center text-white text-2xl font-bold shrink-0`}>
                    {initials(creator.name)}
                  </div>
                  <div className="flex-1 pt-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-0.5">{creator.name}</h2>
                    <p className="text-gray-500 text-sm mb-3">{creator.handle}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {creator.platforms?.map(p => (
                        <span key={p.name} className={`text-xs px-2.5 py-1 rounded-full font-medium ${PLATFORM_COLORS[p.name] || 'bg-gray-100 text-gray-600'}`}>
                          {p.name} · {p.followers}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Niche tags + strongest channels */}
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {creator.niches?.map(n => (
                    <span key={n} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">{n}</span>
                  ))}
                  {creator.strongestChannels?.map(ch => (
                    <span key={ch} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-white font-medium" style={{ background: '#111111' }}>
                      <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor"><path d="M4 0l.93 2.86H8L5.53 4.64 6.47 7.5 4 5.72 1.53 7.5l.94-2.86L0 2.86h3.07z"/></svg>
                      {ch}
                    </span>
                  ))}
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'Total Followers', value: fmtNum(creator.platforms?.reduce((s, p) => s + (p.followersNum || 0), 0)) },
                    { label: 'Engagement Rate', value: primaryPlatform?.engagement ? `${primaryPlatform.engagement}%` : '—' },
                    { label: 'Avg Views', value: primaryPlatform?.avgViews ? fmtNum(primaryPlatform.avgViews) : '—' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Rate card — grouped by channel */}
                {creator.rates?.length > 0 && (
                  <div className="mb-8">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Rate Card</p>
                    {(() => {
                      const strongest = creator.strongestChannels ?? []
                      const RATE_MAP = {
                        'Instagram:Story': 'IG Stories', 'Instagram:Feed Post': 'IG Posts',
                        'Instagram:Reel': 'IG Reels', 'Instagram:Live': 'IG Lives',
                        'TikTok:Video': 'TikTok Videos', 'TikTok:Shop': 'TikTok Shop',
                        'TikTok:Series (3 videos)': 'TikTok Videos',
                        'YouTube:Integration': 'YT Integrations', 'YouTube:Dedicated': 'YT Dedicated Videos',
                        'YouTube:Shorts': 'YT Shorts', 'YouTube:Vlog': 'YT Vlogs',
                      }
                      const grouped = {}
                      creator.rates.forEach(r => {
                        const ch = RATE_MAP[`${r.platform}:${r.type}`] || r.platform
                        if (!grouped[ch]) grouped[ch] = []
                        grouped[ch].push(r)
                      })
                      const keys = Object.keys(grouped).sort((a, b) => {
                        const aS = strongest.includes(a), bS = strongest.includes(b)
                        if (aS && !bS) return -1; if (!aS && bS) return 1; return 0
                      })
                      return keys.map(ch => {
                        const isS = strongest.includes(ch)
                        return (
                          <div key={ch} className="mb-3">
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg ${isS ? 'bg-[#111111]' : 'bg-gray-100'}`}>
                              {isS && (
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
                                  <path d="M4 0l.93 2.86H8L5.53 4.64 6.47 7.5 4 5.72 1.53 7.5l.94-2.86L0 2.86h3.07z"/>
                                </svg>
                              )}
                              <span className={`text-xs font-semibold uppercase tracking-wider ${isS ? 'text-white' : 'text-gray-500'}`}>{ch}</span>
                              {isS && <span className="text-[10px] text-gray-300 ml-auto">Strongest</span>}
                            </div>
                            <div className={`rounded-b-lg overflow-hidden border ${isS ? 'border-gray-300' : 'border-gray-200'}`}>
                              {grouped[ch].map(r => (
                                <div key={r.id || r.type} className={`flex items-center justify-between px-3 py-2.5 border-t first:border-t-0 ${isS ? 'border-gray-200 bg-gray-50/30' : 'border-gray-100 bg-gray-50'}`}>
                                  <span className="text-sm text-gray-600">{r.type}</span>
                                  <span className={`text-sm font-semibold ${isS ? 'text-gray-900' : 'text-gray-900'}`}>${typeof r.rate === 'number' ? r.rate.toLocaleString() : r.rate}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}

                {/* Strongest channels note */}
                {creator.strongestChannelsNote && (
                  <div className="mb-6 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Why these channels</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{creator.strongestChannelsNote}</p>
                  </div>
                )}

                {/* Manager notes */}
                {creator.notes && (
                  <div className="border-l-4 border-gray-400 pl-4 py-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Why this creator</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{creator.notes}</p>
                  </div>
                )}

                {/* Social links */}
                {creator.socialLinks && Object.values(creator.socialLinks).some(Boolean) && (
                  <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-4">
                    {creator.socialLinks.instagram && (
                      <a href={creator.socialLinks.instagram} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <rect x="1" y="1" width="11" height="11" rx="3" stroke="currentColor" strokeWidth="1.3"/>
                          <circle cx="6.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                          <circle cx="9.5" cy="3.5" r=".75" fill="currentColor"/>
                        </svg>
                        Instagram
                      </a>
                    )}
                    {creator.socialLinks.tiktok && (
                      <a href={creator.socialLinks.tiktok} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M9 1v7a3 3 0 11-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          <path d="M9 4.5c.8.5 1.8.5 2.5 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                        TikTok
                      </a>
                    )}
                    {creator.socialLinks.youtube && (
                      <a href={creator.socialLinks.youtube} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <rect x="1" y="2.5" width="11" height="8" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                          <path d="M5.5 4.5l3.5 2-3.5 2V4.5z" fill="currentColor"/>
                        </svg>
                        YouTube
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Footer */}
        <div className="print:hidden text-center py-4">
          <p className="text-xs text-gray-400">Prepared by Qairos · Confidential</p>
        </div>
      </div>
    </div>
  )
}
