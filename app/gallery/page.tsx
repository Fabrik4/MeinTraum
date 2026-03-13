"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"

type DreamImage = {
  id: number
  image_url: string
  format: string
  created_at: string
  dream_entry_id: number
  dream_entries: { raw_input_text: string; dreamed_at: string | null } | null
}

const FORMAT_LABELS: Record<string, string> = {
  stories: "9:16",
  square: "1:1",
  pinterest: "4:5",
}

export default function GalleryPage() {
  const { user, loading: authLoading } = useAuth()
  const [images, setImages] = useState<DreamImage[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<DreamImage | null>(null)

  useEffect(() => {
    if (!user) return
    fetchImages()
  }, [user])

  async function fetchImages() {
    setLoading(true)
    const { data } = await supabase
      .from("dream_images")
      .select("id, image_url, format, created_at, dream_entry_id, dream_entries(raw_input_text, dreamed_at)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
    if (data) setImages(data as DreamImage[])
    setLoading(false)
  }

  async function downloadImage(img: DreamImage) {
    const canvas = document.createElement("canvas")
    const dims =
      img.format === "stories" ? { w: 1080, h: 1920 } :
      img.format === "pinterest" ? { w: 1080, h: 1350 } :
      { w: 1080, h: 1080 }
    canvas.width = dims.w
    canvas.height = dims.h
    const ctx = canvas.getContext("2d")!

    const image = new Image()
    image.crossOrigin = "anonymous"
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject()
      image.src = img.image_url
    })
    ctx.drawImage(image, 0, 0, dims.w, dims.h)

    const gradH = img.format === "stories" ? dims.h * 0.35 : img.format === "square" ? dims.h * 0.28 : dims.h * 0.22
    const grad = ctx.createLinearGradient(0, dims.h - gradH, 0, dims.h)
    grad.addColorStop(0, "transparent")
    grad.addColorStop(1, "#070b14")
    ctx.fillStyle = grad
    ctx.fillRect(0, dims.h - gradH, dims.w, gradH)

    const dreamText = img.dream_entries?.raw_input_text ?? ""
    const text = dreamText.slice(0, 80) + (dreamText.length > 80 ? "…" : "")
    const fontSize = Math.round(dims.w * 0.032)
    ctx.font = `italic ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
    ctx.fillStyle = "rgba(255,255,255,0.82)"
    ctx.textAlign = "center"
    const maxW = dims.w - 100
    const words = text.split(" ")
    const lines: string[] = []
    let line = ""
    for (const w of words) {
      const test = line ? line + " " + w : w
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w }
      else line = test
    }
    if (line) lines.push(line)
    const lh = Math.round(dims.w * 0.044)
    const ty = dims.h - Math.round(dims.h * 0.08) - lines.length * lh
    lines.forEach((l, i) => ctx.fillText(l, dims.w / 2, ty + i * lh))

    ctx.font = `${Math.round(dims.w * 0.022)}px -apple-system, BlinkMacSystemFont, sans-serif`
    ctx.fillStyle = "rgba(255,255,255,0.38)"
    ctx.fillText("🌙 MeinTraum · meintraum.app", dims.w / 2, dims.h - Math.round(dims.h * 0.03))

    const link = document.createElement("a")
    link.download = `traumkarte_${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  if (authLoading || loading) return (
    <main className="min-h-screen bg-[#070b14] px-6 pt-16 pb-24 md:py-14 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="h-8 w-48 rounded-xl bg-white/5 animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  )

  if (!user) return (
    <main className="min-h-screen bg-[#070b14] px-6 pt-16 pb-24 md:py-14 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-white/60">Bitte melde dich an um deine Traumbilder zu sehen.</p>
        <Link href="/login" className="inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-[#070b14] hover:scale-[1.02] transition">
          Anmelden
        </Link>
      </div>
    </main>
  )

  return (
    <>
      <main className="min-h-screen bg-[#070b14] px-6 pt-16 pb-24 md:py-14 text-white">
        <div className="mx-auto max-w-3xl">

          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70 mb-2">Galerie</p>
            <h1 className="text-3xl font-semibold">Deine Traumbilder</h1>
            {images.length > 0 && (
              <p className="mt-2 text-sm text-white/45">{images.length} Bild{images.length !== 1 ? "er" : ""}</p>
            )}
          </div>

          {images.length === 0 ? (
            <div className="rounded-3xl border border-white/8 bg-white/3 p-12 text-center space-y-4">
              <div className="text-4xl">🎨</div>
              <p className="font-medium text-white">Noch keine Traumbilder</p>
              <p className="text-sm text-white/45 leading-6">
                Generiere dein erstes Bild auf einem Traumeintrag.
              </p>
              <Link href="/timeline"
                className="inline-block mt-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition">
                Zur Timeline →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((img) => (
                <button key={img.id} onClick={() => setLightbox(img)}
                  className="relative group rounded-2xl overflow-hidden border border-white/8 hover:border-white/20 transition-all aspect-square">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider bg-black/40 rounded-full px-2 py-0.5">
                        {FORMAT_LABELS[img.format] ?? img.format}
                      </span>
                      <p className="text-xs text-white/60 mt-1">
                        {new Date(img.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}>
          <div className="relative w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.image_url} alt="" className="w-full rounded-2xl" />

            {lightbox.dream_entries?.raw_input_text && (
              <p className="text-sm text-white/55 italic leading-6 line-clamp-2">
                "{lightbox.dream_entries.raw_input_text.slice(0, 100)}…"
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={() => downloadImage(lightbox)}
                className="flex-1 rounded-xl border border-white/10 bg-white/8 px-4 py-2.5 text-sm text-white/70 hover:bg-white/12 hover:text-white transition flex items-center justify-center gap-2">
                ⬇ Herunterladen
              </button>
              <Link href={`/entries/${lightbox.dream_entry_id}?type=dream`}
                className="flex-1 rounded-xl border border-cyan-300/20 bg-cyan-300/8 px-4 py-2.5 text-sm text-cyan-100 hover:bg-cyan-300/12 transition flex items-center justify-center gap-2">
                Zum Traum →
              </Link>
            </div>

            <button onClick={() => setLightbox(null)}
              className="absolute -top-2 -right-2 rounded-full bg-white/10 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition text-sm">
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
