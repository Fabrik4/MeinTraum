"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"

type DreamImage = {
  id: number
  image_url: string
  format: string
  card_title: string | null
  created_at: string
  dream_entry_id: number | null
  journal_entry_id: number | null
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!user) return
    fetchImages()
  }, [user])

  async function fetchImages() {
    setLoading(true)
    const { data } = await supabase
      .from("dream_images")
      .select("id, image_url, format, card_title, created_at, dream_entry_id, journal_entry_id")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
    if (data) setImages(data as unknown as DreamImage[])
    setLoading(false)
  }

  async function renderCanvas(img: DreamImage, canvas: HTMLCanvasElement) {
    const dims =
      img.format === "stories" ? { w: 1080, h: 1920 } :
      img.format === "pinterest" ? { w: 1080, h: 1350 } :
      { w: 1080, h: 1080 }
    canvas.width = dims.w
    canvas.height = dims.h
    const ctx = canvas.getContext("2d")!

    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject()
      image.src = `/api/proxy-image?url=${encodeURIComponent(img.image_url)}`
    })
    const scale = Math.max(dims.w / image.width, dims.h / image.height)
    const sw = image.width * scale, sh = image.height * scale
    ctx.drawImage(image, (dims.w - sw) / 2, (dims.h - sh) / 2, sw, sh)

    const grad = ctx.createLinearGradient(0, 0, 0, dims.h)
    grad.addColorStop(0, "rgba(7,11,20,0.45)")
    grad.addColorStop(0.35, "transparent")
    grad.addColorStop(0.60, "transparent")
    grad.addColorStop(1, "rgba(7,11,20,0.75)")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, dims.w, dims.h)

    const s = dims.w / 400
    const pad = 18 * s
    const brandText = "🌙 MeinTraum"
    const bFontSize = 13 * s
    ctx.font = `500 ${bFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
    const bw = ctx.measureText(brandText).width
    const px = 10 * s, py = 6 * s
    ctx.fillStyle = "rgba(0,0,0,0.28)"
    const rx = pad, ry = pad, rw = bw + px * 2, rh = bFontSize + py * 2, rr = rh / 2
    ctx.beginPath()
    ctx.moveTo(rx + rr, ry)
    ctx.lineTo(rx + rw - rr, ry); ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr)
    ctx.lineTo(rx + rw, ry + rh - rr); ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh)
    ctx.lineTo(rx + rr, ry + rh); ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr)
    ctx.lineTo(rx, ry + rr); ctx.quadraticCurveTo(rx, ry, rx + rr, ry)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = "rgba(255,255,255,0.85)"
    ctx.fillText(brandText, rx + px, ry + py + bFontSize * 0.82)

    const title = img.card_title ?? ""
    if (title) {
      const titleFontSize = (img.format === "stories" ? 22 : 18) * s
      const urlFontSize = 11 * s
      const bottomPad = 32 * s
      const urlY = dims.h - bottomPad
      const titleY = urlY - urlFontSize * 1.8 - titleFontSize * 0.3
      ctx.font = `600 ${titleFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.fillStyle = "white"
      ctx.textAlign = "center"
      ctx.shadowColor = "rgba(0,0,0,0.8)"
      ctx.shadowBlur = 10 * s
      const maxWidth = dims.w - 48 * s
      const words = title.split(" ")
      let line = ""
      const lines: string[] = []
      for (const word of words) {
        const test = line ? line + " " + word : word
        if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word }
        else line = test
      }
      if (line) lines.push(line)
      const lineH = titleFontSize * 1.25
      const totalH = lines.length * lineH
      let ty = titleY - totalH + lineH
      for (const l of lines) { ctx.fillText(l, dims.w / 2, ty); ty += lineH }
      ctx.shadowBlur = 0
      ctx.font = `${urlFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.fillStyle = "rgba(255,255,255,0.45)"
      ctx.fillText("meintraum.app", dims.w / 2, urlY)
    }
  }

  function getFilename(img: DreamImage) {
    const safe = (img.card_title || "traum").replace(/[^a-z0-9äöü]/gi, "-").toLowerCase().slice(0, 40)
    return `traumbild_${safe}_${new Date().toISOString().slice(0, 10)}.png`
  }

  async function downloadImage(img: DreamImage) {
    const canvas = document.createElement("canvas")
    await renderCanvas(img, canvas)
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = getFilename(img)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, "image/png")
  }

  async function shareImage(img: DreamImage) {
    const canvas = document.createElement("canvas")
    await renderCanvas(img, canvas)
    canvas.toBlob(async (blob) => {
      if (!blob) { downloadImage(img); return }
      const file = new File([blob], getFilename(img), { type: "image/png" })
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: img.card_title || "Mein Traum",
            text: "Mein Traum auf MeinTraum · meintraum.app",
          })
          return
        } catch { /* fall through */ }
      }
      downloadImage(img)
    }, "image/png")
  }

  // Canvas in Lightbox rendern sobald sich lightbox ändert
  useEffect(() => {
    if (!lightbox || !canvasRef.current) return
    renderCanvas(lightbox, canvasRef.current)
  }, [lightbox])

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
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${img.journal_entry_id ? "bg-amber-300/20 text-amber-200" : "bg-cyan-300/20 text-cyan-200"}`}>
                      {img.journal_entry_id ? "Journal" : "Traum"}
                    </span>
                  </div>
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
            <canvas
              ref={canvasRef}
              className="w-full rounded-2xl"
              style={
                lightbox.format === "stories"
                  ? { maxHeight: 440, aspectRatio: "9/16", width: "auto", margin: "0 auto", display: "block" }
                  : lightbox.format === "pinterest"
                  ? { maxWidth: 300, aspectRatio: "4/5", width: "100%", margin: "0 auto", display: "block" }
                  : { maxWidth: 340, aspectRatio: "1/1", width: "100%" }
              }
            />

            {lightbox.card_title && (
              <p className="text-xs text-cyan-300/60 text-center italic">"{lightbox.card_title}"</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => downloadImage(lightbox)}
                className="flex-1 rounded-xl border border-white/10 bg-white/8 px-4 py-2.5 text-sm text-white/70 hover:bg-white/12 hover:text-white transition flex items-center justify-center gap-2">
                ⬇ Herunterladen
              </button>
              <button onClick={() => shareImage(lightbox)}
                className="flex-1 rounded-xl border border-cyan-300/20 bg-cyan-300/8 px-4 py-2.5 text-sm text-cyan-100 hover:bg-cyan-300/12 transition flex items-center justify-center gap-2">
                📤 Teilen
              </button>
            </div>

            <Link href={lightbox.journal_entry_id ? `/entries/${lightbox.journal_entry_id}?type=journal` : `/entries/${lightbox.dream_entry_id}?type=dream`}
              className="block text-center text-xs text-white/40 hover:text-white/70 transition">
              Zum Eintrag →
            </Link>

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
