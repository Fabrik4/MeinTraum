"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"

type Message = { role: "user" | "assistant"; content: string }

export type ChatContext = {
  type: "dream" | "journal"
  text: string
  emotion?: string | null
  tone?: string | null
  clarity?: string | null
  moodScore?: number | null
  tags?: string[]
  persons?: string[]
  places?: string[]
  // IDs für Session-Verknüpfung
  dreamId?: number
  journalId?: number
}

function buildOpeningMessage(ctx: ChatContext): string {
  if (ctx.type === "dream") {
    if (ctx.tone === "nightmare") return `Ich sehe, du hattest einen Albtraum. Das kann sich sehr real anfühlen – manchmal noch lange nach dem Aufwachen. Was ist dir davon am stärksten im Gedächtnis geblieben?`
    if (ctx.emotion?.includes("Angst")) return `Angst taucht in deinem Traum auf. Was war der Moment der sich am intensivsten angefühlt hat?`
    if (ctx.tone === "pleasant") return `Du hattest einen schönen Traum. Was hast du beim Aufwachen als erstes gefühlt?`
    return `Danke dass du deinen Traum geteilt hast. Was ist das erste was dir in den Sinn kommt wenn du jetzt nochmal daran denkst?`
  } else {
    const score = ctx.moodScore ?? 5
    if (score <= 4) return `Es klingt als wäre es ein schwieriger Tag. Was beschäftigt dich am meisten gerade?`
    if (score >= 8) return `Es freut mich dass du dich gut fühlst! Was hat heute dazu beigetragen?`
    return `Ich habe deinen Eintrag gelesen. Gibt es etwas darüber das du vertiefen möchtest?`
  }
}

function buildCurrentEntryText(ctx: ChatContext): string {
  const parts: string[] = []
  if (ctx.type === "dream") {
    parts.push(`Traum: "${ctx.text}"`)
    if (ctx.emotion) parts.push(`Emotionen: ${ctx.emotion}`)
    if (ctx.tone) parts.push(`Stimmung: ${ctx.tone}`)
    if (ctx.clarity) parts.push(`Klarheit: ${ctx.clarity}`)
  } else {
    parts.push(`Journaleintrag: "${ctx.text}"`)
    if (ctx.moodScore) parts.push(`Stimmung: ${ctx.moodScore}/10`)
    if (ctx.tags?.length) parts.push(`Themen: ${ctx.tags.join(", ")}`)
  }
  if (ctx.persons?.length) parts.push(`Personen: ${ctx.persons.join(", ")}`)
  if (ctx.places?.length) parts.push(`Orte: ${ctx.places.join(", ")}`)
  return parts.join(" | ")
}

export default function DreamChat({ context, onClose }: {
  context: ChatContext
  onClose: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  // Bestehende Session laden oder neue starten
  useEffect(() => {
    if (!userId || initialized) return
    setInitialized(true)
    loadOrStartSession()
  }, [userId])

  async function loadOrStartSession() {
    // Prüfen ob bereits eine Session für diesen Eintrag existiert
    const idCol = context.type === "dream" ? "linked_dream_id" : "linked_journal_id"
    const idVal = context.type === "dream" ? context.dreamId : context.journalId

    if (idVal) {
      const { data: existingSession } = await supabase.from("chat_sessions")
        .select("id, messages").eq("user_id", userId!).eq(idCol, idVal)
        .order("created_at", { ascending: false }).limit(1).maybeSingle()

      if (existingSession && existingSession.messages?.length > 0) {
        setSessionId(existingSession.id)
        setMessages(existingSession.messages)
        return
      }
    }

    // Neue Session mit Eröffnungsnachricht
    const opening = buildOpeningMessage(context)
    setMessages([{ role: "assistant", content: opening }])
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading || !userId) return
    const userMsg: Message = { role: "user", content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          sessionId,
          userId,
          sessionType: context.type,
          linkedDreamId: context.dreamId,
          linkedJournalId: context.journalId,
          currentEntryText: buildCurrentEntryText(context),
        }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
        if (data.sessionId && !sessionId) setSessionId(data.sessionId)
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Entschuldigung, da ist etwas schiefgelaufen." }])
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const accentColor = context.type === "dream" ? "cyan" : "amber"

  return (
    <div className="flex flex-col rounded-3xl border border-white/10 bg-[#0a0f1e] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full animate-pulse ${accentColor === "cyan" ? "bg-cyan-300" : "bg-amber-300"}`} />
          <div>
            <p className="text-sm font-medium text-white">
              {context.type === "dream" ? "Über diesen Traum sprechen" : "Über diesen Eintrag sprechen"}
            </p>
            <p className="text-xs text-white/28">
              {sessionId ? "Gespräch wird gespeichert" : "KI hört zu · Enter zum Senden"}
            </p>
          </div>
        </div>
        <button onClick={onClose}
          className="rounded-xl border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-white/45 transition hover:bg-white/8 hover:text-white">
          Schliessen ✕
        </button>
      </div>

      {/* Nachrichten */}
      <div className="overflow-y-auto px-5 py-5 space-y-4 max-h-[420px] min-h-[260px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
              msg.role === "user"
                ? "bg-white text-[#070b14] rounded-br-sm"
                : "bg-white/7 border border-white/8 text-white/82 rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/7 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0,150,300].map((d) => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/5 px-4 py-4">
        <div className="flex gap-3 items-end">
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} placeholder="Schreib etwas…" rows={1}
            className={`flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/22 focus:outline-none transition ${accentColor === "cyan" ? "focus:border-cyan-300/25" : "focus:border-amber-300/25"}`}
            style={{ maxHeight: "120px" }}
            onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px" }} />
          <button onClick={sendMessage} disabled={loading || !input.trim() || !userId}
            className="shrink-0 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#070b14] transition hover:scale-[1.02] active:scale-[0.99] disabled:opacity-35">
            ↑
          </button>
        </div>
        <p className="mt-2 text-xs text-white/15 text-center">Kein Ersatz für professionelle Beratung</p>
      </div>
    </div>
  )
}