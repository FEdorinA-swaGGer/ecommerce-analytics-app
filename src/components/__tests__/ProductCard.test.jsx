import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductCard from '../ProductCard'

const product = {
  id: 1,
  name: 'Футболка Classic',
  price: 1299,
  imageURL: 'https://example.com/image.jpg',
}

test('рендерит карточку товара из props', () => {
  render(
    <ProductCard
      product={product}
      onAddToCart={jest.fn()}
      onOpenDetails={jest.fn()}
    />,
  )

  expect(screen.getByText('Футболка Classic')).toBeInTheDocument()
  expect(screen.getByText('1299 ₽')).toBeInTheDocument()
})

test('вызывает onAddToCart по клику', async () => {
  const user = userEvent.setup()
  const onAddToCart = jest.fn()

  render(
    <ProductCard
      product={product}
      onAddToCart={onAddToCart}
      onOpenDetails={jest.fn()}
    />,
  )

  await user.click(screen.getByRole('button', { name: /добавить в корзину/i }))
  expect(onAddToCart).toHaveBeenCalledWith(product)
})
