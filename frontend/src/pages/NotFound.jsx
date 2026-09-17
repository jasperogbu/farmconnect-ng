import { Link } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sprout className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-4xl font-extrabold">404</h1>
      <p className="mt-2 text-muted-foreground">This page could not be found.</p>
      <Button asChild className="mt-6">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}
