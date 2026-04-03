import { getOrders, getSessions } from './api'

function normalizeList(payload) {
  return Array.isArray(payload) ? payload : []
}

/**
 * Loads orders and sessions independently so one failure does not block the other.
 * @returns {Promise<{ orders: object[], sessions: object[], errors: string[] }>}
 */
export async function loadAdminAnalyticsData() {
  const errors = []

  let orders = []
  try {
    orders = normalizeList(await getOrders())
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    errors.push(`Не удалось загрузить заказы: ${message}`)
  }

  let sessions = []
  try {
    sessions = normalizeList(await getSessions())
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    errors.push(`Не удалось загрузить сессии: ${message}`)
  }

  return { orders, sessions, errors }
}
