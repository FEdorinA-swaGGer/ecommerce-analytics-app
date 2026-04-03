import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

function formatRub(value) {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return rubFormatter.format(numeric)
}

export default function RevenueLineChart({
  data = [],
  loading = false,
  empty = false,
  placeholderClassName,
  emptyClassName,
}) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {loading && (
        <div
          data-testid="revenue-line-skeleton"
          className={placeholderClassName}
          aria-label="Загрузка графика"
        />
      )}
      {!loading && empty && (
        <div data-testid="revenue-line-empty" className={emptyClassName}>
          Нет данных для отображения
        </div>
      )}
      {!loading && !empty && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip formatter={(value) => formatRub(value)} />
            <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
