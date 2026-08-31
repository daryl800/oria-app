-- Cache column for the pre-signup onboarding "teaser" (personalized preview
-- shown after MBTI + BaZi + concern, before signup). Generated once via LLM
-- and cached here so page reloads / back-navigation don't trigger a second
-- paid call for the same anonymous session.
ALTER TABLE temp_onboarding_data
ADD COLUMN IF NOT EXISTS teaser_result jsonb DEFAULT NULL;
