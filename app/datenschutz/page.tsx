import Link from "next/link"

export default function Datenschutz() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-white">
      <h1 className="text-4xl font-semibold">Datenschutz</h1>

      <div className="mt-10 space-y-6 text-white/75 leading-8">

        <p>
          Der Schutz Ihrer persönlichen Daten ist uns wichtig. Diese Website
          erhebt nur die Daten, die für den Betrieb des Projekts notwendig sind.
        </p>

        <p>
          Wenn Sie sich für den Early Access anmelden, wird Ihre E-Mail-Adresse
          gespeichert, um Sie über den Start von MeinTraum und relevante
          Updates zum Projekt zu informieren.
        </p>

        <p>
          Die Daten werden nicht verkauft und nicht an Dritte weitergegeben.
        </p>

        <p>
          Sie können jederzeit verlangen, dass Ihre Daten gelöscht werden.
          Schreiben Sie dazu einfach eine E-Mail an:
        </p>

        <p>
          info@fabrik4.ch
        </p>

        <p>
          Diese Website wird über moderne Hosting- und Datenbankdienste
          betrieben. Dabei können technische Daten (z.B. IP-Adresse oder
          Browserinformationen) automatisch verarbeitet werden, um den Betrieb
          der Seite sicherzustellen.
        </p>

        <p>
          Stand: 2026
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