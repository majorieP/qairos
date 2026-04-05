// Shared creator photo + follower formatting helpers.
// Used by Roster, Dashboard, Deals, Campaigns, Invoices, Payouts, MediaKits, etc.

const FALLBACK_CREATOR_PHOTOS = {
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

// Returns a URL for the creator's photo. Prefers the user-uploaded
// `profilePhoto` / `profile_photo` field, then falls back to a deterministic
// randomuser.me portrait keyed off the id.
export function creatorPhoto(creator) {
  if (!creator) return null
  const uploaded = creator.profilePhoto || creator.profile_photo
  if (uploaded) return uploaded
  const id = creator.id
  if (FALLBACK_CREATOR_PHOTOS[id]) return FALLBACK_CREATOR_PHOTOS[id]
  if (id == null) return 'https://randomuser.me/api/portraits/women/1.jpg'
  const n = ((Number(id) * 7) % 49) + 1
  const gender = Number(id) % 2 === 0 ? 'men' : 'women'
  return `https://randomuser.me/api/portraits/${gender}/${n}.jpg`
}

// Accepts a creator-like object OR a raw id. Convenience for deal/campaign
// rows that only carry a creatorId.
export function creatorPhotoById(id, creator) {
  if (creator) return creatorPhoto(creator)
  return creatorPhoto({ id })
}

// Resolves a creator photo by id by first looking up the roster's clientsData
// (which may contain a user-uploaded profilePhoto) then falling back.
// Pages can call this instead of rolling their own creatorPhotoUrl(id).
import { clientsData } from '../pages/Roster'
export function creatorPhotoUrl(id) {
  if (id == null) return null
  const creator = clientsData.find(c => c.id === id || c.id === Number(id))
  if (creator) return creatorPhoto(creator)
  return creatorPhoto({ id })
}

// Formats a follower/subscriber count as "1.2M" / "345K" / "1.1K".
// Accepts numbers or numeric strings. Returns '—' for null/undefined/NaN.
export function fmtFollowers(n) {
  if (n === null || n === undefined || n === '') return '—'
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1_000)     return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(Math.round(num))
}
