import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import StarRating from '@/components/StarRating'
import EmptyState from '@/components/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { userApi } from '@/lib/api'
import { initials } from '@/lib/utils'

export default function Farmers() {
  const [query, setQuery] = useState('')
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (q) => {
    setLoading(true)
    try {
      const data = await userApi.farmers(q ? { q } : {})
      setFarmers(data)
    } catch {
      setFarmers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load('')
  }, [load])

  function onSubmit(event) {
    event.preventDefault()
    load(query)
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Farmers</h1>
        <p className="text-muted-foreground">Meet the producers behind the produce.</p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 flex max-w-xl gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search farmers by name, city or state"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : farmers.length === 0 ? (
          <EmptyState icon={Users} title="No farmers found" description="Try another search term." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {farmers.map((farmer) => (
              <Card key={farmer.id} className="h-full">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials(farmer.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{farmer.full_name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[farmer.city, farmer.state].filter(Boolean).join(', ') || 'Nigeria'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <StarRating value={farmer.rating} size="sm" showValue />
                  </div>
                  {farmer.bio && (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{farmer.bio}</p>
                  )}
                  <Button asChild variant="outline" size="sm" className="mt-auto w-full pt-2">
                    <Link to={`/farmers/${farmer.id}`} className="mt-4">
                      View store
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
