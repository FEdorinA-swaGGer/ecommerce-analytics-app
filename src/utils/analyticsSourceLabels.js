/**
 * Human-readable labels for analytics traffic sources (admin UI).
 * Canonical tokens match checkout / filters (lowercase).
 */

/** @type {Record<string, string>} */
export const ANALYTICS_SOURCE_LABEL_BY_TOKEN = Object.freeze({
  vk: 'VK',
  yandex: 'Яндекс',
  direct: 'Прямой заход',
  email: 'Email',
})

/**
 * @param {unknown} sourceRaw value from `order.source` (or legacy channel fields handled by caller)
 * @returns {string}
 */
export function formatAnalyticsSourceTokenForAdmin(sourceRaw) {
  if (typeof sourceRaw === 'string' && sourceRaw.trim() !== '') {
    const key = sourceRaw.trim().toLowerCase()
    const mapped = ANALYTICS_SOURCE_LABEL_BY_TOKEN[key]
    if (mapped) return mapped
    return sourceRaw.trim()
  }
  if (typeof sourceRaw === 'number' && Number.isFinite(sourceRaw)) {
    return String(sourceRaw)
  }
  return '—'
}
