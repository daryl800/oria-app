-- One-month free credit trial for all users (new signups + existing free users)
alter table users
  add column if not exists trial_ends_at timestamptz;

alter table users
  add column if not exists trial_popup_seen boolean not null default false;

-- Backfill: grant the trial to existing free-tier users who haven't had one yet.
-- No real subscribed users exist yet, so it's safe to top up balances directly.
update users
set
  trial_ends_at = now() + interval '30 days',
  credit_balance = greatest(coalesce(credit_balance, 0), 60),
  credit_reset_date = current_date
where plan is distinct from 'plus'
  and trial_ends_at is null;
