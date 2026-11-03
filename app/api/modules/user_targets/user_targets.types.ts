export interface UserTarget {
  id: string
  target: number
  /** ISO date (YYYY-MM-DD). */
  start_date: string
  /** ISO date (YYYY-MM-DD), or null for an open-ended target. */
  end_date: string | null
  target_name: string | null
  /** Free-text team name, e.g. "A"; null means the target applies to all agents. */
  team: string | null
}

export interface CreateUserTargetDto {
  target: number
  start_date: string
  end_date?: string | null
  target_name?: string | null
  team?: string | null
}

export type UpdateUserTargetDto = Partial<CreateUserTargetDto>
