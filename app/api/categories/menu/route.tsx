import { CategoryService } from "@/app/api/modules/categories/categories.service"

export async function GET() {
  const categories = await CategoryService.getCategoriesProvidersAndPlans()
  return Response.json(categories)
}