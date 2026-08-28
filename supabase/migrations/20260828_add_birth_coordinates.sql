-- Store the precise geocoded birth coordinates (when available) alongside
-- the free-text birth_location string. These are used to compute true solar
-- time accurately (longitude correction) instead of relying on a crude
-- hardcoded city/region lookup table, and are kept here so the chart can be
-- recalculated/audited later without asking the user to re-enter their
-- birthplace.
alter table bazi_profile_versions
  add column if not exists birth_lat double precision,
  add column if not exists birth_lng double precision;
