import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('../../services/api', () => ({
  createOrder: jest.fn(() =>
    Promise.resolve({
      id: 'ord-test',
      date: '2026-04-02',
      total: 100,
      status: 'completed',
      source: 'vk',
    })
  ),
}))

import Cart from '../Cart'

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.setItem(
    'cart_items',
    JSON.stringify([
      { id: 1, name: 'Футболка Classic', price: 1299 },
      { id: 2, name: 'Джинсы Skinny', price: 2599 },
    ])
  )
})

test('показывает товары из localStorage', () => {
  render(<Cart isOpen onClose={jest.fn()} />)
  expect(screen.getByText('Футболка Classic')).toBeInTheDocument()
  expect(screen.getByText('Джинсы Skinny')).toBeInTheDocument()
})

test('удаляет товар из корзины по кнопке', async () => {
  const user = userEvent.setup()
  render(<Cart isOpen onClose={jest.fn()} />)

  await user.click(screen.getAllByRole('button', { name: /удалить/i })[0])

  expect(screen.queryByText('Футболка Classic')).not.toBeInTheDocument()
  expect(JSON.parse(localStorage.getItem('cart_items'))).toHaveLength(1)
})
