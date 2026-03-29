import { useState } from 'react'
import styles from './AdminForm.module.css'

const initialValues = {
  name: '',
  price: '',
  size: '',
  color: '',
  imageURL: '',
  description: '',
}

function AdminForm({ onSubmit, editProduct, onCancelEdit }) {
  const [values, setValues] = useState(() =>
    editProduct ? { ...editProduct, price: String(editProduct.price) } : initialValues,
  )
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!values.name.trim()) {
      setError('Название обязательно')
      return
    }
    if (Number(values.price) <= 0) {
      setError('Цена должна быть больше 0')
      return
    }
    setError('')
    onSubmit({ ...values, price: Number(values.price) })
    setValues(initialValues)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3>{editProduct ? 'Редактирование' : 'Новый товар'}</h3>
      {error && <p className={styles.error}>{error}</p>}
      <input name="name" placeholder="name" value={values.name} onChange={handleChange} />
      <input
        name="price"
        type="number"
        placeholder="price"
        value={values.price}
        onChange={handleChange}
      />
      <input name="size" placeholder="size" value={values.size} onChange={handleChange} />
      <input name="color" placeholder="color" value={values.color} onChange={handleChange} />
      <input
        name="imageURL"
        placeholder="imageURL"
        value={values.imageURL}
        onChange={handleChange}
      />
      <textarea
        name="description"
        placeholder="description"
        value={values.description}
        onChange={handleChange}
      />
      <button type="submit">Сохранить</button>
      {editProduct && (
        <button type="button" onClick={onCancelEdit}>
          Отмена
        </button>
      )}
    </form>
  )
}

export default AdminForm
