import styles from './AdminTable.module.css'

function AdminTable({ products, onEdit, onDelete }) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Название</th>
            <th>Цена</th>
            <th>Размер</th>
            <th>Цвет</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.price}</td>
              <td>{product.size}</td>
              <td>{product.color}</td>
              <td>
                <button type="button" onClick={() => onEdit(product)}>
                  Редактировать
                </button>
                <button type="button" onClick={() => onDelete(product.id)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AdminTable
