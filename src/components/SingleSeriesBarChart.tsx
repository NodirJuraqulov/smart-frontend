import { theme as antdTheme } from 'antd'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type DataKey,
} from 'recharts'
import { useTheme } from '@/contexts/ThemeContext'
import { colorBrandAuto } from '@/theme/palette'

interface SingleSeriesBarChartProps<T extends object> {
  data: T[]
  xKey: DataKey<T>
  yKey: DataKey<T>
  xTickFormatter?: (value: string | number) => string
  yTickFormatter?: (value: number) => string
  tooltipFormatter?: (value: number) => string
  xInterval?: number
}

export default function SingleSeriesBarChart<T extends object>({
  data,
  xKey,
  yKey,
  xTickFormatter,
  yTickFormatter,
  tooltipFormatter,
  xInterval,
}: SingleSeriesBarChartProps<T>) {
  const { mode } = useTheme()
  const { token } = antdTheme.useToken()
  const barColor = colorBrandAuto[mode]

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid
          vertical={false}
          stroke={token.colorBorder}
          strokeDasharray="0"
        />
        <XAxis
          dataKey={xKey}
          tickFormatter={xTickFormatter}
          interval={xInterval}
          tick={{ fill: token.colorTextTertiary, fontSize: 12 }}
          stroke={token.colorBorder}
          tickLine={false}
        />
        <YAxis
          tickFormatter={yTickFormatter}
          tick={{ fill: token.colorTextTertiary, fontSize: 12 }}
          stroke={token.colorBorder}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: token.colorFillTertiary }}
          contentStyle={{
            backgroundColor: token.colorBgElevated,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: token.borderRadiusSM,
          }}
          labelStyle={{ color: token.colorText }}
          itemStyle={{ color: token.colorText }}
          formatter={(value) =>
            tooltipFormatter ? tooltipFormatter(Number(value)) : value
          }
        />
        <Bar
          dataKey={yKey}
          fill={barColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
