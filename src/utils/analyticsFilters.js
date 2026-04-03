/**
 * Pure filter helpers for the admin analytics dashboard.
 * No formatting, no aggregation — only subset selection on raw lists.
 */

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** @type {'all' | 'vk' | 'yandex' | 'direct' | 'email'} */
export const ANALYTICS_SOURCE_ALL = 'all'

/**
 * @returns {{ source: 'all' | 'vk' | 'yandex' | 'direct' | 'email', dateFrom: string, dateTo: string }}
 */
export function createDefaultAnalyticsFilters() {
  return {
    source: ANALYTICS_SOURCE_ALL,
    dateFrom: '',
    dateTo: '',
  }
}

/**
 * Same normalization as order grouping in analytics (lowercase token).
 * @param {unknown} value
 * @returns {string}
 */
function normalizeSourceToken(value) {
  if (typeof value === 'string' && value.trim() !== '')
    return value.trim().toLowerCase()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return 'unknown'
}

function orderSourceKey(order) {
  if (!isRecord(order)) return 'unknown'
  return normalizeSourceToken(order.source ?? order.channel ?? order.utmSource)
}

function sessionSourceKey(session) {
  if (!isRecord(session)) return 'unknown'
  return normalizeSourceToken(
    session.source ?? session.channel ?? session.utmSource
  )
}

/**
 * Normalizes a filter date input to `YYYY-MM-DD` or empty string.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeAnalyticsFilterDateInput(value) {
  if (typeof value !== 'string') return ''
  const t = value.trim()
  if (!t) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

/**
 * Calendar day key for an order (business date column).
 * @param {unknown} order
 * @returns {string | null}
 */
function orderDayKey(order) {
  if (!isRecord(order)) return null
  const raw = order.date ?? order.createdAt ?? order.created_at
  return normalizeDayKeyFromRaw(raw)
}

/**
 * Calendar day key for a session timestamp.
 * @param {unknown} session
 * @returns {string | null}
 */
function sessionDayKey(session) {
  if (!isRecord(session)) return null
  const raw =
    session.date ?? session.startedAt ?? session.createdAt ?? session.created_at
  return normalizeDayKeyFromRaw(raw)
}

function normalizeDayKeyFromRaw(raw) {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

/**
 * Inclusive bounds for filtering. If both ends are set and `from > to`, they are swapped.
 * @param {string} dateFrom
 * @param {string} dateTo
 * @returns {{ fromBound: string | null, toBound: string | null } | null} `null` = no date filter active
 */
export function resolveAnalyticsDateBounds(dateFrom, dateTo) {
  let from = normalizeAnalyticsFilterDateInput(dateFrom)
  let to = normalizeAnalyticsFilterDateInput(dateTo)
  if (!from && !to) return null
  if (from && to && from > to) {
    const tmp = from
    from = to
    to = tmp
  }
  return {
    fromBound: from || null,
    toBound: to || null,
  }
}

function dayInInclusiveRange(day, bounds) {
  if (!bounds) return true
  if (!day) return false
  if (bounds.fromBound && day < bounds.fromBound) return false
  if (bounds.toBound && day > bounds.toBound) return false
  return true
}

/**
 * @param {unknown} orders
 * @param {{ source: string, dateFrom: string, dateTo: string }} filters
 * @returns {object[]}
 */
export function filterOrdersByAnalyticsFilters(orders, filters) {
  if (!Array.isArray(orders)) return []
  const list =
    filters && typeof filters === 'object'
      ? filters
      : createDefaultAnalyticsFilters()
  const sourceToken =
    list.source === ANALYTICS_SOURCE_ALL || !list.source
      ? null
      : String(list.source).toLowerCase()
  const dateBounds = resolveAnalyticsDateBounds(list.dateFrom, list.dateTo)

  return orders.filter((order) => {
    if (sourceToken !== null && orderSourceKey(order) !== sourceToken)
      return false
    if (dateBounds !== null) {
      const day = orderDayKey(order)
      if (!dayInInclusiveRange(day, dateBounds)) return false
    }
    return true
  })
}

/**
 * @param {unknown} sessions
 * @param {{ source: string, dateFrom: string, dateTo: string }} filters
 * @returns {object[]}
 */
export function filterSessionsByAnalyticsFilters(sessions, filters) {
  if (!Array.isArray(sessions)) return []
  const list =
    filters && typeof filters === 'object'
      ? filters
      : createDefaultAnalyticsFilters()
  const sourceToken =
    list.source === ANALYTICS_SOURCE_ALL || !list.source
      ? null
      : String(list.source).toLowerCase()
  const dateBounds = resolveAnalyticsDateBounds(list.dateFrom, list.dateTo)

  return sessions.filter((session) => {
    if (sourceToken !== null && sessionSourceKey(session) !== sourceToken)
      return false
    if (dateBounds !== null) {
      const day = sessionDayKey(session)
      if (!dayInInclusiveRange(day, dateBounds)) return false
    }
    return true
  })
}
