import { useEffect, useRef, useState } from 'react'
import styles from './ProductModal.module.css'
import { getProductById } from '../services/api'

const CLOSE_FALLBACK_MS = 380

function ProductModal({ productId, onClose }) {
  const [product, setProduct] = useState(null)
  const [closing, setClosing] = useState(false)
  const closeFallbackRef = useRef(null)

  useEffect(() => {
    return () => {
      if (closeFallbackRef.current) {
        clearTimeout(closeFallbackRef.current)
        closeFallbackRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    let mounted = true
    if (productId) {
      getProductById(productId).then((data) => {
        if (mounted) setProduct(data)
      })
    }
    return () => {
      mounted = false
    }
  }, [productId])

  const finishClose = () => {
    if (closeFallbackRef.current) {
      clearTimeout(closeFallbackRef.current)
      closeFallbackRef.current = null
    }
    onClose()
  }

  const requestClose = () => {
    if (closing) return
    setClosing(true)
    closeFallbackRef.current = setTimeout(finishClose, CLOSE_FALLBACK_MS)
  }

  const handleAnimationEnd = (event) => {
    if (!closing) return
    if (event.target !== event.currentTarget) return
    const name = String(event.animationName || '')
    if (!name.includes('ui-modal-overlay-out')) return
    finishClose()
  }

  if (!productId) return null

  return (
    <div
      className={`${styles.overlay} ui-modal-backdrop ui-modal-root ${
        closing ? 'ui-modal--out' : 'ui-modal--in'
      }`}
      role="presentation"
      onClick={requestClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        className={`${styles.modal} ui-modal-panel`}
        onClick={(event) => event.stopPropagation()}
      >
        {!product ? (
          <p>Загрузка...</p>
        ) : (
          <>
            <img src={product.imageURL} alt={product.name} className={styles.image} />
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p>
              Цена: <strong>{product.price} ₽</strong>
            </p>
            <p>
              Размер: {product.size}, Цвет: {product.color}
            </p>
          </>
        )}
        <button
          type="button"
          className={`${styles.close} btn-animate btn-animate--primary`}
          onClick={requestClose}
        >
          Закрыть
        </button>
      </div>
    </div>
  )
}

export default ProductModal
