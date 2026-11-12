-- 002: server-side XP ledger.
-- One row per reward key per user. The primary key makes every reward
-- idempotent, so retries and replayed events cannot add XP twice.

BEGIN;

CREATE TABLE IF NOT EXISTS xp_ledger (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_key TEXT NOT NULL CHECK (length(reward_key) <= 200),
    amount INTEGER NOT NULL CHECK (amount >= 0),
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, reward_key)
);

CREATE INDEX IF NOT EXISTS xp_ledger_user_day_idx ON xp_ledger (user_id, awarded_at);

INSERT INTO schema_migrations (version)
VALUES ('002_xp_ledger')
ON CONFLICT (version) DO NOTHING;

COMMIT;
