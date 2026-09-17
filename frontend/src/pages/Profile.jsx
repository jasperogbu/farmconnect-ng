import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import StarRating from '@/components/StarRating'
import { useAuth } from '@/context/AuthContext'
import { userApi } from '@/lib/api'
import { NIGERIAN_STATES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

export default function Profile() {
  const { user, refresh } = useAuth()
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    phone: user.phone || '',
    state: user.state || '',
    city: user.city || '',
    address: user.address || '',
    bio: user.bio || '',
    password: '',
  })
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      await userApi.update(payload)
      await refresh()
      toast.success('Profile updated.')
      setForm((prev) => ({ ...prev, password: '' }))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">My profile</h1>
      <p className="text-sm text-muted-foreground">Manage your account details.</p>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{user.full_name}</CardTitle>
              <CardDescription>@{user.username} · joined {formatDate(user.created_at)}</CardDescription>
            </div>
            <Badge variant="secondary" className="capitalize">
              {user.role}
            </Badge>
          </div>
          {user.role === 'farmer' && (
            <div className="pt-2">
              <StarRating value={user.rating} showValue />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(event) => update('full_name', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  placeholder="0803 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={form.state} onValueChange={(value) => update('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City / LGA</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(event) => update('city', event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(event) => update('address', event.target.value)}
              />
            </div>

            {user.role === 'farmer' && (
              <div className="space-y-2">
                <Label htmlFor="bio">About your farm</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(event) => update('bio', event.target.value)}
                  placeholder="Tell buyers about what you grow and your farming experience."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New password (leave blank to keep current)</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
