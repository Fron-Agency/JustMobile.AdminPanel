export type Category = {
  id: string
  name: string
  badge?: string
  is_active: boolean
}

export type CreateCategoryDto = {
  name: string
  badge?: string
  is_active: boolean
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>