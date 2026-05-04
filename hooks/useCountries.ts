import { useEffect, useState } from "react"

type CountryOption = {
  value: string
  label: string
}

export function useCountries() {
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2"
        )

        const data = await res.json()

        if (!Array.isArray(data)) {
          throw new Error("Invalid API response")
        }

        const formatted = data
          .map((c: any) => ({
            value: c.cca2,
            label: c.name?.common,
          }))
          .filter((c) => c.value && c.label)
          .sort((a, b) => a.label.localeCompare(b.label))

        setCountries(formatted)
      } catch (err) {
        console.error("Failed to load countries", err)
        setCountries([])
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  return { countries, loading }
}