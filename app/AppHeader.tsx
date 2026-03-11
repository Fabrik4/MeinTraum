"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AppHeader() {
  const pathname = usePathname()

  const hideHeader =
    pathname === "/" ||
    pathname === "/impressum" ||
    pathname === "/datenschutz"

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

          <Link
            href="/login"
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  )
}