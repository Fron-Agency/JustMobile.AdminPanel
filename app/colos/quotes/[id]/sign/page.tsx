"use client"

import { use, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Eraser, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import { SignaturePad, type SignaturePadHandle } from "@/components/colos/signature-pad"

type QuoteDetail = {
  id: number
  name: string
  town: string
  pdfUrl: string | null
  signedAt: string | null
}

export default function ColosSignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)

  const clientPadRef = useRef<SignaturePadHandle>(null)
  const workerPadRef = useRef<SignaturePadHandle>(null)

  const today = new Date().toLocaleDateString("fr-CH")

  useEffect(() => {
    fetch(`/api/colos/quotes/${id}`)
      .then((res) => res.json())
      .then((data: QuoteDetail | { message: string }) => {
        if (!("id" in data)) {
          setFeedback({ tone: "destructive", title: "Could not load quote", description: data.message })
          return
        }
        setQuote(data)
      })
      .finally(() => setIsLoading(false))
  }, [id])

  const handleSubmit = async () => {
    if (!clientPadRef.current || !workerPadRef.current) return
    if (clientPadRef.current.isEmpty() || workerPadRef.current.isEmpty()) {
      setFeedback({
        tone: "destructive",
        title: "Both signatures are required",
        description: "Please ask both the client and the worker to sign before submitting.",
      })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/colos/quotes/${id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientSignature: clientPadRef.current.toDataURL(),
          workerSignature: workerPadRef.current.toDataURL(),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message || "Failed to save signatures")
      }
      setFeedback({ tone: "success", title: "Mandate signed", description: "Redirecting to the quotes list…" })
      setTimeout(() => router.push("/colos"), 1200)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong"
      setFeedback({ tone: "destructive", title: "Could not save signatures", description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="max-w-xl mx-auto">
        <FeedbackAlert tone="destructive" title="Quote not found" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Sign mandate</h1>
        <p className="text-sm text-muted-foreground">
          {quote.name} · {quote.town} · {today}
        </p>
      </div>

      {feedback ? (
        <FeedbackAlert
          tone={feedback.tone}
          title={feedback.title}
          description={feedback.description}
        />
      ) : null}

      {quote.signedAt ? (
        <FeedbackAlert
          tone="success"
          title="Already signed"
          description={`This mandate was signed on ${new Date(quote.signedAt).toLocaleString()}.`}
        />
      ) : (
        <>
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Client signature</h2>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1 text-muted-foreground"
                onClick={() => clientPadRef.current?.clear()}
              >
                <Eraser className="w-3.5 h-3.5" />
                Clear
              </Button>
            </div>
            <SignaturePad ref={clientPadRef} />
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Worker signature (COLOS SA)</h2>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1 text-muted-foreground"
                onClick={() => workerPadRef.current?.clear()}
              >
                <Eraser className="w-3.5 h-3.5" />
                Clear
              </Button>
            </div>
            <SignaturePad ref={workerPadRef} />
          </section>

          <Button className="w-full gap-2" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
            Submit signatures
          </Button>
        </>
      )}
    </div>
  )
}
