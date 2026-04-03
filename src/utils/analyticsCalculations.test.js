import {
  calculateAverageOrderValue,
  calculateConversionRate,
  calculateOrdersCount,
  calculateRevenue,
  buildAdminAnalyticsKpiRows,
  revenueBySource,
  salesByDay,
  sortRevenueBySourceDescending,
} from './analyticsCalculations'

const sampleOrders = [
  { id: '1', total: 1000, status: 'completed' },

  { id: '2', total: 500, status: 'cancelled' },

  { id: '3', total: 2000, status: 'shipped' },
]

const sampleSessions = [
  { id: 'a', converted: true },

  { id: 'b', converted: false },

  { id: 'c', converted: true },
]

describe('calculateRevenue', () => {
  test('sums eligible orders only', () => {
    expect(calculateRevenue(sampleOrders)).toBe(3000)
  })

  test('empty input', () => {
    expect(calculateRevenue([])).toBe(0)

    expect(calculateRevenue(null)).toBe(0)
  })
})

describe('calculateOrdersCount', () => {
  test('counts eligible orders', () => {
    expect(calculateOrdersCount(sampleOrders)).toBe(2)
  })
})

describe('calculateConversionRate', () => {
  test('converted / total sessions * 100', () => {
    expect(calculateConversionRate([], sampleSessions)).toBeCloseTo(66.7, 1)
  })

  test('no sessions', () => {
    expect(calculateConversionRate([], [])).toBe(0)
  })
})

describe('calculateAverageOrderValue', () => {
  test('revenue / count', () => {
    expect(calculateAverageOrderValue(sampleOrders)).toBe(1500)
  })

  test('no orders', () => {
    expect(calculateAverageOrderValue([])).toBe(0)
  })
})

describe('buildAdminAnalyticsKpiRows', () => {
  test('returns four rows with string values', () => {
    const rows = buildAdminAnalyticsKpiRows(sampleOrders, sampleSessions)

    expect(rows).toHaveLength(4)

    expect(rows.map((r) => r.key)).toEqual([
      'revenue',
      'orders',
      'conversion',
      'aov',
    ])
  })
})

describe('salesByDay', () => {
  test('groups by day, sums revenue, sorts ascending, excludes cancelled/refunded', () => {
    const orders = [
      { id: '1', date: '2025-11-02', total: 1000, status: 'completed' },

      { id: '2', date: '2025-11-01', total: 2500, status: 'shipped' },

      { id: '3', date: '2025-11-02', total: 500, status: 'processing' },

      { id: '4', date: '2025-11-02', total: 999, status: 'cancelled' },

      { id: '5', date: '2025-11-03', total: 200, status: 'refunded' },
    ]

    expect(salesByDay(orders)).toEqual([
      { day: '2025-11-01', revenue: 2500, ordersCount: 1 },

      { day: '2025-11-02', revenue: 1500, ordersCount: 2 },
    ])
  })

  test('ignores invalid totals and missing dates, safe on non-array input', () => {
    const orders = [
      { id: '1', date: '2025-11-02', total: '1000', status: 'completed' },

      { id: '2', date: '', total: 1000, status: 'completed' },

      { id: '3', total: 500, status: 'completed' },

      { id: '4', date: '2025-11-02', total: 'nope', status: 'completed' },
    ]

    expect(salesByDay(orders)).toEqual([
      { day: '2025-11-02', revenue: 1000, ordersCount: 1 },
    ])

    expect(salesByDay(null)).toEqual([])
  })
})

describe('revenueBySource', () => {
  test('groups by source, sorts by revenue descending, excludes cancelled/refunded', () => {
    const orders = [
      {
        id: '1',
        date: '2025-11-01',
        total: 1000,
        status: 'completed',
        source: 'direct',
      },

      {
        id: '2',
        date: '2025-11-01',
        total: 2500,
        status: 'shipped',
        source: 'google',
      },

      {
        id: '3',
        date: '2025-11-02',
        total: 500,
        status: 'processing',
        source: 'direct',
      },

      {
        id: '4',
        date: '2025-11-02',
        total: 999,
        status: 'cancelled',
        source: 'google',
      },
    ]

    const rows = revenueBySource(orders)

    expect(rows.map((r) => r.source)).toEqual(['google', 'direct'])

    expect(rows.map((r) => r.revenue)).toEqual([2500, 1500])

    rows.forEach((row) => {
      expect(Object.keys(row).sort()).toEqual([
        'ordersCount',
        'revenue',
        'source',
      ])
    })
  })

  test('normalizes missing source to unknown; sorts by revenue (unknown after when tied)', () => {
    const orders = [
      { id: '1', date: '2025-11-01', total: 1000, status: 'completed' },

      {
        id: '2',
        date: '2025-11-01',
        total: 500,
        status: 'completed',
        channel: 'Email',
      },
    ]

    expect(revenueBySource(orders)).toEqual([
      { source: 'unknown', revenue: 1000, ordersCount: 1 },

      { source: 'email', revenue: 500, ordersCount: 1 },
    ])

    expect(revenueBySource(undefined)).toEqual([])
  })

  test('when revenue ties, known sources precede unknown', () => {
    const orders = [
      { id: '1', total: 1000, status: 'completed', source: 'direct' },

      { id: '2', total: 1000, status: 'completed' },
    ]

    expect(revenueBySource(orders).map((r) => r.source)).toEqual([
      'direct',
      'unknown',
    ])
  })
})

describe('sortRevenueBySourceDescending', () => {
  test('orders by revenue; on tie, unknown last', () => {
    const sorted = sortRevenueBySourceDescending([
      { source: 'unknown', revenue: 100, ordersCount: 1 },

      { source: 'vk', revenue: 100, ordersCount: 1 },

      { source: 'yandex', revenue: 200, ordersCount: 1 },
    ])

    expect(sorted.map((r) => r.source)).toEqual(['yandex', 'vk', 'unknown'])
  })
})
