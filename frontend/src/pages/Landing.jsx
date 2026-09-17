import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Sprout,
  Tractor,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { APP_NAME, PRODUCT_CATEGORIES } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'
import { homeForRole } from '@/lib/utils'

const features = [
  {
    icon: Tractor,
    title: 'Farmers list directly',
    text: 'Farmers publish their produce with price, quantity and location in minutes.',
  },
  {
    icon: Search,
    title: 'Buyers search with ease',
    text: 'Find maize in Jos, yam in Makurdi or palm oil in Ikom by keyword, state and price.',
  },
  {
    icon: MessageSquare,
    title: 'Chat before you buy',
    text: 'Negotiate prices and agree delivery terms through built-in real-time messaging.',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted marketplace',
    text: 'Ratings, reviews and administrator moderation keep the market fair and safe.',
  },
]

const steps = [
  { title: 'Create an account', text: 'Register as a farmer or a buyer in under a minute.' },
  { title: 'List or discover', text: 'Farmers upload produce; buyers browse and filter the market.' },
  { title: 'Trade directly', text: 'Chat, agree a price and complete the transaction without middlemen.' },
]

export default function Landing() {
  const { user } = useAuth()

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container grid gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col justify-center">
            <Badge variant="secondary" className="w-fit">
              <Sprout className="mr-1 h-3.5 w-3.5" />
              Nigeria&apos;s direct farm-to-buyer marketplace
            </Badge>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Buy fresh produce <span className="text-primary">directly from Nigerian farmers</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              {APP_NAME} removes the middlemen. Farmers earn more, buyers pay less, and produce
              moves from farm to table faster across all 36 states and the FCT.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/marketplace">
                  Browse marketplace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {user ? (
                <Button asChild size="lg" variant="outline">
                  <Link to={homeForRole(user.role)}>Go to dashboard</Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="outline">
                  <Link to="/register">I&apos;m a farmer</Link>
                </Button>
              )}
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                { label: 'States covered', value: '36+' },
                { label: 'Produce categories', value: '9' },
                { label: 'Middlemen', value: '0' },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                  <dd className="text-2xl font-bold text-primary">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden rounded-2xl border shadow-lg">
              <img
                src="/farmers-buyers.jpeg"
                alt="Nigerian farmers and buyers trading together"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 rounded-xl border bg-background p-4 shadow-lg">
              <p className="text-xs text-muted-foreground">Direct trade</p>
              <p className="text-lg font-bold text-primary">Farm to buyer</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                Across Nigeria
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b py-8">
        <div className="container flex flex-wrap items-center justify-center gap-2">
          {PRODUCT_CATEGORIES.map((category) => (
            <Link key={category} to={`/marketplace?category=${encodeURIComponent(category)}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                {category}
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Why {APP_NAME}?</h2>
          <p className="mt-3 text-muted-foreground">
            A digital marketplace built for the realities of Nigerian agriculture.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">Three steps from farm to buyer.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <Card key={step.title}>
                <CardContent className="p-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / impact */}
      <section className="container py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: TrendingUp, title: 'Better prices', text: 'Farmers keep more of every naira.' },
            { icon: Users, title: 'Direct relationships', text: 'Buyers deal with farmers, not agents.' },
            { icon: BadgeCheck, title: 'Less post-harvest loss', text: 'Faster matching of supply and demand.' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold">Ready to trade directly?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
            Join farmers and buyers already connecting on {APP_NAME}.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/register">Create free account</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/marketplace">Explore produce</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
