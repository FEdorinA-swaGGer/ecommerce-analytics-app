import { useMemo } from 'react'
import {
  formatOrderDateForDisplay,
  formatOrderSourceForDisplay,
  formatOrderTotalRub,
  getOrderCompositionDisplay,
  getOrderStatusPresentation,
  getRecentOrders,
} from '../../utils/recentOrdersHelpers'
import styles from './RecentOrdersTable.module.css'

const STATUS_BADGE_CLASS = {
  completed: styles.badgeCompleted,
  processing: styles.badgeProcessing,
  cancelled: styles.badgeCancelled,
  shipped: styles.badgeShipped,
  refunded: styles.badgeRefunded,
  default: styles.badgeDefault,
}

const COMPOSITION_CELL_CLASS = {
  rich: styles.compositionRich,
  'count-only': styles.compositionCountOnly,
  legacy: styles.compositionLegacy,
  unreadable: styles.compositionUnreadable,
}

/**
 * Recent orders for the admin analytics dashboard (uses pre-filtered `orders`).
 * @param {{ orders: unknown[], loading?: boolean, limit?: number }} props
 */
function RecentOrdersTable({ orders, loading = false, limit = 10 }) {
  const rows = useMemo(() => getRecentOrders(orders, { limit }), [orders, limit])

  if (loading) {
    return (
      <section className={styles.section} aria-labelledby="recent-orders-heading">
        <article className={`${styles.card} hover-lift`}>
          <header className={styles.header}>
            <h2 id="recent-orders-heading" className={styles.title}>
              Последние заказы
            </h2>
            <p className={styles.subtitle}>Список обновляется по выбранным фильтрам.</p>
          </header>
          <div className={styles.skeleton} aria-hidden />
        </article>
      </section>
    )
  }

  return (
    <section className={styles.section} aria-labelledby="recent-orders-heading">
      <article className={`${styles.card} hover-lift`}>
        <header className={styles.header}>
          <h2 id="recent-orders-heading" className={styles.title}>
            Последние заказы
          </h2>
          <p className={styles.subtitle}>
            До {limit} последних заказов — в рамках текущих фильтров.
          </p>
        </header>

        {rows.length === 0 ? (
          <p className={styles.empty} role="status">
            Нет заказов по текущим фильтрам.
          </p>
        ) : (
          <div className={styles.scroll}>
            <table className={styles.table}>
              <colgroup>
                <col className={styles.colDate} />
                <col className={styles.colSource} />
                <col className={styles.colStatus} />
                <col className={styles.colSum} />
                <col className={styles.colComposition} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className={styles.th}>
                    Дата
                  </th>
                  <th scope="col" className={styles.th}>
                    Источник
                  </th>
                  <th scope="col" className={styles.th}>
                    Статус
                  </th>
                  <th scope="col" className={`${styles.th} ${styles.thRight} ${styles.thSum}`}>
                    Сумма
                  </th>
                  <th scope="col" className={`${styles.th} ${styles.thComposition}`}>
                    Состав
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order, index) => {
                  const key =
                    order && typeof order === 'object' && order.id != null
                      ? String(order.id)
                      : `row-${index}`
                  const status = getOrderStatusPresentation(order)
                  const composition = getOrderCompositionDisplay(order)
                  const badgeToneClass = STATUS_BADGE_CLASS[status.tone] ?? STATUS_BADGE_CLASS.default
                  const compositionToneClass =
                    COMPOSITION_CELL_CLASS[composition.variant] ?? COMPOSITION_CELL_CLASS.rich
                  const statusTitle =
                    status.label !== '—' && status.displayLabel !== status.label
                      ? `${status.displayLabel} · ${status.label}`
                      : status.displayLabel

                  return (
                    <tr key={key} className={styles.row}>
                      <td className={styles.cell}>{formatOrderDateForDisplay(order)}</td>
                      <td className={styles.cell}>{formatOrderSourceForDisplay(order)}</td>
                      <td className={styles.cell}>
                        <span
                          className={`${styles.badge} ${badgeToneClass}`}
                          data-status={status.slug}
                          title={statusTitle}
                        >
                          {status.displayLabel}
                        </span>
                      </td>
                      <td className={`${styles.cell} ${styles.cellRight} ${styles.cellSum}`}>
                        {formatOrderTotalRub(order)}
                      </td>
                      <td className={`${styles.cell} ${styles.cellComposition} ${compositionToneClass}`}>
                        <span
                          className={styles.compositionInner}
                          title={composition.title ?? composition.text}
                        >
                          {composition.text}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  )
}

export default RecentOrdersTable
