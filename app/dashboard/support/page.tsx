"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { SupportConversation, SupportMessage } from "@/app/api/modules/support/support.type"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Send, MessageSquare } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function SupportPage() {
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoadingConvs, setIsLoadingConvs] = useState(true)
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load conversations list
  useEffect(() => {
    fetch("/api/support")
      .then((r) => r.json())
      .then((data) => setConversations(data))
      .finally(() => setIsLoadingConvs(false))
  }, [])

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!selectedId) return
    setIsLoadingMsgs(true)
    setMessages([])
    fetch(`/api/support/${selectedId}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data))
      .finally(() => setIsLoadingMsgs(false))
  }, [selectedId])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Realtime: new conversations
  useEffect(() => {
    const channel = supabase
      .channel("support-conversations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_conversations" },
        (payload) => {
          setConversations((prev) => [payload.new as SupportConversation, ...prev])
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "support_conversations" },
        (payload) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === payload.new.id ? (payload.new as SupportConversation) : c))
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Realtime: new messages for the selected conversation
  useEffect(() => {
    if (!selectedId) return

    const channel = supabase
      .channel(`support-messages-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // Avoid duplicate if we optimistically added it
            if (prev.some((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new as SupportMessage]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedId])

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null

  async function handleSend() {
    if (!draft.trim() || !selectedId || isSending) return
    setIsSending(true)
    const content = draft.trim()
    setDraft("")

    // Optimistic message
    const optimistic: SupportMessage = {
      id: `optimistic-${Date.now()}`,
      conversation_id: selectedId,
      sender: "admin",
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    await fetch(`/api/support/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })

    setIsSending(false)
  }

  async function handleToggleStatus() {
    if (!selectedConv) return
    const next = selectedConv.status === "open" ? "closed" : "open"
    await fetch(`/api/support/${selectedConv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden border border-border rounded-lg">
      {/* Conversation list */}
      <aside className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-card">
        <div className="px-4 py-3 border-b border-border">
          <p className="font-semibold text-sm">Support Conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoadingConvs ? (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2 p-6">
              <MessageSquare className="w-8 h-8 opacity-30" />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/40 transition-colors",
                  selectedId === conv.id && "bg-muted/60"
                )}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium truncate">
                    {conv.visitor_name ?? "Anonymous"}
                  </span>
                  <Badge
                    variant={conv.status === "open" ? "default" : "secondary"}
                    className="text-[10px] h-4 px-1.5"
                  >
                    {conv.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conv.visitor_email ?? "No email"}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-background">
        {!selectedConv ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
            Select a conversation to start
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
              <div>
                <p className="font-semibold text-sm">{selectedConv.visitor_name ?? "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">{selectedConv.visitor_email ?? "No email"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
              >
                {selectedConv.status === "open" ? "Close conversation" : "Reopen"}
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {isLoadingMsgs ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-48 rounded-lg" />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-xs mt-10">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.sender === "admin" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-3.5 py-2 rounded-2xl text-sm",
                        msg.sender === "admin"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      <p>{msg.content}</p>
                      <p className={cn(
                        "text-[10px] mt-0.5",
                        msg.sender === "admin" ? "text-primary-foreground/60 text-right" : "text-muted-foreground"
                      )}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-t border-border bg-card">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend() }}
                className="flex gap-2"
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={selectedConv.status === "closed" ? "Conversation is closed" : "Type a message…"}
                  disabled={selectedConv.status === "closed" || isSending}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!draft.trim() || selectedConv.status === "closed" || isSending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
