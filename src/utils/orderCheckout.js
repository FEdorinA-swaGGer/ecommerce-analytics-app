/**
 * Pure checkout helpers: cart totals, validation, order payload for POST /orders.
 * Single canonical `source` token (lowercase) aligned with analytics.
 */

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Cart UI + API: one row per allowed source (value = canonical analytics token). */
export const CHECKOUT_SOURCE_OPTIONS = Object.freeze([
  { value: 'vk', label: 'VK' },
  { value: 'yandex', label: 'Яндекс' },
  { value: 'direct', label: 'Прямой' },
  { value: 'email', label: 'Email' },
])

/** @readonly */
export const CHECKOUT_SOURCE_VALUES = Object.freeze(
  CHECKOUT_SOURCE_OPTIONS.map((o) => o.value)
)

export const DEFAULT_CHECKOUT_SOURCE = 'direct'

export const NEW_ORDER_STATUS = 'completed'

/**
 * @param {unknown} value
 * @returns {value is string}
 */
export function isAllowedCheckoutSource(value) {
  return typeof value === 'string' && CHECKOUT_SOURCE_VALUES.includes(value)
}

/**
 * Parsed unit price in rubles (not rounded); null if missing or invalid.
 * @param {unknown} item
 * @returns {number | null}
 */
function parseUnitPriceRubFromCartItem(item) {
  if (!isRecord(item)) return null
  const p = item.price
  if (typeof p === 'number' && Number.isFinite(p)) return p
  if (typeof p === 'string' && p.trim() !== '') {
    const n = Number(p)
    if (Number.isFinite(n)) return n
  }
  return null
}

/**
 * Sum cart line prices (rubles, integer).
 * @param {unknown} items
 * @returns {number}
 */
export function computeCartTotalRub(items) {
  if (!Array.isArray(items)) return 0
  let sum = 0
  for (const item of items) {
    const p = parseUnitPriceRubFromCartItem(item)
    if (p !== null) sum += p
  }
  return Math.round(sum)
}

/**
 * Label for an order line (catalog uses `name`; `title` supported).
 * @param {Record<string, unknown>} raw
 * @returns {string}
 */
function lineItemNameFromCartRow(raw) {
  const name = raw.name
  const title = raw.title
  if (typeof name === 'string' && name.trim() !== '') return name.trim()
  if (typeof title === 'string' && title.trim() !== '') return title.trim()
  return 'Товар'
}

/**
 * Aggregates cart rows into order lines (same product id → one line with quantity).
 * Rows without a valid unit price are skipped (same as total).
 * @param {unknown} items
 * @returns {{ items: { productId: string | number | null, id: string | number, name: string, price: number, quantity: number }[], itemsCount: number }}
 */
export function buildOrderLineItemsFromCart(items) {
  if (!Array.isArray(items)) return { items: [], itemsCount: 0 }

  /** @type {Map<string, { productId: string | number | null, id: string | number, name: string, price: number, quantity: number }>} */
  const byKey = new Map()

  for (let i = 0; i < items.length; i++) {
    const raw = items[i]
    if (!isRecord(raw)) continue
    const unit = parseUnitPriceRubFromCartItem(raw)
    if (unit === null) continue

    const price = Math.round(unit)
    const idRaw = raw.id ?? raw.productId
    const hasStableId =
      (typeof idRaw === 'string' && idRaw !== '') ||
      (typeof idRaw === 'number' && Number.isFinite(idRaw))
    const key = hasStableId ? String(idRaw) : `__row_${i}`

    const name = lineItemNameFromCartRow(raw)
    const existing = byKey.get(key)
    if (existing) {
      existing.quantity += 1
      continue
    }

    const productId = hasStableId ? idRaw : null
    const id = hasStableId ? /** @type {string | number} */ (idRaw) : key
    byKey.set(key, {
      productId,
      id,
      name,
      price,
      quantity: 1,
    })
  }

  const lines = Array.from(byKey.values())
  const itemsCount = lines.reduce((acc, row) => acc + row.quantity, 0)
  return { items: lines, itemsCount }
}

/**
 * Local calendar date YYYY-MM-DD for order.date (analytics filters / salesByDay).
 */
export function todayOrderDateString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * @param {{ items: unknown, source: unknown }} params
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateCheckoutRequest({ items, source }) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'Корзина пуста' }
  }
  if (!isAllowedCheckoutSource(source)) {
    return { ok: false, error: 'Выберите источник заказа' }
  }
  const total = computeCartTotalRub(items)
  if (total <= 0) {
    return { ok: false, error: 'Неверная сумма заказа' }
  }
  return { ok: true }
}

/**
 * Payload for json-server POST /orders (id assigned by server).
 * @param {{ items: unknown, source: string }} params
 * @returns {{ date: string, total: number, status: string, source: string, items: { productId: string | number | null, id: string | number, name: string, price: number, quantity: number }[], itemsCount: number }}
 */
export function buildOrderPayloadFromCart({ items, source }) {
  const { items: orderItems, itemsCount } = buildOrderLineItemsFromCart(items)
  return {
    date: todayOrderDateString(),
    total: computeCartTotalRub(items),
    status: NEW_ORDER_STATUS,
    source,
    items: orderItems,
    itemsCount,
  }
}
