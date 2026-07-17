"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import SignaturePadLib from "signature_pad"
import { cn } from "@/lib/utils"

export type SignaturePadHandle = {
  clear: () => void
  isEmpty: () => boolean
  toDataURL: () => string
}

type SignaturePadProps = {
  className?: string
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad(
  { className },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const pad = new SignaturePadLib(canvas, { backgroundColor: "rgb(255, 255, 255)" })
    padRef.current = pad

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width * ratio
      canvas.height = height * ratio
      canvas.getContext("2d")?.scale(ratio, ratio)
      pad.clear()
    }

    resize()
    window.addEventListener("resize", resize)

    return () => {
      window.removeEventListener("resize", resize)
      pad.off()
      padRef.current = null
    }
  }, [])

  useImperativeHandle(ref, () => ({
    clear: () => padRef.current?.clear(),
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    toDataURL: () => padRef.current?.toDataURL("image/png") ?? "",
  }))

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full h-48 rounded-md border bg-white touch-none", className)}
    />
  )
})
