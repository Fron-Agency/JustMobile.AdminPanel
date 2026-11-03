export interface Agent {
  id: string
  first_name: string
  last_name: string
  created_at: string
  /** Free-text team name, e.g. "A"; null when unassigned. */
  team: string | null
}

export interface CreateAgentDto {
  first_name: string
  last_name: string
  team?: string | null
}

export type UpdateAgentDto = Partial<CreateAgentDto>
