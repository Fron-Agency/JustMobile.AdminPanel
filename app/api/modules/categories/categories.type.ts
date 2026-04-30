export type Category = {
  id: string
  name: string
  is_active: boolean
}

export type CreateCategoryDto = {
  name: string
  is_active: boolean
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>