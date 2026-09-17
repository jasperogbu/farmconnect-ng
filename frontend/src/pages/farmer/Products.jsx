import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Edit, Package, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import EmptyState from '@/components/EmptyState'
import { productApi } from '@/lib/api'
import { formatNaira, resolveImage } from '@/lib/utils'

export default function FarmerProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState(null)

  async function load() {
    try {
      setProducts(await productApi.mine())
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function confirmDelete() {
    try {
      await productApi.remove(target.id)
      toast.success('Listing removed.')
      setTarget(null)
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My products</h1>
          <p className="text-sm text-muted-foreground">Manage your farm produce listings.</p>
        </div>
        <Button asChild>
          <Link to="/farmer/products/new">
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Start by listing your first produce."
          action={
            <Button asChild>
              <Link to="/farmer/products/new">
                <Plus className="h-4 w-4" />
                Add product
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const image = resolveImage(product.image_url)
            return (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-[4/3] w-full bg-muted">
                  {image ? (
                    <img src={image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-primary/40">
                      <Package className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    <Badge variant={product.is_available ? 'secondary' : 'outline'}>
                      {product.is_available ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatNaira(product.price)} / {product.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.quantity} {product.unit} available
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to={`/farmer/products/${product.id}/edit`}>
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setTarget(product)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={Boolean(target)} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove “{target?.name}”? Buyers will no longer see it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
