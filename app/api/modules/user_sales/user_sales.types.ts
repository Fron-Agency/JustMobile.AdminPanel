export interface UserSales {
  id: string
  first_name: string
  last_name: string
  sales: number
  created_at: string
}

export interface CreateUserSalesDto {
  first_name: string
  last_name: string
  sales: number
}

export interface UpdateUserSalesDto {
  first_name?: string
  last_name?: string
  sales?: number
}
