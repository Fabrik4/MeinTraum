"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { supabase } from "@/lib/supabase"
import { useState } from "react"

// ── Icons ─────────────────────────────────────────────────────
function HomeIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}
function ArchivIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}
function MoonIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  )
}
function PenIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}
function ProfileIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}
function GlobeIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9M3 12h18" />
    </svg>
  )
}
function LogoutIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
function ChatIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

// ── Nav Items ─────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/dashboard",   label: "Home",    Icon: HomeIcon },
  { href: "/timeline",    label: "Archiv",  Icon: ArchivIcon },
  { href: "/entry",       label: "Traum",   Icon: MoonIcon,  primary: true },
  { href: "/journal/new", label: "Journal", Icon: PenIcon },
  { href: "/profile",     label: "Profil",  Icon: ProfileIcon },
]

function checkActive(pathname: string, href: string) {
  if (href === "/entry") return pathname === "/entry"
  if (href === "/journal/new") return pathname.startsWith("/journal")
  if (href === "/timeline") return pathname === "/timeline"
  if (href === "/dashboard") return pathname === "/dashboard"
  if (href === "/profile") return pathname.startsWith("/profile")
  return false
}

// ── Haupt-Komponente ──────────────────────────────────────────
export default function AppHeader() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  // Auf Landingpage keinen Header zeigen
  if (pathname === "/" || pathname === "/login" || pathname === "/auth/callback") return null

  return (
    <>
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#070b14]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative h-7 w-7">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 opacity-80 group-hover:opacity-100 transition" />
              <div className="absolute inset-[2px] rounded-full bg-[#070b14]" />
              <div className="absolute inset-[5px] rounded-full bg-gradient-to-br from-cyan-300 to-violet-400 opacity-70 group-hover:opacity-100 transition" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-white/85 group-hover:text-white transition">
              MeinTraum
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = checkActive(pathname, item.href)
              if (item.primary) return null
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm transition-all duration-200 ${
                    active ? "bg-white/10 text-white" : "text-white/45 hover:text-white hover:bg-white/5"
                  }`}>
                  <item.Icon size={14} />
                  {item.label}
                </Link>
              )
            })}
            {/* Chat Link */}
            <Link href="/chat"
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm transition-all duration-200 ${
                pathname === "/chat" ? "bg-white/10 text-white" : "text-white/45 hover:text-white hover:bg-white/5"
              }`}>
              <ChatIcon size={14} />
              Chat
            </Link>
          </nav>

          {/* Rechts */}
          <div className="flex items-center gap-2.5">

            {/* Quick-Add Traum – Desktop */}
            <Link href="/entry"
              className="hidden md:flex items-center gap-1.5 rounded-xl bg-white/90 hover:bg-white px-4 py-2 text-xs font-semibold text-[#070b14] transition-all hover:scale-[1.02] active:scale-[0.99]">
              <MoonIcon size={13} color="#070b14" />
              Neuer Traum
            </Link>

            {/* User Avatar / Auth */}
            {!loading && (
              user ? (
                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-cyan-300/20 to-violet-400/20 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:text-white">
                    {user.email?.slice(0, 1).toUpperCase()}
                  </button>

                  {menuOpen && (
                    <>
                      {/* Backdrop */}
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      {/* Dropdown */}
                      <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-white/10 bg-[#0c1220] p-1.5 shadow-2xl shadow-black/50">
                        <div className="px-3 py-2 mb-1">
                          <p className="text-xs text-white/30 truncate">{user.email}</p>
                        </div>
                        <div className="border-t border-white/5 my-1" />
                        <Link href="/profile" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/65 transition hover:bg-white/6 hover:text-white">
                          <ProfileIcon size={15} /> Profil & Einstellungen
                        </Link>
                        <Link href="/chat" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/65 transition hover:bg-white/6 hover:text-white">
                          <ChatIcon size={15} /> KI-Chat
                        </Link>
                        <div className="border-t border-white/5 my-1" />
                        <a href="/" target="_blank"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/65 transition hover:bg-white/6 hover:text-white">
                          <GlobeIcon size={15} /> Zur Landingpage
                        </a>
                        <div className="border-t border-white/5 my-1" />
                        <button onClick={handleSignOut}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-300/60 transition hover:bg-red-300/6 hover:text-red-200">
                          <LogoutIcon size={15} /> Abmelden
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/login"
                  className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white">
                  Anmelden
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      {/* ── Bottom Bar – Mobile only ──────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        {/* Blur + Border */}
        <div className="border-t border-white/8 bg-[#070b14]/95 backdrop-blur-xl">
          <div className="flex items-end justify-around px-1 pt-2 pb-2">

            {NAV_ITEMS.map((item) => {
              const active = checkActive(pathname, item.href)

              // Mittlerer Primär-Button
              if (item.primary) {
                return (
                  <Link key={item.href} href={item.href}
                    className="flex flex-col items-center gap-1 -mt-4">
                    <div className={`flex h-[54px] w-[54px] items-center justify-center rounded-[18px] transition-all duration-200 active:scale-95 ${
                      active
                        ? "bg-white shadow-lg shadow-white/10"
                        : "bg-gradient-to-br from-cyan-300 to-violet-500 shadow-lg shadow-cyan-300/15"
                    }`}>
                      <item.Icon size={23} color="#070b14" />
                    </div>
                    <span className={`text-[9px] font-medium tracking-wide transition ${active ? "text-cyan-300" : "text-white/35"}`}>
                      {item.label}
                    </span>
                  </Link>
                )
              }

              return (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center gap-1 px-2 py-1 min-w-[52px] transition-all active:scale-90">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                    active ? "bg-cyan-300/10" : ""
                  }`}>
                    <item.Icon size={20} color={active ? "rgb(165 243 252)" : "rgba(255,255,255,0.32)"} />
                  </div>
                  <span className={`text-[9px] font-medium tracking-wide transition ${
                    active ? "text-cyan-300" : "text-white/32"
                  }`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}

          </div>

          {/* iPhone Safe Area */}
          <div className="h-[env(safe-area-inset-bottom,0px)]" />
        </div>
      </nav>

      {/* Spacer – verhindert dass Content hinter Bottom Bar verschwindet */}
      <div className="md:hidden h-[72px]" />
    </>
  )
}