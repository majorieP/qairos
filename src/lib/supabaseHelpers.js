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

export async function deleteRow(table, id) {
  if (!isSupabaseConfigured) return null
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) { console.warn(`[supabase] ${table} delete error:`, error.message); return false }
  return true
}
