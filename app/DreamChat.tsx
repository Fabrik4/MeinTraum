"use client"

import { useEffect, useRef, useState } from "react"

type Message = {
  role: "user" | "assistant"
  content: string
}

type ChatContext = {
  type: "dream" | "journal"
  text: string
  emotion?: string | null
  tone?: string | null
  clarity?: string | null
  persons?: string[]
  places?: string[]
  moodScore?: number | null
  tags?: string[]
}

function buildContextString(ctx: ChatContext): string {
  const parts: string[] = []

  if (ctx.type === "dream") {
    parts.push(`Der User hat folgenden Traum erfasst: "${ctx.text}"`)
    if (ctx.emotion) parts.push(`Dominante Emotionen: ${ctx.emotion}`)
    if (ctx.tone) parts.push(`Stimmung des Traums: ${ctx.tone === "nightmare" ? "Albtraum" : ctx.tone === "pleasant" ? "Schöner Traum" : "Neutral"}`)
    if (ctx.clarity) parts.push(`Traumklarheit: ${ctx.clarity}`)
    if (ctx.persons?.length) parts.push(`Personen im Traum: ${ctx.persons.join(", ")}`)
    if (ctx.places?.length) parts.push(`Orte im Traum: ${ctx.places.join(", ")}`)
  } else {
    parts.push(`Der User hat folgenden Journal-Eintrag geschrieben: "${ctx.text}"`)
    if (ctx.moodScore) parts.push(`Stimmung: ${ctx.moodScore}/10`)
    if (ctx.tags?.length) parts.push(`Themen: ${ctx.tags.join(", ")}`)
  }

  return parts.join("\n")
}

function buildOpeningMessage(ctx: ChatContext): string {
  if (ctx.type === "dream") {
    const tone = ctx.tone
    if (tone === "nightmare") {
      return `Ich sehe, du hattest einen Albtraum. Das kann sich sehr real anfühlen – manchmal noch lange nach dem Aufwachen. Was ist dir davon am stärksten im Gedächtnis geblieben?`
    }
    if (ctx.emotion?.includes("Angst")) {
      return `Angst taucht in deinem Traum auf – das ist oft ein Zeichen dass dein Geist etwas verarbeitet. Was war der Moment im Traum der sich am intensivsten angefühlt hat?`
    }
    if (tone === "pleasant") {
      return `Du hattest einen schönen Traum – das ist schön zu hören. Was hast du beim Aufwachen als erstes gefühlt?`
    }
    return `Danke dass du deinen Traum geteilt hast. Was ist das erste was dir in den Sinn kommt wenn du jetzt nochmal daran denkst?`
  } else {
    const score = ctx.moodScore ?? 5
    if (score <= 4) {
      return `Es klingt als wäre es ein schwieriger Tag. Ich bin hier wenn du darüber sprechen möchtest – was beschäftigt dich am meisten gerade?`
    }
    if (score >= 8) {
      return `Es freut mich dass du dich gut fühlst! Was hat heute dazu beigetragen?`
    }
    return `Ich habe deinen Eintrag gelesen. Gibt es etwas darüber was du beschrieben hast das du vertiefen möchtest?`
  }
}

export default function DreamChat({ context, onClose }: {
  context: ChatContext
  onClose: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Eröffnungsnachricht der KI
  useEffect(() => {
    if (initialized) return
    setInitialized(true)
    const opening = buildOpeningMessage(context)
    setMessages([{ role: "assistant", content: opening }])
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: "user", content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: buildContextString(context),
        }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Entschuldigung, da ist etwas schiefgelaufen. Versuche es nochmal."
      }])
    }

    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col rounded-3xl border border-white/10 bg-[#0a0f1e] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
          <div>
            <p className="text-sm font-medium text-white">
              {context.type === "dream" ? "Über diesen Traum sprechen" : "Über diesen Eintrag sprechen"}
            </p>
            <p className="text-xs text-white/35">KI hört zu – drücke Enter zum Senden</p>
          </div>
        </div>
        <button onClick={onClose}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition hover:bg-white/10 hover:text-white">
          Schliessen ✕
        </button>
      </div>

      {/* Nachrichten */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-h-[420px] min-h-[280px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
              msg.role === "user"
                ? "bg-white text-[#070b14] rounded-br-sm"
                : "bg-white/8 border border-white/10 text-white/85 rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/5 px-4 py-4">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Schreib etwas…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-300/30 focus:outline-none transition"
            style={{ maxHeight: "120px" }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = "auto"
              el.style.height = Math.min(el.scrollHeight, 120) + "px"
            }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="shrink-0 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#070b14] transition hover:scale-[1.02] active:scale-[0.99] disabled:opacity-40">
            ↑
          </button>
        </div>
        <p className="mt-2 text-xs text-white/20 text-center">
          Kein Ersatz für professionelle Beratung
        </p>
      </div>

    </div>
  )
}