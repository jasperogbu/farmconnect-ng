import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, Clock, Package, ShoppingBasket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import StatCard from '@/components/StatCard'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import ProductCard from '@/components/ProductCard'
import EmptyState from '@/components/EmptyState'
import { dashboardApi } from '@/lib/api'
import { formatDate, formatNaira } from '@/lib/utils'

export default function BuyerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi
      .buyer()
      .then(setData)
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buyer dashboard</h1>
          <p className="text-sm text-muted-foreground">Track your orders and discover fresh produce.</p>
        </div>
        <Button asChild>
          <Link to="/marketplace">
            <ShoppingBasket className="h-4 w-4" />
            Browse marketplace
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total orders" value={data.total_orders} icon={Package} />
        <StatCard label="Active orders" value={data.pending_orders} icon={Clock} />
        <StatCard label="Delivered" value={data.delivered_orders} icon={CheckCircle2} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent_orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="Your orders will appear here once you start buying."
              action={
                <Button asChild>
                  <Link to="/marketplace">Browse marketplace</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.product_name}</TableCell>
                    <TableCell>{order.farmer_name}</TableCell>
                    <TableCell>
                      {order.quantity} {order.unit}
                    </TableCell>
                    <TableCell>{formatNaira(order.total_price)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/buyer/orders">Manage all orders</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold">Recommended for you</h2>
        {data.recommended_products.length === 0 ? (
          <EmptyState icon={ShoppingBasket} title="No products available yet" className="mt-4" />
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.recommended_products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
