import { NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"
import { requireColosAuth } from "@/utils/colos/require-auth"
import { ColosPdfService } from "@/app/api/modules/colos/colos-pdf.service"
import { ColosQuoteService } from "@/app/api/modules/colos/colos-quotes.service"

const resend = new Resend(process.env.RESEND_API_KEY)

const sendPdfEmailSchema = z.object({
  quoteId: z.number(),
})

export async function POST(req: Request) {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { quoteId } = sendPdfEmailSchema.parse(await req.json())

    const quote = await ColosQuoteService.getById(quoteId)

    let buffer = await ColosPdfService.getBuffer(quoteId)
    if (!buffer) {
      await ColosPdfService.generateAndStore(quoteId)
      buffer = await ColosPdfService.getBuffer(quoteId)
    }
    if (!buffer) {
      return NextResponse.json({ message: "Impossible de générer le PDF" }, { status: 500 })
    }

    const html = `
      <div style="font-family: sans-serif; max-width: 620px; margin: 0 auto; background: #fff;">
        <div style="background: #c2185b; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; color: #fff; font-size: 20px; font-weight: 600;">COLOS</h1>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 16px; color: #1a1a1a; font-size: 14px; line-height: 1.5;">Bonjour ${quote.name},</p>
          <p style="margin: 0 0 16px; color: #374151; font-size: 14px; line-height: 1.5;">
            Veuillez trouver ci-joint votre document d'assurance maladie.
          </p>
          <p style="margin: 0 0 16px; color: #374151; font-size: 14px; line-height: 1.5;">
            N'hésitez pas à nous contacter pour toute question.
          </p>
          <p style="margin: 32px 0 0; color: #374151; font-size: 14px;">Cordialement,<br />L'équipe COLOS</p>
          <p style="margin-top: 32px; color: #9ca3af; font-size: 12px; border-top: 1px solid #f0f0f0; padding-top: 16px;">
            COLOS SA, Route du Simplon 51, 1902 Evionnaz — info@colos.ch · www.colos.ch
          </p>
        </div>
      </div>
    `

    const { error } = await resend.emails.send({
      from: "COLOS <info@colos.ch>",
      to: [quote.email],
      subject: "Votre document d'assurance maladie",
      html,
      attachments: [
        {
          filename: `quote-${quoteId}.pdf`,
          content: buffer,
        },
      ],
    })

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Échec de l'envoi de l'email" },
      { status: 400 }
    )
  }
}
