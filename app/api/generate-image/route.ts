import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 60

const DAILY_LIMIT = 20

// Format → Bildgrösse
const FORMAT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  stories:   { width: 1080, height: 1920 },
  square:    { width: 1080, height: 1080 },
  pinterest: { width: 1080, height: 1350 },
}

export async function POST(req: NextRequest) {
  try {
    const { dream_entry_id, user_id, dream_text, format = "square" } = await req.json()
    // dream_entry_id ist bigint in der DB → als number behandeln

    if (!dream_entry_id || !user_id || !dream_text) {
      return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Daily Limit prüfen ──────────────────────────────────────
    const { data: limitData } = await supabase
      .rpc("get_daily_image_count", { p_user_id: user_id })

    if (limitData >= DAILY_LIMIT) {
      return NextResponse.json({
        error: `Tageslimit erreicht (${DAILY_LIMIT} Bilder/Tag). Morgen wieder verfügbar.`,
        limit_reached: true,
      }, { status: 429 })
    }

    // ── Prompt aufbauen ─────────────────────────────────────────
    const prompt = buildImagePrompt(dream_text)
    const dimensions = FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS.square

    // ── Replicate Flux Schnell ──────────────────────────────────
    const replicateRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        "Prefer": "wait", // synchron warten
      },
      body: JSON.stringify({
        input: {
          prompt,
          width: dimensions.width,
          height: dimensions.height,
          num_outputs: 1,
          num_inference_steps: 4,
          output_format: "webp",
          output_quality: 90,
        },
      }),
    })

    if (!replicateRes.ok) {
      const err = await replicateRes.text()
      console.error("Replicate error:", err)
      return NextResponse.json({ error: "Bildgenerierung fehlgeschlagen" }, { status: 500 })
    }

    const prediction = await replicateRes.json()
    const imageUrl = prediction.output?.[0]

    if (!imageUrl) {
      return NextResponse.json({ error: "Kein Bild generiert" }, { status: 500 })
    }

    // ── Bild zu Supabase Storage hochladen ──────────────────────
    const imageRes = await fetch(imageUrl)
    const imageBlob = await imageRes.blob()
    const fileName = `${user_id}/${dream_entry_id}_${format}_${Date.now()}.webp`

    const { error: uploadError } = await supabase.storage
      .from("dream-images")
      .upload(fileName, imageBlob, {
        contentType: "image/webp",
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: "Bild konnte nicht gespeichert werden" }, { status: 500 })
    }

    // ── Public URL holen ────────────────────────────────────────
    const { data: urlData } = supabase.storage
      .from("dream-images")
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    // ── In DB speichern ─────────────────────────────────────────
    const { data: imageRecord, error: dbError } = await supabase
      .from("dream_images")
      .insert({
        user_id,
        dream_entry_id,
        image_url: publicUrl,
        storage_path: fileName,
        prompt_used: prompt,
        format,
      })
      .select("id, image_url, format, created_at")
      .single()

    if (dbError) {
      console.error("DB insert error:", dbError)
      return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      image: imageRecord,
      remaining_today: DAILY_LIMIT - (limitData + 1),
    })

  } catch (error) {
    console.error("Generate image error:", error)
    return NextResponse.json({ error: "Unbekannter Fehler" }, { status: 500 })
  }
}

// ── Prompt Builder ───────────────────────────────────────────────
function buildImagePrompt(dreamText: string): string {
  // Traumtext kürzen auf max 200 Zeichen
  const shortened = dreamText.slice(0, 200).trim()

  return `Dreamlike, surreal digital art illustration of a dream scene: ${shortened}. 
Dark atmospheric mood, deep navy and midnight blue tones, subtle cyan and violet accents, 
soft ethereal lighting, cinematic composition, painterly style, no text, no watermarks, 
high quality, 8k, detailed, mystical atmosphere.`
}