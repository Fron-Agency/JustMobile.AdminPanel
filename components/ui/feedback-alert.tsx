import * as React from "react"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export type FeedbackAlertTone = "default" | "destructive" | "success"

export type FeedbackAlertProps = Omit<
  React.ComponentProps<typeof Alert>,
  "variant" | "title"
> & {
  tone?: FeedbackAlertTone
  title: string
  description?: React.ReactNode
  hideIcon?: boolean
  /** Called after `autoHideMs`. Uses a ref so the timer is not reset on parent re-renders. */
  onAutoDismiss?: () => void
  /** Defaults to 5000 when `onAutoDismiss` is set. Omit both to keep the alert mounted until removed externally. */
  autoHideMs?: number
}

const toneIcon: Record<
  FeedbackAlertTone,
  React.ReactNode
> = {
  default: <Info className="text-foreground" aria-hidden />,
  destructive: <AlertCircle aria-hidden />,
  success: (
    <CheckCircle2
      className="text-emerald-600 dark:text-emerald-400"
      aria-hidden
    />
  ),
}

const toneClassName: Record<FeedbackAlertTone, string | undefined> = {
  default: undefined,
  destructive: undefined,
  success:
    "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-50 [&_[data-slot=alert-description]]:text-emerald-900/80 dark:[&_[data-slot=alert-description]]:text-emerald-200/90",
}

/**
 * Inline feedback built from shadcn Alert primitives — use for API / operation messages
 * on dashboard pages (dialogs, tables, forms).
 */
export function FeedbackAlert({
  tone = "default",
  title,
  description,
  hideIcon,
  className,
  onAutoDismiss,
  autoHideMs: autoHideMsProp,
  ...props
}: FeedbackAlertProps) {
  const variant = tone === "destructive" ? "destructive" : "default"
  const dismissRef = React.useRef(onAutoDismiss)
  const [progress, setProgress] = React.useState(100)
  dismissRef.current = onAutoDismiss

  const autoHideMs =
    autoHideMsProp ?? (onAutoDismiss != null ? 5000 : undefined)

  React.useEffect(() => {
    if (autoHideMs == null || autoHideMs <= 0) return

    const start = Date.now()

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start
      const percent = Math.max(0, 100 - (elapsed / autoHideMs) * 100)
      setProgress(percent)
    }, 50)

    const timeout = window.setTimeout(() => {
      dismissRef.current?.()
    }, autoHideMs)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [autoHideMs])

  return (
    <Alert
      variant={variant}
      className={cn(toneClassName[tone], className)}
      {...props}
    >
      {!hideIcon ? toneIcon[tone] : null}
      <AlertTitle>{title}</AlertTitle>
      {description != null && description !== "" ? (
        <AlertDescription>{description}</AlertDescription>
      ) : null}
      {autoHideMs ? (
          <div className="mt-2 h-1 w-full overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-current shrink"
              style={{
                width: "100%",
                animation: `shrink ${autoHideMs}ms linear forwards`,
              }}
            />
          </div>
        ) : null}
    </Alert>
  )
}
