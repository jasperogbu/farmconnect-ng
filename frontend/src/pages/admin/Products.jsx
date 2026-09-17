import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EyeOff, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { adminApi } from '@/lib/api'
import { formatNaira } from '@/lib/utils'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [removedOnly, setRemovedOnly] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setProducts(await adminApi.products(removedOnly ? { removed_only: true } : {}))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [removedOnly])

  useEffect(() => {
    load()
  }, [load])

  async function toggleRemoval(product) {
    try {
      await adminApi.toggleRemove(product.id)
      toast.success(product.is_removed ? 'Listing restored.' : 'Listing removed.')
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function remove(product) {
    if (!window.confirm(`Permanently delete “${product.name}”? This cannot be undone.`)) return
    try {
      await adminApi.deleteProduct(product.id)
      toast.success('Listing deleted.')
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listings</h1>
          <p className="text-sm text-muted-foreground">Monitor and moderate marketplace content.</p>
        </div>
        <Button variant="outline" onClick={() => setRemovedOnly((value) => !value)}>
          {removedOnly ? 'Show all listings' : 'Show removed only'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.farmer_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[product.city, product.state].filter(Boolean).join(', ')}
                    </TableCell>
                    <TableCell>
                      {formatNaira(product.price)}
                      <span className="text-xs text-muted-foreground"> / {product.unit}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.quantity} {product.unit}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_removed ? 'destructive' : 'secondary'}>
                        {product.is_removed ? 'Removed' : 'Visible'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleRemoval(product)}>
                          {product.is_removed ? (
                            <>
                              <RotateCcw className="h-3.5 w-3.5" /> Restore
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5" /> Remove
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => remove(product)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No listings found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
