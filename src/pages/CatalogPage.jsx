import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'
import { getProducts } from '../services/api'
import { addToCart } from '../utils/cartStorage'
import styles from './CatalogPage.module.css'

function CatalogPage() {
  const [products, setProducts] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    getProducts().then(setProducts)
  }, [])

  const handleAddToCart = (product) => {
    addToCart(product)
    window.dispatchEvent(new Event('storage'))
  }

  return (
    <main className={styles.page}>
      <h1>Каталог одежды</h1>
      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            onOpenDetails={setSelectedId}
          />
        ))}
      </div>
      {selectedId && (
        <ProductModal productId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </main>
  )
}

export default CatalogPage
