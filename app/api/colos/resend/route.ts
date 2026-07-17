import { NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"
import { requireColosAuth } from "@/utils/colos/require-auth"
import { ColosPdfService } from "@/app/api/modules/colos/colos-pdf.service"
import { ColosQuoteService } from "@/app/api/modules/colos/colos-quotes.service"
import { COLOS_PDF_LANGUAGES, type ColosPdfLang } from "@/app/api/modules/colos/colos-pdf.languages"

const resend = new Resend(process.env.RESEND_API_KEY)

const VALID_LANGS = COLOS_PDF_LANGUAGES.map((l) => l.code) as [ColosPdfLang, ...ColosPdfLang[]]

const sendPdfEmailSchema = z.object({
  quoteId: z.number(),
  lang: z.enum(VALID_LANGS).default("fr"),
})

const EMAIL_COPY: Record<ColosPdfLang, { subject: string; greeting: (name: string) => string; body: string[]; signoff: string }> = {
  fr: {
    subject: "Votre document d'assurance maladie",
    greeting: (name) => `Bonjour ${name},`,
    body: [
      "Veuillez trouver ci-joint votre document d'assurance maladie.",
      "N'hésitez pas à nous contacter pour toute question.",
    ],
    signoff: "Cordialement,<br />L'équipe COLOS",
  },
  it: {
    subject: "Il tuo documento di assicurazione malattia",
    greeting: (name) => `Gentile ${name},`,
    body: [
      "In allegato trova il suo documento di assicurazione malattia.",
      "Non esiti a contattarci per qualsiasi domanda.",
    ],
    signoff: "Cordiali saluti,<br />Il team COLOS",
  },
  de: {
    subject: "Ihr Krankenversicherungsdokument",
    greeting: (name) => `Guten Tag ${name},`,
    body: [
      "Anbei finden Sie Ihr Krankenversicherungsdokument.",
      "Bei Fragen stehen wir Ihnen gerne zur Verfügung.",
    ],
    signoff: "Freundliche Grüsse,<br />Das COLOS-Team",
  },
  en: {
    subject: "Your health insurance document",
    greeting: (name) => `Hello ${name},`,
    body: [
      "Please find attached your health insurance document.",
      "Please don't hesitate to contact us with any questions.",
    ],
    signoff: "Best regards,<br />The COLOS team",
  },
}

export async function POST(req: Request) {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { quoteId, lang } = sendPdfEmailSchema.parse(await req.json())

    const quote = await ColosQuoteService.getById(quoteId)
    const buffer = await ColosPdfService.renderForViewing(quoteId, lang)

    const copy = EMAIL_COPY[lang]
    const html = `
      <div style="font-family: sans-serif; max-width: 620px; margin: 0 auto; background: #fff;">
        <div style="background: #c2185b; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; color: #fff; font-size: 20px; font-weight: 600;">COLOS</h1>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 16px; color: #1a1a1a; font-size: 14px; line-height: 1.5;">${copy.greeting(quote.name)}</p>
          ${copy.body
            .map(
              (line) =>
                `<p style="margin: 0 0 16px; color: #374151; font-size: 14px; line-height: 1.5;">${line}</p>`
            )
            .join("")}
          <p style="margin: 32px 0 0; color: #374151; font-size: 14px;">${copy.signoff}</p>
          <p style="margin-top: 32px; color: #9ca3af; font-size: 12px; border-top: 1px solid #f0f0f0; padding-top: 16px;">
            COLOS SA, Route du Simplon 51, 1902 Evionnaz — info@colos.ch · www.colos.ch
          </p>
        </div>
      </div>
    `

    const { error } = await resend.emails.send({
      from: "COLOS <info@colos.ch>",
      to: [quote.email],
      subject: copy.subject,
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
