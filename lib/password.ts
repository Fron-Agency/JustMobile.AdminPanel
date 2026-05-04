function toB64(bytes: Uint8Array): string {
  let str = ""
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str)
}

function fromB64(str: string): Uint8Array {
  const raw = atob(str)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plain),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256
  )
  return `pbkdf2:100000:${toB64(salt)}:${toB64(new Uint8Array(bits))}`
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  try {
    const [algo, iterStr, saltB64, hashB64] = stored.split(":")
    if (algo !== "pbkdf2") return false
    const salt = fromB64(saltB64)
    const iterations = parseInt(iterStr, 10)
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(plain),
      "PBKDF2",
      false,
      ["deriveBits"]
    )
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      key,
      256
    )
    const derived = new Uint8Array(bits)
    const expected = fromB64(hashB64)
    if (derived.length !== expected.length) return false
    let diff = 0
    for (let i = 0; i < derived.length; i++) diff |= derived[i] ^ expected[i]
    return diff === 0
  } catch {
    return false
  }
}
