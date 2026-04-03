import { isOrderEligibleForRevenueMetrics } from './analyticsCalculations'
import {
  getItemLineRevenueRub,
  getTopProductsFromOrders,
  stableProductAggregationKey,
} from './orderItemsAnalytics'

describe('stableProductAggregationKey', () => {
  test('prefers productId', () => {
    expect(stableProductAggregationKey({ productId: '1', id: 'x', name: 'A' })).toBe('p:1')
  })

  test('fallback id', () => {
    expect(stableProductAggregationKey({ id: 'row-1', name: 'A', price: 10, quantity: 1 })).toBe('i:row-1')
  })

  test('fallback name', () => {
    expect(stableProductAggregationKey({ name: 'Hat', price: 10, quantity: 1 })).toBe('n:hat')
  })
})

describe('getItemLineRevenueRub', () => {
  test('price times quantity', () => {
    expect(getItemLineRevenueRub({ price: 100, quantity: 3 })).toBe(300)
  })

  test('malformed returns null', () => {
    expect(getItemLineRevenueRub(null)).toBe(null)
    expect(getItemLineRevenueRub({ price: 'nope', quantity: 1 })).toBe(null)
  })
})

describe('getTopProductsFromOrders', () => {
  const goodOrder = (id, items) => ({
    id,
    total: 1000,
    status: 'completed',
    source: 'vk',
    items,
  })

  test('aggregates revenue and order count', () => {
    const orders = [
      goodOrder('1', [{ productId: '10', name: 'A', price: 100, quantity: 2 }]),
      goodOrder('2', [{ productId: '10', name: 'A', price: 100, quantity: 1 }]),
    ]
    const top = getTopProductsFromOrders(orders, { limit: 5, sortBy: 'revenue' })
    expect(top).toHaveLength(1)
    expect(top[0].totalRevenueRub).toBe(300)
    expect(top[0].totalQuantity).toBe(3)
    expect(top[0].ordersContaining).toBe(2)
  })

  test('skips ineligible orders', () => {
    const orders = [
      { id: '1', total: 100, status: 'cancelled', items: [{ productId: '1', name: 'A', price: 100, quantity: 1 }] },
      goodOrder('2', [{ productId: '1', name: 'A', price: 100, quantity: 1 }]),
    ]
    const top = getTopProductsFromOrders(orders, { limit: 5 })
    expect(top[0].ordersContaining).toBe(1)
    expect(top[0].totalQuantity).toBe(1)
  })

  test('ignores orders without items', () => {
    expect(getTopProductsFromOrders([{ id: '1', total: 100, status: 'completed' }], { limit: 5 })).toEqual(
      [],
    )
  })

  test('sort by quantity', () => {
    const orders = [
      goodOrder('a', [
        { productId: '1', name: 'Low', price: 1000, quantity: 1 },
        { productId: '2', name: 'HighQ', price: 1, quantity: 50 },
      ]),
    ]
    const top = getTopProductsFromOrders(orders, { limit: 5, sortBy: 'quantity' })
    expect(top[0].name).toBe('HighQ')
  })

  test('non-array orders', () => {
    expect(getTopProductsFromOrders(undefined, { limit: 5 })).toEqual([])
  })
})

describe('isOrderEligibleForRevenueMetrics', () => {
  test('excludes cancelled', () => {
    expect(isOrderEligibleForRevenueMetrics({ total: 100, status: 'cancelled' })).toBe(false)
  })

  test('accepts completed with total', () => {
    expect(isOrderEligibleForRevenueMetrics({ total: 100, status: 'completed' })).toBe(true)
  })
})
