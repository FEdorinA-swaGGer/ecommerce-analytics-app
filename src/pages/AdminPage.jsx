import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminForm from '../components/AdminForm'
import AdminTable from '../components/AdminTable'
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '../services/api'
import { logoutAdmin } from '../utils/auth'
import styles from './AdminPage.module.css'

function AdminPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [editProduct, setEditProduct] = useState(null)

  const loadProducts = () => getProducts().then(setProducts)

  useEffect(() => {
    loadProducts()
  }, [])

  const handleSave = async (payload) => {
    if (editProduct) {
      await updateProduct(editProduct.id, payload)
      setEditProduct(null)
    } else {
      await createProduct(payload)
    }
    await loadProducts()
  }

  const handleDelete = async (id) => {
    await deleteProduct(id)
    await loadProducts()
  }

  return (
    <main className={styles.page}>
      <div className={`${styles.headline} page-enter`}>
        <h1>Админ-панель</h1>
        <div className={styles.headActions}>
          <Link
            to="/admin/analytics"
            className={`${styles.secondaryLink} btn-animate btn-animate--outline`}
          >
            Аналитика
          </Link>
          <button
            type="button"
            className="btn-animate btn-animate--primary"
            onClick={() => {
              logoutAdmin()
              navigate('/admin/login')
            }}
          >
            Выйти
          </button>
        </div>
      </div>
      <div className={`${styles.layout} page-enter-stagger`}>
        <AdminForm
          key={editProduct?.id ?? 'new-product'}
          onSubmit={handleSave}
          editProduct={editProduct}
          onCancelEdit={() => setEditProduct(null)}
        />
        <AdminTable
          products={products}
          onEdit={setEditProduct}
          onDelete={handleDelete}
        />
      </div>
    </main>
  )
}

export default AdminPage
