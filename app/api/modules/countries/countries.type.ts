export interface Country {
  id: string
  name: string
  countries: string[] | null
}

export interface CreateCountryDto {
  name: string
  countries?: string[] | null
}

export type UpdateCountryDto = Partial<CreateCountryDto>
