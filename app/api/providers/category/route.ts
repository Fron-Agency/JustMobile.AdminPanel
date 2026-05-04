import { ProviderService } from "../../modules/providers/providers.service"

export async function GET() {
  const categories = await ProviderService.getProvidersAndCategories()
  return Response.json(categories)
}