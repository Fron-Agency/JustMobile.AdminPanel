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
        plans_mobile(name),
        plans_home(name),
        products_colors(
          *,
          products_photos(*)
        )
      `)
      .order("name")

    if (error) throw new Error(error.message)

    return (data ?? []).map((row: any) => ({
      ...row,
      plan_mobile_name: row.plans_mobile?.name ?? null,
      plan_home_name: row.plans_home?.name ?? null,
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
        plans_mobile(name),
        plans_home(name),
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
      ...(data as any),
      plan_mobile_name: (data as any).plans_mobile?.name ?? null,
      plan_home_name: (data as any).plans_home?.name ?? null,
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
    return { ...data, plan_mobile_name: null, plan_home_name: null, colors: [] }
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
    return { ...data, plan_mobile_name: null, plan_home_name: null, colors: [] }
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
