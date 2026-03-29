import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Cart from './Cart'
import styles from './Header.module.css'
import { getCartItems } from '../utils/cartStorage'

function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartCount, setCartCount] = useState(() => getCartItems().length)

  useEffect(() => {
    const onStorage = () => setCartCount(getCartItems().length)
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          Clothify Store
        </Link>
        <nav className={styles.nav}>
          <button
            type="button"
            className={styles.cartButton}
            onClick={() => setIsCartOpen(true)}
          >
            Корзина ({cartCount})
          </button>
          <Link to="/admin/login" className={styles.adminLink}>
            Админ
          </Link>
        </nav>
      </header>
      {isCartOpen && <Cart isOpen onClose={() => setIsCartOpen(false)} />}
    </>
  )
}

export default Header
