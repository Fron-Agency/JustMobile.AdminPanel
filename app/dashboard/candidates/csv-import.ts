import type { CandidateLanguage, CefrLevel } from "@/app/api/modules/candidates/candidates.types"
import { CEFR_LEVELS } from "@/app/api/modules/candidates/candidates.types"

export interface ImportRow {
  firstname: string
  lastname: string
  date_of_birth: string
  phone_number: string
  city: string
  email: string
  languages: Partial<Record<CandidateLanguage, CefrLevel>>
  previous_role: string
  why_us: string
  /** ISO date (YYYY-MM-DD), from the CSV's Timestamp column. Empty if unparseable. */
  created_at: string
}

export interface ImportParseResult {
  rows: ImportRow[]
  skipped: Array<{ line: number; reason: string }>
  duplicates: number
}

// --- Low-level CSV parsing -------------------------------------------------

/**
 * RFC4180-ish CSV parser: handles quoted fields, escaped quotes (""), and
 * quoted fields containing embedded newlines/commas — all present in the
 * Optimus export (multi-paragraph CV text pasted straight into cells).
 */
export function parseCsv(text: string): string[][] {
  // Strip BOM if present (common in Excel-exported CSVs).
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)

  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else {
      field += char
    }
  }

  // Final field/row if the file doesn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""))
}

// --- Header matching ---------------------------------------------------

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents (ë, ç, etc.)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function findColumn(headers: string[], matchers: (string | RegExp)[]): number {
  const normalized = headers.map(normalizeHeader)
  for (const matcher of matchers) {
    const idx = normalized.findIndex((h) =>
      typeof matcher === "string" ? h.includes(matcher) : matcher.test(h)
    )
    if (idx !== -1) return idx
  }
  return -1
}

// Per-language: the sheet has two overlapping column families — a level-only
// column tucked among the "sales/system" questions, and a
// "Gjuha e huaj .../Fremdsprachenkenntnisse [X]" column later. Either may hold
// the CEFR value for a given row; we take whichever parses first.
const LANGUAGE_MATCHERS: Record<CandidateLanguage, (string | RegExp)[]> = {
  german: ["gjermane", "deutsch"],
  french: ["frenge", "frengje", "franz"],
  italian: ["italiane", "italian"],
  serboCroatian: ["serbokroate", "serbo"],
  turkish: ["turke", "turkish"],
  spanish: ["spanjolle", "spanish"],
  english: ["angleze", "english"],
}

function toCefr(raw: string): CefrLevel | null {
  const value = raw.trim().toUpperCase()
  // Cells like "B1, B2, C1" list every level the applicant claims — take the highest.
  const found = value
    .split(/[,/]/)
    .map((v) => v.trim())
    .filter((v) => (CEFR_LEVELS as readonly string[]).includes(v)) as CefrLevel[]
  if (found.length === 0) return null
  const order: CefrLevel[] = ["B1", "B2", "C1", "C2"]
  return found.reduce((best, level) => (order.indexOf(level) > order.indexOf(best) ? level : best))
}

// --- Date parsing --------------------------------------------------------

function toIsoDate(raw: string): string {
  const value = raw.trim()
  if (!value) return ""

  // MM/DD/YYYY (the dominant format in this export)
  let m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const [, mo, d, y] = m
    if (Number(mo) >= 1 && Number(mo) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
    }
  }

  // DD.MM.YYYY / DD-MM-YYYY
  m = value.match(/^(\d{1,2})[.-](\d{1,2})[.-](\d{4})$/)
  if (m) {
    const [, d, mo, y] = m
    if (Number(mo) >= 1 && Number(mo) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
    }
  }

  // Bare year, e.g. "1983"
  m = value.match(/^(19|20)\d{2}$/)
  if (m) return `${value}-01-01`

  return "" // unparseable — leave blank rather than guessing
}

// Timestamp column is "MM/DD/YYYY HH:mm:ss" — only the date part is kept since
// candidates.created_at is a plain `date` column, not a timestamp.
function toIsoDateFromTimestamp(raw: string): string {
  const datePart = raw.trim().split(/\s+/)[0] ?? ""
  return toIsoDate(datePart)
}

// --- Name splitting --------------------------------------------------------

function splitName(fullName: string): { firstname: string; lastname: string } {
  const parts = fullName.trim().replace(/\s+/g, " ").split(" ")
  if (parts.length === 0 || (parts.length === 1 && !parts[0])) {
    return { firstname: "", lastname: "" }
  }
  if (parts.length === 1) return { firstname: parts[0], lastname: parts[0] }
  return { firstname: parts[0], lastname: parts.slice(1).join(" ") }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// --- Main entry point --------------------------------------------------

export function parseOptimusCandidatesCsv(text: string): ImportParseResult {
  const table = parseCsv(text)
  if (table.length === 0) return { rows: [], skipped: [], duplicates: 0 }

  const headers = table[0]
  const dataRows = table.slice(1)

  const col = {
    timestamp: findColumn(headers, ["timestamp"]),
    dob: findColumn(headers, ["lindjes", "geburtsdatum"]),
    phonePrimary: findColumn(headers, [/^numri i telefonit/]),
    phoneAlt: findColumn(headers, ["numri kontaktues"]),
    emailA: findColumn(headers, [/^email$/]),
    emailB: findColumn(headers, ["email adresa"]),
    fullName: findColumn(headers, ["emri dhe mbiemri", "name und nachname"]),
    city: findColumn(headers, ["vendbanimi", "wohnort"]),
    whyUs: findColumn(headers, ["pse deshironi", "warum mochte"]),
    prevRole: findColumn(headers, [/^a keni punuar/]),
    prevRoleDetail: findColumn(headers, ["nese po", "sa gjate"]),
  }

  const langCols: Record<CandidateLanguage, number[]> = {
    german: [],
    french: [],
    italian: [],
    serboCroatian: [],
    turkish: [],
    spanish: [],
    english: [],
  }
  headers.forEach((h, i) => {
    const normalized = normalizeHeader(h)
    for (const [lang, matchers] of Object.entries(LANGUAGE_MATCHERS) as [
      CandidateLanguage,
      (string | RegExp)[]
    ][]) {
      if (matchers.some((m) => (typeof m === "string" ? normalized.includes(m) : m.test(normalized)))) {
        langCols[lang].push(i)
      }
    }
  })

  const get = (row: string[], idx: number) => (idx >= 0 && idx < row.length ? row[idx] ?? "" : "")

  const rows: ImportRow[] = []
  const skipped: ImportParseResult["skipped"] = []
  const seenEmails = new Map<string, number>() // email -> index in `rows`

  dataRows.forEach((row, i) => {
    const lineNumber = i + 2 // +1 for header, +1 for 1-indexing

    const rawEmail = get(row, col.emailA).trim() || get(row, col.emailB).trim()
    const email = EMAIL_RE.test(rawEmail) ? rawEmail.toLowerCase() : ""
    if (!email) {
      skipped.push({ line: lineNumber, reason: "No valid email address" })
      return
    }

    const fullName = get(row, col.fullName).trim()
    const { firstname, lastname } = splitName(fullName)
    if (!firstname || !lastname) {
      skipped.push({ line: lineNumber, reason: "Missing or unparseable name" })
      return
    }

    const languages: Partial<Record<CandidateLanguage, CefrLevel>> = {}
    for (const [lang, indices] of Object.entries(langCols) as [CandidateLanguage, number[]][]) {
      for (const idx of indices) {
        const level = toCefr(get(row, idx))
        if (level) {
          languages[lang] = level
          break
        }
      }
    }

    const previousRoleText = [get(row, col.prevRole), get(row, col.prevRoleDetail)]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" — ")
      .slice(0, 200)

    const record: ImportRow = {
      firstname,
      lastname,
      date_of_birth: toIsoDate(get(row, col.dob)),
      phone_number: (get(row, col.phonePrimary).trim() || get(row, col.phoneAlt).trim()).slice(0, 100),
      city: get(row, col.city).trim().slice(0, 200),
      email,
      languages,
      previous_role: previousRoleText,
      why_us: get(row, col.whyUs).trim().slice(0, 5000),
      created_at: toIsoDateFromTimestamp(get(row, col.timestamp)),
    }

    const existingIdx = seenEmails.get(email)
    if (existingIdx !== undefined) {
      // Later submission wins (CSV is chronological) — merge in anything the
      // newer row left blank so re-applications don't lose earlier detail.
      // "Applied" date is the exception: keep the earliest, since that's when
      // the person actually first applied.
      const existing = rows[existingIdx]
      rows[existingIdx] = {
        ...record,
        date_of_birth: record.date_of_birth || existing.date_of_birth,
        phone_number: record.phone_number || existing.phone_number,
        city: record.city || existing.city,
        why_us: record.why_us || existing.why_us,
        previous_role: record.previous_role || existing.previous_role,
        languages: { ...existing.languages, ...record.languages },
        created_at:
          existing.created_at && (!record.created_at || existing.created_at < record.created_at)
            ? existing.created_at
            : record.created_at,
      }
    } else {
      seenEmails.set(email, rows.length)
      rows.push(record)
    }
  })

  const duplicates = dataRows.length - rows.length - skipped.length

  return { rows, skipped, duplicates: Math.max(duplicates, 0) }
}
