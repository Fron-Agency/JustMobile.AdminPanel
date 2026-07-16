"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, dateFnsLocalizer, Views, type View } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS, de } from "date-fns/locale"
import { useLocale, useTranslations } from "next-intl"
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
import type { Candidates } from "@/app/api/modules/candidates/candidates.types"
import { CANDIDATE_STATUS_COLORS } from "@/app/api/modules/candidates/candidates.types"

const locales = { en: enUS, de }

interface InterviewEvent {
  id: string
  title: string
  start: Date
  end: Date
  candidate: Candidates
}

export default function CalendarPage() {
  const t = useTranslations("Calendar")
  const tStatus = useTranslations("Candidates.status")
  const locale = useLocale()
  const dateFnsLocale = locale === "de" ? de : enUS

  const localizer = useMemo(
    () =>
      dateFnsLocalizer({
        format,
        parse,
        startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
        getDay,
        locales,
      }),
    []
  )

  // Force 24-hour time everywhere in the calendar (gutter, event labels,
  // agenda view) instead of date-fns' default 12-hour AM/PM formatting.
  const calendarFormats = useMemo(
    () => ({
      timeGutterFormat: (date: Date) => format(date, "HH:mm"),
      eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
        `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`,
      agendaTimeFormat: (date: Date) => format(date, "HH:mm"),
      agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
        `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`,
      dayHeaderFormat: (date: Date) => format(date, "EEEE dd/MM", { locale: dateFnsLocale }),
    }),
    [dateFnsLocale]
  )

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
        <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4" style={{ height: "75vh" }}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            {t("loadingSchedule")}
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            culture={locale}
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
            <DialogDescription>{t("eventDialog.description")}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">{t("eventDialog.when")}</span>
                <span className="col-span-2">
                  {format(selected.start, "dd/MM/yyyy HH:mm")}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">{t("eventDialog.email")}</span>
                <span className="col-span-2">{selected.candidate.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">{t("eventDialog.phone")}</span>
                <span className="col-span-2">{selected.candidate.phone_number}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-muted-foreground">{t("eventDialog.status")}</span>
                <div className="col-span-2">
                  <Badge variant="outline" className={CANDIDATE_STATUS_COLORS[selected.candidate.status]}>
                    {tStatus(selected.candidate.status)}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              {t("eventDialog.close")}
            </Button>
            {selected && (
              <Button asChild>
                <a href={`/dashboard/candidates`}>{t("eventDialog.goToCandidates")}</a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
