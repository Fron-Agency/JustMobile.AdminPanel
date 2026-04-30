import type { Category, Provider, Plan, Lead, User } from "./types"

export const mockUsers: User[] = [
  { id: "user-1", fullname: "Admin User", email: "admin@justmobile.com", password: "", role: "admin", is_active: true, created_at: "2024-01-01" },
  { id: "user-2", fullname: "Sales Agent", email: "agent@justmobile.com", password: "", role: "agent", is_active: true, created_at: "2024-01-15" },
  { id: "user-3", fullname: "Viewer Account", email: "viewer@justmobile.com", password: "", role: "viewer", is_active: false, created_at: "2024-02-01" },
]

export async function getUsers(): Promise<User[]> {
  return mockUsers
}

export async function getUserById(id: string): Promise<User | null> {
  return mockUsers.find((user) => user.id === id) || null
}

export const mockCategories: Category[] = [
  { id: "cat-1", name: "Mobile", is_active: true },
  { id: "cat-2", name: "Broadband", is_active: true },
  { id: "cat-3", name: "TV & Streaming", is_active: false },
]

export const mockProviders: Provider[] = [
  { id: "prov-1", category_id: "cat-1", name: "Vodafone", created_at: "2024-01-10", is_active: true },
  { id: "prov-2", category_id: "cat-1", name: "EE", created_at: "2024-01-15", is_active: true },
  { id: "prov-3", category_id: "cat-2", name: "BT", created_at: "2024-02-01", is_active: true },
  { id: "prov-4", category_id: "cat-3", name: "Sky", created_at: "2024-02-10", is_active: false },
]

export const mockPlans: Plan[] = [
  { id: "plan-1", provider_id: "prov-1", price: 25, data_gb: 50, speed: 100, contract_length: 24, name: "Vodafone Essentials", discount: 0, is_favorite: false },
  { id: "plan-2", provider_id: "prov-1", price: 35, data_gb: 100, speed: 300, contract_length: 12, name: "Vodafone Pro", discount: 10, is_favorite: true },
  { id: "plan-3", provider_id: "prov-2", price: 30, data_gb: 75, speed: 150, contract_length: 24, name: "EE Smart", discount: 5, is_favorite: false },
  { id: "plan-4", provider_id: "prov-3", price: 40, data_gb: 200, speed: 500, contract_length: 18, name: "BT Full Fibre", discount: 15, is_favorite: true },
  { id: "plan-5", provider_id: "prov-2", price: 20, data_gb: 30, speed: 50, contract_length: 12, name: "EE Starter", discount: 0, is_favorite: false },
]

export const mockLeads: Lead[] = [
  { id: "lead-1", fullname: "James Harrington", email: "james.h@email.com", phone: "+44 7700 900001", plan_id: "plan-1", file_url: "", status: "new", created_at: "2024-04-01" },
  { id: "lead-2", fullname: "Sophia Patel", email: "sophia.p@email.com", phone: "+44 7700 900002", plan_id: "plan-2", file_url: "", status: "contacted", created_at: "2024-04-03" },
  { id: "lead-3", fullname: "Oliver Nguyen", email: "oliver.n@email.com", phone: "+44 7700 900003", plan_id: "plan-3", file_url: "", status: "converted", created_at: "2024-04-05" },
  { id: "lead-4", fullname: "Emma Clarke", email: "emma.c@email.com", phone: "+44 7700 900004", plan_id: "plan-4", file_url: "", status: "lost", created_at: "2024-04-07" },
  { id: "lead-5", fullname: "Liam Okonkwo", email: "liam.o@email.com", phone: "+44 7700 900005", plan_id: "plan-5", file_url: "", status: "new", created_at: "2024-04-09" },
  { id: "lead-6", fullname: "Ava Martínez", email: "ava.m@email.com", phone: "+44 7700 900006", plan_id: "plan-1", file_url: "", status: "contacted", created_at: "2024-04-11" },
]

export async function getCategories(): Promise<Category[]> {
  return mockCategories
}

export async function getProviders(): Promise<Provider[]> {
  return mockProviders
}

export async function getPlans(): Promise<Plan[]> {
  return mockPlans
}

export async function getLeads(): Promise<Lead[]> {
  return mockLeads
}

export async function getProvidersByCategory(categoryId: string): Promise<Provider[]> {
  return mockProviders.filter((provider) => provider.category_id === categoryId)
}

export async function getPlansByProvider(providerId: string): Promise<Plan[]> {
  return mockPlans.filter((plan) => plan.provider_id === providerId)
}

export async function getLeadsByPlan(planId: string): Promise<Lead[]> {
  return mockLeads.filter((lead) => lead.plan_id === planId)
}
