import { useMemo, useState } from 'react'
import {
  formatTopProductRevenueForDisplay,
  getTopProductsFromOrders,
} from '../../utils/orderItemsAnalytics'
import styles from './TopProductsBlock.module.css'

const LIMIT = 8

/**
 * Top products by line items from orders (same filtered `orders` as charts / recent table).
 * @param {{ orders: unknown[], loading?: boolean }} props
 */
function TopProductsBlock({ orders, loading = false }) {
  const [sortBy, setSortBy] = useState(/** @type {'revenue' | 'quantity'} */ ('revenue'))

  const rows = useMemo(
    () => getTopProductsFromOrders(orders, { limit: LIMIT, sortBy }),
    [orders, sortBy],
  )

  if (loading) {
    return (
      <section className={styles.section} aria-labelledby="top-products-heading">
        <div className={styles.grid}>
          <article className={styles.card}>
            <header className={styles.header}>
              <div>
                <h2 id="top-products-heading" className={styles.title}>
                  Топ товаров
                </h2>
                <p className={styles.subtitle}>Рейтинг позиций по выбранным фильтрам.</p>
              </div>
            </header>
            <div className={styles.skeleton} aria-hidden />
          </article>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section} aria-labelledby="top-products-heading">
      <div className={styles.grid}>
        <article className={styles.card}>
          <header className={styles.header}>
            <div>
              <h2 id="top-products-heading" className={styles.title}>
                Топ товаров
              </h2>
              <p className={styles.subtitle}>
                По заказам с заполненным составом, отбор как у показателей выручки.
              </p>
            </div>
            <div className={styles.sortWrap}>
              <div className={styles.sortRow} role="group" aria-label="Сортировка топа">
                <span className={styles.sortLabel}>Сортировка</span>
                <button
                  type="button"
                  className={
                    sortBy === 'revenue' ? `${styles.sortBtn} ${styles.sortBtnActive}` : styles.sortBtn
                  }
                  onClick={() => setSortBy('revenue')}
                >
                  По выручке
                </button>
                <button
                  type="button"
                  className={
                    sortBy === 'quantity' ? `${styles.sortBtn} ${styles.sortBtnActive}` : styles.sortBtn
                  }
                  onClick={() => setSortBy('quantity')}
                >
                  По количеству
                </button>
              </div>
            </div>
          </header>

          {rows.length === 0 ? (
            <p className={styles.empty} role="status">
              Нет данных по товарам для текущих фильтров.
            </p>
          ) : (
            <div className={`${styles.tableWrap} ${styles.scroll}`}>
              <table className={styles.table}>
                <colgroup>
                  <col className={styles.colProduct} />
                  <col className={styles.colMoney} />
                  <col className={styles.colQty} />
                  <col className={styles.colOrders} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col" className={styles.th}>
                      Товар
                    </th>
                    <th scope="col" className={`${styles.th} ${styles.thRight}`}>
                      Выручка
                    </th>
                    <th scope="col" className={`${styles.th} ${styles.thRight}`}>
                      Шт.
                    </th>
                    <th scope="col" className={`${styles.th} ${styles.thRight}`}>
                      Заказов
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.productKey} className={styles.row}>
                      <td className={styles.productCell}>
                        <div className={styles.productName} title={row.name}>
                          {row.name}
                        </div>
                        {row.productId != null && String(row.productId).trim() !== '' && (
                          <div className={styles.productMeta}>ID {String(row.productId)}</div>
                        )}
                      </td>
                      <td className={styles.cellRight}>{formatTopProductRevenueForDisplay(row)}</td>
                      <td className={styles.cellRight}>{row.totalQuantity}</td>
                      <td className={styles.cellRight}>{row.ordersContaining}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

export default TopProductsBlock
