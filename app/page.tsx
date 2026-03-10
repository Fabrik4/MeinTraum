"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
export default function Home() {
   const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const { error } = await supabase
      .from("waitlist")
      .insert([{ email }])

    if (error) {
      setMessage("Diese E-Mail ist bereits eingetragen oder ungültig.")
    } else {
      setMessage("Danke! Du bist auf der Warteliste.")
      setEmail("")
    }
  }
  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(89,120,255,0.22),_transparent_35%),radial-gradient(circle_at_80%_20%,_rgba(0,220,200,0.16),_transparent_25%),radial-gradient(circle_at_20%_80%,_rgba(160,90,255,0.12),_transparent_30%)]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.04))]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-24 md:px-10 md:pb-32 md:pt-32">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1 text-sm text-white/70 backdrop-blur">
              Ein Schweizer Projekt
            </div>

            <h1 className="text-5xl font-semibold tracking-tight text-white md:text-7xl">
              MeinTraum
            </h1>

            <p className="mt-6 text-2xl font-medium text-white/90 md:text-3xl">
              Verstehe deine Träume. Und dich selbst.
            </p>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              Halte deine Träume in Sekunden fest und entdecke über Zeit Muster,
              Emotionen und Zusammenhänge zwischen deinem Schlaf, deinem Alltag
              und deinem Unterbewusstsein.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="#early-access"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]"
              >
                Early Access sichern
              </a>
              <a
                href="#mehr-erfahren"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white/85 backdrop-blur transition hover:bg-white/10"
              >
                Mehr erfahren
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="mehr-erfahren"
        className="mx-auto max-w-6xl px-6 py-20 md:px-10"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
              Problem
            </p>
            <h2 className="mt-4 text-2xl font-semibold">
              Träume verschwinden schneller als wir sie verstehen.
            </h2>
            <p className="mt-4 leading-8 text-white/70">
              Die meisten Träume zerfallen innerhalb weniger Minuten nach dem
              Aufwachen. Klassische Traumtagebücher sind mühsam und viele Apps
              liefern nur schnelle Symboldeutungen statt echter Erkenntnisse.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
              Unsere Perspektive
            </p>
            <h2 className="mt-4 text-2xl font-semibold">
              Träume sind kein Rätsel – sie sind ein Spiegel.
            </h2>
            <p className="mt-4 leading-8 text-white/70">
              MeinTraum hilft dir, Träume nicht nur zu speichern, sondern über
              längere Zeit Muster zu erkennen: wiederkehrende Orte, bestimmte
              Emotionen, vertraute Personen und mögliche Verbindungen zu deinem
              Alltag.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
            Mehr als ein Traumdeuter
          </p>
          <h2 className="mt-4 text-3xl font-semibold">
            Was MeinTraum anders macht
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6">
              <h3 className="text-lg font-semibold text-white/90">
                Klassische Traumdeuter
              </h3>
              <ul className="mt-4 space-y-3 text-white/65">
                <li>• analysieren einzelne Träume isoliert</li>
                <li>• liefern generische Symboldeutungen</li>
                <li>• arbeiten mit festen Bedeutungslisten</li>
                <li>• geben schnelle Antworten, aber selten echte Erkenntnisse</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-cyan-300/20 bg-[#0d1526] p-6">
              <h3 className="text-lg font-semibold text-white">
                MeinTraum
              </h3>
              <ul className="mt-4 space-y-3 text-white/75">
                <li>• sammelt Träume über längere Zeit</li>
                <li>• erkennt wiederkehrende Muster</li>
                <li>• verbindet Träume mit Schlaf und Kontext</li>
                <li>• unterstützt Selbstreflexion statt wagen Deutungen</li>
              </ul>
            </div>
          </div>

          <p className="mt-8 max-w-3xl leading-8 text-white/70">
            Das Ziel ist nicht, dir zu sagen, was dein Traum bedeutet. Sondern
            dir zu helfen zu verstehen, was deine Träume über dich erzählen und wie wir Muster erkennen.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 md:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
            Funktionen
          </p>
          <h2 className="mt-4 text-3xl font-semibold">
            Schnell erfassen. Klarer reflektieren. Langfristig wachsen.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Traum sofort festhalten",
              text: "Per Stichwort, Text oder Sprachnachricht direkt nach dem Aufwachen.",
            },
            {
              title: "Erinnerungen ergänzen",
              text: "Wenn später Details zurückkommen, kannst du sie jederzeit anpassen oder ergänzen.",
            },
            {
              title: "Kontext erfassen",
              text: "Emotionen, Schlafdauer oder Faktoren wie Alkohol lassen sich einfach festhalten.",
            },
            {
              title: "Muster erkennen",
              text: "Wiederkehrende Personen, Orte und Emotionen werden über Zeit sichtbar.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-4 leading-8 text-white/70">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
            Vision
          </p>
          <h2 className="mt-4 text-3xl font-semibold">
            Eine Karte deiner inneren Welt
          </h2>
          <p className="mt-6 max-w-3xl leading-8 text-white/70">
            Mit jeder Nacht wächst dein persönliches Traumarchiv. Über Wochen
            und Monate entsteht ein Bild deiner inneren Landschaft: Themen,
            Ängste, emotionale Muster und Veränderungen über Zeit. MeinTraum 
            macht sichtbar, was sonst im Unterbewusstsein verborgen bleibt.
          </p>
        </div>
      </section>

      <section
        id="early-access"
        className="mx-auto max-w-4xl px-6 py-20 md:px-10"
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur md:p-12">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
            Early Access
          </p>
          <h2 className="mt-4 text-3xl font-semibold">
            Sei einer der ersten Nutzer
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-white/70">
            MeinTraum befindet sich aktuell in Entwicklung. Trage dich ein und
            erhalte Zugang zur ersten Version und weiteren Vorteilen.
          </p>

<form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-xl flex-col gap-4 sm:flex-row">
  <input
    type="email"
    required
    value={email}
    onChange={(e)=>setEmail(e.target.value)}
    placeholder="Deine E-Mail-Adresse"
    className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0b1220] px-5 py-3 text-white placeholder:text-white/35"
  />

  <button
    type="submit"
    className="rounded-2xl bg-white px-6 py-3 font-medium text-[#070b14]"
  >
    Early Access sichern
  </button>
</form>

{message && (
  <p className="mt-4 text-sm text-white/70">{message}</p>
)}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-12 pt-6 text-sm text-white/45 md:px-10">
        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p>MeinTraum — Ein Projekt aus der Schweiz.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white/70">
              Datenschutz
            </a>
            <a href="#" className="hover:text-white/70">
              Impressum Fabrik4
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}