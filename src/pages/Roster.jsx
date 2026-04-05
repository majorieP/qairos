import { useState, useMemo, useEffect, useRef, Fragment } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { creatorPhoto, fmtFollowers } from '../lib/creatorHelpers'
import { uploadImage } from '../lib/supabaseHelpers'

// ── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ['Prospect', 'To Contact', 'Contacted', 'In Discussion', 'Signed', 'With Agency Now', 'Former Client', 'Lost']

const STATUS_CONFIG = {
  'Prospect':        { badgeStyle: { background: '#F3F3F3', color: '#666666' }, dotColor: '#888888', colStyle: { background: '#F3F3F3', borderColor: '#E5E5E5' } },
  'To Contact':      { badgeStyle: { background: '#FFF4EC', color: '#C4622D' }, dotColor: '#C4622D', colStyle: { background: '#FFF4EC', borderColor: '#FED7AA' } },
  'Contacted':       { badgeStyle: { background: '#EEF4FF', color: '#2D5BE3' }, dotColor: '#2D5BE3', colStyle: { background: '#EEF4FF', borderColor: '#BFDBFE' } },
  'In Discussion':   { badgeStyle: { background: '#EEF4FF', color: '#2D5BE3' }, dotColor: '#2D5BE3', colStyle: { background: '#EEF4FF', borderColor: '#BFDBFE' } },
  'Signed':          { badgeStyle: { background: '#EDFAF3', color: '#1A7A4A' }, dotColor: '#1A7A4A', colStyle: { background: '#EDFAF3', borderColor: '#BBF7D0' } },
  'With Agency Now': { badgeStyle: { background: '#EDFAF3', color: '#1A7A4A' }, dotColor: '#1A7A4A', colStyle: { background: '#EDFAF3', borderColor: '#BBF7D0' } },
  'Former Client':   { badgeStyle: { background: '#F3F3F3', color: '#666666' }, dotColor: '#888888', colStyle: { background: '#F3F3F3', borderColor: '#E5E5E5' } },
  'Lost':            { badgeStyle: { background: '#FEE2E2', color: '#DC2626' }, dotColor: '#DC2626', colStyle: { background: '#FEE2E2', borderColor: '#FECACA' } },
}

const NICHES = ['Fashion', 'Beauty', 'Lifestyle', 'Travel', 'Fitness', 'Tech', 'Food', 'Parenting', 'Entertainment', 'Business', 'Gaming', 'Other']
const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'Pinterest', 'Twitch', 'Other']
const MANAGERS = ['Marjorie A.', 'Devon Park', 'Sienna Moore', 'Rafi Okafor']
const CONTRACT_TYPES = ['Exclusive', 'Non-Exclusive']
const FOLLOWER_RANGES = [
  { label: 'Under 100K',  min: 0,       max: 100000 },
  { label: '100K–500K',   min: 100000,  max: 500000 },
  { label: '500K–1M',     min: 500000,  max: 1000000 },
  { label: '1M+',         min: 1000000, max: Infinity },
]

const PLATFORM_COLORS = {
  Instagram:   { badge: 'bg-pink-50 text-pink-700',          border: 'border-l-pink-400' },
  TikTok:      { badge: 'bg-zinc-900 text-white',             border: 'border-l-zinc-700' },
  YouTube:     { badge: 'bg-red-50 text-red-600',             border: 'border-l-red-400' },
  LinkedIn:    { badge: 'bg-blue-50 text-blue-700',           border: 'border-l-blue-400' },
  'Twitter/X': { badge: 'bg-zinc-900 text-white',             border: 'border-l-zinc-700' },
  Twitter:     { badge: 'bg-gray-100 text-gray-600',          border: 'border-l-gray-400' },
  Pinterest:   { badge: 'bg-red-100 text-red-700',            border: 'border-l-red-500' },
  Twitch:      { badge: 'bg-gray-100 text-gray-600',           border: 'border-l-gray-400' },
  Other:       { badge: 'bg-gray-100 text-gray-600',          border: 'border-l-gray-400' },
}

const PLATFORM_DOT = {
  Instagram:   'bg-pink-500',
  TikTok:      'bg-zinc-900',
  YouTube:     'bg-red-500',
  'Twitter/X': 'bg-zinc-900',
  Pinterest:   'bg-red-600',
  Twitch:      'bg-gray-500',
  Other:       'bg-gray-400',
}

const CHANNEL_COLORS = {
  'IG Reels':            { background: '#F3F3F3', color: '#666666' },
  'IG Stories':          { background: '#F3F3F3', color: '#666666' },
  'IG Posts':            { background: '#F3F3F3', color: '#666666' },
  'IG Lives':            { background: '#F3F3F3', color: '#666666' },
  'TikTok Videos':       { background: '#F3F3F3', color: '#666666' },
  'TikTok Shop':         { background: '#F3F3F3', color: '#666666' },
  'TikTok Lives':        { background: '#F3F3F3', color: '#666666' },
  'YT Integrations':     { background: '#FEE2E2', color: '#DC2626' },
  'YT Shorts':           { background: '#FEE2E2', color: '#DC2626' },
  'YT Dedicated Videos': { background: '#FEE2E2', color: '#DC2626' },
  'YT Vlogs':            { background: '#FFF4EC', color: '#C4622D' },
  'Podcasts':            { background: '#FFF4EC', color: '#C4622D' },
  'Newsletters':         { background: '#EEF4FF', color: '#2D5BE3' },
  'Other':               { background: '#F3F3F3', color: '#666666' },
}

// Maps rate (platform:type) → channel name
const RATE_TYPE_TO_CHANNEL = {
  'Instagram:Story':          'IG Stories',
  'Instagram:Feed Post':      'IG Posts',
  'Instagram:Reel':           'IG Reels',
  'Instagram:Live':           'IG Lives',
  'TikTok:Video':             'TikTok Videos',
  'TikTok:Shop':              'TikTok Shop',
  'TikTok:Live':              'TikTok Lives',
  'TikTok:Series (3 videos)': 'TikTok Videos',
  'YouTube:Integration':      'YT Integrations',
  'YouTube:Dedicated':        'YT Dedicated Videos',
  'YouTube:Shorts':           'YT Shorts',
  'YouTube:Vlog':             'YT Vlogs',
  'Podcast:Episode':          'Podcasts',
}
function rateToChannel(r) {
  return RATE_TYPE_TO_CHANNEL[`${r.platform}:${r.type}`] || r.platform
}

const NICHE_COLORS = {
  Fashion:      { background: '#F3F3F3', color: '#666666' },
  Beauty:       { background: '#F3F3F3', color: '#666666' },
  Lifestyle:    { background: '#F3F3F3', color: '#666666' },
  Travel:       { background: '#EEF4FF', color: '#2D5BE3' },
  Fitness:      { background: '#EDFAF3', color: '#1A7A4A' },
  Tech:         { background: '#EEF4FF', color: '#2D5BE3' },
  Food:         { background: '#FFF4EC', color: '#C4622D' },
  Parenting:    { background: '#EDFAF3', color: '#1A7A4A' },
  Entertainment:{ background: '#FFF4EC', color: '#C4622D' },
  Business:     { background: '#EEF4FF', color: '#2D5BE3' },
  Gaming:       { background: '#F3F3F3', color: '#666666' },
  Other:        { background: '#F3F3F3', color: '#666666' },
}

const NICHE_BANNER = {
  Fashion:      'from-pink-400 to-rose-500',
  Beauty:       'from-rose-400 to-pink-500',
  Lifestyle:    'from-gray-400 to-gray-500',
  Travel:       'from-sky-400 to-blue-500',
  Fitness:      'from-emerald-400 to-teal-500',
  Tech:         'from-gray-500 to-gray-700',
  Food:         'from-amber-400 to-orange-500',
  Parenting:    'from-teal-400 to-cyan-500',
  Entertainment:'from-orange-400 to-red-500',
  Business:     'from-blue-400 to-blue-600',
  Gaming:       'from-gray-600 to-gray-800',
  Other:        'from-gray-400 to-gray-600',
}

const AVATAR_PALETTE = [
  'bg-gray-700', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-teal-500', 'bg-sky-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500',
]

const CREATOR_PHOTOS = {
  1:  'https://randomuser.me/api/portraits/women/12.jpg',
  2:  'https://randomuser.me/api/portraits/men/10.jpg',
  3:  'https://randomuser.me/api/portraits/women/22.jpg',
  4:  'https://randomuser.me/api/portraits/men/20.jpg',
  5:  'https://randomuser.me/api/portraits/women/32.jpg',
  6:  'https://randomuser.me/api/portraits/women/26.jpg',
  7:  'https://randomuser.me/api/portraits/men/15.jpg',
  8:  'https://randomuser.me/api/portraits/women/44.jpg',
  9:  'https://randomuser.me/api/portraits/men/25.jpg',
  10: 'https://randomuser.me/api/portraits/women/8.jpg',
}

const CREATOR_CONTENT = {
  1:  'https://picsum.photos/300/400?random=17',
  2:  'https://picsum.photos/300/400?random=34',
  3:  'https://picsum.photos/300/400?random=51',
  4:  'https://picsum.photos/300/400?random=68',
  5:  'https://picsum.photos/300/400?random=25',
  6:  'https://picsum.photos/300/400?random=42',
  7:  'https://picsum.photos/300/400?random=63',
  8:  'https://picsum.photos/300/400?random=78',
  9:  'https://picsum.photos/300/400?random=91',
  10: 'https://picsum.photos/300/400?random=14',
}

const CREATOR_MOCK_STATS = {
  1:  { likes: '42.1K', comments: '1.2K' },
  2:  { likes: '28.3K', comments: '892' },
  3:  { likes: '95.6K', comments: '3.1K' },
  4:  { likes: '18.2K', comments: '643' },
  5:  { likes: '21.4K', comments: '814' },
  6:  { likes: '48.7K', comments: '1.8K' },
  7:  { likes: '124K',  comments: '8.5K' },
  8:  { likes: '16.8K', comments: '729' },
  9:  { likes: '218K',  comments: '12.4K' },
  10: { likes: '38.2K', comments: '2.1K' },
}

const DEAL_STATUS_COLORS = {
  Negotiation: { background: '#FFF4EC', color: '#C4622D' },
  Signed:      { background: '#EEF4FF', color: '#2D5BE3' },
  Proposal:    { background: '#F3F3F3', color: '#666666' },
  Closed:      { background: '#EDFAF3', color: '#1A7A4A' },
}

const CAMPAIGN_STATUS_COLORS = {
  Upcoming: { background: '#EDFAF3', color: '#1A7A4A' },
  Planning: { background: '#F3F3F3', color: '#666666' },
  Live:     { background: '#EEF4FF', color: '#2D5BE3' },
  Complete: { background: '#F3F3F3', color: '#666666' },
}

// ── Mock Data ────────────────────────────────────────────────────────────────

export const clientsData = [
  {
    id: 1,
    name: 'Sofia Chen',
    handle: '@sofiac',
    email: 'sofia@sofiacreates.com',
    phone: '+1 (213) 555-0192',
    location: 'Los Angeles, CA',
    bio: 'Top beauty creator specializing in skincare reviews, GRWM content, and brand partnerships. Known for authentic storytelling and highly engaged audiences.',
    primaryPlatform: 'Instagram',
    niches: ['Beauty', 'Lifestyle'],
    contractType: 'Exclusive',
    commissionRate: 15,
    status: 'Signed',
    assignedManager: 'Marjorie A.',
    signedDate: '2023-03-14',
    notes: 'Prefers email communication. Negotiation window: Q1 only.',
    socialLinks: { instagram: 'https://instagram.com/sofiac', tiktok: 'https://tiktok.com/@sofiac_beauty', youtube: 'https://youtube.com/@SofiaChenBeauty' },
    platforms: [
      { name: 'Instagram', handle: '@sofiac',          followers: '2.4M',  followersNum: 2400000, engagement: 4.2, avgViews: '180K' },
      { name: 'TikTok',    handle: '@sofiac_beauty',   followers: '890K',  followersNum: 890000,  engagement: 6.1, avgViews: '520K' },
      { name: 'YouTube',   handle: 'Sofia Chen Beauty',followers: '210K',  followersNum: 210000,  engagement: 3.8, avgViews: '95K' },
    ],
    rates: [
      { id: 1, platform: 'Instagram', type: 'Story',       rate: 500 },
      { id: 2, platform: 'Instagram', type: 'Feed Post',   rate: 1500 },
      { id: 3, platform: 'Instagram', type: 'Reel',        rate: 2000 },
      { id: 4, platform: 'TikTok',    type: 'Video',       rate: 3000 },
      { id: 5, platform: 'YouTube',   type: 'Integration', rate: 5000 },
      { id: 6, platform: 'YouTube',   type: 'Dedicated',   rate: 8000 },
    ],
    activePlatforms: ['Instagram', 'TikTok', 'YouTube'],
    strongestChannels: ['IG Reels', 'TikTok Videos'],
    strongestChannelsNote: "Sofia's beauty GRWM reels consistently outperform on Instagram. Her TikTok skincare videos frequently go viral.",
    deals: [
      { id: 1, brand: 'Luminary Beauty', brandId: 1,    value: '$12,000', status: 'Negotiation', date: 'Mar 2024' },
      { id: 2, brand: 'Glow Cosmetics',  brandId: null, value: '$8,500',  status: 'Signed',      date: 'Jan 2024' },
      { id: 3, brand: 'BeautyLab',       brandId: null, value: '$6,000',  status: 'Closed',      date: 'Oct 2023' },
    ],
    campaigns: [
      { id: 1, name: 'Spring Glow Campaign',   campaignPageId: 1,    platform: 'Instagram', liveDate: 'Apr 15, 2024', status: 'Upcoming' },
      { id: 2, name: 'Summer Skincare Series', campaignPageId: null, platform: 'TikTok',    liveDate: 'Jun 1, 2024',  status: 'Planning' },
    ],
    earnings: { ytd: 42500, commission: 6375, paidOut: 36125 },
  },
  {
    id: 2,
    name: 'Marcus Reid',
    handle: '@marcusreid',
    email: 'marcus@marcusreid.io',
    phone: '+1 (503) 555-0847',
    location: 'Portland, OR',
    bio: 'Fitness educator and endurance athlete documenting training, nutrition, and performance content. Strong with endurance sports audiences and in-depth gear reviews.',
    primaryPlatform: 'YouTube',
    niches: ['Fitness'],
    contractType: 'Non-Exclusive',
    commissionRate: 12,
    status: 'Signed',
    assignedManager: 'Sienna Moore',
    signedDate: '2022-07-03',
    notes: 'Premium partnerships only. Long-form content preferred.',
    socialLinks: { instagram: 'https://instagram.com/marcusreid_fit', tiktok: 'https://tiktok.com/@marcusreid', youtube: 'https://youtube.com/@MarcusReidFitness' },
    platforms: [
      { name: 'Instagram', handle: '@marcusreid_fit',       followers: '420K', followersNum: 420000, engagement: 3.5, avgViews: '85K' },
      { name: 'TikTok',    handle: '@marcusreid',           followers: '310K', followersNum: 310000, engagement: 5.2, avgViews: '210K' },
      { name: 'YouTube',   handle: 'Marcus Reid Fitness',   followers: '890K', followersNum: 890000, engagement: 4.9, avgViews: '340K' },
    ],
    rates: [
      { id: 1, platform: 'Instagram', type: 'Story',       rate: 300 },
      { id: 2, platform: 'Instagram', type: 'Feed Post',   rate: 900 },
      { id: 3, platform: 'TikTok',    type: 'Video',       rate: 1500 },
      { id: 4, platform: 'YouTube',   type: 'Integration', rate: 4500 },
      { id: 5, platform: 'YouTube',   type: 'Dedicated',   rate: 7500 },
    ],
    activePlatforms: ['Instagram', 'TikTok', 'YouTube'],
    strongestChannels: ['YT Dedicated Videos', 'YT Vlogs'],
    strongestChannelsNote: "Marcus's long-form YouTube workouts drive the highest engagement and direct brand conversion for fitness and gear brands.",
    deals: [
      { id: 1, brand: 'Peak Athletics', brandId: 2,    value: '$8,500', status: 'Signed', date: 'Feb 2024' },
      { id: 2, brand: 'RunTech Gear',   brandId: null, value: '$4,200', status: 'Closed', date: 'Nov 2023' },
    ],
    campaigns: [
      { id: 1, name: 'Marathon Season Push', campaignPageId: 2, platform: 'YouTube', liveDate: 'May 5, 2024', status: 'Planning' },
    ],
    earnings: { ytd: 28000, commission: 3360, paidOut: 24640 },
  },
  {
    id: 3,
    name: 'Anika Patel',
    handle: '@anikapatel',
    email: 'anika@anikapatelcreates.com',
    phone: '+1 (512) 555-0293',
    location: 'Austin, TX',
    bio: 'Plant-based food creator and recipe developer producing vibrant cooking content focused on accessible, healthy meals. Strong TikTok presence with a highly engaged community.',
    primaryPlatform: 'TikTok',
    niches: ['Food', 'Lifestyle'],
    contractType: 'Exclusive',
    commissionRate: 15,
    status: 'In Discussion',
    assignedManager: 'Marjorie A.',
    signedDate: '2024-01-18',
    notes: 'Contract renewal pending. Wants exclusivity clause removed.',
    socialLinks: { instagram: 'https://instagram.com/anikapatelcooks', tiktok: 'https://tiktok.com/@anikapatel', youtube: '' },
    platforms: [
      { name: 'Instagram', handle: '@anikapatelcooks', followers: '680K',  followersNum: 680000,  engagement: 5.8, avgViews: '120K' },
      { name: 'TikTok',    handle: '@anikapatel',      followers: '1.1M',  followersNum: 1100000, engagement: 7.3, avgViews: '890K' },
    ],
    rates: [
      { id: 1, platform: 'Instagram', type: 'Story',            rate: 400 },
      { id: 2, platform: 'Instagram', type: 'Reel',             rate: 1800 },
      { id: 3, platform: 'TikTok',    type: 'Video',            rate: 3500 },
      { id: 4, platform: 'TikTok',    type: 'Series (3 videos)',rate: 9000 },
    ],
    activePlatforms: ['Instagram', 'TikTok'],
    strongestChannels: ['TikTok Videos', 'TikTok Shop'],
    strongestChannelsNote: "Anika's TikTok recipe videos regularly hit 1M+ views. TikTok Shop integrations convert exceptionally well for food brands.",
    deals: [
      { id: 1, brand: 'Verdant Foods', brandId: 3,    value: '$5,200', status: 'Proposal', date: 'Mar 2024' },
      { id: 2, brand: 'HarvestCo',     brandId: null, value: '$3,800', status: 'Signed',   date: 'Feb 2024' },
    ],
    campaigns: [
      { id: 1, name: 'Spring Harvest Collection', campaignPageId: 3, platform: 'TikTok', liveDate: 'Apr 28, 2024', status: 'Upcoming' },
    ],
    earnings: { ytd: 18500, commission: 2775, paidOut: 15725 },
  },
  {
    id: 4,
    name: 'James Ortiz',
    handle: '@jamesortiz',
    email: 'james@jortiztech.com',
    phone: '+1 (415) 555-0741',
    location: 'San Francisco, CA',
    bio: 'Consumer tech reviewer and software analyst specializing in deep-dive product reviews, unboxings, and productivity workflows.',
    primaryPlatform: 'YouTube',
    niches: ['Tech'],
    contractType: 'Non-Exclusive',
    commissionRate: 10,
    status: 'Former Client',
    assignedManager: 'Rafi Okafor',
    signedDate: '2021-09-09',
    notes: 'Contract ended Jan 2024. Good terms — potential re-sign in H2.',
    socialLinks: { instagram: 'https://instagram.com/jortiz_tech', tiktok: '', youtube: 'https://youtube.com/@JamesOrtizTech' },
    platforms: [
      { name: 'Instagram', handle: '@jortiz_tech',     followers: '98K',  followersNum: 98000,  engagement: 2.1, avgViews: '22K' },
      { name: 'YouTube',   handle: 'James Ortiz Tech', followers: '450K', followersNum: 450000, engagement: 4.4, avgViews: '185K' },
    ],
    rates: [
      { id: 1, platform: 'Instagram', type: 'Story',       rate: 200 },
      { id: 2, platform: 'Instagram', type: 'Feed Post',   rate: 600 },
      { id: 3, platform: 'YouTube',   type: 'Integration', rate: 4000 },
      { id: 4, platform: 'YouTube',   type: 'Dedicated',   rate: 9000 },
    ],
    activePlatforms: ['Instagram', 'YouTube'],
    strongestChannels: ['YT Dedicated Videos', 'YT Integrations'],
    strongestChannelsNote: "James's deep-dive tech reviews drive strong affiliate conversions. Dedicated videos consistently outperform for tech brand sponsorships.",
    deals: [
      { id: 1, brand: 'TechFlow', brandId: 4,    value: '$18,000', status: 'Closed', date: 'Jan 2024' },
      { id: 2, brand: 'NovaPad', brandId: null, value: '$9,500',  status: 'Closed', date: 'Sep 2023' },
    ],
    campaigns: [],
    earnings: { ytd: 9500, commission: 950, paidOut: 8550 },
  },
  {
    id: 5,
    name: 'Lily Nakamura',
    handle: '@lily.nkm',
    email: 'lily@lilynkm.com',
    phone: '+1 (646) 555-0384',
    location: 'New York, NY',
    bio: 'Luxury travel photographer documenting premium destinations, boutique hotels, and cultural experiences through stunning visual content.',
    primaryPlatform: 'Instagram',
    niches: ['Travel', 'Lifestyle'],
    contractType: 'Non-Exclusive',
    commissionRate: 12,
    status: 'Prospect',
    assignedManager: 'Marjorie A.',
    signedDate: '',
    notes: 'Referred by Sofia Chen. Has existing brand relationships — needs careful onboarding.',
    socialLinks: { instagram: 'https://instagram.com/lily.nkm', tiktok: 'https://tiktok.com/@lily.travels', youtube: '' },
    platforms: [
      { name: 'Instagram', handle: '@lily.nkm',    followers: '780K', followersNum: 780000, engagement: 3.9, avgViews: '95K' },
      { name: 'TikTok',    handle: '@lily.travels', followers: '145K', followersNum: 145000, engagement: 4.7, avgViews: '78K' },
    ],
    rates: [
      { id: 1, platform: 'Instagram', type: 'Story',     rate: 350 },
      { id: 2, platform: 'Instagram', type: 'Feed Post', rate: 1200 },
      { id: 3, platform: 'Instagram', type: 'Reel',      rate: 2500 },
      { id: 4, platform: 'TikTok',    type: 'Video',     rate: 1800 },
    ],
    activePlatforms: ['Instagram', 'TikTok'],
    strongestChannels: ['IG Posts', 'IG Reels'],
    strongestChannelsNote: "Lily's travel photography excels on Instagram. Static posts and Reels showcasing destinations and boutique hotels perform best.",
    deals: [], campaigns: [],
    earnings: { ytd: 0, commission: 0, paidOut: 0 },
  },
  {
    id: 6,
    name: 'Zoe Martinez',
    handle: '@zoestyle',
    email: 'zoe@zoestyle.co',
    phone: '+1 (305) 555-0619',
    location: 'Miami, FL',
    bio: 'Fashion and lifestyle creator known for her bold aesthetic, OOTDs, and designer lookbooks. Strong engagement with a 18–34 female demographic.',
    primaryPlatform: 'Instagram',
    niches: ['Fashion', 'Beauty'],
    contractType: 'Exclusive',
    commissionRate: 15,
    status: 'To Contact',
    assignedManager: 'Devon Park',
    signedDate: '',
    notes: 'Warm lead from Glossy Media conference. Reach out by end of March.',
    socialLinks: { instagram: 'https://instagram.com/zoestyle', tiktok: 'https://tiktok.com/@zoestyle', youtube: '' },
    platforms: [
      { name: 'Instagram', handle: '@zoestyle', followers: '520K', followersNum: 520000, engagement: 4.8, avgViews: '110K' },
      { name: 'TikTok',    handle: '@zoestyle', followers: '280K', followersNum: 280000, engagement: 6.2, avgViews: '340K' },
    ],
    activePlatforms: ['Instagram', 'TikTok'],
    strongestChannels: ['IG Reels', 'TikTok Videos'],
    strongestChannelsNote: "Zoe's OOTDs and designer lookbooks drive high engagement on both platforms. TikTok outfit reveals perform exceptionally.",
    rates: [], deals: [], campaigns: [],
    earnings: { ytd: 0, commission: 0, paidOut: 0 },
  },
  {
    id: 7,
    name: 'Ryan Thompson',
    handle: '@rthompson',
    email: 'ryan@rthompsoncreates.com',
    phone: '+1 (323) 555-0156',
    location: 'Los Angeles, CA',
    bio: 'Viral entertainment creator and comedian with a knack for trending content. Known for sketch comedy, reaction videos, and celebrity collaborations.',
    primaryPlatform: 'YouTube',
    niches: ['Entertainment'],
    contractType: 'Non-Exclusive',
    commissionRate: 12,
    status: 'Contacted',
    assignedManager: 'Sienna Moore',
    signedDate: '',
    notes: 'Initial call Mar 10. Interested but wants to review contract terms.',
    socialLinks: { instagram: 'https://instagram.com/rthompson', tiktok: 'https://tiktok.com/@rthompson', youtube: 'https://youtube.com/@RyanThompsonLive' },
    platforms: [
      { name: 'YouTube',   handle: '@RyanThompsonLive', followers: '1.2M', followersNum: 1200000, engagement: 5.6, avgViews: '820K' },
      { name: 'TikTok',    handle: '@rthompson',        followers: '890K', followersNum: 890000,  engagement: 8.1, avgViews: '1.2M' },
      { name: 'Instagram', handle: '@rthompson',        followers: '340K', followersNum: 340000,  engagement: 3.2, avgViews: '65K' },
    ],
    activePlatforms: ['YouTube', 'TikTok', 'Instagram'],
    strongestChannels: ['TikTok Videos', 'YT Vlogs'],
    strongestChannelsNote: "Ryan's comedy sketches go viral consistently on TikTok. YouTube vlogs attract diverse brand partnership audiences.",
    rates: [], deals: [], campaigns: [],
    earnings: { ytd: 0, commission: 0, paidOut: 0 },
  },
  {
    id: 8,
    name: 'Priya Sharma',
    handle: '@priyasharma',
    email: 'priya@priyasharma.biz',
    phone: '+1 (408) 555-0922',
    location: 'San Jose, CA',
    bio: 'Business and entrepreneurship educator sharing startup strategy, personal finance, and leadership content. Strong LinkedIn presence among professional audiences.',
    primaryPlatform: 'LinkedIn',
    niches: ['Business', 'Lifestyle'],
    contractType: 'Non-Exclusive',
    commissionRate: 10,
    status: 'With Agency Now',
    assignedManager: 'Rafi Okafor',
    signedDate: '2023-06-01',
    notes: 'Currently with WME for speaking engagements. Our scope is digital brand deals only.',
    socialLinks: { instagram: '', tiktok: '', youtube: 'https://youtube.com/@PriyaSharmaTV' },
    platforms: [
      { name: 'LinkedIn', handle: 'Priya Sharma',      followers: '380K', followersNum: 380000, engagement: 6.4, avgViews: '95K' },
      { name: 'YouTube',  handle: '@PriyaSharmaTV',    followers: '220K', followersNum: 220000, engagement: 4.1, avgViews: '78K' },
    ],
    rates: [
      { id: 1, platform: 'LinkedIn', type: 'Post',               rate: 1200 },
      { id: 2, platform: 'LinkedIn', type: 'Newsletter Mention', rate: 800 },
      { id: 3, platform: 'YouTube',  type: 'Integration',        rate: 3500 },
    ],
    activePlatforms: ['YouTube', 'Other'],
    strongestChannels: ['YT Dedicated Videos', 'Newsletters'],
    strongestChannelsNote: "Priya's YouTube business strategy content and LinkedIn newsletter reach high-intent professional audiences with strong brand affinity.",
    deals: [
      { id: 1, brand: 'FinanceFirst', brandId: null, value: '$6,000', status: 'Closed', date: 'Dec 2023' },
    ],
    campaigns: [],
    earnings: { ytd: 6000, commission: 600, paidOut: 5400 },
  },
  {
    id: 9,
    name: 'Tyler Brooks',
    handle: '@tylerplays',
    email: 'tyler@tylerbrooks.gg',
    phone: '+1 (512) 555-0483',
    location: 'Austin, TX',
    bio: 'Top-tier gaming creator and esports personality with massive reach across YouTube and TikTok. Specializes in FPS content, game reviews, and live tournament coverage.',
    primaryPlatform: 'YouTube',
    niches: ['Gaming', 'Entertainment'],
    contractType: 'Exclusive',
    commissionRate: 20,
    status: 'Lost',
    assignedManager: 'Devon Park',
    signedDate: '',
    notes: 'Went with Loaded Agency. High potential — revisit in 6 months.',
    socialLinks: { instagram: 'https://instagram.com/tylerplays', tiktok: 'https://tiktok.com/@tylerplays', youtube: 'https://youtube.com/@TylerBrooksGG' },
    platforms: [
      { name: 'YouTube',   handle: '@TylerBrooksGG', followers: '2.1M', followersNum: 2100000, engagement: 4.7, avgViews: '1.4M' },
      { name: 'TikTok',    handle: '@tylerplays',    followers: '1.4M', followersNum: 1400000, engagement: 7.2, avgViews: '2.1M' },
      { name: 'Instagram', handle: '@tylerplays',    followers: '480K', followersNum: 480000,  engagement: 2.8, avgViews: '92K' },
    ],
    activePlatforms: ['YouTube', 'TikTok', 'Instagram'],
    strongestChannels: ['YT Dedicated Videos', 'TikTok Videos'],
    strongestChannelsNote: "Tyler's YouTube gaming content leads in watchtime. TikTok gameplay clips go viral frequently with exceptional engagement rates.",
    rates: [], deals: [], campaigns: [],
    earnings: { ytd: 0, commission: 0, paidOut: 0 },
  },
  {
    id: 10,
    name: 'Emma Walsh',
    handle: '@emmawelsh',
    email: 'emma@emmawalsh.co',
    phone: '+1 (617) 555-0371',
    location: 'Boston, MA',
    bio: 'Parenting and lifestyle creator sharing honest, humor-forward content about motherhood, family travel, and intentional living. Authentic voice and highly loyal community.',
    primaryPlatform: 'Instagram',
    niches: ['Parenting', 'Lifestyle'],
    contractType: 'Non-Exclusive',
    commissionRate: 12,
    status: 'In Discussion',
    assignedManager: 'Sienna Moore',
    signedDate: '',
    notes: 'Negotiating terms. Interested in long-term brand partnerships.',
    socialLinks: { instagram: 'https://instagram.com/emmawelsh', tiktok: 'https://tiktok.com/@emmawelsh', youtube: '' },
    platforms: [
      { name: 'Instagram', handle: '@emmawelsh', followers: '345K', followersNum: 345000, engagement: 6.1, avgViews: '88K' },
      { name: 'TikTok',    handle: '@emmawelsh', followers: '192K', followersNum: 192000, engagement: 7.8, avgViews: '310K' },
    ],
    rates: [
      { id: 1, platform: 'Instagram', type: 'Story', rate: 250 },
      { id: 2, platform: 'Instagram', type: 'Reel',  rate: 1500 },
      { id: 3, platform: 'TikTok',    type: 'Video', rate: 2000 },
    ],
    activePlatforms: ['Instagram', 'TikTok'],
    strongestChannels: ['IG Reels', 'TikTok Videos'],
    strongestChannelsNote: "Emma's authentic parenting content resonates strongly on Reels and TikTok, with humor-forward videos generating high saves and shares.",
    deals: [], campaigns: [],
    earnings: { ytd: 0, commission: 0, paidOut: 0 },
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function avatarBg(id) {
  return AVATAR_PALETTE[(id - 1) % AVATAR_PALETTE.length]
}

function fmt(n) {
  return n === 0 ? '$0' : '$' + n.toLocaleString()
}

// fmtFollowers now lives in lib/creatorHelpers.js — re-export for local compat.
const fmtNum = fmtFollowers

// creatorPhoto now lives in lib/creatorHelpers.js — thin wrapper.
function clientPhoto(client) {
  return creatorPhoto(client)
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function primaryPlatformData(client) {
  return client.platforms.find(p => p.name === client.primaryPlatform)
}

function primaryFollowers(client) {
  // Single source of truth: format the numeric followersNum using fmtFollowers.
  return fmtFollowers(primaryPlatformData(client)?.followersNum)
}

function primaryFollowersNum(client) {
  return primaryPlatformData(client)?.followersNum ?? 0
}

function primaryEngagement(client) {
  return primaryPlatformData(client)?.engagement ?? 0
}

function groupClients(clients, groupBy) {
  if (!groupBy) return [{ key: 'all', label: null, items: clients }]
  const keys = groupBy === 'status' ? STATUSES
    : groupBy === 'platform' ? PLATFORMS
    : groupBy === 'manager' ? MANAGERS
    : NICHES
  const map = {}
  clients.forEach(c => {
    const vals = groupBy === 'niche' ? c.niches : [c[groupBy === 'manager' ? 'assignedManager' : groupBy === 'platform' ? 'primaryPlatform' : 'status']]
    vals.forEach(v => {
      if (!map[v]) map[v] = []
      map[v].push(c)
    })
  })
  return keys.filter(k => map[k]?.length).map(k => ({ key: k, label: k, items: map[k] }))
}

// ── Shared Components ────────────────────────────────────────────────────────

function Badge({ children, className, style }) {
  return (
    <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${className ?? ''}`} style={style}>
      {children}
    </span>
  )
}

function Avatar({ client, size = 'md' }) {
  const pxMap = { xs: 28, sm: 32, md: 40, lg: 56, xl: 80 }
  const px = pxMap[size] || 40
  return (
    <img
      src={clientPhoto(client)}
      alt={client.name}
      style={{ width: px, height: px, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  )
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { badgeStyle: { background: '#F3F3F3', color: '#666666' } }
  return <Badge style={cfg.badgeStyle}>{status}</Badge>
}

const PLATFORM_TEXT_COLORS = {
  Instagram:   '#D6185D',
  TikTok:      '#111111',
  YouTube:     '#CC0000',
  'Twitter/X': '#111111',
  LinkedIn:    '#0A66C2',
  Pinterest:   '#E60023',
  Twitch:      '#6441A4',
  Other:       '#666666',
}
const PLATFORM_BORDER_COLORS = {
  Instagram:   '#FBCFE8',
  TikTok:      '#E5E5E5',
  YouTube:     '#FECACA',
  'Twitter/X': '#E5E5E5',
  LinkedIn:    '#BFDBFE',
  Pinterest:   '#FECACA',
  Twitch:      '#DDD6FE',
  Other:       '#E5E5E5',
}

function PlatformBadge({ platform }) {
  const color  = PLATFORM_TEXT_COLORS[platform]  ?? '#666666'
  const border = PLATFORM_BORDER_COLORS[platform] ?? '#E5E5E5'
  return (
    <span style={{ display: 'inline-block', fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: '#fff', border: `1px solid ${border}`, color, whiteSpace: 'nowrap' }}>
      {platform}
    </span>
  )
}

function NicheTag({ niche }) {
  return (
    <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: '#F5F5F5', color: '#666666', whiteSpace: 'nowrap' }}>
      {niche}
    </span>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-8 pl-2.5 pr-7 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
    >
      <option value="">{label}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function Section({ title, action, noPadding, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {action && <div>{action}</div>}
      </div>
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  )
}

function EmptyState({ message, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <p className="text-sm text-gray-400">{message}</p>
      {sub && <p className="text-xs text-gray-300 mt-0.5">{sub}</p>}
    </div>
  )
}

function GroupHeader({ label, count }) {
  return (
    <tr>
      <td colSpan={20} style={{ padding: '8px 16px', background: '#FAFAFA', borderTop: '1px solid #EEEEEE', borderBottom: '1px solid #EEEEEE' }}>
        <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 600, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ marginLeft: 6, fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, color: '#BBBBBB' }}>({count})</span>
      </td>
    </tr>
  )
}

// ── Views ────────────────────────────────────────────────────────────────────

function TableView({ clients, groupBy, onSelect }) {
  const groups = groupClients(clients, groupBy)
  return (
    <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 12, overflow: 'hidden' }}>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Inter", system-ui, sans-serif' }}>
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #EEEEEE' }}>
              {['Client', 'Handle', 'Platform', 'Followers', 'Eng %', 'Niche', 'Status', 'Contract', 'Commission', 'Manager', 'Signed', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <Fragment key={group.key}>
                {group.label && <GroupHeader label={group.label} count={group.items.length} />}
                {group.items.map((client, i) => (
                  <tr
                    key={client.id}
                    onClick={() => onSelect(client)}
                    style={{ borderBottom: '1px solid #EEEEEE', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={clientPhoto(client)} alt={client.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        <span style={{ fontWeight: 500, fontSize: 13, color: '#111111', whiteSpace: 'nowrap' }}>{client.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#888888', whiteSpace: 'nowrap' }}>{client.handle}</td>
                    <td style={{ padding: '10px 14px' }}><PlatformBadge platform={client.primaryPlatform} /></td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#444444', whiteSpace: 'nowrap' }}>{primaryFollowers(client)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#444444' }}>{primaryEngagement(client)}%</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {client.niches.slice(0, 2).map(n => <NicheTag key={n} niche={n} />)}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><StatusBadge status={client.status} /></td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#666666', whiteSpace: 'nowrap' }}>{client.contractType}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#666666' }}>{client.commissionRate}%</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#666666', whiteSpace: 'nowrap' }}>{client.assignedManager}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#888888', whiteSpace: 'nowrap' }}>{fmtDate(client.signedDate)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: '#CCCCCC', display: 'block' }}>
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {clients.length === 0 && (
        <div style={{ padding: '48px 20px', textAlign: 'center', fontSize: 13, color: '#AAAAAA', fontFamily: '"Inter", system-ui, sans-serif' }}>No clients match the current filters.</div>
      )}
    </div>
  )
}

const KANBAN_ACCENT = {
  'Prospect':        '#E5E5E5',
  'To Contact':      '#FDE68A',
  'Contacted':       '#BFDBFE',
  'In Discussion':   '#C7D2FE',
  'Signed':          '#BBF7D0',
  'With Agency Now': '#BBF7D0',
  'Former Client':   '#E5E5E5',
  'Lost':            '#FECACA',
}

function KanbanView({ clients, onSelect }) {
  return (
    <div className="overflow-x-auto pb-4">
      <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
        {STATUSES.map(status => {
          const cards = clients.filter(c => c.status === status)
          const accent = KANBAN_ACCENT[status] ?? '#E5E5E5'
          return (
            <div key={status} style={{ width: 232, flexShrink: 0 }}>
              {/* Column header */}
              <div style={{ background: '#FAFAFA', border: '1px solid #EEEEEE', borderTop: `2px solid ${accent}`, borderRadius: 10, padding: '10px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#333333' }}>{status}</span>
                <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 500, color: '#999999', background: '#EEEEEE', borderRadius: 10, padding: '1px 7px' }}>{cards.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cards.map(client => (
                  <div
                    key={client.id}
                    onClick={() => onSelect(client)}
                    style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <img src={clientPhoto(client)} alt={client.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#111111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</p>
                        <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, color: '#AAAAAA', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.handle}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <PlatformBadge platform={client.primaryPlatform} />
                      <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 12, color: '#555555', fontWeight: 500 }}>{primaryFollowers(client)}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {client.niches.slice(0, 2).map(n => <NicheTag key={n} niche={n} />)}
                    </div>
                    <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, color: '#BBBBBB', margin: 0 }}>{client.assignedManager}</p>
                  </div>
                ))}
                {cards.length === 0 && (
                  <div style={{ border: '1.5px dashed #EEEEEE', borderRadius: 12, padding: '24px 0', textAlign: 'center', fontFamily: '"Inter", system-ui, sans-serif', fontSize: 12, color: '#CCCCCC' }}>
                    No clients
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GalleryCard({ client, onSelect }) {
  const totalFollowers = client.platforms.reduce((s, p) => s + (p.followersNum || 0), 0)
  const largestPlatform = client.platforms.reduce((max, p) => (!max || p.followersNum > max.followersNum) ? p : max, null)
  const photoUrl = creatorPhoto(client)
  const contentUrl = CREATOR_CONTENT[client.id] || `https://picsum.photos/300/400?random=${client.id * 11}`
  const mockStats = CREATOR_MOCK_STATS[client.id] || { likes: '—', comments: '—' }

  return (
    <div
      onClick={() => onSelect(client)}
      style={{
        display: 'flex',
        background: '#fff',
        border: '1px solid #EEEEEE',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: 'none',
        transition: 'box-shadow 0.18s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* ── Left 60% ── */}
      <div style={{ flex: '0 0 60%', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>

        {/* Profile photo + name + niche tags */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <img
            src={photoUrl}
            alt={client.name}
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 2, minWidth: 0 }}>
            <h3 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 700, fontSize: 20, color: '#111111', lineHeight: 1.2, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {client.name}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {client.niches.map(n => (
                <span key={n} style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: '#F3F3F3', color: '#888888', whiteSpace: 'nowrap' }}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="3.5" r="2" stroke="#999999" strokeWidth="1.2"/>
                <path d="M1.5 10.5c0-2.49 2.01-4.5 4.5-4.5s4.5 2.01 4.5 4.5" stroke="#999999" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 400, color: '#999999' }}>Total Audience</span>
            </div>
            <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 15, fontWeight: 600, color: '#111111' }}>{fmtNum(totalFollowers)}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="0.75" y="6.5" width="2.5" height="4.75" rx="0.5" fill="#999999"/>
                <rect x="4.75" y="3.5" width="2.5" height="7.75" rx="0.5" fill="#999999"/>
                <rect x="8.75" y="0.75" width="2.5" height="10.5" rx="0.5" fill="#999999"/>
              </svg>
              <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 400, color: '#999999' }}>Largest Platform</span>
            </div>
            <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 15, fontWeight: 600, color: '#111111' }}>{largestPlatform?.name || '—'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="#999999" strokeWidth="1.2"/>
                <path d="M1.5 6h9" stroke="#999999" strokeWidth="1.2"/>
                <path d="M6 1.5c-1.4 1.6-2 3.1-2 4.5s.6 2.9 2 4.5" stroke="#999999" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M6 1.5c1.4 1.6 2 3.1 2 4.5s-.6 2.9-2 4.5" stroke="#999999" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 400, color: '#999999' }}>Location</span>
            </div>
            <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 15, fontWeight: 600, color: '#111111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.location || '—'}</span>
          </div>
        </div>

        {/* Bio */}
        <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 14, fontWeight: 400, color: '#666666', lineHeight: 1.55, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {client.bio || client.notes || '—'}
        </p>
      </div>

      {/* ── Right 40% ── */}
      <div style={{ flex: '0 0 40%', position: 'relative', overflow: 'hidden', minHeight: 240 }}>
        <img
          src={contentUrl}
          alt="content preview"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.12) 45%, transparent 100%)', pointerEvents: 'none' }} />
        {/* Engagement stats + arrow */}
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 12, fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 500 }}>
              <svg width="13" height="12" viewBox="0 0 13 12" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.5 10.8S1 7.4 1 3.9A2.6 2.6 0 016.5 2.6 2.6 2.6 0 0112 3.9c0 3.5-5.5 6.9-5.5 6.9z"/>
              </svg>
              {mockStats.likes}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 12, fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 500 }}>
              <svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 2a1 1 0 011-1h9a1 1 0 011 1v5.5a1 1 0 01-1 1H7.5L5 10.5V8.5H2a1 1 0 01-1-1V2z" fill="white"/>
              </svg>
              {mockStats.comments}
            </span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onSelect(client) }}
            style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6h7M7 3.5l2.5 2.5L7 8.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function GalleryView({ clients, onSelect }) {
  if (clients.length === 0) {
    return <div className="py-16 text-center text-sm text-gray-400">No clients match the current filters.</div>
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {clients.map(client => (
        <GalleryCard key={client.id} client={client} onSelect={onSelect} />
      ))}
    </div>
  )
}

function ListView({ clients, groupBy, onSelect }) {
  const groups = groupClients(clients, groupBy)
  if (clients.length === 0) {
    return <div className="py-16 text-center text-sm text-gray-400">No clients match the current filters.</div>
  }
  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
      {groups.map(group => (
        <div key={group.key} style={{ marginBottom: 24 }}>
          {group.label && (
            <p style={{ fontSize: 11, fontWeight: 600, color: '#999999', textTransform: 'uppercase',
              letterSpacing: '0.05em', padding: '0 4px', marginBottom: 8 }}>
              {group.label} <span style={{ fontWeight: 400, color: '#BBBBBB' }}>({group.items.length})</span>
            </p>
          )}
          <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 12, overflow: 'hidden' }}>
            {group.items.map((client, idx) => {
              const isLast = idx === group.items.length - 1
              return (
                <ListRow key={client.id} client={client} onSelect={onSelect} isLast={isLast} />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function ListRow({ client, onSelect, isLast }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={() => onSelect(client)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px',
        cursor: 'pointer', background: hovered ? '#FAFAFA' : '#fff',
        borderBottom: isLast ? 'none' : '1px solid #F3F3F3',
        transition: 'background 0.15s',
      }}
    >
      <img
        src={clientPhoto(client)}
        alt={client.name}
        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111111' }}>{client.name}</span>
          <span style={{ fontSize: 12, color: '#AAAAAA' }}>{client.handle}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          <PlatformBadge platform={client.primaryPlatform} />
          <span style={{ fontSize: 12, color: '#888888' }}>{primaryFollowers(client)} followers</span>
          <span style={{ color: '#DDDDDD', fontSize: 12 }}>·</span>
          {client.niches.slice(0, 3).map(n => <NicheTag key={n} niche={n} />)}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <StatusBadge status={client.status} />
        <span style={{ fontSize: 12, color: '#BBBBBB', display: 'none' }} className="lg:block">{client.assignedManager}</span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: hovered ? '#AAAAAA' : '#DDDDDD', transition: 'color 0.15s' }}>
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

// ── Client Profile ────────────────────────────────────────────────────────────

function ClientProfile({ client, onBack, onSave }) {
  const navigate = useNavigate()
  const [rates, setRates] = useState(client.rates)
  const [editRates, setEditRates] = useState(client.rates)
  const [isEditingRates, setIsEditingRates] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ ...client })

  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    setRates(client.rates)
    setEditRates(client.rates)
    setForm({ ...client })
  }, [client])

  const handleSaveRates = () => {
    setRates(editRates)
    setIsEditingRates(false)
    onSave({ ...client, rates: editRates })
  }

  const handleSave = () => {
    onSave({ ...client, ...form })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setForm({ ...client })
    setIsEditing(false)
  }

  const toggleNiche = (niche) => {
    setForm(prev => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter(n => n !== niche)
        : [...prev.niches, niche],
    }))
  }

  const toggleActivePlatform = (p) => {
    setForm(prev => {
      const list = prev.activePlatforms ?? []
      return { ...prev, activePlatforms: list.includes(p) ? list.filter(x => x !== p) : [...list, p] }
    })
  }

  const toggleStrongestChannel = (ch) => {
    setForm(prev => {
      const list = prev.strongestChannels ?? []
      return { ...prev, strongestChannels: list.includes(ch) ? list.filter(x => x !== ch) : [...list, ch] }
    })
  }

  const totalFollowers = client.platforms.reduce((s, p) => s + (p.followersNum || 0), 0)
  const primaryPlatformStat = client.platforms.find(p => p.name === client.primaryPlatform) || client.platforms[0]
  const largestPlatform = client.platforms.reduce((max, p) => (!max || p.followersNum > max.followersNum) ? p : max, null)
  const profilePhoto = creatorPhoto(client)
  const mockStats = CREATOR_MOCK_STATS[client.id] || { likes: '—', comments: '—' }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm mb-6 group transition-colors"
        style={{ color: '#888888', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: '"Inter", system-ui, sans-serif' }}
        onMouseEnter={e => e.currentTarget.style.color = '#111111'}
        onMouseLeave={e => e.currentTarget.style.color = '#888888'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:-translate-x-0.5 transition-transform">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Clients
      </button>

      <div className="space-y-4">

        {/* ── HEADER ── */}
        <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '28px 28px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 24 }}>
              {/* Left: photo + name + badges */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                <img src={profilePhoto} alt={client.name} style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h1 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 700, fontSize: 28, color: '#111111', margin: 0, lineHeight: 1.1 }}>{client.name}</h1>
                    <StatusBadge status={client.status} />
                    <span style={{ fontSize: 11, color: '#BBBBBB', fontFamily: '"Inter", system-ui, sans-serif' }}>{client.contractType}</span>
                  </div>
                  <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 14, color: '#888888', margin: '0 0 12px' }}>{client.handle}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {(client.activePlatforms?.length ? client.activePlatforms : [client.primaryPlatform]).map(p => {
                      const cfg = PLATFORM_COLORS[p] ?? { badge: 'bg-gray-100 text-gray-600' }
                      const dot = PLATFORM_DOT[p] ?? 'bg-gray-400'
                      return (
                        <span key={p} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                          {p}
                        </span>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {client.niches.map(n => (
                      <span key={n} style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: '#F3F3F3', color: '#888888' }}>{n}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Right: edit button + content strip */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14, flexShrink: 0 }}>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ padding: '6px 14px', fontSize: 12, fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 500, border: '1px solid #EEEEEE', borderRadius: 8, color: '#555555', background: '#fff', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >Edit Profile</button>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="group relative overflow-hidden" style={{ width: 120, height: 160, borderRadius: 12, flexShrink: 0 }}>
                      <img src={`https://picsum.photos/120/160?random=${(client.id - 1) * 3 + i + 30}`} alt="content" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1" style={{ background: 'rgba(0,0,0,0.52)' }}>
                        <span style={{ color: '#fff', fontSize: 12, fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 500 }}>♥ {mockStats.likes}</span>
                        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: '"Inter", system-ui, sans-serif' }}>👁 {primaryPlatformStat?.avgViews || '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Divider */}
            <div style={{ borderTop: '1px solid #EEEEEE' }} />
            {/* 4 key stats */}
            <div style={{ display: 'flex', padding: '20px 0 24px', alignItems: 'center' }}>
              {[
                { label: 'Total Audience',  value: fmtNum(totalFollowers) },
                { label: 'Engagement Rate', value: primaryPlatformStat?.engagement ? `${primaryPlatformStat.engagement}%` : '—' },
                { label: 'Largest Platform', value: largestPlatform?.name || '—' },
                { label: 'Location',        value: client.location || '—' },
              ].map((stat, i, arr) => (
                <div key={stat.label} style={{ display: 'flex', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, color: '#999999', margin: '0 0 4px', fontWeight: 400 }}>{stat.label}</p>
                    <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 18, fontWeight: 600, color: '#111111', margin: 0 }}>{stat.value}</p>
                  </div>
                  {i < arr.length - 1 && <div style={{ width: 1, height: 34, background: '#EEEEEE', margin: '0 28px', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BIO + DETAILS ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 14 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEEEEE' }}>
                <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#111111' }}>Bio</span>
              </div>
              <div style={{ padding: 20 }}>
                <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 14, color: '#555555', lineHeight: 1.65, margin: 0 }}>
                  {client.bio || <span style={{ color: '#CCCCCC', fontStyle: 'italic' }}>No bio yet.</span>}
                </p>
                {client.notes && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #F0F0F0' }}>
                    <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 500, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Notes</p>
                    <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 14, color: '#666666', margin: 0 }}>{client.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 14 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEEEEE' }}>
                <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#111111' }}>Details</span>
              </div>
              <div style={{ padding: '4px 20px 16px' }}>
                <dl style={{ margin: 0 }}>
                  {[
                    { label: 'Email',      value: client.email },
                    { label: 'Phone',      value: client.phone },
                    { label: 'Location',   value: client.location },
                    { label: 'Contract',   value: client.contractType },
                    { label: 'Commission', value: client.commissionRate ? `${client.commissionRate}%` : '—' },
                    { label: 'Signed',     value: fmtDate(client.signedDate) },
                    { label: 'Manager',    value: client.assignedManager },
                  ].map((d, i, arr) => (
                    <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid #F5F5F5' : 'none', gap: 8 }}>
                      <dt style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 12, color: '#AAAAAA', fontWeight: 400, flexShrink: 0 }}>{d.label}</dt>
                      <dd style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 12, color: '#111111', fontWeight: 500, margin: 0, textAlign: 'right', wordBreak: 'break-word' }}>{d.value || '—'}</dd>
                    </div>
                  ))}
                  {(client.socialLinks?.instagram || client.socialLinks?.tiktok || client.socialLinks?.youtube) && (
                    <div style={{ paddingTop: 10 }}>
                      <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 500, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Links</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {client.socialLinks.instagram && <a href={client.socialLinks.instagram} target="_blank" rel="noreferrer" style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 12, color: '#555555', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>Instagram ↗</a>}
                        {client.socialLinks.tiktok && <a href={client.socialLinks.tiktok} target="_blank" rel="noreferrer" style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 12, color: '#555555', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>TikTok ↗</a>}
                        {client.socialLinks.youtube && <a href={client.socialLinks.youtube} target="_blank" rel="noreferrer" style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 12, color: '#555555', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>YouTube ↗</a>}
                      </div>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* ── SOCIAL STATS ── */}
        <div className={`grid gap-4 ${client.platforms.length === 1 ? 'grid-cols-1' : client.platforms.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {client.platforms.map(p => {
            const estAvgLikes = fmtNum(Math.round(p.followersNum * (p.engagement / 100) * 0.65))
            return (
              <div key={p.name} style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 14, fontWeight: 600, color: '#111111' }}>{p.name}</span>
                  <PlatformBadge platform={p.name} />
                </div>
                <div style={{ padding: 20 }}>
                  <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 12, color: '#AAAAAA', margin: '0 0 16px' }}>{p.handle}</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Followers',       value: p.followers },
                      { label: 'Engagement Rate', value: `${p.engagement}%` },
                      { label: 'Avg Views',        value: p.avgViews },
                      { label: 'Avg Likes',        value: estAvgLikes },
                    ].map(stat => (
                      <div key={stat.label}>
                        <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, color: '#999999', margin: '0 0 4px', fontWeight: 400 }}>{stat.label}</p>
                        <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 20, fontWeight: 600, color: '#111111', margin: 0 }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── STRONGEST CHANNELS ── */}
        {(client.strongestChannels?.length > 0) && (
          <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 14 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEEEEE' }}>
              <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#111111' }}>Strongest Channels</span>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: client.strongestChannelsNote ? 14 : 0 }}>
                {client.strongestChannels.map(ch => (
                  <span key={ch} style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5, ...(CHANNEL_COLORS[ch] ?? { background: '#F3F3F3', color: '#666666' }) }}>
                    <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor"><path d="M4 0l.93 2.86H8L5.53 4.64 6.47 7.5 4 5.72 1.53 7.5l.94-2.86L0 2.86h3.07z"/></svg>
                    {ch}
                  </span>
                ))}
              </div>
              {client.strongestChannelsNote && (
                <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 14, color: '#666666', lineHeight: 1.6, margin: 0, paddingLeft: 12, borderLeft: '2px solid #EEEEEE' }}>
                  {client.strongestChannelsNote}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── RATE CARD ── */}
        <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#111111' }}>Rate Card</span>
            {isEditingRates ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSaveRates} style={{ padding: '5px 12px', fontSize: 12, fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 500, background: '#111111', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>Save</button>
                <button onClick={() => { setEditRates(rates); setIsEditingRates(false) }} style={{ padding: '5px 12px', fontSize: 12, fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 500, background: '#fff', color: '#666666', border: '1px solid #EEEEEE', borderRadius: 7, cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setIsEditingRates(true)} style={{ fontSize: 12, fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 500, color: '#555555', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>Edit</button>
            )}
          </div>
          {rates.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, color: '#AAAAAA', margin: 0 }}>No rates set</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Inter", system-ui, sans-serif' }}>
              <thead>
                <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #EEEEEE' }}>
                  {['Platform', 'Content Type', 'Rate'].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rates.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < rates.length - 1 ? '1px solid #EEEEEE' : 'none' }}>
                    <td style={{ padding: '12px 20px', fontSize: 14, color: '#555555', fontWeight: 400 }}>{r.platform}</td>
                    <td style={{ padding: '12px 20px', fontSize: 14, color: '#555555', fontWeight: 400 }}>{r.type}</td>
                    <td style={{ padding: '12px 20px' }}>
                      {isEditingRates ? (
                        <input type="number" value={editRates.find(er => er.id === r.id)?.rate ?? ''} onChange={e => setEditRates(prev => prev.map(er => er.id === r.id ? { ...er, rate: Number(e.target.value) } : er))} style={{ width: 100, padding: '4px 8px', fontSize: 13, border: '1px solid #EEEEEE', borderRadius: 6, fontFamily: '"Inter", system-ui, sans-serif', outline: 'none' }} />
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111111' }}>{fmt(r.rate)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── DEALS + CAMPAIGNS ── */}
        <div className="grid grid-cols-2 gap-4">
          {/* Deals — horizontal scroll cards */}
          <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEEEEE' }}>
              <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#111111' }}>Deals ({client.deals.length})</span>
            </div>
            {client.deals.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, color: '#AAAAAA', margin: 0 }}>No deals yet</p>
              </div>
            ) : (
              <div style={{ padding: 16, overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  {client.deals.map(d => (
                    <div key={d.id} style={{ flexShrink: 0, width: 176, border: '1px solid #EEEEEE', borderRadius: 10, padding: 16 }}>
                      <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#111111', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.brandId ? (
                          <button onClick={() => navigate(`/contacts?tab=brands&open=${d.brandId}`)} style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: 13, color: '#111111', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>{d.brand}</button>
                        ) : d.brand}
                      </p>
                      <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 16, fontWeight: 600, color: '#1A7A4A', margin: '0 0 12px' }}>{d.value}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Badge style={DEAL_STATUS_COLORS[d.status] ?? { background: '#F3F3F3', color: '#666666' }}>{d.status}</Badge>
                        <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, color: '#AAAAAA' }}>{d.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Campaigns — compact list */}
          <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEEEEE' }}>
              <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#111111' }}>Campaigns ({client.campaigns.length})</span>
            </div>
            {client.campaigns.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, color: '#AAAAAA', margin: 0 }}>No campaigns</p>
              </div>
            ) : (
              <div style={{ padding: '6px 0' }}>
                {client.campaigns.map((c, i) => (
                  <div key={c.id} style={{ padding: '10px 20px', borderBottom: i < client.campaigns.length - 1 ? '1px solid #F5F5F5' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PlatformBadge platform={c.platform} />
                    <span style={{ flex: 1, fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, color: '#333333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.campaignPageId ? (
                        <button onClick={() => navigate(`/campaigns?open=${c.campaignPageId}`)} style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, color: '#111111', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>{c.name}</button>
                      ) : c.name}
                    </span>
                    <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, color: '#AAAAAA', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.liveDate}</span>
                    <Badge style={CAMPAIGN_STATUS_COLORS[c.status] ?? { background: '#F3F3F3', color: '#666666' }}>{c.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── EARNINGS ── */}
        <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 14 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEEEEE' }}>
            <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#111111' }}>Earnings</span>
          </div>
          <div style={{ padding: 20 }}>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'YTD Revenue',       value: fmt(client.earnings.ytd),        sub: 'Gross across all deals' },
                { label: 'Commission Earned', value: fmt(client.earnings.commission),  sub: `${client.commissionRate}% of revenue` },
                { label: 'Total Paid Out',    value: fmt(client.earnings.paidOut),     sub: 'Net of commission' },
              ].map(m => (
                <div key={m.label} style={{ border: '1px solid #EEEEEE', borderRadius: 10, padding: '20px 22px' }}>
                  <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 400, color: '#999999', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</p>
                  <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 26, fontWeight: 600, color: '#111111', margin: '0 0 4px', lineHeight: 1 }}>{m.value}</p>
                  <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 12, color: '#BBBBBB', margin: 0 }}>{m.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DOCUMENTS ── */}
        <div style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: 14 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#111111' }}>Documents</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 500, color: '#555555', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.background='#F5F5F5'} onMouseLeave={e => e.currentTarget.style.background='none'}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              Upload
            </button>
          </div>
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: '#CCCCCC' }}>
                <path d="M11 2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8L11 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M11 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M7 13h6M7 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 13, color: '#AAAAAA', margin: '0 0 4px', fontWeight: 500 }}>No documents yet</p>
            <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: 12, color: '#CCCCCC', margin: 0 }}>Contracts and files linked to this client will appear here</p>
          </div>
        </div>

      </div>

      {/* Edit Profile Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${isEditing ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={handleCancel}
      />
      <aside className={`fixed right-0 top-0 z-50 w-[460px] bg-white border-l border-gray-200 h-full overflow-y-auto shadow-xl transition-transform duration-300 ease-in-out ${isEditing ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-gray-900">Edit Client</h2>
          <button onClick={handleCancel} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"><CloseIcon /></button>
        </div>
        <div className="p-6 space-y-4">
          <PhotoUpload
            value={form.profilePhoto || form.profile_photo || null}
            onChange={url => setForm(prev => ({ ...prev, profilePhoto: url }))}
          />
          {[
            { label: 'Name',   key: 'name' },
            { label: 'Handle', key: 'handle' },
            { label: 'Email',  key: 'email' },
            { label: 'Phone',  key: 'phone' },
            { label: 'Location', key: 'location' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</label>
              <input
                type="text"
                value={form[key] ?? ''}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          ))}

          {/* Status */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Status</label>
            <select value={form.status ?? ''} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Primary Platform */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Primary Platform</label>
            <select value={form.primaryPlatform ?? ''} onChange={e => setForm(prev => ({ ...prev, primaryPlatform: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Active Platforms */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Platforms</label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map(p => {
                const active = (form.activePlatforms ?? []).includes(p)
                const dot = PLATFORM_DOT[p] ?? 'bg-gray-400'
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleActivePlatform(p)}
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${active ? (PLATFORM_COLORS[p]?.badge ?? 'bg-[#111111] text-white') + ' border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? dot : 'bg-gray-300'}`} />
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Niches */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Niches</label>
            <div className="flex flex-wrap gap-1.5">
              {NICHES.map(n => {
                const active = (form.niches ?? []).includes(n)
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleNiche(n)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${active ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Strongest Channels */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Strongest Channels</label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ALL_CHANNELS.map(ch => {
                const active = (form.strongestChannels ?? []).includes(ch)
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleStrongestChannel(ch)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${active ? 'border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                    style={active ? (CHANNEL_COLORS[ch] ?? { background: '#F3F3F3', color: '#666666' }) : undefined}
                  >
                    {ch}
                  </button>
                )
              })}
            </div>
            <textarea
              value={form.strongestChannelsNote ?? ''}
              onChange={e => setForm(prev => ({ ...prev, strongestChannelsNote: e.target.value }))}
              rows={2}
              placeholder="Why are these the creator's strongest channels?"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
          </div>

          {/* Contract + Commission */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Contract Type</label>
              <select value={form.contractType ?? ''} onChange={e => setForm(prev => ({ ...prev, contractType: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                {CONTRACT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Commission %</label>
              <input type="number" min="0" max="100" value={form.commissionRate ?? ''} onChange={e => setForm(prev => ({ ...prev, commissionRate: Number(e.target.value) }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
          </div>

          {/* Manager + Signed Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Manager</label>
              <select value={form.assignedManager ?? ''} onChange={e => setForm(prev => ({ ...prev, assignedManager: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                {MANAGERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Signed Date</label>
              <input type="date" value={form.signedDate ?? ''} onChange={e => setForm(prev => ({ ...prev, signedDate: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Social Links</label>
            <div className="space-y-2">
              {['instagram', 'tiktok', 'youtube'].map(platform => (
                <div key={platform} className="flex items-center gap-2">
                  <span className="w-16 text-xs text-gray-400 capitalize shrink-0">{platform}</span>
                  <input
                    type="text"
                    placeholder={`https://${platform}.com/...`}
                    value={form.socialLinks?.[platform] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [platform]: e.target.value } }))}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Bio</label>
            <textarea
              value={form.bio ?? ''}
              onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <button onClick={handleSave} className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>Save changes</button>
            <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ── Add Client Modal ──────────────────────────────────────────────────────────

const ALL_CHANNELS = [
  'IG Reels', 'IG Stories', 'IG Posts', 'IG Lives',
  'TikTok Videos', 'TikTok Shop', 'TikTok Lives',
  'YT Integrations', 'YT Shorts', 'YT Dedicated Videos', 'YT Vlogs',
  'Podcasts', 'Newsletters', 'Other',
]
const ADD_PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'Pinterest', 'Twitch', 'Other']
const RATE_TYPES = ['Story', 'Feed Post', 'Reel', 'Live', 'Video', 'Shop', 'Integration', 'Dedicated', 'Shorts', 'Vlog', 'Episode', 'Newsletter Mention', 'Post']

// ── Photo Upload (click or drag-drop) ────────────────────────────────────────
function PhotoUpload({ value, onChange }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please choose an image file'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB'); return }
    setError(null); setBusy(true)
    const { url, error: err } = await uploadImage('creator-photos', file, 'creator')
    setBusy(false)
    if (err) { setError(err); return }
    if (url) onChange(url)
  }

  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Profile Photo</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
        className={`relative flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${dragOver ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
      >
        {value ? (
          <img src={value} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F3F3F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v14M2 9h14" stroke="#AAAAAA" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700">{busy ? 'Uploading…' : value ? 'Photo uploaded' : 'Click or drop an image'}</p>
          <p className="text-[10px] text-gray-400">{value ? 'Click to replace' : 'PNG / JPG, up to 5 MB'}</p>
          {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
        </div>
        {value && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(null); setError(null) }}
            className="p-1 text-gray-400 hover:text-gray-600 shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  )
}

function AddClientModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '', handle: '', email: '', phone: '', location: '', bio: '',
    status: 'Prospect', assignedManager: 'Marjorie A.',
    contractType: 'Non-Exclusive', commissionRate: 20, signedDate: '',
    primaryPlatform: 'Instagram', notes: '',
  })
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [niches, setNiches] = useState([])
  const [channels, setChannels] = useState([])
  const [platforms, setPlatforms] = useState([
    { id: 1, name: 'Instagram', handle: '', followersNum: '', engagement: '', avgViews: '' }
  ])
  const [rates, setRates] = useState([
    { id: 1, platform: 'Instagram', type: 'Story', rate: '' }
  ])
  const [errors, setErrors] = useState({})

  const ch = (field, val) => { setForm(p => ({ ...p, [field]: val })); setErrors(p => ({ ...p, [field]: '' })) }

  const toggleNiche = (n) => setNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  const toggleChannel = (c) => setChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const addPlatform = () => setPlatforms(p => [...p, { id: Date.now(), name: 'Instagram', handle: '', followersNum: '', engagement: '', avgViews: '' }])
  const removePlatform = (id) => setPlatforms(p => p.filter(r => r.id !== id))
  const updatePlatform = (id, field, val) => setPlatforms(p => p.map(r => r.id === id ? { ...r, [field]: val } : r))

  const addRate = () => setRates(p => [...p, { id: Date.now(), platform: 'Instagram', type: 'Story', rate: '' }])
  const removeRate = (id) => setRates(p => p.filter(r => r.id !== id))
  const updateRate = (id, field, val) => setRates(p => p.map(r => r.id === id ? { ...r, [field]: val } : r))

  const inputCls = (field) => `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  const handleSubmit = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = true
    if (!form.handle.trim()) errs.handle = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    const id = Date.now()
    const newClient = {
      ...form,
      id,
      profilePhoto,
      niches: niches.length ? niches : ['Other'],
      strongestChannels: channels,
      platforms: platforms.filter(p => p.name).map(p => {
        const num = Number(p.followersNum) || 0
        return {
          name: p.name, handle: p.handle,
          // Derive the display string from the numeric value so there's
          // a single source of truth.
          followers: num ? fmtFollowers(num) : '—',
          followersNum: num,
          engagement: Number(p.engagement) || 0,
          avgViews: p.avgViews || '—',
        }
      }),
      rates: rates.filter(r => r.rate).map((r, i) => ({ id: i + 1, platform: r.platform, type: r.type, rate: Number(r.rate) })),
      deals: [], campaigns: [],
      earnings: { ytd: 0, commission: 0, paidOut: 0 },
      socialLinks: {},
      commissionRate: Number(form.commissionRate) || 20,
    }
    onAdd(newClient)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />
      <aside className="relative z-10 ml-auto w-[600px] h-full bg-white border-l border-gray-200 overflow-y-auto shadow-2xl flex flex-col">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Add Client</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">

          {/* Profile Photo */}
          <section>
            <PhotoUpload value={profilePhoto} onChange={setProfilePhoto} />
          </section>

          {/* Basic Info */}
          <section>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Basic Info</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Full Name <span className="text-red-400">*</span></label>
                  <input value={form.name} onChange={e => ch('name', e.target.value)} placeholder="Sofia Chen" className={inputCls('name')} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">Name is required</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Handle <span className="text-red-400">*</span></label>
                  <input value={form.handle} onChange={e => ch('handle', e.target.value)} placeholder="@sofiac" className={inputCls('handle')} />
                  {errors.handle && <p className="text-xs text-red-500 mt-1">Handle is required</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => ch('email', e.target.value)} placeholder="sofia@email.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Phone</label>
                  <input value={form.phone} onChange={e => ch('phone', e.target.value)} placeholder="+1 (555) 000-0000" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Location</label>
                <input value={form.location} onChange={e => ch('location', e.target.value)} placeholder="Los Angeles, CA" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Bio</label>
                <textarea value={form.bio} onChange={e => ch('bio', e.target.value)} rows={3} placeholder="Short bio about the creator..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
              </div>
            </div>
          </section>

          {/* Agency Info */}
          <section>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Agency Details</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Status</label>
                  <select value={form.status} onChange={e => ch('status', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Manager</label>
                  <select value={form.assignedManager} onChange={e => ch('assignedManager', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                    {MANAGERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Contract Type</label>
                  <select value={form.contractType} onChange={e => ch('contractType', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                    {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Commission (%)</label>
                  <input type="number" value={form.commissionRate} onChange={e => ch('commissionRate', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Signed Date</label>
                  <input type="date" value={form.signedDate} onChange={e => ch('signedDate', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
                </div>
              </div>
            </div>
          </section>

          {/* Niches */}
          <section>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Niches</p>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(n => (
                <button key={n} type="button" onClick={() => toggleNiche(n)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${niches.includes(n) ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  {n}
                </button>
              ))}
            </div>
          </section>

          {/* Platforms */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Platforms</p>
              <div className="flex items-center gap-3">
                <div>
                  <select value={form.primaryPlatform} onChange={e => ch('primaryPlatform', e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300">
                    {ADD_PLATFORMS.map(p => <option key={p} value={p}>{p} (Primary)</option>)}
                  </select>
                </div>
                <button type="button" onClick={addPlatform} className="text-xs text-[#111111] hover:opacity-70 font-medium">+ Add</button>
              </div>
            </div>
            <div className="space-y-3">
              {platforms.map(p => (
                <div key={p.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select value={p.name} onChange={e => updatePlatform(p.id, 'name', e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 flex-1">
                      {ADD_PLATFORMS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <input value={p.handle} onChange={e => updatePlatform(p.id, 'handle', e.target.value)} placeholder="@handle" className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white" />
                    {platforms.length > 1 && (
                      <button type="button" onClick={() => removePlatform(p.id)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-400 uppercase tracking-wide mb-1">Followers</label>
                      <input type="number" value={p.followersNum} onChange={e => updatePlatform(p.id, 'followersNum', e.target.value)} placeholder="2400000" className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white" />
                      {p.followersNum && <p className="text-[9px] text-gray-400 mt-0.5">= {fmtFollowers(p.followersNum)}</p>}
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 uppercase tracking-wide mb-1">Engagement %</label>
                      <input type="number" step="0.1" value={p.engagement} onChange={e => updatePlatform(p.id, 'engagement', e.target.value)} placeholder="4.2" className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 uppercase tracking-wide mb-1">Avg Views</label>
                      <input value={p.avgViews} onChange={e => updatePlatform(p.id, 'avgViews', e.target.value)} placeholder="180K" className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Strongest Channels */}
          <section>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Strongest Channels</p>
            <div className="flex flex-wrap gap-2">
              {ALL_CHANNELS.map(c => (
                <button key={c} type="button" onClick={() => toggleChannel(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${channels.includes(c) ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  {c}
                </button>
              ))}
            </div>
          </section>

          {/* Rate Card */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Rate Card</p>
              <button type="button" onClick={addRate} className="text-xs text-[#111111] hover:opacity-70 font-medium">+ Add rate</button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['Platform', 'Content Type', 'Rate ($)', ''].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rates.map(r => (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="px-2 py-1.5">
                        <select value={r.platform} onChange={e => updateRate(r.id, 'platform', e.target.value)} className="w-full text-xs border-none bg-transparent focus:outline-none">
                          {ADD_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={r.type} onChange={e => updateRate(r.id, 'type', e.target.value)} className="w-full text-xs border-none bg-transparent focus:outline-none">
                          {RATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={r.rate} onChange={e => updateRate(r.id, 'rate', e.target.value)} placeholder="0" className="w-20 text-xs border-none bg-transparent focus:outline-none" />
                      </td>
                      <td className="px-2 py-1.5">
                        {rates.length > 1 && (
                          <button type="button" onClick={() => removeRate(r.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Notes */}
          <section>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Notes</p>
            <textarea value={form.notes} onChange={e => ch('notes', e.target.value)} rows={3} placeholder="Internal notes..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
          </section>

          <div className="flex gap-2 pt-2 border-t border-gray-100 sticky bottom-0 bg-white pb-2">
            <button onClick={handleSubmit} className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>Add Client</button>
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Roster() {
  const [searchParams] = useSearchParams()
  const openId = parseInt(searchParams.get('open'))

  const [clients, setClients] = useState(clientsData)
  const [selected, setSelected] = useState(() =>
    openId ? clientsData.find(c => c.id === openId) ?? null : null
  )

  useEffect(() => {
    if (openId) {
      const found = clients.find(c => c.id === openId)
      if (found) setSelected(found)
    }
  }, [openId])

  const [view, setView] = useState('table')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterNiche, setFilterNiche] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterManager, setFilterManager] = useState('')
  const [filterContract, setFilterContract] = useState('')
  const [filterFollowers, setFilterFollowers] = useState('')
  const [groupBy, setGroupBy] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [showAdd, setShowAdd] = useState(false)

  const filtered = useMemo(() => {
    let out = clients
    if (search) {
      const q = search.toLowerCase()
      out = out.filter(c => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
    }
    if (filterStatus)   out = out.filter(c => c.status === filterStatus)
    if (filterNiche)    out = out.filter(c => c.niches.includes(filterNiche))
    if (filterPlatform) out = out.filter(c => c.primaryPlatform === filterPlatform)
    if (filterManager)  out = out.filter(c => c.assignedManager === filterManager)
    if (filterContract) out = out.filter(c => c.contractType === filterContract)
    if (filterFollowers) {
      const range = FOLLOWER_RANGES.find(r => r.label === filterFollowers)
      if (range) out = out.filter(c => { const n = primaryFollowersNum(c); return n >= range.min && n < range.max })
    }
    return [...out].sort((a, b) => {
      if (sortBy === 'name')       return a.name.localeCompare(b.name)
      if (sortBy === 'followers')  return primaryFollowersNum(b) - primaryFollowersNum(a)
      if (sortBy === 'engagement') return primaryEngagement(b) - primaryEngagement(a)
      if (sortBy === 'signedDate') return (b.signedDate || '').localeCompare(a.signedDate || '')
      if (sortBy === 'commission') return b.commissionRate - a.commissionRate
      return 0
    })
  }, [clients, search, filterStatus, filterNiche, filterPlatform, filterManager, filterContract, filterFollowers, sortBy])

  const handleSave = (updated) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelected(updated)
  }

  const handleAdd = (newClient) => {
    setClients(prev => [newClient, ...prev])
  }

  if (selected) {
    return <ClientProfile client={selected} onBack={() => setSelected(null)} onSave={handleSave} />
  }

  const hasFilters = search || filterStatus || filterNiche || filterPlatform || filterManager || filterContract || filterFollowers

  const clearFilters = () => {
    setSearch(''); setFilterStatus(''); setFilterNiche(''); setFilterPlatform('')
    setFilterManager(''); setFilterContract(''); setFilterFollowers('')
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} clients total`}
        action={
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add Client
          </button>
        }
      />

      {/* View Tabs + Sort */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-1">
          {[['table', 'Table'], ['kanban', 'Kanban'], ['gallery', 'Gallery'], ['list', 'List']].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                background: '#FFFFFF',
                border: `1px solid ${view === v ? '#111111' : '#EEEEEE'}`,
                borderRadius: 6,
                padding: '6px 14px',
                fontFamily: '"Inter", system-ui, sans-serif',
                fontWeight: 500,
                fontSize: 13,
                color: view === v ? '#111111' : '#888888',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {view !== 'kanban' && view !== 'gallery' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Group by</span>
              <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="h-8 pl-2.5 pr-7 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none">
                <option value="">None</option>
                <option value="status">Status</option>
                <option value="niche">Niche</option>
                <option value="platform">Platform</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Sort by</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-8 pl-2.5 pr-7 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none">
              <option value="name">Name</option>
              <option value="followers">Followers</option>
              <option value="engagement">Engagement</option>
              <option value="signedDate">Signed Date</option>
              <option value="commission">Commission</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 pl-8 pr-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 w-48"
          />
        </div>
        <FilterSelect label="All Statuses"   value={filterStatus}   onChange={setFilterStatus}   options={STATUSES} />
        <FilterSelect label="All Niches"     value={filterNiche}    onChange={setFilterNiche}    options={NICHES} />
        <FilterSelect label="All Platforms"  value={filterPlatform} onChange={setFilterPlatform} options={PLATFORMS} />
        <FilterSelect label="All Managers"   value={filterManager}  onChange={setFilterManager}  options={MANAGERS} />
        <FilterSelect label="Contract Type"  value={filterContract} onChange={setFilterContract} options={CONTRACT_TYPES} />
        <FilterSelect label="Follower Range" value={filterFollowers} onChange={setFilterFollowers} options={FOLLOWER_RANGES.map(r => r.label)} />
        {hasFilters && (
          <button onClick={clearFilters} className="h-8 px-2.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Clear all
          </button>
        )}
        <span className="text-xs text-gray-400 ml-1">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {view === 'table'   && <TableView   clients={filtered} groupBy={groupBy} onSelect={setSelected} />}
      {view === 'kanban'  && <KanbanView  clients={filtered} onSelect={setSelected} />}
      {view === 'gallery' && <GalleryView clients={filtered} onSelect={setSelected} />}
      {view === 'list'    && <ListView    clients={filtered} groupBy={groupBy} onSelect={setSelected} />}

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}
