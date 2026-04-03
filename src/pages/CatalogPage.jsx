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
  }

  return (
    <main className={styles.page}>
      <h1 className="page-enter">Каталог одежды</h1>
      <div className={`${styles.grid} page-enter-stagger`}>
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
        <ProductModal
          key={selectedId}
          productId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  )
}

export default CatalogPage
