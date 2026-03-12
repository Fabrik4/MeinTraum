"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"
import { useSpeechRecorder } from "@/lib/useSpeechRecorder"

type Message = { role: "user" | "assistant"; content: string }

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Speech-to-Text
  const onTranscript = useCallback((text: string) => {
    setInput((prev) => prev ? prev + " " + text : text)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])
  const { state: recState, errorMsg: recError, start: startRec, stop: stopRec } = useSpeechRecorder(onTranscript)

  useEffect(() => {
    if (initialized) return
    setInitialized(true)
    setMessages([{
      role: "assistant",
      content: "Hallo! Ich bin hier um mit dir über deine Träume, Stimmungen oder was dich gerade beschäftigt zu sprechen. Womit möchtest du beginnen?",
    }])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: "user", content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    // Reset textarea height
    if (inputRef.current) { inputRef.current.style.height = "auto" }
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          userId: user?.id ?? null,
          sessionId,
          sessionType: "free",
        }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
        if (data.sessionId) setSessionId(data.sessionId)
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

  function resetChat() {
    setMessages([{ role: "assistant", content: "Hallo! Womit möchtest du heute beginnen?" }])
    setSessionId(null)
  }

  return (
    <main className="flex flex-col bg-[#070b14] text-white h-[calc(100dvh-132px)] md:h-[calc(100vh-60px)]">

      {/* Header */}
      <div className="shrink-0 border-b border-white/5 px-5 py-4">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-violet-300 animate-pulse" />
          <div>
            <p className="text-sm font-medium text-white">Traumbegleiter AI</p>
            <p className="text-xs text-white/30">Dein persönlicher Gesprächsbegleiter</p>
          </div>
          {messages.length > 1 && (
            <button onClick={resetChat}
              className="ml-auto rounded-xl border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-white/40 transition hover:bg-white/8 hover:text-white/65">
              Neues Gespräch
            </button>
          )}
        </div>
      </div>

      {/* Nachrichten */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                msg.role === "user"
                  ? "bg-white text-[#070b14] rounded-br-sm"
                  : "bg-white/7 border border-white/8 text-white/85 rounded-bl-sm"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/7 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  {[0, 150, 300].map((d) => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full bg-white/35 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/5 px-5 py-4">
        <div className="mx-auto max-w-2xl">
          {!user && !authLoading && (
            <div className="mb-3 rounded-2xl border border-amber-300/15 bg-amber-300/8 px-4 py-2.5 text-xs text-amber-200">
              Melde dich an damit die KI deinen persönlichen Kontext kennt.{" "}
              <a href="/login" className="underline underline-offset-2">Anmelden →</a>
            </div>
          )}
          <div className="flex gap-2 items-end">
            {/* Mikrofon */}
            <button
              type="button"
              onClick={recState === "recording" ? stopRec : startRec}
              disabled={recState === "transcribing" || loading}
              title={recState === "recording" ? "Aufnahme stoppen" : "Einsprechen"}
              className={`shrink-0 rounded-2xl border px-3 py-3 text-sm transition-all ${
                recState === "recording"
                  ? "border-red-400/40 bg-red-400/15 text-red-200 animate-pulse"
                  : recState === "transcribing"
                  ? "border-violet-300/20 bg-violet-300/8 text-violet-300/60 cursor-wait"
                  : recState === "error"
                  ? "border-red-300/20 bg-red-300/8 text-red-300/60"
                  : "border-white/10 bg-white/5 text-white/40 hover:border-violet-300/30 hover:text-violet-300/70"
              } disabled:opacity-40`}>
              {recState === "recording" ? "⏹" : recState === "transcribing" ? <span className="animate-spin inline-block">✦</span> : "🎤"}
            </button>

            {/* Texteingabe */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={recState === "recording" ? "Aufnahme läuft…" : recState === "transcribing" ? "Wird transkribiert…" : "Schreib etwas…"}
              rows={1}
              disabled={recState === "recording" || recState === "transcribing"}
              className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-violet-300/25 focus:outline-none transition disabled:opacity-50"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = "auto"
                el.style.height = Math.min(el.scrollHeight, 120) + "px"
              }}
            />

            {/* Senden */}
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="shrink-0 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#070b14] transition hover:scale-[1.02] active:scale-[0.99] disabled:opacity-35">
              ↑
            </button>
          </div>
          {recState === "error" && recError && (
            <p className="mt-1.5 text-xs text-red-300/60 text-center">{recError}</p>
          )}
          <p className="mt-2 text-xs text-white/18 text-center">Kein Ersatz für professionelle Beratung</p>
        </div>
      </div>

    </main>
  )
}
