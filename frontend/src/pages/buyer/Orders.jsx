import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MapPin, MessageSquare, Package, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import StarRating from '@/components/StarRating'
import EmptyState from '@/components/EmptyState'
import { chatApi, orderApi, reviewApi } from '@/lib/api'
import { formatDate, formatNaira } from '@/lib/utils'

export default function BuyerOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submitting, setSubmitting] = useState(false)

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

  async function messageFarmer(order) {
    try {
      const conversation = await chatApi.createConversation(order.farmer_id)
      navigate(`/messages?c=${conversation.id}`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function submitReview() {
    if (reviewForm.comment.trim().length < 3) {
      toast.error('Please write a short review.')
      return
    }
    setSubmitting(true)
    try {
      await reviewApi.create({
        product_id: reviewTarget.product_id,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      })
      toast.success('Review submitted.')
      setReviewTarget(null)
      setReviewForm({ rating: 5, comment: '' })
      load()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
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
        <h1 className="text-2xl font-bold tracking-tight">My orders</h1>
        <p className="text-sm text-muted-foreground">Track and manage your purchases.</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Browse the marketplace to place your first order."
          action={
            <Button asChild>
              <Link to="/marketplace">Browse marketplace</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const canCancel = !['delivered', 'cancelled'].includes(order.status)
            const canReview = order.status === 'delivered' && !order.reviewed && order.product_id
            return (
              <Card key={order.id}>
                <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      {order.product_id ? (
                        <Link
                          to={`/product/${order.product_id}`}
                          className="font-semibold hover:text-primary"
                        >
                          {order.product_name}
                        </Link>
                      ) : (
                        <h3 className="font-semibold">{order.product_name}</h3>
                      )}
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.quantity} {order.unit} · {formatNaira(order.total_price)} ·{' '}
                      {formatDate(order.created_at)}
                    </p>
                    <p className="text-sm">
                      Farmer: <span className="font-medium">{order.farmer_name}</span>
                    </p>
                    {(order.delivery_city || order.delivery_state) && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {[order.delivery_address, order.delivery_city, order.delivery_state]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => messageFarmer(order)}>
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message farmer
                    </Button>
                    {canReview && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setReviewTarget(order)
                          setReviewForm({ rating: 5, comment: '' })
                        }}
                      >
                        <Star className="h-3.5 w-3.5" />
                        Leave review
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => cancel(order)}
                        disabled={busy === order.id}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={Boolean(reviewTarget)} onOpenChange={(open) => !open && setReviewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {reviewTarget?.product_name}</DialogTitle>
            <DialogDescription>Share your experience with other buyers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rating</Label>
              <StarRating
                value={reviewForm.rating}
                onChange={(value) => setReviewForm((prev) => ({ ...prev, rating: value }))}
                size="lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review">Comment</Label>
              <Textarea
                id="review"
                value={reviewForm.comment}
                onChange={(event) =>
                  setReviewForm((prev) => ({ ...prev, comment: event.target.value }))
                }
                placeholder="How was the produce and the farmer?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submitReview} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
