"use client"
import { Moon, Brain, Sparkles, Search } from "lucide-react"
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
              Verstehe deine Träume & entdecke Muster in dir selbst.
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
    icon: Moon,
    title: "Traum sofort festhalten",
    text: "Per Stichwort, Text oder Sprachnachricht direkt nach dem Aufwachen.",
  },
  {
    icon: Sparkles,
    title: "Erinnerung ergänzen",
    text: "Wenn später Details zurückkommen, kannst du sie jederzeit bearbeiten.",
  },
  {
    icon: Brain,
    title: "Kontext erfassen",
    text: "Emotionen, Schlaf oder Faktoren wie Alkohol lassen sich einfach festhalten.",
  },
  {
    icon: Search,
    title: "Muster erkennen",
    text: "Wiederkehrende Personen, Orte und Emotionen werden über Zeit sichtbar.",
  },
].map((item) => {
  const Icon = item.icon
  return (
    <div
      key={item.title}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
    >
      <Icon className="mb-4 h-8 w-8 text-cyan-300" />
      <h3 className="text-lg font-semibold">{item.title}</h3>
      <p className="mt-4 leading-8 text-white/70">{item.text}</p>
    </div>
  )
})}        </div>
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
      <section className="mx-auto max-w-6xl px-6 py-20 md:px-10">
  <div className="grid items-center gap-10 lg:grid-cols-2">
    <div>
      <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
        So könnte MeinTraum aussehen
      </p>
      <h2 className="mt-4 text-3xl font-semibold">
        Schnell festhalten. Später vertiefen.
      </h2>
      <p className="mt-6 max-w-xl leading-8 text-white/70">
        Direkt nach dem Aufwachen zählt vor allem eines: den Traum festhalten,
        bevor er zerfällt. MeinTraum hilft dir, Erinnerungen schnell zu sichern
        und später mit mehr Ruhe zu ergänzen, zu ordnen und zu reflektieren.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="font-medium text-white">Schneller Einstieg</p>
          <p className="mt-2 text-sm leading-7 text-white/65">
            Stichworte, Sprache oder kurzer Text direkt nach dem Aufwachen.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="font-medium text-white">Bearbeitbar statt halluziniert</p>
          <p className="mt-2 text-sm leading-7 text-white/65">
            Ergänze später Personen, Orte, Emotionen und Kontext, wenn mehr
            Erinnerung zurückkommt.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="font-medium text-white">Muster über Zeit</p>
          <p className="mt-2 text-sm leading-7 text-white/65">
            Keine Einmal-Deutung, sondern langfristige Erkenntnisse über dich
            selbst.
          </p>
        </div>
      </div>
    </div>

    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute inset-0 rounded-[2.5rem] bg-cyan-400/10 blur-3xl" />
      <div className="relative rounded-[2.5rem] border border-white/10 bg-[#0b1220] p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between px-2 pt-1 text-xs text-white/40">
          <span>9:41</span>
          <span>MeinTraum</span>
          <span>●●●</span>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#0f1728] p-5">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
              Neuer Traum
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              Was ist dir geblieben?
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/40">Stichworte</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Haus", "Hund", "Essen", "Angst"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/40">Erkannte Elemente</p>
            <div className="mt-3 space-y-2 text-sm text-white/75">
              <div className="flex items-center justify-between">
                <span>Emotion</span>
                <span className="text-cyan-200">Angst</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ort</span>
                <span className="text-cyan-200">Zuhause</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Bekannte Person</span>
                <span className="text-cyan-200">Ja</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/40">Klarheit</p>
              <p className="mt-2 font-medium text-white">Mittel</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/40">Albtraum</p>
              <p className="mt-2 font-medium text-white">Eher ja</p>
            </div>
          </div>

          <button className="mt-5 w-full rounded-2xl bg-white px-4 py-3 font-medium text-[#070b14]">
            Traum speichern
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="mx-auto max-w-6xl px-6 py-20 md:px-10">
  <div className="mb-12 max-w-2xl">
    <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
      So funktioniert MeinTraum
    </p>
    <h2 className="mt-4 text-3xl font-semibold">
      In drei Schritten vom Traum zur Erkenntnis
    </h2>
    <p className="mt-4 leading-8 text-white/70">
      MeinTraum hilft dir nicht nur beim Festhalten von Träumen, sondern dabei,
      über Zeit Muster zu erkennen und mehr über dich selbst zu verstehen.
    </p>
  </div>

  <div className="grid gap-6 md:grid-cols-3">
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-sm font-semibold text-cyan-100">
        01
      </div>
      <h3 className="text-lg font-semibold">Traum festhalten</h3>
      <p className="mt-4 leading-8 text-white/70">
        Halte deinen Traum direkt nach dem Aufwachen per Stichwort, Text oder
        Sprache fest, bevor die Erinnerung zerfällt.
      </p>
    </div>

    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-sm font-semibold text-cyan-100">
        02
      </div>
      <h3 className="text-lg font-semibold">Details ergänzen</h3>
      <p className="mt-4 leading-8 text-white/70">
        Ergänze später Personen, Orte, Emotionen und Kontext, wenn weitere
        Erinnerungen auftauchen oder du den Traum klarer einordnen willst.
      </p>
    </div>

    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-sm font-semibold text-cyan-100">
        03
      </div>
      <h3 className="text-lg font-semibold">Muster erkennen</h3>
      <p className="mt-4 leading-8 text-white/70">
        Über Wochen und Monate wird sichtbar, welche Themen, Emotionen und
        Zusammenhänge sich in deiner Traumwelt und deinem Alltag wiederholen.
      </p>
    </div>
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

    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-8 flex max-w-xl flex-col gap-4 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Deine E-Mail-Adresse"
        className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0b1220] px-5 py-3 text-white placeholder:text-white/35 focus:border-cyan-300/40 focus:outline-none"
      />

      <button
        type="submit"
        className="rounded-2xl bg-white px-6 py-3 font-medium text-[#070b14] transition hover:scale-[1.02]"
      >
        Early Access sichern
      </button>
    </form>

    {message && (
      <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
        {message}
      </div>
    )}

    <p className="mt-4 text-xs text-white/45">
      Mit der Anmeldung stimmst du zu, dass wir deine E-Mail speichern dürfen,
      um dich über den Start von MeinTraum zu informieren.

      Keine Werbung. Keine Weitergabe deiner Daten. 
    </p>
  </div>
</section>
<section className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur md:p-10">
    <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
      Warum Early Access?
    </p>

    <h2 className="mt-4 text-2xl font-semibold md:text-3xl">
      Als früher Nutzer prägst du MeinTraum mit
    </h2>

    <p className="mt-4 max-w-2xl leading-8 text-white/70">
      MeinTraum entsteht nicht als anonymer Traumdeuter, sondern als Werkzeug
      für echte Selbstreflexion. Wer früh dabei ist, hilft mit, die App in die
      richtige Richtung zu entwickeln.
    </p>

    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-5">
        <p className="text-base font-semibold text-white">Früher Zugang</p>
        <p className="mt-3 text-sm leading-7 text-white/65">
          Du gehörst zu den ersten, die MeinTraum testen und vor dem offiziellen
          Start Zugriff erhalten.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-5">
        <p className="text-base font-semibold text-white">Einfluss auf Features</p>
        <p className="mt-3 text-sm leading-7 text-white/65">
          Deine Rückmeldungen helfen dabei, Capture, Musteranalyse und
          Selbstreflexion von Anfang an sinnvoll zu gestalten.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-5">
        <p className="text-base font-semibold text-white">Exklusive Updates</p>
        <p className="mt-3 text-sm leading-7 text-white/65">
          Du erhältst Einblicke in die Entwicklung und erfährst als Erstes, wenn
          neue Funktionen live gehen.
        </p>
      </div>
    </div>
  </div>
</section>
<section className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
  <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur md:p-10">
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
        Vertrauenswürdig statt laut
      </p>

      <h2 className="mt-4 text-2xl font-semibold md:text-3xl">
        MeinTraum soll dich verstehen lassen
      </h2>

      <p className="mt-4 leading-8 text-white/70">
        Kein esoterischer Kitsch, keine billigen Deutungen und keine unnötige
        Reizüberflutung. MeinTraum entsteht als ruhiges Werkzeug für
        Selbstreflexion, Mustererkennung und langfristige Selbsterkenntnis.
      </p>
    </div>

    <div className="mt-10 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-5 text-center">
        <p className="text-base font-semibold text-white">Schweizer Projekt</p>
        <p className="mt-3 text-sm leading-7 text-white/65">
          Entwickelt mit Fokus auf Qualität, Klarheit und langfristige
          Perspektive.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-5 text-center">
        <p className="text-base font-semibold text-white">Keine Pseudo-Deutung</p>
        <p className="mt-3 text-sm leading-7 text-white/65">
          MeinTraum liefert keine fertigen Antworten, sondern hilft dir,
          deine eigenen Muster besser zu erkennen.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-5 text-center">
        <p className="text-base font-semibold text-white">Privat und bewusst</p>
        <p className="mt-3 text-sm leading-7 text-white/65">
          Keine Werbung, kein Datenverkauf, kein unnötiger Lärm um deine
          Traumwelt.
        </p>
      </div>
    </div>

    <div className="mt-10 text-center">
      <a
        href="#early-access"
        className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]"
      >
        Jetzt für Early Access eintragen
      </a>
    </div>
  </div>
</section>

<footer className="mx-auto max-w-6xl px-6 pb-12 pt-6 text-sm text-white/45 md:px-10">
  <div className="flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">

    <p>
      MeinTraum - Ein Projekt aus der Schweiz.
    </p>

    <div className="flex gap-6">
     <a href="/datenschutz" className="hover:text-white/70">
  Datenschutz
</a>

<a href="/impressum" className="hover:text-white/70">
  Impressum
</a>
    </div>

  </div>
</footer>    </main>
  );
}