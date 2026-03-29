import { useState } from 'react'
import styles from './Cart.module.css'
import { getCartItems, removeFromCartByIndex } from '../utils/cartStorage'

function Cart({ isOpen, onClose }) {
  const [items, setItems] = useState(() => getCartItems())

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.drawer} onClick={(event) => event.stopPropagation()}>
        <h2>Корзина</h2>
        {items.length === 0 && <p>Пусто</p>}
        {items.map((item, index) => (
          <div className={styles.row} key={`${item.id}-${index}`}>
            <span>{item.name}</span>
            <button
              type="button"
              onClick={() => setItems(removeFromCartByIndex(index))}
            >
              Удалить
            </button>
          </div>
        ))}
      </aside>
    </div>
  )
}

export default Cart
