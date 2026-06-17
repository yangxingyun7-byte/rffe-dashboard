import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'top-accent mech-panel rounded-lg border border-border bg-card',
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
          <div>
            {title && (
              <h2 className="font-heading text-sm font-semibold tracking-wide text-foreground">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}
