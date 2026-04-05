import { supabase, isSupabaseConfigured } from './supabase'

// ─── Case conversion ─────────────────────────────────────────────────────────
const toSnake = str => str.replace(/[A-Z]/g, c => '_' + c.toLowerCase())
const toCamel = str => str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())

function mapKeys(obj, fn) {
  if (Array.isArray(obj)) return obj.map(o => mapKeys(o, fn))
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) return obj
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [fn(k), v]))
}

export const rowToObj = row => mapKeys(row, toCamel)
export const objToRow = obj => mapKeys(obj, toSnake)

// ─── Table operations (snake-case column names, camelCase js keys) ───────────
export async function fetchAll(table) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.from(table).select('*')
  if (error) { console.warn(`[supabase] ${table} fetch error:`, error.message); return null }
  return data.map(rowToObj)
}

export async function insertRow(table, obj) {
  if (!isSupabaseConfigured) return null
  const row = objToRow(obj)
  delete row.id
  const { data, error } = await supabase.from(table).insert(row).select().single()
  if (error) { console.warn(`[supabase] ${table} insert error:`, error.message); return null }
  return rowToObj(data)
}

export async function updateRow(table, id, updates) {
  if (!isSupabaseConfigured) return null
  const row = objToRow(updates)
  delete row.id
  const { data, error } = await supabase.from(table).update(row).eq('id', id).select().single()
  if (error) { console.warn(`[supabase] ${table} update error:`, error.message); return null }
  return rowToObj(data)
}

// Upload a file to a storage bucket and return its public URL.
// Returns { url, error }. If Supabase is not configured, returns a local object URL.
export async function uploadImage(bucket, file, pathPrefix = '') {
  if (!file) return { url: null, error: 'no file' }
  if (!isSupabaseConfigured) {
    // Dev fallback: use an object URL so the UI can preview without a backend.
    return { url: URL.createObjectURL(file), error: null }
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const filename = `${pathPrefix}${pathPrefix ? '-' : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filename, file, { cacheControl: '3600', upsert: false, contentType: file.type })
  if (uploadError) {
    console.warn(`[supabase] ${bucket} upload error:`, uploadError.message)
    return { url: null, error: uploadError.message }
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(filename)
  return { url: data.publicUrl, error: null }
}

export async function deleteRow(table, id) {
  if (!isSupabaseConfigured) return null
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) { console.warn(`[supabase] ${table} delete error:`, error.message); return false }
  return true
}
