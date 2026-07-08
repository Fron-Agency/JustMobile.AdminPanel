export type QuoteSource = "justcompare" | "colos"

export type Quote = {
  id: number
  name: string
  email: string
  phone: string
  postcode: string
  town: string
  locationId: string
  currentInsurer: string
  yearOfBirth: string
  franchise: number
  accidentIncluded: boolean
  selectedTariff: string
  source: QuoteSource
  createdAt: Date
  updatedAt: Date
}
