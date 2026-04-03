import { useCallback, useEffect, useRef, useState } from 'react'
import { createOrder } from '../services/api'
import styles from './Cart.module.css'
import {
  buildOrderPayloadFromCart,
  CHECKOUT_SOURCE_OPTIONS,
  computeCartTotalRub,
  DEFAULT_CHECKOUT_SOURCE,
  validateCheckoutRequest,
} from '../utils/orderCheckout'
import {
  clearCart,
  getCartItems,
  removeFromCartByIndex,
} from '../utils/cartStorage'

const CLOSE_FALLBACK_MS = 380

function Cart({ isOpen, onClose }) {
  const [items, setItems] = useState(() => getCartItems())
  const [checkoutSource, setCheckoutSource] = useState(DEFAULT_CHECKOUT_SOURCE)
  const [checkoutError, setCheckoutError] = useState(null)
  const [checkoutInProgress, setCheckoutInProgress] = useState(false)
  const [closing, setClosing] = useState(false)
  const closeFallbackRef = useRef(null)
  const requestCloseRef = useRef(() => {})

  const show = isOpen || closing

  useEffect(() => {
    return () => {
      if (closeFallbackRef.current) {
        clearTimeout(closeFallbackRef.current)
        closeFallbackRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined
    const id = requestAnimationFrame(() => {
      setItems(getCartItems())
      setCheckoutError(null)
    })
    return () => cancelAnimationFrame(id)
  }, [isOpen])

  const finishClose = () => {
    if (closeFallbackRef.current) {
      clearTimeout(closeFallbackRef.current)
      closeFallbackRef.current = null
    }
    setClosing(false)
    onClose()
  }

  const requestClose = () => {
    if (closing) return
    setClosing(true)
    closeFallbackRef.current = setTimeout(finishClose, CLOSE_FALLBACK_MS)
  }

  requestCloseRef.current = requestClose

  const runCheckout = useCallback(async () => {
    const validation = validateCheckoutRequest({
      items,
      source: checkoutSource,
    })
    if (!validation.ok) {
      setCheckoutError(validation.error)
      return
    }
    setCheckoutInProgress(true)
    setCheckoutError(null)
    try {
      const payload = buildOrderPayloadFromCart({
        items,
        source: checkoutSource,
      })
      console.log('ORDER PAYLOAD:', payload)
      await createOrder(payload)
      setItems(clearCart())
      requestCloseRef.current()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setCheckoutError(`Не удалось оформить заказ: ${message}`)
    } finally {
      setCheckoutInProgress(false)
    }
  }, [items, checkoutSource])

  const handleAnimationEnd = (event) => {
    if (!closing) return
    if (event.target !== event.currentTarget) return
    const name = String(event.animationName || '')
    if (!name.includes('ui-cart-overlay-out')) return
    finishClose()
  }

  if (!show) {
    return null
  }

  const totalRub = computeCartTotalRub(items)

  return (
    <div
      className={`${styles.overlay} ui-cart-backdrop ui-cart-root ${
        closing ? 'ui-cart--out' : 'ui-cart--in'
      }`}
      role="presentation"
      onClick={requestClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <aside
        className={`${styles.drawer} ui-cart-drawer`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2>Корзина</h2>
        {items.length === 0 && <p>Пусто</p>}
        {items.map((item, index) => (
          <div className={styles.row} key={`${item.id}-${index}`}>
            <span>{item.name}</span>
            <button
              type="button"
              className="btn-animate btn-animate--primary"
              disabled={checkoutInProgress}
              onClick={() => setItems(removeFromCartByIndex(index))}
            >
              Удалить
            </button>
          </div>
        ))}

        {items.length > 0 && (
          <>
            <div className={styles.sourceSection}>
              <p className={styles.sourceLabel}>Источник заказа</p>
              <div
                className={styles.sourcePills}
                role="group"
                aria-label="Источник заказа"
              >
                {CHECKOUT_SOURCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.sourcePill} ${
                      checkoutSource === opt.value
                        ? styles.sourcePillActive
                        : ''
                    }`}
                    disabled={checkoutInProgress}
                    onClick={() => setCheckoutSource(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <p className={styles.totalLine}>
              Итого: <strong>{totalRub} ₽</strong>
            </p>

            {checkoutError && (
              <p className={styles.checkoutError} role="alert">
                {checkoutError}
              </p>
            )}

            <button
              type="button"
              className={`${styles.checkoutBtn} btn-animate btn-animate--primary`}
              disabled={checkoutInProgress || items.length === 0}
              onClick={() => void runCheckout()}
            >
              {checkoutInProgress ? 'Оформление…' : 'Оформить заказ'}
            </button>
          </>
        )}
      </aside>
    </div>
  )
}

export default Cart
