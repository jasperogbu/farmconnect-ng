import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function StarRating({ value = 0, onChange, size = 'md', showValue = false }) {
  const dimensions = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
  const interactive = typeof onChange === 'function'

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange(star)}
            className={cn(interactive && 'cursor-pointer transition-transform hover:scale-110', !interactive && 'cursor-default')}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                dimensions,
                star <= Math.round(value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-muted-foreground/40',
              )}
            />
          </button>
        ))}
      </span>
      {showValue && (
        <span className="text-sm text-muted-foreground">
          {value ? Number(value).toFixed(1) : 'New'}
        </span>
      )}
    </span>
  )
}
