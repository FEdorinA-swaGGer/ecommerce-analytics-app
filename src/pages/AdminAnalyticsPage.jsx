import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadAdminAnalyticsData } from '../services/analyticsData'
import { computeAnalytics } from '../utils/analyticsCalculations'
import { ANALYTICS_SOURCE_LABEL_BY_TOKEN } from '../utils/analyticsSourceLabels'
import {
  ANALYTICS_SOURCE_ALL,
  createDefaultAnalyticsFilters,
  filterOrdersByAnalyticsFilters,
  filterSessionsByAnalyticsFilters,
} from '../utils/analyticsFilters'
import { logoutAdmin } from '../utils/auth'
import RecentOrdersTable from '../components/analytics/RecentOrdersTable'
import TopProductsBlock from '../components/analytics/TopProductsBlock'
import RevenueByChannelBarChart from '../components/analytics/RevenueByChannelBarChart'
import RevenueLineChart from '../components/analytics/RevenueLineChart'
import styles from './AdminAnalyticsPage.module.css'

const SOURCE_FILTER_OPTIONS = [
  { value: ANALYTICS_SOURCE_ALL, label: 'Все источники' },
  ...Object.keys(ANALYTICS_SOURCE_LABEL_BY_TOKEN).map((value) => ({
    value,
    label: ANALYTICS_SOURCE_LABEL_BY_TOKEN[value],
  })),
]

function AdminAnalyticsPage() {
  const navigate = useNavigate()
  const [loadPhase, setLoadPhase] = useState('loading')
  const [orders, setOrders] = useState([])
  const [sessions, setSessions] = useState([])
  const [loadErrors, setLoadErrors] = useState([])
  const [filters, setFilters] = useState(createDefaultAnalyticsFilters)

  useEffect(() => {
    let cancelled = false

    loadAdminAnalyticsData()
      .then((result) => {
        if (cancelled) return
        setOrders(result.orders)
        setSessions(result.sessions)
        setLoadErrors(result.errors)
        setLoadPhase('ready')
      })
      .catch((err) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        setOrders([])
        setSessions([])
        setLoadErrors([`Сбой загрузки аналитики: ${message}`])
        setLoadPhase('ready')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filteredOrders = useMemo(
    () => filterOrdersByAnalyticsFilters(orders, filters),
    [orders, filters],
  )
  const filteredSessions = useMemo(
    () => filterSessionsByAnalyticsFilters(sessions, filters),
    [sessions, filters],
  )
  const analytics = useMemo(
    () => computeAnalytics({ orders: filteredOrders, sessions: filteredSessions }),
    [filteredOrders, filteredSessions],
  )
  const isLoading = loadPhase === 'loading'

  return (
    <main className={styles.page}>
      <div className={`${styles.headline} page-enter`}>
        <h1>Аналитика</h1>
        <div className={styles.headActions}>
          <Link
            to="/admin"
            className={`${styles.secondaryLink} btn-animate btn-animate--outline`}
          >
            Админ-панель
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
      <p className={`${styles.subtitle} page-enter page-enter-delay-1`}>
        Сводка продаж, заказов и товаров
      </p>

      {loadPhase === 'loading' && (
        <p className={styles.statusLine} data-testid="analytics-loading">
          Загрузка данных…
        </p>
      )}

      {loadPhase === 'ready' && loadErrors.length > 0 && (
        <div className={styles.dataWarning} role="alert">
          {loadErrors.map((message) => (
            <p key={message} className={styles.dataWarningText}>
              {message}
            </p>
          ))}
        </div>
      )}

      {loadPhase === 'ready' && (
        <div className={`${styles.filterToolbar} page-enter page-enter-delay-1`}>
          <p className={styles.filterToolbarTitle}>Фильтры</p>
          <div className={styles.filterRow}>
            <div className={styles.filterField}>
              <label className={styles.filterLabel} htmlFor="analytics-filter-source">
                Источник
              </label>
              <select
                id="analytics-filter-source"
                className={styles.filterSelect}
                value={filters.source}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, source: e.target.value }))
                }
              >
                {SOURCE_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.filterField}>
              <label className={styles.filterLabel} htmlFor="analytics-filter-from">
                Дата с
              </label>
              <input
                id="analytics-filter-from"
                type="date"
                className={styles.filterDate}
                value={filters.dateFrom}
                max={filters.dateTo || undefined}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
              />
            </div>
            <div className={styles.filterField}>
              <label className={styles.filterLabel} htmlFor="analytics-filter-to">
                Дата по
              </label>
              <input
                id="analytics-filter-to"
                type="date"
                className={styles.filterDate}
                value={filters.dateTo}
                min={filters.dateFrom || undefined}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                }
              />
            </div>
            <div className={styles.filterActions}>
              <button
                type="button"
                className={styles.filterReset}
                onClick={() => setFilters(createDefaultAnalyticsFilters())}
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>
      )}

      {loadPhase === 'ready' && (
        <div className={`${styles.kpiGrid} page-enter-stagger`}>
          {analytics.kpi.map(({ key, label, value }) => (
            <article key={key} className={`${styles.kpiCard} hover-lift`}>
              <p className={styles.kpiLabel}>{label}</p>
              <p className={styles.kpiValue}>{value}</p>
            </article>
          ))}
        </div>
      )}

      <section className={`${styles.chartsGrid} page-enter-stagger`} aria-label="Графики аналитики">
        <article className={`${styles.chartCard} hover-lift`}>
          <header className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Выручка по дням</h2>
          </header>
          <div className={styles.chartBody}>
            <RevenueLineChart
              data={analytics.salesByDay}
              loading={isLoading}
              empty={!isLoading && analytics.salesByDay.length === 0}
              placeholderClassName={styles.chartSkeleton}
              emptyClassName={styles.chartEmpty}
            />
          </div>
        </article>

        <article className={`${styles.chartCard} hover-lift`}>
          <header className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Выручка по источникам</h2>
          </header>
          <div className={styles.chartBody}>
            <RevenueByChannelBarChart
              data={analytics.revenueBySource}
              loading={isLoading}
              empty={!isLoading && analytics.revenueBySource.length === 0}
              placeholderClassName={styles.chartSkeleton}
              emptyClassName={styles.chartEmpty}
            />
          </div>
        </article>
      </section>

      <RecentOrdersTable orders={filteredOrders} loading={isLoading} limit={10} />

      <TopProductsBlock orders={filteredOrders} loading={isLoading} />
    </main>
  )
}

export default AdminAnalyticsPage
