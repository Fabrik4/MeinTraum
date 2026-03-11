"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const hideHeader =
    pathname === "/" ||
    pathname === "/impressum" ||
    pathname === "/datenschutz"

  useEffect(() => {
    // Beim Laden: aktuellen User holen
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
      setLoading(false)
    })

    // Auf Auth-Änderungen reagieren (Login / Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (hideHeader) return null

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070b14]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-white"
        >
          MeinTraum
        </Link>

        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/dreams"
            className="rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            Traumarchiv
          </Link>
          <Link
            href="/entry"
            className="rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            Neuer Traum
          </Link>

          {!loading && (
            <>
              {userEmail ? (
                <div className="flex items-center gap-3">
                  <span className="hidden sm:block text-sm text-white/40 truncate max-w-[160px]">
                    {userEmail}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
                  >
                    Abmelden
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]"
                >
                  Login
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
