import { useEffect, useState } from 'react'
import styles from './ProductModal.module.css'
import { getProductById } from '../services/api'

function ProductModal({ productId, onClose }) {
  const [product, setProduct] = useState(null)

  useEffect(() => {
    let mounted = true
    getProductById(productId).then((data) => {
      if (mounted) setProduct(data)
    })
    return () => {
      mounted = false
    }
  }, [productId])

  if (!productId) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
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
        <button type="button" className={styles.close} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  )
}

export default ProductModal
