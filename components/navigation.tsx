'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Radio, RadioTower, Cpu, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: '总览', icon: LayoutGrid },
  { href: '/tx', label: 'TX 结果', icon: RadioTower },
  { href: '/rx', label: 'RX 结果', icon: Radio },
  { href: '/device', label: '器件详情', icon: Cpu },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[#181825]/90 backdrop-blur supports-[backdrop-filter]:bg-[#181825]/70">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-rf-blue/40 bg-rf-blue/10 text-rf-blue">
            <Activity className="h-5 w-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-sm font-bold tracking-wider text-rf-blue mech-glow-blue">
              RFFE
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Test Dashboard
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-rf-blue/12 text-rf-blue'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <span className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rf-green" />
            飞书数据源已连接
          </span>
        </div>
      </div>
    </header>
  )
}
