'use client'

import { useState } from 'react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  DEVICES,
  CASES,
  MATRIX,
  COLORS,
  deviceRadar,
  deviceCoverage,
  type Status,
} from '@/lib/rffe-data'
import { Panel } from '@/components/panel'
import { KpiCard } from '@/components/kpi-card'
import { cn } from '@/lib/utils'
import { CheckCircle2, CircleDashed, Ban, Cpu } from 'lucide-react'

const tooltipStyle = {
  backgroundColor: '#181825',
  border: '1px solid #45475a',
  borderRadius: 8,
  fontSize: 12,
  color: '#cdd6f4',
}

const statusMeta: Record<Status, { label: string; cls: string }> = {
  tested: { label: '已测试', cls: 'border-rf-green/40 bg-rf-green/10 text-rf-green' },
  untested: { label: '未测试', cls: 'border-rf-yellow/40 bg-rf-yellow/10 text-rf-yellow' },
  na: { label: '不适用', cls: 'border-border bg-secondary text-muted-foreground' },
}

export function DeviceDetail() {
  const [deviceId, setDeviceId] = useState(DEVICES[0].id)
  const device = DEVICES.find((d) => d.id === deviceId)!
  const radar = deviceRadar(deviceId)
  const cov = deviceCoverage(deviceId)

  return (
    <div className="space-y-6">
      {/* 器件选择 */}
      <Panel title="选择器件" subtitle="点击切换查看不同 RFFE 器件的测试详情">
        <div className="flex flex-wrap gap-2">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDeviceId(d.id)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs tabular-nums transition-colors',
                d.id === deviceId
                  ? 'border-rf-blue/50 bg-rf-blue/15 text-rf-blue'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {d.id}
            </button>
          ))}
        </div>
      </Panel>

      {/* 器件头部信息 */}
      <div className="top-accent mech-panel flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-md border border-rf-blue/40 bg-rf-blue/10 text-rf-blue">
          <Cpu className="h-7 w-7" />
        </span>
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-wide text-rf-blue mech-glow-blue">
            {device.id}
          </h2>
          <p className="text-sm text-muted-foreground">
            {device.type} · {device.band}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="已测 Case" value={cov.tested} icon={CheckCircle2} accent="green" />
        <KpiCard label="未测 Case" value={cov.untested} icon={CircleDashed} accent="yellow" />
        <KpiCard label="不适用" value={cov.na} icon={Ban} accent="purple" />
        <KpiCard
          label="完成度"
          value={
            cov.tested + cov.untested === 0
              ? 0
              : Math.round((cov.tested / (cov.tested + cov.untested)) * 100)
          }
          unit="%"
          icon={Cpu}
          accent="peach"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel
          title="综合性能雷达"
          subtitle="实测归一化得分 vs 规格书目标"
        >
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radar} outerRadius="72%">
              <PolarGrid stroke={COLORS.grid} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: COLORS.muted, fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: COLORS.muted, fontSize: 10 }} stroke={COLORS.border} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Radar name="实测得分" dataKey="value" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.32} />
              <Radar name="规格书目标" dataKey="datasheet" stroke={COLORS.peach} fill={COLORS.peach} fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="测试 Case 汇总" subtitle="该器件所有 Case 的测试状态与适用通路">
          <div className="overflow-hidden rounded-md border border-border/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">测试 Case</th>
                  <th className="px-3 py-2 font-medium">通路</th>
                  <th className="px-3 py-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {CASES.map((c) => {
                  const s = MATRIX[c.id][deviceId]
                  const m = statusMeta[s]
                  return (
                    <tr key={c.id} className="border-t border-border/40">
                      <td className="px-3 py-2 font-medium text-foreground">{c.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {c.paths.join(' / ')}
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-[11px]', m.cls)}>
                          {m.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  )
}
