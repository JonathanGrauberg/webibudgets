import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowRight, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    positive: boolean
  }
  href?: string // 👈 nuevo — opcional, no rompe usos existentes sin este prop
  className?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  href,
  className,
}: StatCardProps) {
  const content = (
    <Card
      className={cn(
        'overflow-hidden transition-colors',
        href && 'group-hover:border-foreground/20',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-card-foreground">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>

        {href && (
          <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            Ver detalle <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="group block">
        {content}
      </Link>
    )
  }

  return content
}