import { ProductRepository } from "./products.repository"
import type { Product, ProductColor, ProductPhoto } from "./products.type"
import type {
  CreateProductInput,
  UpdateProductInput,
  CreateColorInput,
  UpdateColorInput,
  CreatePhotoInput,
  UpdatePhotoInput,
} from "./products.validation"

export const ProductService = {
  async getAll(): Promise<Product[]> {
    return ProductRepository.findAll()
  },

  async getById(id: string): Promise<Product> {
    const product = await ProductRepository.findById(id)
    if (!product) throw new Error("Product not found")
    return product
  },

  async create(input: CreateProductInput): Promise<Product> {
    const product = await ProductRepository.create(input)
    return (await ProductRepository.findById(product.id))!
  },

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    await ProductService.getById(id)
    await ProductRepository.update(id, input)
    return (await ProductRepository.findById(id))!
  },

  async delete(id: string): Promise<void> {
    await ProductService.getById(id)
    return ProductRepository.delete(id)
  },

  // Colors
  async createColor(productId: string, input: CreateColorInput): Promise<ProductColor> {
    await ProductService.getById(productId)
    return ProductRepository.createColor({ ...input, product_id: productId })
  },

  async updateColor(id: string, input: UpdateColorInput): Promise<ProductColor> {
    return ProductRepository.updateColor(id, input)
  },

  async deleteColor(id: string): Promise<void> {
    return ProductRepository.deleteColor(id)
  },

  // Photos
  async createPhoto(productId: string, input: CreatePhotoInput): Promise<ProductPhoto> {
    return ProductRepository.createPhoto({ ...input, product_id: productId })
  },

  async updatePhoto(id: string, input: UpdatePhotoInput): Promise<ProductPhoto> {
    return ProductRepository.updatePhoto(id, input)
  },

  async deletePhoto(id: string): Promise<void> {
    return ProductRepository.deletePhoto(id)
  },
}
