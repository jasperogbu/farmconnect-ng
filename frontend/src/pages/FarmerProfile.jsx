import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, MapPin, MessageSquare, PackageSearch, Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import StarRating from '@/components/StarRating'
import ProductCard from '@/components/ProductCard'
import EmptyState from '@/components/EmptyState'
import StatCard from '@/components/StatCard'
import { useAuth } from '@/context/AuthContext'
import { chatApi, userApi } from '@/lib/api'
import { formatDate, initials } from '@/lib/utils'

export default function FarmerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [farmer, setFarmer] = useState(null)
  const [products, setProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [profile, listing, feedback] = await Promise.all([
        userApi.farmer(id),
        userApi.farmerProducts(id),
        userApi.farmerReviews(id),
      ])
      setFarmer(profile)
      setProducts(listing)
      setReviews(feedback)
    } catch (error) {
      toast.error(error.message)
      navigate('/farmers')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    load()
  }, [load])

  async function messageFarmer() {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const conversation = await chatApi.createConversation(Number(id))
      navigate(`/messages?c=${conversation.id}`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return (
      <div className="container space-y-6 py-8">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (!farmer) return null

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/10 text-2xl text-primary">
              {initials(farmer.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{farmer.full_name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {[farmer.city, farmer.state].filter(Boolean).join(', ') || 'Nigeria'}
            </p>
            <div className="mt-2">
              <StarRating value={farmer.rating} showValue />
            </div>
            {farmer.bio && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{farmer.bio}</p>}
          </div>
          <Button onClick={messageFarmer}>
            <MessageSquare className="h-4 w-4" />
            Message farmer
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Listings" value={products.length} icon={Sprout} />
        <StatCard label="Reviews" value={farmer.total_reviews} icon={PackageSearch} />
        <StatCard label="Rating" value={farmer.rating ? farmer.rating.toFixed(1) : 'New'} />
      </div>

      <Tabs defaultValue="products" className="mt-8">
        <TabsList>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          {products.length === 0 ? (
            <EmptyState icon={Sprout} title="No products yet" description="This farmer has not listed any produce." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          {reviews.length === 0 ? (
            <EmptyState icon={PackageSearch} title="No reviews yet" />
          ) : (
            <div className="space-y-4">
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
                          <p className="text-xs text-muted-foreground">
                            {review.product_name} · {formatDate(review.created_at)}
                          </p>
                        </div>
                      </div>
                      <StarRating value={review.rating} size="sm" />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
