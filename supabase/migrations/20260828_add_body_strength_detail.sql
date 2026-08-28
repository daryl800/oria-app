-- Store the 得令/得地/得勢 derivation behind the 身強/身弱 classification, so
-- the profile summary LLM can narrate the actual reasoning chain instead of
-- just asserting the final label. body_strength (the classification string,
-- e.g. "身弱") is untouched — Chart.tsx depends on it staying a plain string.
alter table bazi_profile_versions
  add column if not exists body_strength_detail jsonb;
