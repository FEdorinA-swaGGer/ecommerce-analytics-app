/**
 * Pure helpers for the admin "recent orders" table.
 * Safe on malformed orders; no mutation of input rows.
 */

import { formatRubForDisplay } from './analyticsCalculations'
import { formatAnalyticsSourceTokenForAdmin } from './analyticsSourceLabels'

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeOrderTotal(order) {
  if (!isRecord(order)) return null
  const t = order.total
  if (typeof t === 'number' && Number.isFinite(t)) return t
  if (typeof t === 'string' && t.trim() !== '') {
    const parsed = Number(t)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

/**
 * Parseable timestamp for sorting (desc = newest first). Invalid dates sort last.
 * @param {unknown} order
 * @returns {number}
 */
export function getOrderSortTimeMs(order) {
  if (!isRecord(order)) return Number.NEGATIVE_INFINITY
  const raw = order.date ?? order.createdAt ?? order.created_at
  if (typeof raw !== 'string' || !raw.trim()) return Number.NEGATIVE_INFINITY
  const trimmed = raw.trim()
  const ms = Date.parse(trimmed)
  if (!Number.isNaN(ms)) return ms
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const day = Date.parse(`${trimmed}T12:00:00`)
    return Number.isNaN(day) ? Number.NEGATIVE_INFINITY : day
  }
  return Number.NEGATIVE_INFINITY
}

/**
 * @param {unknown} orders already filtered orders
 * @param {{ limit?: number }} options
 * @returns {object[]}
 */
export function getRecentOrders(orders, options = {}) {
  const limit =
    typeof options.limit === 'number' && Number.isFinite(options.limit) && options.limit > 0
      ? Math.floor(options.limit)
      : 10
  if (!Array.isArray(orders)) return []
  const copy = [...orders]
  copy.sort((a, b) => {
    const dt = getOrderSortTimeMs(b) - getOrderSortTimeMs(a)
    if (dt !== 0) return dt
    const idA = isRecord(a) && a.id != null ? String(a.id) : ''
    const idB = isRecord(b) && b.id != null ? String(b.id) : ''
    return idB.localeCompare(idA)
  })
  return copy.slice(0, limit)
}

function normalizeQuantity(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0)
    return Math.round(raw)
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw.trim())
    if (Number.isFinite(n) && n >= 0) return Math.round(n)
  }
  return null
}

/**
 * Display count for the table column; `null` → show em dash in UI.
 * @param {unknown} order
 * @returns {number | null}
 */
export function getOrderItemsCount(order) {
  if (!isRecord(order)) return null
  const direct = order.itemsCount
  if (direct !== undefined && direct !== null) {
    const n = normalizeQuantity(direct)
    if (n !== null) return n
  }
  const items = order.items
  if (!Array.isArray(items)) return null
  if (items.length === 0) return 0
  let sum = 0
  let anyValid = false
  for (const row of items) {
    if (!isRecord(row)) continue
    let q = normalizeQuantity(row.quantity)
    if (q === null) {
      const hasLine =
        (typeof row.name === 'string' && row.name.trim() !== '') ||
        row.productId != null ||
        row.id != null
      if (hasLine) q = 1
    }
    if (q !== null) {
      sum += q
      anyValid = true
    }
  }
  if (anyValid) return sum
  return null
}

const COMPOSITION_SEP = ' · '

function nameFromItemRow(row) {
  if (!isRecord(row)) return null
  const name = row.name
  if (typeof name === 'string' && name.trim() !== '') return name.trim()
  return null
}

/**
 * First two names from the first two line items (positions 0 and 1), in order.
 * @param {unknown[]} items
 * @returns {string[]}
 */
function firstTwoRowNamesFromItems(items) {
  if (!Array.isArray(items)) return []
  const out = []
  for (let i = 0; i < Math.min(2, items.length); i++) {
    const n = nameFromItemRow(items[i])
    if (n) out.push(n)
  }
  return out
}

/**
 * Unified "composition" column: count + optional names, or legacy / empty-data fallbacks.
 * @param {unknown} order
 * @returns {{ text: string, title: string | null, variant: 'rich' | 'count-only' | 'legacy' | 'unreadable' }}
 */
export function getOrderCompositionDisplay(order) {
  const count = getOrderItemsCount(order)
  const items = isRecord(order) && Array.isArray(order.items) ? order.items : null

  if (count === null) {
    if (items && items.length > 0) {
      return {
        text: 'Нет состава',
        title: 'Позиции указаны, но не удалось посчитать количество.',
        variant: 'unreadable',
      }
    }
    return {
      text: 'Нет данных',
      title:
        'Состав заказа в данных не сохранён — так бывает для записей до обновления каталога.',
      variant: 'legacy',
    }
  }

  const countPart = `${count} ед.`

  if (!items || items.length === 0) {
    return { text: countPart, title: countPart, variant: 'count-only' }
  }

  const parts = firstTwoRowNamesFromItems(items)
  const extraLines = items.length > 2 ? items.length - 2 : 0

  if (parts.length === 0) {
    return { text: countPart, title: countPart, variant: 'count-only' }
  }

  let namePart = parts.join(', ')
  if (extraLines > 0) namePart += ` +${extraLines} ещё`
  const full = `${countPart}${COMPOSITION_SEP}${namePart}`
  return { text: full, title: full, variant: 'rich' }
}

function orderSourceRaw(order) {
  if (!isRecord(order)) return undefined
  return order.source ?? order.channel ?? order.utmSource
}

/**
 * @param {unknown} order
 * @returns {string}
 */
export function formatOrderSourceForDisplay(order) {
  return formatAnalyticsSourceTokenForAdmin(orderSourceRaw(order))
}

/**
 * @param {unknown} order
 * @returns {string}
 */
export function formatOrderDateForDisplay(order) {
  if (!isRecord(order)) return '—'
  const raw = order.date ?? order.createdAt ?? order.created_at
  if (typeof raw !== 'string' || !raw.trim()) return '—'
  const trimmed = raw.trim()
  const ms = Date.parse(trimmed)
  let day = ms
  if (Number.isNaN(ms) && /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    day = Date.parse(`${trimmed}T12:00:00`)
  }
  if (typeof day === 'number' && !Number.isNaN(day)) {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(day)
  }
  return trimmed
}

/**
 * @param {unknown} order
 * @returns {string}
 */
export function formatOrderTotalRub(order) {
  const total = normalizeOrderTotal(order)
  if (total === null) return '—'
  return formatRubForDisplay(Math.round(total))
}

/** Known English tokens → Russian UI (stored `status` in data unchanged). */
const ORDER_STATUS_LABEL_RU = Object.freeze({
  completed: 'Выполнен',
  processing: 'В обработке',
  cancelled: 'Отменён',
  canceled: 'Отменён',
  shipped: 'Отправлен',
  refunded: 'Возврат',
  pending: 'Ожидает',
})

/**
 * @param {string} normalized lowercased trim-free token from `order.status`
 * @param {string} rawLabel original trimmed status string
 * @returns {string}
 */
export function formatOrderStatusDisplayRu(normalized, rawLabel) {
  const mapped = ORDER_STATUS_LABEL_RU[normalized]
  if (mapped !== undefined) return mapped
  if (!rawLabel || rawLabel === '—') return '—'
  return rawLabel
}

/**
 * Visual tone for status badge (known business statuses only).
 * @param {string} normalized lowercased status token
 * @returns {'completed' | 'processing' | 'cancelled' | 'shipped' | 'refunded' | 'default'}
 */
function statusToneFromNormalized(normalized) {
  if (normalized === 'completed') return 'completed'
  if (normalized === 'processing' || normalized === 'pending') return 'processing'
  if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled'
  if (normalized === 'shipped') return 'shipped'
  if (normalized === 'refunded') return 'refunded'
  return 'default'
}

/**
 * @param {unknown} order
 * @returns {{ label: string, displayLabel: string, slug: string, tone: 'completed' | 'processing' | 'cancelled' | 'shipped' | 'refunded' | 'default' }}
 */
export function getOrderStatusPresentation(order) {
  if (!isRecord(order)) {
    return { label: '—', displayLabel: '—', slug: 'unknown', tone: 'default' }
  }
  const raw = order.status
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return { label: '—', displayLabel: '—', slug: 'unknown', tone: 'default' }
  }
  const label = String(raw).trim()
  const normalized = label.toLowerCase()
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  const tone = statusToneFromNormalized(normalized)
  const displayLabel = formatOrderStatusDisplayRu(normalized, label)
  return { label, displayLabel, slug: slug || 'unknown', tone }
}
