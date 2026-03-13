"use client"

import Link from "next/link"

export default function UnterstuetzenPage() {
  return (
    <main className="min-h-screen bg-[#070b14] text-white px-5 pt-16 pb-24 md:py-14">
      <div className="mx-auto max-w-2xl space-y-10">

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/60 mb-4">Support</p>
          <h1 className="text-3xl font-semibold">MeinTraum unterstützen</h1>
          <p className="mt-4 text-sm leading-7 text-white/45 max-w-lg">
            MeinTraum ist aktuell in der Beta – kostenlos.
            Dein Support hilft die App weiterzuentwickeln.
            Early Supporter erhalten später exklusiven Zugang
            zu einem dauerhaften Vorzugspreis.
          </p>
        </div>

        {/* Ko-fi Card */}
        <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-4">
          <p className="text-2xl">☕</p>
          <div>
            <p className="font-semibold text-white">Kaffee ausgeben</p>
            <p className="text-sm text-white/40 mt-1 leading-6">
              Einmalig oder regelmässig – du entscheidest.
            </p>
          </div>
          <a
            href="https://ko-fi.com/meintraum"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/8 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15 active:scale-[0.99]">
            Auf Ko-fi unterstützen →
          </a>
        </div>

        {/* Beta-Hinweis */}
        <p className="text-center text-xs text-white/20">
          Beta-Phase: kostenlos · Early Supporter: coming soon
        </p>

        {/* Back */}
        <div className="flex justify-center">
          <Link href="/dashboard"
            className="text-xs text-white/25 hover:text-white/50 transition">
            ← Zurück zum Dashboard
          </Link>
        </div>

      </div>
    </main>
  )
}
