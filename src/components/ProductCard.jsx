import styles from './ProductCard.module.css'

function ProductCard({ product, onAddToCart, onOpenDetails }) {
  return (
    <article
      className={`${styles.card} hover-lift`}
      data-testid="product-card"
    >
      <img src={product.imageURL} alt={product.name} className={styles.image} />
      <h3>{product.name}</h3>
      <p className={styles.price}>{product.price} ₽</p>
      <div className={styles.actions}>
        <button
          type="button"
          className="btn-animate btn-animate--muted"
          onClick={() => onOpenDetails(product.id)}
        >
          Подробнее
        </button>
        <button
          type="button"
          className={`${styles.primary} btn-animate btn-animate--primary`}
          onClick={() => onAddToCart(product)}
        >
          Добавить в корзину
        </button>
      </div>
    </article>
  )
}

export default ProductCard
