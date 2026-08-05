-- Add advanced BaZi calculation fields to bazi_profile_versions
alter table bazi_profile_versions
  add column if not exists ten_gods jsonb,
  add column if not exists body_strength text,
  add column if not exists favorable_elements jsonb,
  add column if not exists void_branches jsonb,
  add column if not exists bazi_analysis jsonb;
