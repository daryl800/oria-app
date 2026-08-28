-- Store the computed 神煞 (Shen Sha) structural facts alongside the rest of
-- the derived BaZi data, same pattern as body_strength_detail/wealth_vault.
-- Interpretive framing/copy lives entirely in the frontend; this column
-- only holds which stars were found and which pillar(s) they appear in.
alter table bazi_profile_versions
  add column if not exists shen_sha jsonb;
