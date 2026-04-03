import {
  ANALYTICS_SOURCE_ALL,
  createDefaultAnalyticsFilters,
  filterOrdersByAnalyticsFilters,
  filterSessionsByAnalyticsFilters,
  resolveAnalyticsDateBounds,
} from './analyticsFilters'

describe('resolveAnalyticsDateBounds', () => {
  test('returns null when both empty', () => {
    expect(resolveAnalyticsDateBounds('', '')).toBeNull()
  })

  test('swaps when from after to', () => {
    expect(resolveAnalyticsDateBounds('2025-12-10', '2025-12-01')).toEqual({
      fromBound: '2025-12-01',
      toBound: '2025-12-10',
    })
  })

  test('allows open-ended lower bound', () => {
    expect(resolveAnalyticsDateBounds('', '2025-11-15')).toEqual({
      fromBound: null,
      toBound: '2025-11-15',
    })
  })
})

describe('filterOrdersByAnalyticsFilters', () => {
  const orders = [
    {
      id: '1',
      date: '2025-11-01',
      source: 'vk',
      total: 100,
      status: 'completed',
    },
    {
      id: '2',
      date: '2025-11-20',
      source: 'email',
      total: 200,
      status: 'completed',
    },
    {
      id: '3',
      date: '2025-12-05',
      source: 'vk',
      total: 300,
      status: 'completed',
    },
  ]

  test('source all keeps list subject only to date', () => {
    const f = {
      ...createDefaultAnalyticsFilters(),
      dateFrom: '2025-11-15',
      dateTo: '',
    }
    expect(filterOrdersByAnalyticsFilters(orders, f).map((o) => o.id)).toEqual([
      '2',
      '3',
    ])
  })

  test('source vk and date range', () => {
    const f = {
      source: 'vk',
      dateFrom: '2025-11-01',
      dateTo: '2025-11-30',
    }
    expect(filterOrdersByAnalyticsFilters(orders, f).map((o) => o.id)).toEqual([
      '1',
    ])
  })

  test('non-array orders yields []', () => {
    expect(
      filterOrdersByAnalyticsFilters(null, createDefaultAnalyticsFilters())
    ).toEqual([])
  })
})

describe('filterSessionsByAnalyticsFilters', () => {
  const sessions = [
    {
      id: 'a',
      date: '2025-11-01T10:00:00.000Z',
      source: 'vk',
      converted: true,
    },
    {
      id: 'b',
      date: '2025-11-25T10:00:00.000Z',
      source: 'yandex',
      converted: false,
    },
  ]

  test('filters by session day utc and source', () => {
    const f = {
      source: 'vk',
      dateFrom: '2025-11-01',
      dateTo: '2025-11-01',
    }
    expect(filterSessionsByAnalyticsFilters(sessions, f)).toHaveLength(1)
    expect(filterSessionsByAnalyticsFilters(sessions, f)[0].id).toBe('a')
  })

  test('all source only applies dates', () => {
    const f = {
      source: ANALYTICS_SOURCE_ALL,
      dateFrom: '2025-11-20',
      dateTo: '',
    }
    expect(
      filterSessionsByAnalyticsFilters(sessions, f).map((s) => s.id)
    ).toEqual(['b'])
  })
})
