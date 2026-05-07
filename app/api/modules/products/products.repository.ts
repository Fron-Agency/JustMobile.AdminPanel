import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type {
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductColor,
  CreateColorDto,
  UpdateColorDto,
  ProductPhoto,
  CreatePhotoDto,
  UpdatePhotoDto,
} from "./products.type"

async function client() {
  return createClient(await cookies())
}

export const ProductRepository = {
  async findAll(): Promise<Product[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        plans(name),
        products_colors(
          *,
          products_photos(*)
        )
      `)
      .order("name")

    if (error) throw new Error(error.message)

    return (data ?? []).map((row: any) => ({
      ...row,
      plan_name: row.plans?.name ?? "",
      colors: (row.products_colors ?? []).map((c: any) => ({
        ...c,
        photos: c.products_photos ?? [],
      })),
    }))
  },

  async findById(id: string): Promise<Product | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        plans(name),
        products_colors(
          *,
          products_photos(*)
        )
      `)
      .eq("id", id)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) return null

    return {
      ...data,
      plan_name: (data as any).plans?.name ?? "",
      colors: ((data as any).products_colors ?? []).map((c: any) => ({
        ...c,
        photos: c.products_photos ?? [],
      })),
    }
  },

  async create(payload: CreateProductDto): Promise<Product> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("products")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return { ...data, plan_name: "", colors: [] }
  },

  async update(id: string, payload: UpdateProductDto): Promise<Product> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return { ...data, plan_name: "", colors: [] }
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },

  // Colors
  async createColor(payload: CreateColorDto): Promise<ProductColor> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("products_colors")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return { ...data, photos: [] }
  },

  async updateColor(id: string, payload: UpdateColorDto): Promise<ProductColor> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("products_colors")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return { ...data, photos: [] }
  },

  async deleteColor(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("products_colors").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },

  // Photos
  async createPhoto(payload: CreatePhotoDto): Promise<ProductPhoto> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("products_photos")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async updatePhoto(id: string, payload: UpdatePhotoDto): Promise<ProductPhoto> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("products_photos")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async deletePhoto(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("products_photos").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}
