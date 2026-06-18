'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  COLORS,
  instrumentDistribution,
  caseStatusDistribution,
} from '@/lib/rffe-data'

const tooltipStyle = {
  backgroundColor: '#181825',
  border: '1px solid #45475a',
  borderRadius: 8,
  fontSize: 12,
  color: '#cdd6f4',
}

interface DonutData {
  name: string
  value: number
  color: string
}

interface CaseData {
  name: string
  已测: number
  未测: number
}

interface InstrumentDonutProps {
  data?: DonutData[]
}

interface CaseStatusBarsProps {
  data?: CaseData[]
}

export function InstrumentDonut({ data: propData }: InstrumentDonutProps = {}) {
  const data = propData || instrumentDistribution()
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={3}
          stroke="#1e1e2e"
          strokeWidth={2}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number, n) => [`${v} 项 (${total > 0 ? Math.round((v / total) * 100) : 0}%)`, n]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: COLORS.muted }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function CaseStatusBars({ data: propData }: CaseStatusBarsProps = {}) {
  const data = propData || caseStatusDistribution()
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12 }}>
        <CartesianGrid stroke={COLORS.grid} horizontal={false} />
        <XAxis type="number" stroke={COLORS.muted} fontSize={11} />
        <YAxis
          type="category"
          dataKey="name"
          stroke={COLORS.muted}
          fontSize={10}
          width={92}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(137,180,250,0.06)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
        <Bar dataKey="已测" stackId="a" fill={COLORS.green} radius={[0, 0, 0, 0]} />
        <Bar dataKey="未测" stackId="a" fill={COLORS.yellow} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
