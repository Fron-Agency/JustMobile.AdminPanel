"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, dateFnsLocalizer, Views, type View } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./calendar-theme.css"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Candidates, CandidateStatus } from "@/app/api/modules/candidates/candidates.types"

const locales = { "en-US": enUS }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

// Force 24-hour time everywhere in the calendar (gutter, event labels,
// agenda view) instead of date-fns' default 12-hour AM/PM formatting.
const calendarFormats = {
  timeGutterFormat: (date: Date) => format(date, "HH:mm"),
  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`,
  agendaTimeFormat: (date: Date) => format(date, "HH:mm"),
  agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`,
  dayHeaderFormat: (date: Date) => format(date, "EEEE dd/MM"),
}

const STATUS_BADGE_VARIANT: Record<CandidateStatus, "default" | "secondary" | "destructive" | "outline"> = {
  new: "secondary",
  reviewed: "outline",
  accepted: "default",
  rejected: "destructive",
}

interface InterviewEvent {
  id: string
  title: string
  start: Date
  end: Date
  candidate: Candidates
}

export default function CalendarPage() {
  const [candidates, setCandidates] = useState<Candidates[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<View>(Views.WEEK)
  const [date, setDate] = useState(new Date())
  const [selected, setSelected] = useState<InterviewEvent | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetch("/api/candidates")
      .then((res) => res.json())
      .then(setCandidates)
      .finally(() => setIsLoading(false))
  }, [])

  const events = useMemo<InterviewEvent[]>(() => {
    return candidates
      .filter((c) => c.interview_date)
      .map((c) => {
        const start = new Date(c.interview_date as string)
        const end = new Date(start.getTime() + 30 * 60 * 1000)
        return {
          id: c.id,
          title: `${c.firstname} ${c.lastname}`,
          start,
          end,
          candidate: c,
        }
      })
  }, [candidates])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Interview Calendar</h1>
        <p className="text-sm text-muted-foreground">
          All scheduled candidate interviews across Optimus Marketing.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4" style={{ height: "75vh" }}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Loading schedule…
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            formats={calendarFormats}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            step={30}
            timeslots={2}
            defaultView={Views.WEEK}
            style={{ height: "100%" }}
            onSelectEvent={(event) => setSelected(event as InterviewEvent)}
            popup
          />
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.candidate.firstname} {selected?.candidate.lastname}</DialogTitle>
            <DialogDescription>Scheduled interview details.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">When</span>
                <span className="col-span-2">
                  {format(selected.start, "dd/MM/yyyy HH:mm")}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Email</span>
                <span className="col-span-2">{selected.candidate.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Phone</span>
                <span className="col-span-2">{selected.candidate.phone_number}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-muted-foreground">Status</span>
                <div className="col-span-2">
                  <Badge variant={STATUS_BADGE_VARIANT[selected.candidate.status]}>
                    {selected.candidate.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
            {selected && (
              <Button asChild>
                <a href={`/dashboard/candidates`}>Go to candidates</a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
