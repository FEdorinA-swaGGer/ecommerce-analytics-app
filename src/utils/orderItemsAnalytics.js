/**
 * Pure aggregation over `order.items` for admin analytics (Top Products).
 * Does not mutate inputs. Safe on legacy orders without `items`.
 */

import { formatRubForDisplay, isOrderEligibleForRevenueMetrics } from './analyticsCalculations'

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function parseFiniteNonNegativeNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0)
    return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value.trim())
    if (Number.isFinite(n) && n >= 0) return n
  }
  return null
}

/**
 * Integer units sold per line; `null` if unknown or &lt; 1.
 * @param {unknown} item
 * @returns {number | null}
 */
export function getItemQuantityForAggregation(item) {
  if (!isRecord(item)) return null
  const q = parseFiniteNonNegativeNumber(item.quantity)
  if (q !== null) {
    const units = Math.round(q)
    if (units < 1) return null
    return units
  }
  const hasLine =
    (typeof item.name === 'string' && item.name.trim() !== '') ||
    item.productId != null ||
    item.id != null
  if (hasLine) return 1
  return null
}

/**
 * Line revenue in rubles (rounded); `null` if row unusable.
 * @param {unknown} item
 * @returns {number | null}
 */
export function getItemLineRevenueRub(item) {
  if (!isRecord(item)) return null
  const qty = getItemQuantityForAggregation(item)
  if (qty === null) return null
  const price = parseFiniteNonNegativeNumber(item.price)
  if (price === null) return null
  return Math.round(price * qty)
}

/**
 * Stable key for merging lines across orders. Returns `null` if row cannot be grouped.
 * @param {unknown} item
 * @returns {string | null}
 */
export function stableProductAggregationKey(item) {
  if (!isRecord(item)) return null
  const pid = item.productId
  if (pid !== null && pid !== undefined && String(pid).trim() !== '') {
    return `p:${String(pid)}`
  }
  const id = item.id
  if (id !== null && id !== undefined && String(id).trim() !== '') {
    return `i:${String(id)}`
  }
  const name = item.name
  if (typeof name === 'string' && name.trim() !== '') {
    return `n:${name.trim().toLowerCase()}`
  }
  return null
}

/**
 * @param {unknown} item
 * @param {string} aggregateKey
 * @returns {string | number | null}
 */
export function displayProductIdFromItem(item, aggregateKey) {
  if (!isRecord(item)) return null
  if (item.productId !== null && item.productId !== undefined && String(item.productId).trim() !== '') {
    return item.productId
  }
  if (item.id !== null && item.id !== undefined && String(item.id).trim() !== '') {
    return item.id
  }
  if (aggregateKey.startsWith('p:')) return aggregateKey.slice(2)
  if (aggregateKey.startsWith('i:')) return aggregateKey.slice(2)
  return null
}

/**
 * @param {{ totalRevenueRub: number }} row
 * @returns {string}
 */
export function formatTopProductRevenueForDisplay(row) {
  return formatRubForDisplay(row.totalRevenueRub)
}

/**
 * @typedef {{ productKey: string, productId: string | number | null, name: string, totalQuantity: number, totalRevenueRub: number, ordersContaining: number }} TopProductRow
 */

/**
 * @param {unknown} orders filtered orders (same set as charts / recent table)
 * @param {{ limit?: number, sortBy?: 'revenue' | 'quantity' }} options
 * @returns {TopProductRow[]}
 */
export function getTopProductsFromOrders(orders, options = {}) {
  const limit =
    typeof options.limit === 'number' && Number.isFinite(options.limit) && options.limit > 0
      ? Math.floor(options.limit)
      : 8
  const sortBy = options.sortBy === 'quantity' ? 'quantity' : 'revenue'

  if (!Array.isArray(orders)) return []

  /** @type {Map<string, { name: string, totalQuantity: number, totalRevenueRub: number, orderKeys: Set<string>, sampleItem: object }>} */
  const map = new Map()

  let orderIndex = 0
  for (const order of orders) {
    const orderKey =
      isRecord(order) && order.id != null ? String(order.id) : `idx-${orderIndex}`
    orderIndex++

    if (!isOrderEligibleForRevenueMetrics(order)) continue

    const items = order.items
    if (!Array.isArray(items) || items.length === 0) continue

    for (const raw of items) {
      const key = stableProductAggregationKey(raw)
      if (key === null) continue
      const qty = getItemQuantityForAggregation(raw)
      const rev = getItemLineRevenueRub(raw)
      if (qty === null || rev === null) continue

      const displayId = displayProductIdFromItem(raw, key)
      const name =
        isRecord(raw) && typeof raw.name === 'string' && raw.name.trim() !== ''
          ? raw.name.trim()
          : displayId != null
            ? `Товар ${displayId}`
            : 'Товар'

      let bucket = map.get(key)
      if (!bucket) {
        bucket = {
          name,
          totalQuantity: 0,
          totalRevenueRub: 0,
          orderKeys: new Set(),
          sampleItem: raw,
        }
        map.set(key, bucket)
      }
      bucket.totalQuantity += qty
      bucket.totalRevenueRub += rev
      bucket.orderKeys.add(orderKey)
      if (
        isRecord(raw) &&
        typeof raw.name === 'string' &&
        raw.name.trim() !== '' &&
        bucket.name.startsWith('Товар ')
      ) {
        bucket.name = raw.name.trim()
      }
    }
  }

  const rows = Array.from(map.entries()).map(([productKey, b]) => ({
    productKey,
    productId: displayProductIdFromItem(b.sampleItem, productKey),
    name: b.name,
    totalQuantity: b.totalQuantity,
    totalRevenueRub: b.totalRevenueRub,
    ordersContaining: b.orderKeys.size,
  }))

  rows.sort((a, b) => {
    if (sortBy === 'quantity') {
      const dq = b.totalQuantity - a.totalQuantity
      if (dq !== 0) return dq
    } else {
      const dr = b.totalRevenueRub - a.totalRevenueRub
      if (dr !== 0) return dr
    }
    const o = b.ordersContaining - a.ordersContaining
    if (o !== 0) return o
    return String(a.name).localeCompare(String(b.name), 'ru')
  })

  return rows.slice(0, limit)
}
