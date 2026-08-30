-- Cache table for the daily east/west motto card (see apps/api/src/routes/mottoTest.ts).
-- Keyed by ganzhi (the 60-value sexagenary day-pillar cycle), not by calendar
-- date, so once all 60 rows are seeded (see scripts/seedDailyMottos.ts) every
-- future request for a given ganzhi is a permanent cache hit and never calls
-- the LLM again. No prior migration created this table — it's being added now
-- defensively (IF NOT EXISTS) since it was apparently created out-of-band.
CREATE TABLE IF NOT EXISTS daily_mottos (
  ganzhi text PRIMARY KEY,
  east jsonb NOT NULL,
  west jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
