import {
  buildOrderLineItemsFromCart,
  buildOrderPayloadFromCart,
  computeCartTotalRub,
  DEFAULT_CHECKOUT_SOURCE,
  isAllowedCheckoutSource,
  validateCheckoutRequest,
} from './orderCheckout'

describe('computeCartTotalRub', () => {
  test('sums numeric prices', () => {
    expect(computeCartTotalRub([{ price: 1000 }, { price: 500.4 }])).toBe(1500)
  })

  test('non-array', () => {
    expect(computeCartTotalRub(null)).toBe(0)
  })
})

describe('validateCheckoutRequest', () => {
  test('rejects empty cart', () => {
    const r = validateCheckoutRequest({
      items: [],
      source: DEFAULT_CHECKOUT_SOURCE,
    })
    expect(r.ok).toBe(false)
  })

  test('rejects invalid source', () => {
    const r = validateCheckoutRequest({
      items: [{ price: 100 }],
      source: 'facebook',
    })
    expect(r.ok).toBe(false)
  })

  test('accepts valid', () => {
    const r = validateCheckoutRequest({ items: [{ price: 100 }], source: 'vk' })
    expect(r.ok).toBe(true)
  })
})

describe('buildOrderLineItemsFromCart', () => {
  test('merges same product id and sums itemsCount', () => {
    const { items, itemsCount } = buildOrderLineItemsFromCart([
      { id: '1', name: 'A', price: 100 },
      { id: '1', name: 'A', price: 100 },
      { id: '2', name: 'B', price: 50 },
    ])
    expect(itemsCount).toBe(3)
    expect(items).toHaveLength(2)
    expect(items.find((r) => r.id === '1')).toEqual({
      productId: '1',
      id: '1',
      name: 'A',
      price: 100,
      quantity: 2,
    })
  })

  test('uses title when name missing', () => {
    const { items } = buildOrderLineItemsFromCart([{ id: 'x', title: 'T', price: 10 }])
    expect(items[0].name).toBe('T')
  })

  test('separate lines when id missing (per cart row)', () => {
    const { items, itemsCount } = buildOrderLineItemsFromCart([
      { name: 'Gift', price: 99 },
      { name: 'Gift', price: 99 },
    ])
    expect(itemsCount).toBe(2)
    expect(items).toHaveLength(2)
  })
})

describe('buildOrderPayloadFromCart', () => {
  test('shape, source, items and itemsCount', () => {
    const payload = buildOrderPayloadFromCart({
      items: [{ id: 'a', name: 'One', price: 1299 }, { price: 2399 }],
      source: 'email',
    })
    expect(payload.total).toBe(3698)
    expect(payload.status).toBe('completed')
    expect(payload.source).toBe('email')
    expect(payload.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(payload.itemsCount).toBe(2)
    expect(payload.items).toHaveLength(2)
    expect(payload.items[0]).toMatchObject({
      productId: 'a',
      name: 'One',
      price: 1299,
      quantity: 1,
    })
  })
})

describe('isAllowedCheckoutSource', () => {
  test('vk allowed', () => {
    expect(isAllowedCheckoutSource('vk')).toBe(true)
  })
})
