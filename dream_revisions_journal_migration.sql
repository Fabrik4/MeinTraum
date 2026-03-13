-- Journal-Ergänzungen: journal_entry_id zu dream_revisions hinzufügen
ALTER TABLE dream_revisions
  ADD COLUMN IF NOT EXISTS journal_entry_id bigint REFERENCES journal_entries(id) ON DELETE CASCADE;

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS dream_revisions_journal_entry_id_idx ON dream_revisions(journal_entry_id);
