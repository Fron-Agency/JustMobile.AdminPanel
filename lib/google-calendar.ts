import { google } from "googleapis"

const EVENT_DURATION_MS = 30 * 60 * 1000

function getCalendarClient() {
  const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!clientEmail || !privateKey) return null

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  })

  return google.calendar({ version: "v3", auth })
}

// Creates or updates the calendar event for a candidate's interview. Returns
// the event id to persist on the candidate row, or null if calendar sync
// isn't configured (missing env vars) so callers can no-op gracefully.
export async function upsertInterviewEvent(params: {
  eventId: string | null
  candidateName: string
  interviewDate: string
}): Promise<string | null> {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendar || !calendarId) return null

  const start = new Date(params.interviewDate)
  const end = new Date(start.getTime() + EVENT_DURATION_MS)

  const requestBody = {
    summary: params.candidateName,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  }

  if (params.eventId) {
    const { data } = await calendar.events.update({
      calendarId,
      eventId: params.eventId,
      requestBody,
    })
    return data.id ?? null
  }

  const { data } = await calendar.events.insert({
    calendarId,
    requestBody,
  })
  return data.id ?? null
}

export async function deleteInterviewEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendar || !calendarId) return

  try {
    await calendar.events.delete({ calendarId, eventId })
  } catch (error) {
    // Event may already be gone (deleted manually in Google Calendar) — not
    // worth failing the candidate update over a 404/410 from the calendar API.
    const status = (error as { code?: number })?.code
    if (status !== 404 && status !== 410) throw error
  }
}
