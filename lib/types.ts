export type Category = {
  id: string
  name: string
  is_active: boolean
}

export type Provider = {
  id: string
  category_id: string
  name: string
  created_at: string
  is_active: boolean
}

export type Plan = {
  id: string
  provider_id: string
  price: number
  data_gb: number
  speed: number
  contract_length: number
  name: string
  discount: number
  is_favorite: boolean
}

export type Lead = {
  id: string
  fullname: string
  email: string
  phone: string
  plan_id: string
  file_url: string
  status: "new" | "contacted" | "converted" | "lost"
  created_at: string
}

export type User = {
  id: string
  fullname: string
  email: string
  password: string
  role: "admin" | "agent" | "viewer"
  is_active: boolean
  created_at: string
}
