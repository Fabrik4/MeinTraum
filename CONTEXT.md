# MeinTraum – Entwicklungs-Session Zusammenfassung
## Stand: 13. März 2026 (Session 5)

## Projekt-Kontext
- **App:** Traumtagebuch + Journal mit KI-Reflexion, Mustererkennung, Schlafoptimierung
- **Live:** https://www.meintraum.app
- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase + Vercel
- **Auth:** Google OAuth + Passwort-Login (Magic Link entfernt) → Redirect: https://www.meintraum.app/auth/callback
- **KI:** Anthropic Claude (claude-sonnet-4-20250514) via API
- **Nutzer:** Anfänger, arbeitet mit VS Code + GitHub + Vercel, copy-paste Workflow

---

## Aktuelle App-Struktur (vollständig)

```
app/
  page.tsx                        → Landingpage
  layout.tsx                      → Root Layout mit AppHeader
  AppHeader.tsx                   → Mobile Bottom Bar + Desktop Top Nav ✅
  DreamChat.tsx                   → Traumbegleiter AI Chat-Komponente ✅
  dashboard/page.tsx              → Dashboard (Stats + Check-in + Streak + Stimmungsmonitor) ✅
  entry/page.tsx                  → Traum erfassen → redirect zu /entries/[id]?type=dream ✅
  entries/[id]/page.tsx           → Universal-Detailseite (Traum + Journal) ✅
  journal/new/page.tsx            → Neuer Journal-Eintrag (mit SleepWheelPicker) ✅
  timeline/page.tsx               → Kombinierte Timeline (mit Pin-Feature) ✅
  patterns/page.tsx               → Muster-Analyse ✅
  profile/page.tsx                → Profil + KI-Kontext + Keyevents + KI-Gedächtnis ✅
  chat/page.tsx                   → Traumbegleiter AI freier Chat (mit STT) ✅
  login/page.tsx                  → Google OAuth + Passwort Login/Register/Forgot ✅
  unterstuetzen/page.tsx          → Support-Seite (Ko-fi) ✅ NEU
  auth/callback/route.ts          → Auth Callback
  datenschutz/page.tsx            → Datenschutz
  impressum/page.tsx              → Impressum
  dreams/[id]/page.tsx            → Redirect → /entries/[id]?type=dream ✅
  dreams/page.tsx                 → Redirect → /timeline ✅
  journal/[id]/page.tsx           → Redirect → /entries/[id]?type=journal ✅
  api/
    analyze-dream/route.ts        → KI Traumanalyse (4 Modi, mit JSON-Parse try-catch) ✅
    analyze-journal/route.ts      → KI Journal-Analyse (4 Modi, mit JSON-Parse try-catch) ✅
    expand-dream/route.ts         → Stichwörter → Traumtext
    expand-journal/route.ts       → Stichwörter → Journaltext ✅
    chat/route.ts                 → Traumbegleiter AI Chat (Zwei-Stufen-Kontext) ✅
    generate-summary/route.ts     → KI-Gedächtnis generieren ✅
    checkin/route.ts              → Morning Check-in (no_memory / no_sleep) ✅ NEU
    transcribe/route.ts           → Whisper Speech-to-Text ✅
    pattern-insight/route.ts      → KI-Musteranalyse ✅
lib/
  contextBuilder.ts               → Zwei-Stufen-Kontext Helper ✅
  supabase.ts                     → Supabase Client
  useAuth.ts                      → Auth Hook (kein eingebauter Redirect)
  useStreak.ts                    → Streak Hook (useCallback, kein stale closure) ✅ NEU
  useSpeechRecorder.ts            → STT Hook (onTranscript via Ref, Timer-Cleanup) ✅ NEU
```

---

## Supabase Datenbank (vollständig)

```sql
-- Bestehend
dream_entries:        id, user_id, raw_input_text, dominant_emotion, dream_clarity,
                      dream_tone, familiar_person_flag, familiar_place_flag,
                      nightmare_flag, is_key_event (bool), created_at, dreamed_at

journal_entries:      id, user_id, body_text, mood_score (1-10), mood_label,
                      energy_level (1-5), sleep_hours, tags (text[]),
                      dominant_emotion, familiar_person_flag, familiar_place_flag,
                      is_key_event (bool), entry_date, created_at

journal_entry_entities, journal_analysis, dream_entry_entities, dream_analysis
user_entities, entity_presets, waitlist

-- NEU (context_system_migration.sql)
user_profiles:        id, display_name, age, interests, ki_context,
                      created_at, updated_at

key_events:           id, user_id, title, description, event_date, emoji,
                      linked_dream_id, linked_journal_id, created_at

user_summaries:       id, user_id, summary_text, recurring_persons[], recurring_places[],
                      recurring_emotions[], mood_avg_7d, mood_avg_30d, mood_avg_90d,
                      total_dreams, total_journal, covers_from, covers_to, generated_at

chat_sessions:        id, user_id, session_type (free/dream/journal),
                      linked_dream_id, linked_journal_id, messages (jsonb),
                      compressed_summary, message_count, last_message_at, created_at

-- NEU (streak_migration.sql)
get_user_streak(p_user_id uuid) → RPC-Funktion, zählt konsekutive Tage mit Einträgen
```

## SQL-Migrationen (alle ausgeführt ✅)
- `dream_analysis_migration.sql`
- `journal_entries_migration.sql`
- `journal_extension_migration.sql`
- `user_profiles_migration.sql`
- `context_system_migration.sql`
- `streak_migration.sql` ← NEU

---

## Design-System
- Background: `#070b14`
- Akzent Träume: `cyan-300`
- Akzent Journal: `amber-300`
- Chat/Violet: `violet-300`
- Personen-Tags: `violet-300/15`
- Orts-Tags: `amber-300/15`
- Albtraum: `red-300` (sanft)
- Schöner Traum: `emerald-300` (sanft)
- Stimmung: 1-4 `rose-300/80`, 5-6 `amber-300/80`, 7-10 `emerald-300/80`
- Rundungen: `rounded-2xl` / `rounded-3xl`
- Glassmorphism: `bg-white/5 backdrop-blur border border-white/10`

---

## Navigation (AppHeader)

### Desktop Top Bar
- Logo → `/dashboard`
- Nav: Home, Timeline, Muster, Journal, Chat
- Button: Neuer Traum → `/entry`
- Avatar-Dropdown: Profil, Traumbegleiter, Feedback, ☕ Unterstützen, Landingpage, Abmelden

### Mobile Bottom Bar (5 Items)
- Home (`/dashboard`), Timeline (`/timeline`), Traum erfassen (`/entry`, primary), Journal (`/journal/new`), Muster (`/patterns`)
- Chat ist nur im Desktop-Nav und im Avatar-Dropdown

---

## Zwei-Stufen-Kontext System

```
STUFE 1 – Dauerkontext (~850 Token, immer mitgeschickt)
  • Profil: Name, Alter, Interessen, KI-Kontext
  • user_summaries: KI-generierte Zusammenfassung aller Einträge (manuell aktualisierbar)
  • Stimmungstrends: Ø 7d / 30d / 90d
  • Wiederkehrende Personen, Orte, Emotionen
  • Keyereignisse (max. 10, nach Datum)
  • Gesamtanzahl Träume + Journaleinträge

STUFE 2 – Dynamisch (~850 Token, je nach Kontext)
  • Aktueller Eintrag (Text + Metadaten)
  • Letzte 5 Einträge gemischt (Kurzversion)
  • Chatverlauf (aus chat_sessions)

Kosten: ~$0.01 pro Chat-Nachricht, ~$0.025 pro KI-Gedächtnis-Generierung
Break-even: ~150 zahlende User @ 9 CHF/Mo
```

---

## Features (Session 5 – neu/geändert)

### Login
- Magic Link vollständig entfernt
- Neu: Google OAuth (`signInWithOAuth`) + Passwort (`signInWithPassword`)
- Modes: login / register / forgot password
- Nach Login → `router.push("/dashboard")`

### Dashboard
- Morning Check-in Banner (nur wenn kein Eintrag heute): Traum erfassen / 😶 Nichts erinnert / 💤 Nicht geschlafen
- 🔥 Bewusstheits-Streak Badge (via `useStreak` Hook + Supabase RPC)
- Stimmungsmonitor: Bezier-Kurven-Chart, Ø 7d/30d/Trend-Badges

### Timeline
- Kein "Bearbeiten"-Button mehr
- Typ-Labels: nur Icon (🌙 / 📓)
- 📌 Pin-Feature: Einträge als Keyevent markieren direkt aus Timeline

### Journal / new
- SleepWheelPicker: CSS scroll-snap Drum-Roll Rad (statt Zahleninput)
- Werte: leer + 4h–10h in 0.5h-Schritten

### Chat
- 400-Fehler behoben (API braucht `userId`, nicht `context`)
- 🎤 Speech-to-Text Button (via `useSpeechRecorder`)
- Session-ID wird über Nachrichten hinweg getracked

### Muster-Analyse
- Auth-Redirect für nicht angemeldete User

### Support
- `/unterstuetzen` Seite: Ko-fi Link
- Dezenter Hinweis im Avatar-Dropdown
- Dezentes Banner auf Profilseite

---

## Behobene Bugs (Session 5)

### Kritisch
- **Dashboard/Timeline**: Fehlende `.eq("user_id")` Filter → Daten anderer User sichtbar
- **Timeline**: Kein Auth-Redirect, Race-Condition bei `getUser()` + `fetchAll()`
- **Patterns**: Kein Auth-Redirect für nicht angemeldete User
- **analyze-dream/analyze-journal**: `JSON.parse` ohne spezifischen try-catch → silent 500

### Mittel
- **useSpeechRecorder**: `onTranscript` via Ref statt Dependency → `start` wird nicht bei jedem Render neu erstellt; setTimeout-Cleanup via Ref
- **useStreak**: `load` als `useCallback([userId])`, `useEffect([load])` → kein stale closure
- **SleepWheelPicker**: `useEffect([value])` statt `[]` → synct Scroll wenn Prop sich ändert

---

## Wichtige Env-Variablen (lokal + Vercel!)
```
NEXT_PUBLIC_SUPABASE_URL        → Supabase Projekt URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   → Supabase anon Key
SUPABASE_SERVICE_ROLE_KEY       → Supabase service_role Key ← NUR server-seitig!
ANTHROPIC_API_KEY               → Anthropic API Key
```
⚠️ Nach Vercel Env-Var Änderungen → manuell Redeploy auslösen!

---

## Bekannte Issues / Offene Punkte
- `contextBuilder.ts` muss in `lib/` liegen (nicht `app/`)
- Vercel Analytics/Speed Insights werden von Adblockern blockiert → harmlos, ignorieren

---

## Offene Minor-Bugs (aus Scan Session 5)
- `app/entry/page.tsx`: 3× silent `catch {}` – kein Fehler-Feedback für User
- `app/api/checkin/route.ts`: Insert-Fehler wird ignoriert, trotzdem 200 OK
- `app/api/pattern-insight/route.ts`: `buildTierTwoContext()` mit falschen Argumenten
- `lib/useSpeechRecorder.ts`: Zu kurze Aufnahme (<1000 Bytes) ohne User-Feedback
- `app/api/chat/route.ts`: `newSession?.id` ohne null-check

---

## Nächste Schritte (Priorität)

### 🟡 Kurzfristig
1. Minor-Bugs aus Scan beheben (entry silent catch, checkin error handling, pattern-insight args)
2. **entries_detail_page** updaten: DreamChat Props anpassen (dreamId/journalId mitgeben)
3. Testen ob Chat nach Vercel-Fix funktioniert

### 🟠 Mittelfristig
4. **Monetarisierung** – Free Trial (14 Tage) → Plus 9 CHF / Pro 19 CHF
5. **Wochenrückblick** – automatisch Sonntag generiert
6. **Streak & Reminder** – Push-Notifications oder Email

### 🔵 Langfristig
7. **Social Share-Cards** (virales Marketing)
8. **Gast-Modus** (localStorage → bei Anmeldung übertragen)
9. **Bildgenerierung** (Flux) für Träume
10. **Embeddings/pgvector** für semantische Suche (wenn >5k User)

---

## Wichtige Hinweise
- `dominant_emotion` kommagetrennt: "Angst, Freude"
- `dream_tone` ersetzt `nightmare_flag` langfristig, beide parallel
- `raw_input_text` bleibt immer unverändert
- `useAuth` hat keinen eingebauten Redirect → Seiten müssen selbst `router.push("/login")` aufrufen
- KI-Aussagen immer mit "könnte", "wird oft assoziiert mit" formulieren
- Keine medizinischen/therapeutischen Aussagen
- `@anthropic-ai/sdk` ist in package.json ✅
