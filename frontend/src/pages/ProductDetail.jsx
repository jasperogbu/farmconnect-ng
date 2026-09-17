import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  MapPin,
  MessageSquare,
  Package,
  Sprout,
  Store,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import StarRating from '@/components/StarRating'
import ReportDialog from '@/components/ReportDialog'
import { useAuth } from '@/context/AuthContext'
import { chatApi, orderApi, productApi, reviewApi } from '@/lib/api'
import { formatDate, formatNaira, initials, resolveImage } from '@/lib/utils'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const [orderOpen, setOrderOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({ quantity: 1, notes: '' })
  const [placing, setPlacing] = useState(false)

  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewing, setReviewing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [item, itemReviews] = await Promise.all([
        productApi.get(id),
        productApi.reviews(id),
      ])
      setProduct(item)
      setReviews(itemReviews)
    } catch (error) {
      toast.error(error.message)
      navigate('/marketplace')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    load()
  }, [load])

  async function contactFarmer() {
    if (!user) {
      toast.info('Please log in to message the farmer.')
      navigate('/login')
      return
    }
    try {
      const conversation = await chatApi.createConversation(product.farmer_id)
      navigate(`/messages?c=${conversation.id}`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function placeOrder() {
    if (Number(orderForm.quantity) <= 0) {
      toast.error('Enter a valid quantity.')
      return
    }
    if (Number(orderForm.quantity) > product.quantity) {
      toast.error(`Only ${product.quantity} ${product.unit} available.`)
      return
    }
    setPlacing(true)
    try {
      await orderApi.create({
        product_id: product.id,
        quantity: Number(orderForm.quantity),
        notes: orderForm.notes || null,
      })
      toast.success('Order placed! The farmer will be in touch.')
      setOrderOpen(false)
      navigate('/buyer/orders')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setPlacing(false)
    }
  }

  async function submitReview() {
    if (reviewForm.comment.trim().length < 3) {
      toast.error('Please write a short review.')
      return
    }
    setReviewing(true)
    try {
      await reviewApi.create({
        product_id: product.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      })
      toast.success('Thanks for your review!')
      setReviewForm({ rating: 5, comment: '' })
      load()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setReviewing(false)
    }
  }

  if (loading) {
    return (
      <div className="container grid gap-8 py-8 lg:grid-cols-2">
        <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    )
  }

  if (!product) return null

  const image = resolveImage(product.image_url)
  const alreadyReviewed = reviews.some((review) => review.buyer_id === user?.id)
  const canOrder = user?.role === 'buyer'
  const total = Number(orderForm.quantity || 0) * product.price

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl border bg-muted">
          {image ? (
            <img src={image} alt={product.name} className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
              <Sprout className="h-16 w-16" />
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary">{product.category}</Badge>
            <ReportDialog productId={product.id} />
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{product.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {[product.city, product.state].filter(Boolean).join(', ') || 'Nigeria'}
            </span>
            <span className="flex items-center gap-1">
              <StarRating value={product.rating} size="sm" showValue />
              <span>({product.total_reviews} reviews)</span>
            </span>
          </div>

          <div className="mt-5 rounded-xl border bg-card p-5">
            <p className="text-3xl font-extrabold text-primary">{formatNaira(product.price)}</p>
            <p className="text-sm text-muted-foreground">per {product.unit}</p>
            <p className="mt-3 flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className={product.quantity > 0 ? '' : 'text-destructive'}>
                {product.quantity > 0
                  ? `${product.quantity} ${product.unit} available`
                  : 'Out of stock'}
              </span>
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {canOrder && product.quantity > 0 && (
              <Button onClick={() => setOrderOpen(true)}>
                <Truck className="h-4 w-4" />
                Place order
              </Button>
            )}
            {!user && (
              <Button asChild>
                <Link to="/login">Log in to order</Link>
              </Button>
            )}
            <Button variant="outline" onClick={contactFarmer}>
              <MessageSquare className="h-4 w-4" />
              Message farmer
            </Button>
          </div>

          <Separator className="my-6" />

          <div>
            <h2 className="font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {product.description || 'No description provided.'}
            </p>
          </div>

          <Separator className="my-6" />

          {/* Farmer card */}
          <div className="flex items-center gap-4 rounded-xl border p-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials(product.farmer_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{product.farmer_name}</p>
              <p className="text-xs text-muted-foreground">
                Farmer · {[product.city, product.state].filter(Boolean).join(', ')}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to={`/farmers/${product.farmer_id}`}>
                <Store className="h-4 w-4" />
                Visit store
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-xl font-bold">Reviews ({reviews.length})</h2>
          <div className="mt-4 space-y-4">
            {reviews.length === 0 && (
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review.</p>
            )}
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {initials(review.buyer_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{review.buyer_name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                    <StarRating value={review.rating} size="sm" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Write review */}
        {canOrder && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Write a review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alreadyReviewed ? (
                <p className="text-sm text-muted-foreground">
                  You have already reviewed this product.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Your rating</Label>
                    <StarRating
                      value={reviewForm.rating}
                      onChange={(value) => setReviewForm((prev) => ({ ...prev, rating: value }))}
                      size="lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment">Comment</Label>
                    <Textarea
                      id="comment"
                      placeholder="How was the produce?"
                      value={reviewForm.comment}
                      onChange={(event) =>
                        setReviewForm((prev) => ({ ...prev, comment: event.target.value }))
                      }
                    />
                  </div>
                  <Button className="w-full" onClick={submitReview} disabled={reviewing}>
                    {reviewing ? 'Submitting…' : 'Submit review'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order dialog */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place order — {product.name}</DialogTitle>
            <DialogDescription>
              {formatNaira(product.price)} per {product.unit}. Available: {product.quantity}{' '}
              {product.unit}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity ({product.unit})</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={product.quantity}
                value={orderForm.quantity}
                onChange={(event) =>
                  setOrderForm((prev) => ({ ...prev, quantity: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Delivery notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Delivery address, preferred time, etc."
                value={orderForm.notes}
                onChange={(event) =>
                  setOrderForm((prev) => ({ ...prev, notes: event.target.value }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
              <span className="text-muted-foreground">Estimated total</span>
              <span className="text-lg font-bold text-primary">{formatNaira(total)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={placeOrder} disabled={placing}>
              {placing ? 'Placing…' : 'Confirm order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
