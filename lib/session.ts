const COOKIE_NAME = "jm_session"
const EXPIRES_MS = 7 * 24 * 60 * 60 * 1000

export type SessionPayload = {
  id: string
  email: string
  fullname: string
  role: string
  exp: number
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET ?? "change-this-secret-in-production"
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

function toB64Url(bytes: Uint8Array): string {
  let str = ""
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function fromB64Url(str: string): Uint8Array {
  const raw = atob(str.replace(/-/g, "+").replace(/_/g, "/"))
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function createSession(data: Omit<SessionPayload, "exp">): Promise<string> {
  const payload: SessionPayload = { ...data, exp: Date.now() + EXPIRES_MS }
  const enc = new TextEncoder()
  const key = await getKey()
  const header = toB64Url(enc.encode(JSON.stringify({ alg: "HS256" })))
  const body = toB64Url(enc.encode(JSON.stringify(payload)))
  const message = `${header}.${body}`
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message))
  return `${message}.${toB64Url(new Uint8Array(sig))}`
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const [header, body, sig] = parts
    const key = await getKey()
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromB64Url(sig),
      new TextEncoder().encode(`${header}.${body}`)
    )
    if (!valid) return null
    const payload: SessionPayload = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")))
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

export { COOKIE_NAME, EXPIRES_MS }
