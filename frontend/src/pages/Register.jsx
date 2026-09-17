import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, ShoppingBasket, Sprout, Tractor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { APP_NAME, NIGERIAN_STATES } from '@/lib/constants'
import { cn, homeForRole } from '@/lib/utils'

const roles = [
  { value: 'farmer', label: 'Farmer', description: 'Sell your produce', icon: Tractor },
  { value: 'buyer', label: 'Buyer', description: 'Buy fresh produce', icon: ShoppingBasket },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    role: 'buyer',
    full_name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    state: '',
    city: '',
    address: '',
  })

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        full_name: form.full_name,
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || null,
        state: form.state || null,
        city: form.city || null,
        address: form.address || null,
      }
      const user = await register(payload)
      toast.success(`Welcome to ${APP_NAME}, ${user.full_name}!`)
      navigate(homeForRole(user.role), { replace: true })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/30 px-4 py-10">
      <Link to="/" className="mb-6 flex items-center gap-2 text-xl font-bold">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sprout className="h-5 w-5" />
        </span>
        {APP_NAME}
      </Link>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Join the direct farmer-to-buyer marketplace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Account type</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {roles.map((role) => (
                  <button
                    type="button"
                    key={role.value}
                    onClick={() => update('role', role.value)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                      form.role === role.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:bg-muted',
                    )}
                  >
                    <role.icon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold">{role.label}</span>
                    <span className="text-xs text-muted-foreground">{role.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  placeholder="e.g. Musa Ibrahim"
                  value={form.full_name}
                  onChange={(event) => update('full_name', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="e.g. musa_farms"
                  value={form.username}
                  onChange={(event) => update('username', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(event) => update('password', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  placeholder="0803 123 4567"
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
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
                  placeholder="e.g. Jos North"
                  value={form.city}
                  onChange={(event) => update('city', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address (optional)</Label>
                <Input
                  id="address"
                  placeholder="e.g. Dawanau market road"
                  value={form.address}
                  onChange={(event) => update('address', event.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
