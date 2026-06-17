'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  ComposedChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  COLORS,
  lnaDroopHeatmap,
  ip3Data,
  nfData,
  phaseErrorData,
} from '@/lib/rffe-data'
import { cn } from '@/lib/utils'

const tooltipStyle = {
  backgroundColor: '#181825',
  border: '1px solid #45475a',
  borderRadius: 8,
  fontSize: 12,
  color: '#cdd6f4',
}
const axis = { stroke: COLORS.muted, fontSize: 11 }

// LNA Droop 热力图（器件 × 增益档）
export function LnaDroopHeatmap() {
  const rows = lnaDroopHeatmap()
  const gains = rows[0]?.values.map((v) => v.gain) ?? []
  const all = rows.flatMap((r) => r.values.map((v) => v.droop))
  const min = Math.min(...all)
  const max = Math.max(...all)

  const color = (v: number) => {
    const t = (v - min) / (max - min || 1)
    // 低 droop 偏绿，高 droop 偏红
    if (t < 0.33) return 'bg-rf-green/70'
    if (t < 0.66) return 'bg-rf-yellow/60'
    return 'bg-rf-red/70'
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[420px] gap-[3px]"
        style={{ gridTemplateColumns: `120px repeat(${gains.length}, 1fr)` }}
      >
        <div />
        {gains.map((g) => (
          <div key={g} className="pb-1 text-center text-[11px] text-muted-foreground">
            {g}
          </div>
        ))}
        {rows.map((r) => (
          <div key={r.device} className="contents">
            <div className="flex items-center pr-2 text-[11px] font-medium text-foreground">
              {r.device}
            </div>
            {r.values.map((v) => (
              <div
                key={v.gain}
                title={`${r.device} ${v.gain} — Droop ${v.droop} dB`}
                className={cn(
                  'flex aspect-[2/1] items-center justify-center rounded-[3px] text-[11px] font-medium text-[#11111b] tabular-nums',
                  color(v.droop),
                )}
              >
                {v.droop}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        单元格数值为 Droop (dB)，绿色越低越好，红色为偏大需关注
      </p>
    </div>
  )
}

export function Ip3Chart() {
  const data = ip3Data()
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ left: 0, right: 8 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="device" {...axis} angle={-30} textAnchor="end" height={64} interval={0} />
        <YAxis {...axis} label={{ value: 'dBm', angle: -90, position: 'insideLeft', fill: COLORS.muted, fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(137,180,250,0.06)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
        <Bar dataKey="iip3" name="实测 IIP3" fill={COLORS.blue} radius={[2, 2, 0, 0]} />
        <Bar dataKey="datasheet" name="规格书 IIP3" fill={COLORS.peach} radius={[2, 2, 0, 0]} />
        <Line dataKey="oip3" name="OIP3" stroke={COLORS.green} strokeWidth={2} dot={{ r: 3, fill: COLORS.green }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

const NF_DEVICES = ['QM81000', 'VC7535-88', 'MXD98M9EA', 'VC3726M']

export function NfChart() {
  const [device, setDevice] = useState(NF_DEVICES[0])
  const data = nfData(device)
  return (
    <div>
      <DeviceTabs devices={NF_DEVICES} value={device} onChange={setDevice} />
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ left: 0, right: 8 }}>
          <CartesianGrid stroke={COLORS.grid} vertical={false} />
          <XAxis dataKey="freq" {...axis} unit="M" />
          <YAxis {...axis} domain={[0, 'auto']} label={{ value: 'NF dB', angle: -90, position: 'insideLeft', fill: COLORS.muted, fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="line" />
          <Line dataKey="nf" name="实测 NF" stroke={COLORS.blue} strokeWidth={2} dot={{ r: 2 }} />
          <Line dataKey="datasheet" name="规格书 NF" stroke={COLORS.peach} strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const PHASE_DEVICES = ['QM81000', 'VC7535-88', 'MXD9823AT']

export function PhaseErrorChart() {
  const [device, setDevice] = useState(PHASE_DEVICES[0])
  const data = phaseErrorData(device).map((d) => ({ ...d, label: `${d.angle}°` }))
  return (
    <div>
      <DeviceTabs devices={PHASE_DEVICES} value={device} onChange={setDevice} />
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke={COLORS.grid} />
          <PolarAngleAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 10 }} />
          <PolarRadiusAxis tick={{ fill: COLORS.muted, fontSize: 10 }} stroke={COLORS.border} />
          <Tooltip contentStyle={tooltipStyle} />
          <Radar name="相位误差 (°)" dataKey="error" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DeviceTabs({
  devices,
  value,
  onChange,
}: {
  devices: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {devices.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={cn(
            'rounded-md border px-2.5 py-1 text-xs tabular-nums transition-colors',
            d === value
              ? 'border-rf-blue/50 bg-rf-blue/15 text-rf-blue'
              : 'border-border bg-secondary text-muted-foreground hover:text-foreground',
          )}
        >
          {d}
        </button>
      ))}
    </div>
  )
}
