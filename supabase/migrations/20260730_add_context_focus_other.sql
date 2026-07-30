-- Add context_focus_other to store free-text "other" input from onboarding context step
ALTER TABLE mbti_profile_versions
ADD COLUMN IF NOT EXISTS context_focus_other text DEFAULT NULL;
