import {
  formatOrderDateForDisplay,
  formatOrderSourceForDisplay,
  formatOrderTotalRub,
  getOrderCompositionDisplay,
  getOrderItemsCount,
  getOrderStatusPresentation,
  getOrderSortTimeMs,
  getRecentOrders,
} from './recentOrdersHelpers'

describe('getRecentOrders', () => {
  test('sorts by date descending and limits', () => {
    const rows = [
      { id: 'a', date: '2025-11-01', total: 100, status: 'completed', source: 'vk' },
      { id: 'b', date: '2025-11-03', total: 200, status: 'completed', source: 'vk' },
      { id: 'c', date: '2025-11-02', total: 150, status: 'completed', source: 'vk' },
    ]
    const recent = getRecentOrders(rows, { limit: 2 })
    expect(recent.map((r) => r.id)).toEqual(['b', 'c'])
  })

  test('non-array safe', () => {
    expect(getRecentOrders(null)).toEqual([])
  })
})

describe('getOrderItemsCount', () => {
  test('prefers itemsCount when valid', () => {
    expect(
      getOrderItemsCount({
        itemsCount: 4,
        items: [{ name: 'A', quantity: 1 }],
      }),
    ).toBe(4)
  })

  test('sums quantities when itemsCount missing', () => {
    expect(
      getOrderItemsCount({
        items: [
          { name: 'A', quantity: 2 },
          { name: 'B', quantity: '1' },
        ],
      }),
    ).toBe(3)
  })

  test('old order without items returns null', () => {
    expect(getOrderItemsCount({ total: 100 })).toBe(null)
  })

  test('empty items array returns 0', () => {
    expect(getOrderItemsCount({ items: [] })).toBe(0)
  })

  test('malformed items yields null when nothing valid', () => {
    expect(getOrderItemsCount({ items: [null, 'x', { quantity: 'nope' }] })).toBe(null)
  })

  test('treats line with name but no quantity as 1 unit', () => {
    expect(
      getOrderItemsCount({
        items: [{ name: 'Футболка' }, { name: 'Джинсы' }, { name: 'Куртка' }],
      }),
    ).toBe(3)
  })
})

describe('getOrderCompositionDisplay', () => {
  test('rich: count, two names, +N for extra lines', () => {
    const c = getOrderCompositionDisplay({
      items: [
        { name: 'Куртка Bomber', quantity: 1 },
        { name: 'Платье Summer', quantity: 1 },
        { name: 'Футболка', quantity: 2 },
      ],
    })
    expect(c.variant).toBe('rich')
    expect(c.text).toBe('4 ед. · Куртка Bomber, Платье Summer +1 ещё')
  })

  test('count-only when only itemsCount', () => {
    const c = getOrderCompositionDisplay({ itemsCount: 3 })
    expect(c).toEqual({
      text: '3 ед.',
      title: '3 ед.',
      variant: 'count-only',
    })
  })

  test('legacy when no composition data', () => {
    const c = getOrderCompositionDisplay({ total: 500, date: '2025-01-01', status: 'completed' })
    expect(c.variant).toBe('legacy')
    expect(c.text).toBe('Нет данных')
  })

  test('unreadable when items present but count cannot be derived', () => {
    const c = getOrderCompositionDisplay({
      items: [null, 'x', { quantity: 'nope' }],
    })
    expect(c.variant).toBe('unreadable')
    expect(c.text).toBe('Нет состава')
  })

  test('two lines, no extra suffix', () => {
    const c = getOrderCompositionDisplay({
      items: [
        { name: 'A', quantity: 1 },
        { name: 'B', quantity: 1 },
      ],
    })
    expect(c.text).toBe('2 ед. · A, B')
  })
})

describe('formatOrderSourceForDisplay', () => {
  test('maps known token', () => {
    expect(formatOrderSourceForDisplay({ source: 'yandex' })).toBe('Яндекс')
  })
})

describe('getOrderStatusPresentation', () => {
  test('slug, tone, Russian display for completed', () => {
    const p = getOrderStatusPresentation({ status: 'Completed' })
    expect(p.label).toBe('Completed')
    expect(p.displayLabel).toBe('Выполнен')
    expect(p.slug).toBe('completed')
    expect(p.tone).toBe('completed')
  })

  test('cancelled tone and Russian label', () => {
    const p = getOrderStatusPresentation({ status: 'canceled' })
    expect(p.tone).toBe('cancelled')
    expect(p.displayLabel).toBe('Отменён')
  })

  test('pending maps to processing tone and Ожидает', () => {
    const p = getOrderStatusPresentation({ status: 'pending' })
    expect(p.tone).toBe('processing')
    expect(p.displayLabel).toBe('Ожидает')
  })

  test('refunded tone and label', () => {
    const p = getOrderStatusPresentation({ status: 'refunded' })
    expect(p.tone).toBe('refunded')
    expect(p.displayLabel).toBe('Возврат')
  })

  test('unknown status keeps original as display', () => {
    const p = getOrderStatusPresentation({ status: 'pending_review' })
    expect(p.tone).toBe('default')
    expect(p.displayLabel).toBe('pending_review')
  })
})

describe('getOrderSortTimeMs', () => {
  test('ISO string parses', () => {
    expect(getOrderSortTimeMs({ date: '2025-11-10T10:00:00.000Z' })).toBe(
      Date.parse('2025-11-10T10:00:00.000Z'),
    )
  })
})

describe('formatOrderDateForDisplay', () => {
  test('calendar day string works', () => {
    const s = formatOrderDateForDisplay({ date: '2025-11-02' })
    expect(s).toMatch(/2025/)
    expect(s.length).toBeGreaterThan(4)
  })
})

describe('formatOrderTotalRub', () => {
  test('formats rub', () => {
    const s = formatOrderTotalRub({ total: 1299 })
    expect(s).toContain('1')
    expect(s).toContain('299')
  })
})
