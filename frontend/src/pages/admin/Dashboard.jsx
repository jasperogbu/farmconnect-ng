import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, MessageSquare, Package, ShoppingBag, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import StatCard from '@/components/StatCard'
import { adminApi } from '@/lib/api'
import { ORDER_STATUS } from '@/lib/constants'

const STATUS_COLORS = {
  pending: '#f59e0b',
  accepted: '#0ea5e9',
  processing: '#6366f1',
  shipped: '#a855f7',
  delivered: '#22c55e',
  cancelled: '#ef4444',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi
      .stats()
      .then(setStats)
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
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (!stats) return null

  const orderData = Object.entries(stats.orders_by_status).map(([status, count]) => ({
    status: ORDER_STATUS[status]?.label || status,
    key: status,
    count,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform activity at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={stats.total_users}
          hint={`${stats.farmers} farmers · ${stats.buyers} buyers`}
          icon={Users}
        />
        <StatCard
          label="Products"
          value={stats.total_products}
          hint={`${stats.active_products} active · ${stats.removed_products} removed`}
          icon={Package}
        />
        <StatCard label="Orders" value={stats.total_orders} icon={ShoppingBag} />
        <StatCard label="Open reports" value={stats.open_reports} icon={AlertTriangle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders by status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {orderData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#15803d'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top states by listings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.top_states.length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
            {stats.top_states.map((entry) => (
              <div key={entry.state} className="flex items-center justify-between">
                <span className="text-sm">{entry.state}</span>
                <Badge variant="secondary">{entry.count}</Badge>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" /> New users (7 days)
              </span>
              <Badge>{stats.signups_last_7_days}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" /> Messages sent
              </span>
              <Badge variant="secondary">{stats.total_messages}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
