-- Add 財庫 (wealth/element vault) calculation field to bazi_profile_versions
alter table bazi_profile_versions
  add column if not exists wealth_vault jsonb;
