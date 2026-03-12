export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-5">
      <div className="text-center space-y-5 max-w-sm">
        <p className="text-5xl">🌙</p>
        <h1 className="text-2xl font-semibold">Du bist offline</h1>
        <p className="text-sm text-white/45 leading-7">
          Keine Verbindung – aber dein letzter Traum wartet auf dich.
          Sobald du wieder online bist, synchronisiert MeinTraum automatisch.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
          Erneut versuchen
        </button>
      </div>
    </main>
  )
}