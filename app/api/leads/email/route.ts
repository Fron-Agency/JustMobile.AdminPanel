import { NextResponse } from "next/server"
import { Resend } from "resend"
import { requireAuth } from "@/utils/supabase/require-auth"
import { LeadService } from "@/app/api/modules/leads/leads.service"
import { z } from "zod"

const resend = new Resend(process.env.RESEND_API_KEY)

const sendEmailSchema = z.object({
  recipients: z.array(z.string().email()).min(1),
  leadId: z.string(),
  leadName: z.string(),
  leadEmail: z.string().email(),
  leadPhone: z.string().nullable().optional(),
  leadPlan: z.string().optional(),
  leadAddress: z.object({
    street: z.string().nullable().optional(),
    number: z.string().nullable().optional(),
    zip_code: z.string(),
    city: z.string(),
  }).nullable().optional(),
  leadDateOfBirth: z.string().nullable().optional(),
  leadSwissNumber: z.boolean().nullable().optional(),
  leadRoaming: z.boolean().nullable().optional(),
  leadDescription: z.string().nullable().optional(),
  message: z.string().optional(),
})

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding: 10px 12px; color: #666; width: 160px; vertical-align: top; border-bottom: 1px solid #f0f0f0;">${label}</td>
      <td style="padding: 10px 12px; font-weight: 500; color: #1a1a1a; border-bottom: 1px solid #f0f0f0;">${value}</td>
    </tr>`
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const body = sendEmailSchema.parse(await req.json())

    const address = body.leadAddress
    const formattedAddress = address
      ? [address.street, address.number, address.zip_code, address.city].filter(Boolean).join(" ")
      : null

    const html = `
      <div style="font-family: sans-serif; max-width: 620px; margin: 0 auto; background: #fff;">
        <div style="background: #0f172a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; color: #fff; font-size: 20px; font-weight: 600;">JustMobile</h1>
          <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">New Lead Notification</p>
        </div>

        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="margin: 0 0 20px; font-size: 16px; color: #374151;">Lead Details</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #f0f0f0; border-radius: 6px; overflow: hidden;">
            ${row("Name", body.leadName)}
            ${row("Email", body.leadEmail)}
            ${body.leadPhone ? row("Phone", body.leadPhone) : ""}
            ${body.leadPlan ? row("Plan", body.leadPlan) : ""}
            ${formattedAddress ? row("Address", formattedAddress) : ""}
            ${body.leadDateOfBirth ? row("Date of Birth", body.leadDateOfBirth) : ""}
            ${body.leadSwissNumber != null ? row("Swiss Number", body.leadSwissNumber ? "Yes" : "No") : ""}
            ${body.leadRoaming != null ? row("Roaming Control", body.leadRoaming ? "Yes" : "No") : ""}
            ${body.leadDescription ? row("Description", body.leadDescription) : ""}
          </table>

          ${body.message ? `
          <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-left: 3px solid #0f172a; border-radius: 4px;">
            <p style="margin: 0 0 4px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Note</p>
            <p style="margin: 0; color: #374151;">${body.message}</p>
          </div>` : ""}

          <p style="margin-top: 32px; color: #9ca3af; font-size: 12px; border-top: 1px solid #f0f0f0; padding-top: 16px;">
            Sent from JustMobile Admin Panel
          </p>
        </div>
      </div>
    `

    const { error } = await resend.emails.send({
      from: "JustMobile <info@colos.ch>",
      to: body.recipients,
      subject: `Lead: ${body.leadName}`,
      html,
    })

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    const updatedLead = await LeadService.update(body.leadId, { status: "sent" })

    return NextResponse.json({ success: true, lead: updatedLead })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to send email" },
      { status: 400 }
    )
  }
}
