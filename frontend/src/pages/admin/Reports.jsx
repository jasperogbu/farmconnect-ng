import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import EmptyState from '@/components/EmptyState'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'

const statusStyles = {
  open: 'bg-amber-100 text-amber-800 border-amber-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  dismissed: 'bg-slate-100 text-slate-700 border-slate-200',
}

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState(null)
  const [action, setAction] = useState('resolved')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setReports(await adminApi.reports())
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function submit() {
    setSubmitting(true)
    try {
      await adminApi.resolveReport(target.id, { status: action, resolution_note: note || null })
      toast.success('Report updated.')
      setTarget(null)
      setNote('')
      load()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Review content and accounts flagged by users.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No reports" description="Nothing has been reported yet." />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className={statusStyles[report.status]}>
                      {report.status}
                    </Badge>
                    <h3 className="font-semibold">{report.reason}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {report.product_name && <>Listing: {report.product_name} · </>}
                    {report.reported_username && <>User: @{report.reported_username} · </>}
                    Reported by @{report.reporter_name} on {formatDate(report.created_at)}
                  </p>
                  {report.details && <p className="text-sm">{report.details}</p>}
                  {report.resolution_note && (
                    <p className="text-sm text-muted-foreground">
                      Resolution: {report.resolution_note}
                    </p>
                  )}
                </div>

                {report.status === 'open' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setTarget(report)
                        setAction('resolved')
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Resolve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTarget(report)
                        setAction('dismissed')
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Dismiss
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(target)} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'resolved' ? 'Resolve report' : 'Dismiss report'}
            </DialogTitle>
            <DialogDescription>Add an optional note for the record.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Resolution note (optional)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
