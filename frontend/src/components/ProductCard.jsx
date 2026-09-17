import { Link } from 'react-router-dom'
import { MapPin, Sprout } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import StarRating from '@/components/StarRating'
import { formatNaira, resolveImage } from '@/lib/utils'

export default function ProductCard({ product }) {
  const image = resolveImage(product.image_url)

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
              <Sprout className="h-10 w-10" />
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm">
            {product.category}
          </span>
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="line-clamp-1 font-semibold hover:text-primary">{product.name}</h3>
        </Link>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {[product.city, product.state].filter(Boolean).join(', ') || 'Nigeria'}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <StarRating value={product.rating} size="sm" />
          <span className="text-xs text-muted-foreground">
            ({product.total_reviews})
          </span>
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg font-bold text-primary">{formatNaira(product.price)}</p>
              <p className="text-xs text-muted-foreground">per {product.unit}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {product.quantity} {product.unit} left
            </p>
          </div>
          {product.farmer_name && (
            <p className="mt-2 truncate text-xs text-muted-foreground">
              by <span className="font-medium text-foreground">{product.farmer_name}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
