import { CategoryRepository } from "./categories.repository"
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.validation"
import type { Category } from "./categories.type"

export const CategoryService = {
  async getAll(): Promise<Category[]> {
    return CategoryRepository.findAll()
  },

  async getById(id: string): Promise<Category> {
    const category = await CategoryRepository.findById(id)
    if (!category) throw new Error("Category not found")
    return category
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    return CategoryRepository.create({
      ...input,
      is_active: true,
    })
  },

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    await CategoryService.getById(id)
    return CategoryRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    await CategoryService.getById(id)
    return CategoryRepository.delete(id)
  },
}