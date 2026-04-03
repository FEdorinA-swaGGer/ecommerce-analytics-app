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
        <Link to="/" className={`${styles.logo} nav-brand-animate`}>
          Clothify Store
        </Link>
        <nav className={styles.nav}>
          <button
            type="button"
            className={`${styles.cartButton} btn-animate btn-animate--nav`}
            onClick={() => setIsCartOpen(true)}
          >
            Корзина ({cartCount})
          </button>
          <Link
            to="/admin/login"
            className={`${styles.adminLink} btn-animate btn-animate--nav`}
          >
            Админ
          </Link>
        </nav>
      </header>
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}

export default Header
