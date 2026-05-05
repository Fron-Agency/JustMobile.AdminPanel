"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function LoginPage() {
  const router = useRouter()

  // Login state
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState<string | null>(null)

  // Change-password modal state
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPw, setShowNewPw] = useState(false)
  const [changeError, setChangeError] = useState<string | null>(null)
  const [changeLoading, setChangeLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.message ?? "Login failed")
      setIsLoading(false)
      return
    }

    const data = await res.json()

    if (!data.first_login_executed) {
      setIsLoading(false)
      setShowChangePassword(true)
      return
    }

    router.push("/dashboard")
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangeError(null)

    if (newPassword.length < 6) {
      setChangeError("Password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setChangeError("Passwords do not match")
      return
    }

    setChangeLoading(true)

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    })

    if (!res.ok) {
      const data = await res.json()
      setChangeError(data.message ?? "Failed to change password")
      setChangeLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <>
      <div className="min-h-screen flex">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
          <div>
            <blockquote className="text-sidebar-foreground/80 text-lg leading-relaxed">
              &ldquo;The admin panel gives our team full visibility over leads and plans — it&apos;s fast, clean, and exactly what we needed.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm text-sidebar-foreground/50">— JustMobile Operations Team</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[["2,400+", "Active Leads"], ["140+", "Plans"], ["18", "Providers"]].map(([num, label]) => (
              <div key={label} className="bg-sidebar-accent rounded-lg p-4">
                <p className="text-xl font-bold text-sidebar-primary-foreground">{num}</p>
                <p className="text-xs text-sidebar-foreground/60 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Wifi className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">JustMobile</span>
            </div>

            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-foreground">Welcome back</CardTitle>
                <CardDescription className="text-muted-foreground">Sign in to your admin account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email" className="text-foreground">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@justmobile.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="bg-card border-input"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password" className="text-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        className="bg-card border-input pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground">
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Change password modal — shown on first login */}
      <Dialog open={showChangePassword} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set your password</DialogTitle>
            <DialogDescription>
              This is your first login. Please set a new password before continuing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4 py-2">
            {changeError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {changeError}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={changeLoading} className="w-full">
                {changeLoading ? "Saving..." : "Set password & continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
