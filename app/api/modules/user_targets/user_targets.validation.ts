import { z } from "zod"

const isoDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")

// An empty string (cleared <input type="date"> / empty text field) means null.
// An absent key stays undefined, so partial updates don't clear the column.
const emptyToNull = (v: string | null | undefined) => (v === "" ? null : v)

const target = z.number().finite().min(0, "Target cannot be negative")
const endDate = z.union([isoDate, z.literal("")]).nullable().optional().transform(emptyToNull)
const targetName = z.string().trim().max(200).nullable().optional().transform(emptyToNull)

// ISO dates compare correctly as strings.
export function isValidDateRange(start: string, end: string | null | undefined): boolean {
  return !end || end >= start
}

export const createUserTargetSchema = z
  .object({ target, start_date: isoDate, end_date: endDate, target_name: targetName })
  .refine((data) => isValidDateRange(data.start_date, data.end_date), {
    message: "End date must be on or after start date",
    path: ["end_date"],
  })

export type CreateUserTargetInput = z.infer<typeof createUserTargetSchema>

// The date range against the stored row is checked in UserTargetsService.update,
// since a partial update may send only one of the two dates.
export const updateUserTargetSchema = z
  .object({
    target: target.optional(),
    start_date: isoDate.optional(),
    end_date: endDate,
    target_name: targetName,
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Provide at least one of target, start_date, end_date, or target_name.",
  })

export type UpdateUserTargetInput = z.infer<typeof updateUserTargetSchema>
