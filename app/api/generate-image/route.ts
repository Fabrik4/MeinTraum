import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"

export const runtime = "nodejs"
export const maxDuration = 60

const DAILY_LIMIT = 20

const FORMAT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  stories:   { width: 1080, height: 1920 },
  square:    { width: 1080, height: 1080 },
  pinterest: { width: 1080, height: 1350 },
}

const STYLE_PROMPTS: Record<string, string> = {
  surreal:
    "surreal dreamscape, melting impossible reality, floating objects, impossible architecture, glowing fog, deep indigo and cyan color palette, Salvador Dali inspired, ultra detailed painterly art, no text, no watermarks",
  comic:
    "bold comic book illustration, thick black ink outlines, flat cel-shaded vibrant colors, graphic novel panel, pop art style, high contrast, clean linework, dynamic composition, no text, no watermarks",
  photo:
    "hyperrealistic photography, Canon 5D Mark IV, cinematic natural lighting, photojournalistic documentary style, sharp focus, 35mm film grain, as if this scene really happened, no text, no watermarks",
}

export async function POST(req: NextRequest) {
  try {
    const {
      dream_entry_id,
      journal_entry_id,
      user_id,
      dream_text,
      format = "square",
      style = "surreal",
    } = await req.json()

    if (!user_id || !dream_text) {
      return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 })
    }
    if (!dream_entry_id && !journal_entry_id) {
      return NextResponse.json({ error: "Fehlende Eintrags-ID" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Daily Limit ──────────────────────────────────────────────
    const { data: limitData } = await supabase
      .rpc("get_daily_image_count", { p_user_id: user_id })

    if (limitData >= DAILY_LIMIT) {
      return NextResponse.json({
        error: `Tageslimit erreicht (${DAILY_LIMIT} Bilder/Tag). Morgen wieder verfügbar.`,
        limit_reached: true,
      }, { status: 429 })
    }

    // ── KI-Titel via Claude ──────────────────────────────────────
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const titleRes = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 60,
      messages: [{
        role: "user",
        content: `Erstelle einen kurzen, poetischen Titel (max 6 Wörter, deutsch) für diesen ${journal_entry_id ? "Journal-Eintrag" : "Traum"}. Nur den Titel, nichts sonst, keine Anführungszeichen.\nText: ${dream_text.slice(0, 300)}`,
      }],
    })
    const cardTitle = (titleRes.content[0] as { text: string }).text.trim()

    // ── Prompt aufbauen ─────────────────────────────────────────
    const prefix = journal_entry_id
      ? "Journal entry visualization:"
      : "Dream scene:"
    const stylePrompt = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.surreal
    const prompt = `${prefix} ${dream_text.slice(0, 200).trim()}. ${stylePrompt}`
    const dimensions = FORMAT_DIMENSIONS[format] ?? FORMAT_DIMENSIONS.square

    // ── Replicate Flux Schnell ──────────────────────────────────
    const replicateRes = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
          Prefer: "wait",
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
      }
    )

    if (!replicateRes.ok) {
      console.error("Replicate error:", await replicateRes.text())
      return NextResponse.json({ error: "Bildgenerierung fehlgeschlagen" }, { status: 500 })
    }

    const prediction = await replicateRes.json()
    const imageUrl = prediction.output?.[0]
    if (!imageUrl) {
      return NextResponse.json({ error: "Kein Bild generiert" }, { status: 500 })
    }

    // ── Upload zu Supabase Storage ───────────────────────────────
    const imageBlob = await (await fetch(imageUrl)).blob()
    const entryId = dream_entry_id ?? journal_entry_id
    const fileName = `${user_id}/${entryId}_${format}_${style}_${Date.now()}.webp`

    const { error: uploadError } = await supabase.storage
      .from("dream-images")
      .upload(fileName, imageBlob, { contentType: "image/webp", upsert: false })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: "Bild konnte nicht gespeichert werden" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from("dream-images").getPublicUrl(fileName)

    // ── DB speichern ─────────────────────────────────────────────
    const { data: imageRecord, error: dbError } = await supabase
      .from("dream_images")
      .insert({
        user_id,
        dream_entry_id: dream_entry_id ?? null,
        journal_entry_id: journal_entry_id ?? null,
        image_url: urlData.publicUrl,
        storage_path: fileName,
        prompt_used: prompt,
        format,
        style,
        card_title: cardTitle,
      })
      .select("id, image_url, format, style, card_title, created_at")
      .single()

    if (dbError) {
      console.error("DB insert error:", dbError)
      return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      image: imageRecord,
      card_title: cardTitle,
      remaining_today: DAILY_LIMIT - (limitData + 1),
    })
  } catch (error) {
    console.error("Generate image error:", error)
    return NextResponse.json({ error: "Unbekannter Fehler" }, { status: 500 })
  }
}
