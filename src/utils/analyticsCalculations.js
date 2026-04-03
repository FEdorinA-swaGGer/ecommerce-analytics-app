/**
 * Pure analytics helpers for admin KPIs.
 * Safe on empty or malformed input; no I/O or side effects.
 */

/** Order statuses that must not contribute to revenue or order-count KPIs */
const STATUS_EXCLUDED_FROM_ORDER_METRICS = new Set(['cancelled', 'refunded'])

/** Decimal places for conversion rate percentage in UI */
const CONVERSION_RATE_DECIMALS = 1

function isUnknownSource(source) {
  return source === 'unknown' || source === ''
}

/**
 * Traffic-source chart rows: highest revenue first; ties put `unknown` last.
 * @param {{ source: string, revenue: number, ordersCount: number }[]} rows
 */
export function sortRevenueBySourceDescending(rows) {
  const list = Array.isArray(rows) ? [...rows] : []
  return list.sort((a, b) => {
    if (b.revenue !== a.revenue) return b.revenue - a.revenue
    const unkRank = (s) => (isUnknownSource(s) ? 1 : 0)
    return unkRank(a.source) - unkRank(b.source) || String(a.source).localeCompare(String(b.source))
  })
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeTotal(total) {
  if (typeof total === 'number' && Number.isFinite(total)) return total
  if (typeof total === 'string' && total.trim() !== '') {
    const parsed = Number(total)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function orderCountsTowardMetrics(order) {
  if (!isRecord(order)) return false
  const status = String(order.status ?? '').toLowerCase()
  if (STATUS_EXCLUDED_FROM_ORDER_METRICS.has(status)) return false
  return normalizeTotal(order.total) !== null
}

/**
 * Same eligibility as revenue / orders KPIs (excludes cancelled/refunded, needs valid total).
 * Use for product-level rollups so metrics align with order totals story.
 * @param {unknown} order
 * @returns {boolean}
 */
export function isOrderEligibleForRevenueMetrics(order) {
  return orderCountsTowardMetrics(order)
}

function ordersEligibleForMetrics(orders) {
  if (!Array.isArray(orders)) return []
  return orders.filter(orderCountsTowardMetrics)
}

function normalizeDayString(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function normalizeSourceKey(value) {
  if (typeof value === 'string' && value.trim() !== '') return value.trim().toLowerCase()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return 'unknown'
}

/**
 * Sum of `total` for orders that are not cancelled/refunded and have a valid total.
 * @param {unknown} orders
 * @returns {number} Non-negative integer rubles (rounded).
 */
export function calculateRevenue(orders) {
  const eligible = ordersEligibleForMetrics(orders)
  const sum = eligible.reduce((acc, order) => acc + normalizeTotal(order.total), 0)
  return Math.round(sum)
}

/**
 * Revenue time series grouped by day (ascending).
 * Excludes cancelled/refunded orders and orders with invalid totals.
 * @param {unknown} orders
 * @returns {{ day: string, revenue: number, ordersCount: number }[]}
 */
export function salesByDay(orders) {
  const eligible = ordersEligibleForMetrics(orders)
  const byDay = new Map()

  for (const order of eligible) {
    const day = normalizeDayString(order.date ?? order.createdAt ?? order.created_at)
    if (!day) continue

    const total = normalizeTotal(order.total)
    if (total === null) continue

    const current = byDay.get(day) ?? { day, revenue: 0, ordersCount: 0 }
    current.revenue += total
    current.ordersCount += 1
    byDay.set(day, current)
  }

  return Array.from(byDay.values())
    .map((row) => ({
      day: row.day,
      revenue: Math.round(row.revenue),
      ordersCount: row.ordersCount,
    }))
    .sort((a, b) => a.day.localeCompare(b.day))
}

/**
 * Revenue grouped by traffic source (`order.source`, or legacy `channel` / `utmSource` on the order row).
 * Sorted by revenue descending (`unknown` after known sources when revenue ties).
 * Excludes cancelled/refunded orders and orders with invalid totals.
 * @param {unknown} orders
 * @returns {{ source: string, revenue: number, ordersCount: number }[]}
 */
export function revenueBySource(orders) {
  const eligible = ordersEligibleForMetrics(orders)
  const bySource = new Map()

  for (const order of eligible) {
    const source = normalizeSourceKey(order.source ?? order.channel ?? order.utmSource)
    const total = normalizeTotal(order.total)
    if (total === null) continue

    const current = bySource.get(source) ?? { source, revenue: 0, ordersCount: 0 }
    current.revenue += total
    current.ordersCount += 1
    bySource.set(source, current)
  }

  const rows = Array.from(bySource.values()).map((row) => ({
    source: row.source,
    revenue: Math.round(row.revenue),
    ordersCount: row.ordersCount,
  }))

  return sortRevenueBySourceDescending(rows)
}

/**
 * Number of orders included in revenue (same eligibility rules).
 * @param {unknown} orders
 * @returns {number}
 */
export function calculateOrdersCount(orders) {
  return ordersEligibleForMetrics(orders).length
}

/**
 * Share of sessions with `converted === true`.
 * @param {unknown} _orders Reserved for future funnel / attribution metrics.
 * @param {unknown} sessions
 * @returns {number} Percent 0–100, one decimal, or 0 if no sessions.
 */
export function calculateConversionRate(_orders, sessions) {
  const list = Array.isArray(sessions) ? sessions : []
  if (list.length === 0) return 0
  const converted = list.filter((s) => isRecord(s) && s.converted === true).length
  const rate = (converted / list.length) * 100
  const factor = 10 ** CONVERSION_RATE_DECIMALS
  return Math.round(rate * factor) / factor
}

/**
 * Average order value: revenue / eligible order count.
 * @param {unknown} orders
 * @returns {number} Rounded integer rubles; 0 if no eligible orders.
 */
export function calculateAverageOrderValue(orders) {
  const revenue = calculateRevenue(orders)
  const count = calculateOrdersCount(orders)
  if (count === 0) return 0
  return Math.round(revenue / count)
}

const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

/**
 * @param {number} amountRub
 * @returns {string}
 */
export function formatRubForDisplay(amountRub) {
  if (!Number.isFinite(amountRub)) return '—'
  return rubFormatter.format(amountRub)
}

/**
 * @param {number} percent
 * @returns {string}
 */
export function formatPercentForDisplay(percent) {
  if (!Number.isFinite(percent)) return '—'
  return `${percent.toFixed(CONVERSION_RATE_DECIMALS).replace('.', ',')} %`
}

/**
 * Builds KPI rows for the admin analytics grid (labels + formatted values).
 * @param {unknown} orders
 * @param {unknown} sessions
 * @returns {{ key: string, label: string, value: string }[]}
 */
export function buildAdminAnalyticsKpiRows(orders, sessions) {
  const revenue = calculateRevenue(orders)
  const ordersCount = calculateOrdersCount(orders)
  const conversion = calculateConversionRate(orders, sessions)
  const aov = calculateAverageOrderValue(orders)

  return [
    { key: 'revenue', label: 'Выручка', value: formatRubForDisplay(revenue) },
    { key: 'orders', label: 'Заказы', value: String(ordersCount) },
    { key: 'conversion', label: 'Конверсия', value: formatPercentForDisplay(conversion) },
    { key: 'aov', label: 'Средний чек', value: formatRubForDisplay(aov) },
  ]
}

/**
 * Computes all analytics datasets for the admin analytics page.
 * @param {{ orders: unknown, sessions: unknown }} params
 * @returns {{ kpi: { key: string, label: string, value: string }[], salesByDay: { day: string, revenue: number, ordersCount: number }[], revenueBySource: { source: string, revenue: number, ordersCount: number }[] }}
 */
export function computeAnalytics({ orders, sessions }) {
  return {
    kpi: buildAdminAnalyticsKpiRows(orders, sessions),
    salesByDay: salesByDay(orders),
    revenueBySource: revenueBySource(orders),
  }
}
