import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, Clock, Package, Plus, Star, Wallet } from 'lucide-react'
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
import EmptyState from '@/components/EmptyState'
import { dashboardApi } from '@/lib/api'
import { formatDate, formatNaira } from '@/lib/utils'

export default function FarmerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi
      .farmer()
      .then(setData)
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
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
          <h1 className="text-2xl font-bold tracking-tight">Farmer dashboard</h1>
          <p className="text-sm text-muted-foreground">A summary of your farm business.</p>
        </div>
        <Button asChild>
          <Link to="/farmer/products/new">
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total earnings" value={formatNaira(data.total_earnings)} icon={Wallet} />
        <StatCard label="Products" value={data.total_products} hint={`${data.active_products} active`} icon={Package} />
        <StatCard label="Pending orders" value={data.pending_orders} hint={`${data.total_orders} total`} icon={Clock} />
        <StatCard
          label="Rating"
          value={data.rating ? data.rating.toFixed(1) : 'New'}
          hint={`${data.total_reviews} reviews`}
          icon={Star}
        />
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
              description="Orders from buyers will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Buyer</TableHead>
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
                    <TableCell>{order.buyer_name}</TableCell>
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
              <Link to="/farmer/orders">
                <CheckCircle2 className="h-4 w-4" />
                Manage all orders
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
