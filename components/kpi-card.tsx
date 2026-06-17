import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  accent = 'blue',
  trend,
}: {
  label: string
  value: string | number
  unit?: string
  icon: LucideIcon
  accent?: 'blue' | 'green' | 'yellow' | 'purple' | 'peach'
  trend?: { value: string; up: boolean }
}) {
  const accentMap: Record<string, string> = {
    blue: 'text-rf-blue border-rf-blue/40 bg-rf-blue/10',
    green: 'text-rf-green border-rf-green/40 bg-rf-green/10',
    yellow: 'text-rf-yellow border-rf-yellow/40 bg-rf-yellow/10',
    purple: 'text-rf-purple border-rf-purple/40 bg-rf-purple/10',
    peach: 'text-rf-peach border-rf-peach/40 bg-rf-peach/10',
  }
  const valueColor: Record<string, string> = {
    blue: 'text-rf-blue',
    green: 'text-rf-green',
    yellow: 'text-rf-yellow',
    purple: 'text-rf-purple',
    peach: 'text-rf-peach',
  }

  return (
    <div className="top-accent mech-panel relative overflow-hidden rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-md border',
            accentMap[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs',
              trend.up ? 'text-rf-green' : 'text-rf-red',
            )}
          >
            {trend.up ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span
          className={cn(
            'font-heading text-3xl font-bold tabular-nums',
            valueColor[accent],
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground">{unit}</span>
        )}
      </div>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  )
}
