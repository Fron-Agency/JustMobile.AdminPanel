export interface Agent {
  id: string
  first_name: string
  last_name: string
  created_at: string
}

export interface CreateAgentDto {
  first_name: string
  last_name: string
}

export type UpdateAgentDto = Partial<CreateAgentDto>
