import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Cart from '../Cart'

beforeEach(() => {
  localStorage.setItem(
    'cart_items',
    JSON.stringify([
      { id: 1, name: 'Футболка Classic' },
      { id: 2, name: 'Джинсы Skinny' },
    ]),
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
