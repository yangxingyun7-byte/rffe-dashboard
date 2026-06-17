'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import {
  COLORS,
  paDroopData,
  imdData,
  harmonicData,
  aclrEvmData,
  powerCurrentData,
} from '@/lib/rffe-data'

const tooltipStyle = {
  backgroundColor: '#181825',
  border: '1px solid #45475a',
  borderRadius: 8,
  fontSize: 12,
  color: '#cdd6f4',
}
const axis = { stroke: COLORS.muted, fontSize: 11 }

export function DroopChart() {
  const data = paDroopData().map((r) => ({
    name: `${r.device}·${r.band}`,
    自动: r.auto,
    手动: r.manual,
    规格书: r.datasheet,
  }))
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ left: 0, right: 8 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="name" {...axis} angle={-30} textAnchor="end" height={70} interval={0} />
        <YAxis {...axis} label={{ value: 'dB', angle: -90, position: 'insideLeft', fill: COLORS.muted, fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(137,180,250,0.06)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
        <Bar dataKey="自动" fill={COLORS.blue} radius={[2, 2, 0, 0]} />
        <Bar dataKey="手动" fill={COLORS.teal} radius={[2, 2, 0, 0]} />
        <Bar dataKey="规格书" fill={COLORS.peach} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

const IMD_DEVICES = ['QM77055', 'QM77048', 'VC8016', 'VC7514']

export function ImdChart() {
  const [device, setDevice] = useState(IMD_DEVICES[0])
  const data = imdData(device)
  return (
    <div>
      <DeviceTabs devices={IMD_DEVICES} value={device} onChange={setDevice} />
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ left: 0, right: 8 }}>
          <CartesianGrid stroke={COLORS.grid} vertical={false} />
          <XAxis dataKey="freq" {...axis} unit="M" />
          <YAxis {...axis} label={{ value: 'dBc', angle: -90, position: 'insideLeft', fill: COLORS.muted, fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="line" />
          <ReferenceLine y={-40} stroke={COLORS.red} strokeDasharray="4 4" label={{ value: '规格 -40dBc', fill: COLORS.red, fontSize: 10, position: 'right' }} />
          <Line dataKey="imd3L" name="IMD3 Lo" stroke={COLORS.blue} dot={false} strokeWidth={2} />
          <Line dataKey="imd3R" name="IMD3 Hi" stroke={COLORS.teal} dot={false} strokeWidth={2} />
          <Line dataKey="imd5L" name="IMD5 Lo" stroke={COLORS.yellow} dot={false} strokeWidth={1.5} strokeDasharray="5 3" />
          <Line dataKey="imd5R" name="IMD5 Hi" stroke={COLORS.peach} dot={false} strokeWidth={1.5} strokeDasharray="5 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HarmonicChart() {
  const data = harmonicData().map((d) => ({ name: d.device, 'H2': d.h2, 'H3': d.h3, 'H4': d.h4 }))
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ left: 0, right: 8 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="name" {...axis} angle={-30} textAnchor="end" height={64} interval={0} />
        <YAxis {...axis} label={{ value: 'dBm', angle: -90, position: 'insideLeft', fill: COLORS.muted, fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(137,180,250,0.06)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
        <Bar dataKey="H2" fill={COLORS.blue} radius={[2, 2, 0, 0]} />
        <Bar dataKey="H3" fill={COLORS.purple} radius={[2, 2, 0, 0]} />
        <Bar dataKey="H4" fill={COLORS.teal} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function AclrChart() {
  const data = aclrEvmData()
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ left: 0, right: 8 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="device" {...axis} angle={-30} textAnchor="end" height={64} interval={0} />
        <YAxis yAxisId="l" {...axis} label={{ value: 'ACLR dBc', angle: -90, position: 'insideLeft', fill: COLORS.muted, fontSize: 11 }} />
        <YAxis yAxisId="r" orientation="right" {...axis} label={{ value: 'EVM %', angle: 90, position: 'insideRight', fill: COLORS.muted, fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(137,180,250,0.06)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
        <Bar yAxisId="l" dataKey="aclr" name="ACLR" fill={COLORS.blue} radius={[2, 2, 0, 0]} />
        <Line yAxisId="r" dataKey="evm" name="EVM" stroke={COLORS.peach} strokeWidth={2} dot={{ r: 3, fill: COLORS.peach }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

const PWR_DEVICES = ['QM77055', 'VC8016', 'VC7514', 'QM78218']

export function PowerCurrentChart() {
  const [device, setDevice] = useState(PWR_DEVICES[0])
  const data = powerCurrentData(device)
  return (
    <div>
      <DeviceTabs devices={PWR_DEVICES} value={device} onChange={setDevice} />
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ left: 0, right: 8 }}>
          <CartesianGrid stroke={COLORS.grid} vertical={false} />
          <XAxis dataKey="pout" {...axis} unit="dBm" />
          <YAxis yAxisId="l" {...axis} label={{ value: 'Icc mA', angle: -90, position: 'insideLeft', fill: COLORS.muted, fontSize: 11 }} />
          <YAxis yAxisId="r" orientation="right" {...axis} label={{ value: 'PAE %', angle: 90, position: 'insideRight', fill: COLORS.muted, fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="line" />
          <Line yAxisId="l" dataKey="current" name="电流 Icc" stroke={COLORS.blue} strokeWidth={2} dot={false} />
          <Line yAxisId="r" dataKey="pae" name="效率 PAE" stroke={COLORS.green} strokeWidth={2} dot={false} />
        </ComposedChart>
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
          className={
            'rounded-md border px-2.5 py-1 text-xs tabular-nums transition-colors ' +
            (d === value
              ? 'border-rf-blue/50 bg-rf-blue/15 text-rf-blue'
              : 'border-border bg-secondary text-muted-foreground hover:text-foreground')
          }
        >
          {d}
        </button>
      ))}
    </div>
  )
}
