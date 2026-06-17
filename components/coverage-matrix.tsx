'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CASES, DEVICES, MATRIX, type Status } from '@/lib/rffe-data'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<Status, { cell: string; label: string }> = {
  tested: { cell: 'bg-rf-green/70 hover:bg-rf-green', label: '已测试' },
  untested: { cell: 'bg-rf-yellow/40 hover:bg-rf-yellow/70', label: '待测试' },
  na: { cell: 'bg-secondary/40 hover:bg-secondary', label: '不适用' },
}

export function CoverageMatrix() {
  const [hover, setHover] = useState<{ caseId: string; deviceId: string } | null>(
    null,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {(['tested', 'untested', 'na'] as Status[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn('h-3 w-3 rounded-sm', STATUS_STYLE[s].cell)} />
            {STATUS_STYLE[s].label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card px-2 py-2 text-left font-medium text-muted-foreground">
                Case \ 器件
              </th>
              {DEVICES.map((d) => (
                <th
                  key={d.id}
                  className="px-1 py-2 text-center font-mono text-[10px] font-normal text-muted-foreground"
                >
                  <Link
                    href={`/device?id=${d.id}`}
                    className="inline-block max-w-[64px] truncate align-bottom hover:text-rf-blue"
                    title={`${d.id} · ${d.type}`}
                  >
                    {d.id}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CASES.map((c) => (
              <tr key={c.id} className="border-t border-border/40">
                <td className="sticky left-0 z-10 bg-card px-2 py-1.5 font-medium text-foreground">
                  {c.name}
                </td>
                {DEVICES.map((d) => {
                  const status = MATRIX[c.id][d.id]
                  const isHover =
                    hover?.caseId === c.id && hover?.deviceId === d.id
                  return (
                    <td key={d.id} className="p-0.5 text-center">
                      <div
                        onMouseEnter={() =>
                          setHover({ caseId: c.id, deviceId: d.id })
                        }
                        onMouseLeave={() => setHover(null)}
                        className={cn(
                          'mx-auto h-6 w-full min-w-[20px] cursor-default rounded-sm transition-colors',
                          STATUS_STYLE[status].cell,
                          isHover && 'ring-2 ring-rf-blue ring-offset-1 ring-offset-card',
                        )}
                        title={`${c.name} × ${d.id} · ${STATUS_STYLE[status].label}`}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hover && (
        <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {CASES.find((c) => c.id === hover.caseId)?.name}
          </span>
          {' × '}
          <span className="font-mono text-rf-blue">{hover.deviceId}</span>
          {' — '}
          {STATUS_STYLE[MATRIX[hover.caseId][hover.deviceId]].label}
        </div>
      )}
    </div>
  )
}
