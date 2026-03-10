import Link from "next/link"

export default function Impressum() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-white">
      <h1 className="text-4xl font-semibold">Impressum</h1>

      <div className="mt-10 space-y-6 text-white/75 leading-8">

        <p>
          <strong>MeinTraum</strong> ist ein Projekt von:
        </p>

        <p>
          tsdd GmbH<br/>
          Fabrik4<br/>
          Schweiz
        </p>

        <p>
          Kontakt:<br/>
          info@fabrik4.ch
        </p>

        <p>
          Verantwortlich für den Inhalt dieser Website ist der Betreiber der
          oben genannten Firma.
        </p>

        <p>
          Diese Website befindet sich aktuell in Entwicklung.
        </p>

      </div>

      <div className="mt-12">
        <Link
          href="/"
          className="inline-flex items-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
        >
          ← Zurück zur Startseite
        </Link>
      </div>

    </main>
  )
}