"use client"

import Link from "next/link"

export default function AuthBanner() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-5 py-4">
        <p className="text-sm text-white/70">
          🌙 Du bist als Gast unterwegs – deine Einträge werden nicht gespeichert.
        </p>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]"
          >
            Anmelden
          </Link>
        </div>
      </div>
    </div>
  )
}
