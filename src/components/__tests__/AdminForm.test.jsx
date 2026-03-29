import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminForm from '../AdminForm'

test('показывает ошибку если name пустой', async () => {
  const user = userEvent.setup()
  render(<AdminForm onSubmit={jest.fn()} editProduct={null} onCancelEdit={jest.fn()} />)

  await user.type(screen.getByPlaceholderText('price'), '1000')
  await user.click(screen.getByRole('button', { name: /сохранить/i }))

  expect(screen.getByText('Название обязательно')).toBeInTheDocument()
})

test('показывает ошибку если price <= 0', async () => {
  const user = userEvent.setup()
  render(<AdminForm onSubmit={jest.fn()} editProduct={null} onCancelEdit={jest.fn()} />)

  await user.type(screen.getByPlaceholderText('name'), 'Тест')
  await user.type(screen.getByPlaceholderText('price'), '0')
  await user.click(screen.getByRole('button', { name: /сохранить/i }))

  expect(screen.getByText('Цена должна быть больше 0')).toBeInTheDocument()
})
