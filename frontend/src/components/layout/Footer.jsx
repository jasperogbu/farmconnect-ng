import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'

// Quick links mirror the sections available on each role's dashboard.
const roleLinks = {
  farmer: [
    { to: '/farmer', label: 'Dashboard' },
    { to: '/farmer/products', label: 'My Products' },
    { to: '/farmer/orders', label: 'Orders' },
    { to: '/messages', label: 'Messages' },
    { to: '/profile', label: 'Profile' },
  ],
  buyer: [
    { to: '/buyer', label: 'Dashboard' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/buyer/orders', label: 'My Orders' },
    { to: '/messages', label: 'Messages' },
    { to: '/profile', label: 'Profile' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/products', label: 'Listings' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/profile', label: 'Profile' },
  ],
}

// Guests have no dashboard, so they see the public sections plus entry points.
const guestLinks = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/farmers', label: 'Farmers' },
  { to: '/login', label: 'Log in' },
  { to: '/register', label: 'Create account' },
]

export default function Footer() {
  const { user } = useAuth()
  const baseLinks = user ? roleLinks[user.role] || guestLinks : guestLinks
  const quickLinks = [...baseLinks, { to: '/#how-it-works', label: 'How it works' }]
  const [email, setEmail] = useState('')

  function subscribe(event) {
    event.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email address.')
      return
    }
    toast.success('Subscribed! You will hear from us when new listings go live.')
    setEmail('')
  }

  return (
    <footer className="border-t bg-muted/30">
      <div className="container grid gap-10 py-10 lg:grid-cols-3">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sprout className="h-4 w-4" />
            </span>
            {APP_NAME}
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{APP_TAGLINE}</p>
        </div>

        {/* Quick links (middle) */}
        <div className="lg:justify-self-center">
          <h3 className="text-sm font-semibold">Quick links</h3>
          <ul className="mt-4 space-y-2">
            {quickLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Subscribe + socials */}
        <div>
          <h3 className="text-sm font-semibold">
            Subscribe to get updates when new features or farmer listings go live.
          </h3>
          <form onSubmit={subscribe} className="mt-4 flex max-w-sm gap-2">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Your email"
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </div>

      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </div>
    </footer>
  )
}
