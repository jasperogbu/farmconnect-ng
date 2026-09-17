import { Badge } from '@/components/ui/badge'
import { ORDER_STATUS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export default function OrderStatusBadge({ status }) {
  const config = ORDER_STATUS[status] || { label: status, className: '' }
  return (
    <Badge variant="outline" className={cn('font-medium capitalize', config.className)}>
      {config.label}
    </Badge>
  )
}
