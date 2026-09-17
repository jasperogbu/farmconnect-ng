import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Filter, PackageSearch, Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ProductCard from '@/components/ProductCard'
import EmptyState from '@/components/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { productApi } from '@/lib/api'
import { NIGERIAN_STATES, PRODUCT_CATEGORIES } from '@/lib/constants'

const PAGE_SIZE = 12

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    state: searchParams.get('state') || 'all',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort: searchParams.get('sort') || 'newest',
  })
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: PAGE_SIZE, sort: filters.sort }
      if (filters.q) params.q = filters.q
      if (filters.category !== 'all') params.category = filters.category
      if (filters.state !== 'all') params.state = filters.state
      if (filters.min_price) params.min_price = Number(filters.min_price)
      if (filters.max_price) params.max_price = Number(filters.max_price)
      const result = await productApi.list(params)
      setData(result)
    } catch {
      setData({ items: [], total: 0, pages: 1 })
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    load()
  }, [load])

  const update = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setPage(1)
  }

  function applySearch(event) {
    event.preventDefault()
    const next = {}
    if (filters.q) next.q = filters.q
    if (filters.category !== 'all') next.category = filters.category
    if (filters.state !== 'all') next.state = filters.state
    setSearchParams(next)
    load()
  }

  function reset() {
    setFilters({ q: '', category: 'all', state: 'all', min_price: '', max_price: '', sort: 'newest' })
    setSearchParams({})
    setPage(1)
  }

  const resultLabel = useMemo(
    () => `${data.total} listing${data.total === 1 ? '' : 's'} found`,
    [data.total],
  )

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground">
          Fresh produce from farmers across Nigeria, farm to your doorstep.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={applySearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.q}
            onChange={(event) => update('q', event.target.value)}
            placeholder="Search maize, yam, tomatoes, cocoa…"
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="outline"
          className="sm:hidden"
          onClick={() => setShowFilters((value) => !value)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <Card className={`${showFilters ? 'block' : 'hidden'} h-fit lg:block`}>
          <CardContent className="space-y-5 p-5">
            <div className="flex items-center gap-2 font-semibold">
              <Filter className="h-4 w-4" />
              Filters
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filters.category} onValueChange={(value) => update('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>State</Label>
              <Select value={filters.state} onValueChange={(value) => update('state', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All states</SelectItem>
                  {NIGERIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Price range (₦)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={filters.min_price}
                  onChange={(event) => update('min_price', event.target.value)}
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={filters.max_price}
                  onChange={(event) => update('max_price', event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sort by</Label>
              <Select value={filters.sort} onValueChange={(value) => update('sort', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_asc">Price: low to high</SelectItem>
                  <SelectItem value="price_desc">Price: high to low</SelectItem>
                  <SelectItem value="rating">Top rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="w-full" onClick={reset}>
              Reset filters
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          <p className="mb-4 text-sm text-muted-foreground">{resultLabel}</p>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No listings found"
              description="Try a different keyword, category or state."
              action={
                <Button variant="outline" onClick={reset}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {data.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.min(data.pages, value + 1))}
                disabled={page >= data.pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
