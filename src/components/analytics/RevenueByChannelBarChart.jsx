import {
  Bar,
  BarChart,
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

const SOURCE_DISPLAY_LABELS = {
  instagram: 'VK',
  google: 'Яндекс',
}

function formatSourceAxisLabel(value) {
  if (typeof value !== 'string') return String(value ?? '')
  const key = value.trim().toLowerCase()
  return SOURCE_DISPLAY_LABELS[key] ?? value
}

function formatRub(value) {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return rubFormatter.format(numeric)
}

export default function RevenueByChannelBarChart({
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
          data-testid="revenue-channel-skeleton"
          className={placeholderClassName}
          aria-label="Загрузка графика"
        />
      )}
      {!loading && empty && (
        <div data-testid="revenue-channel-empty" className={emptyClassName}>
          Нет данных для отображения
        </div>
      )}
      {!loading && !empty && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="source" tickFormatter={formatSourceAxisLabel} />
            <YAxis />
            <Tooltip
              formatter={(value) => formatRub(value)}
              labelFormatter={(label) => formatSourceAxisLabel(label)}
            />
            <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
