import { useEffect, useState } from "react"

type CountryOption = {
  value: string
  label: string
}

let cachedCountries: CountryOption[] | null = null
let fetchPromise: Promise<CountryOption[]> | null = null

async function fetchCountries(): Promise<CountryOption[]> {
  if (cachedCountries) return cachedCountries
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch("https://restcountries.com/v3.1/all?fields=name,cca2")
    .then((res) => res.json())
    .then((data) => {
      if (!Array.isArray(data)) throw new Error("Invalid API response")
      const formatted = data
        .map((c: any) => ({ value: c.cca2, label: c.name?.common }))
        .filter((c) => c.value && c.label)
        .sort((a, b) => a.label.localeCompare(b.label))
      cachedCountries = formatted
      fetchPromise = null
      return formatted
    })
    .catch((err) => {
      console.error("Failed to load countries", err)
      fetchPromise = null
      return []
    })

  return fetchPromise
}

export function useCountries() {
  const [countries, setCountries] = useState<CountryOption[]>(cachedCountries ?? [])
  const [loading, setLoading] = useState(cachedCountries === null)

  useEffect(() => {
    if (cachedCountries) return
    fetchCountries().then((data) => {
      setCountries(data)
      setLoading(false)
    })
  }, [])

  return { countries, loading }
}