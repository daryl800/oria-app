-- Store which 子時 (Zi-hour, 23:00-01:00) convention was used for a chart.
-- This only matters for births in the 23:00-23:59 window, where two BaZi
-- schools genuinely disagree about whether the day pillar has already
-- advanced to the next day:
--   'advance' (default, matches all pre-existing charts / prior behavior):
--     the whole 23:00-01:00 window belongs to the next day.
--   'split': only 00:00-01:00 belongs to the next day; 23:00-23:59 keeps
--     the current day's day pillar.
-- Null is treated by the app/engine as 'advance', so this column is purely
-- additive -- no backfill needed, no behavior change for existing rows.
alter table bazi_profile_versions
  add column if not exists zi_hour_convention text;
