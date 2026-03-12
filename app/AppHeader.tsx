"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { supabase } from "@/lib/supabase"

export default function AppHeader() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  const navLinks = [
    { href: "/timeline",    label: "Timeline" },
    { href: "/entry",       label: "🌙 Traum" },
    { href: "/journal/new", label: "📓 Journal" },
  ]

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070b14]/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">

        <Link href="/" className="text-sm font-semibold tracking-wide text-white/90 hover:text-white transition">
          MeinTraum
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href.replace("/new", "") + "/")
            return (
              <Link key={link.href} href={link.href}
                className={`rounded-xl px-3 py-2 text-sm transition ${
                  active ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                }`}>
                {link.label}
              </Link>
            )
          })}
        </nav>

        {!loading && (
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden text-xs text-white/35 sm:block">{user.email}</span>
                <button onClick={handleSignOut}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white">
                  Abmelden
                </button>
              </>
            ) : (
              <Link href="/login"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white">
                Anmelden
              </Link>
            )}
          </div>
        )}

      </div>
    </header>
  )
}