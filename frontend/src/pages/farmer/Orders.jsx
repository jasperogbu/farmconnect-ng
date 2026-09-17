import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MessageSquare, Package, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import EmptyState from '@/components/EmptyState'
import { chatApi, orderApi } from '@/lib/api'
import { ORDER_STATUS } from '@/lib/constants'
import { formatDate, formatNaira } from '@/lib/utils'

const SELECTABLE = ['accepted', 'processing', 'shipped', 'delivered']

export default function FarmerOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)

  async function load() {
    try {
      setOrders(await orderApi.mine())
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function changeStatus(order, status) {
    setBusy(order.id)
    try {
      await orderApi.setStatus(order.id, status)
      toast.success(`Order marked as ${status}.`)
      load()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(null)
    }
  }

  async function cancel(order) {
    setBusy(order.id)
    try {
      await orderApi.cancel(order.id)
      toast.success('Order cancelled.')
      load()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(null)
    }
  }

  async function messageBuyer(order) {
    try {
      const conversation = await chatApi.createConversation(order.buyer_id)
      navigate(`/messages?c=${conversation.id}`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">Accept, fulfil and track buyer orders.</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" description="Buyer orders will show up here." />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const closed = order.status === 'delivered' || order.status === 'cancelled'
            return (
              <Card key={order.id}>
                <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold">{order.product_name}</h3>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.quantity} {order.unit} · {formatNaira(order.total_price)} ·{' '}
                      {formatDate(order.created_at)}
                    </p>
                    <p className="text-sm">
                      Buyer: <span className="font-medium">{order.buyer_name}</span>
                    </p>
                    {(order.delivery_city || order.delivery_state) && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {[order.delivery_address, order.delivery_city, order.delivery_state]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    {order.notes && (
                      <p className="text-sm text-muted-foreground">Note: {order.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => messageBuyer(order)}>
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message buyer
                    </Button>
                    {!closed && (
                      <>
                        <Select
                          value={order.status}
                          onValueChange={(value) => changeStatus(order, value)}
                          disabled={busy === order.id}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SELECTABLE.map((status) => (
                              <SelectItem key={status} value={status}>
                                {ORDER_STATUS[status].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => cancel(order)}
                          disabled={busy === order.id}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
