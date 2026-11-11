-- Azbuka A1 Voice Tutor
-- PostgreSQL initial schema migration
--
-- Apply with a migration runner or psql. This migration is intentionally
-- self-contained and safe to run once inside a transaction.
--
-- The browser remains local-first. The API, not the browser, connects to this
-- database. The event table is the durable sync/idempotency boundary.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Migration bookkeeping
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Shared trigger for updated_at columns
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Course metadata
-- Lesson content continues to ship with the static app in a1-course.json.
-- These tables version the content and provide server-side referential context.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS course_versions (
    id BIGSERIAL PRIMARY KEY,
    schema_version TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    source_name TEXT NOT NULL DEFAULT 'curriculum/russian/a1-course.json',
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (schema_version, content_hash)
);

CREATE TABLE IF NOT EXISTS course_units (
    id TEXT PRIMARY KEY,
    course_version_id BIGINT REFERENCES course_versions(id) ON DELETE SET NULL,
    unit_order INTEGER NOT NULL CHECK (unit_order BETWEEN 1 AND 16),
    title TEXT NOT NULL,
    objective TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('planned', 'active', 'retired')),
    vocabulary_count INTEGER NOT NULL DEFAULT 0 CHECK (vocabulary_count >= 0),
    estimated_minutes INTEGER CHECK (estimated_minutes IS NULL OR estimated_minutes > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (course_version_id, unit_order),
    UNIQUE (course_version_id, title)
);

CREATE INDEX IF NOT EXISTS course_units_order_idx
    ON course_units(unit_order);

DROP TRIGGER IF EXISTS course_units_set_updated_at ON course_units;
CREATE TRIGGER course_units_set_updated_at
BEFORE UPDATE ON course_units
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Accounts and authentication
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    email_normalized TEXT GENERATED ALWAYS AS (lower(btrim(email))) STORED,
    password_hash TEXT,
    display_name TEXT,
    email_verified_at TIMESTAMPTZ,
    disabled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (length(btrim(email)) BETWEEN 3 AND 320)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_uidx
    ON users(email_normalized);

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_agent TEXT,
    ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS sessions_user_active_idx
    ON sessions(user_id, expires_at)
    WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    token_type TEXT NOT NULL CHECK (token_type IN ('email_verification', 'password_reset')),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_tokens_lookup_idx
    ON auth_tokens(token_hash, token_type, expires_at)
    WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_device_id TEXT NOT NULL,
    label TEXT,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, client_device_id)
);

CREATE INDEX IF NOT EXISTS user_devices_user_idx
    ON user_devices(user_id, last_seen_at DESC);

-- ---------------------------------------------------------------------------
-- User preferences and motivation
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    daily_goal INTEGER NOT NULL DEFAULT 10 CHECK (daily_goal BETWEEN 1 AND 500),
    weekly_goal INTEGER NOT NULL DEFAULT 5 CHECK (weekly_goal BETWEEN 1 AND 100),
    audio_speed NUMERIC(4,2) NOT NULL DEFAULT 0.72 CHECK (audio_speed BETWEEN 0.25 AND 2.00),
    voice_name TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS user_settings_set_updated_at ON user_settings;
CREATE TRIGGER user_settings_set_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS user_rewards (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    badges JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(badges) = 'array'),
    activity_dates JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(activity_dates) = 'array'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS user_rewards_set_updated_at ON user_rewards;
CREATE TRIGGER user_rewards_set_updated_at
BEFORE UPDATE ON user_rewards
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Unit and review progress
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_unit_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id TEXT NOT NULL REFERENCES course_units(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    checkpoint_score INTEGER CHECK (checkpoint_score IS NULL OR checkpoint_score >= 0),
    checkpoint_total INTEGER CHECK (checkpoint_total IS NULL OR checkpoint_total > 0),
    dialogue_completed BOOLEAN NOT NULL DEFAULT false,
    xp_earned INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
    last_activity_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, unit_id),
    CHECK (checkpoint_score IS NULL OR checkpoint_total IS NULL OR checkpoint_score <= checkpoint_total),
    CHECK (status <> 'completed' OR completed_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS user_unit_progress_user_status_idx
    ON user_unit_progress(user_id, status, last_activity_at DESC);

DROP TRIGGER IF EXISTS user_unit_progress_set_updated_at ON user_unit_progress;
CREATE TRIGGER user_unit_progress_set_updated_at
BEFORE UPDATE ON user_unit_progress
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS user_item_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_scope TEXT NOT NULL CHECK (item_scope IN ('stage', 'course', 'letter', 'story', 'scenario')),
    item_id TEXT NOT NULL,
    unit_id TEXT REFERENCES course_units(id) ON DELETE SET NULL,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    correct INTEGER NOT NULL DEFAULT 0 CHECK (correct >= 0 AND correct <= attempts),
    last_rating TEXT CHECK (last_rating IS NULL OR last_rating IN ('again', 'hard', 'good', 'easy')),
    difficulty TEXT CHECK (difficulty IS NULL OR difficulty IN ('new', 'learning', 'review', 'difficult')),
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    interval_days NUMERIC(10,2) CHECK (interval_days IS NULL OR interval_days >= 0),
    ease_factor NUMERIC(6,3) CHECK (ease_factor IS NULL OR ease_factor > 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, item_scope, item_id)
);

CREATE INDEX IF NOT EXISTS user_item_progress_due_idx
    ON user_item_progress(user_id, next_review_at)
    WHERE next_review_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_item_progress_unit_idx
    ON user_item_progress(user_id, unit_id, item_scope);

DROP TRIGGER IF EXISTS user_item_progress_set_updated_at ON user_item_progress;
CREATE TRIGGER user_item_progress_set_updated_at
BEFORE UPDATE ON user_item_progress
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS user_story_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    story_id TEXT NOT NULL,
    unit_id TEXT REFERENCES course_units(id) ON DELETE SET NULL,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    correct INTEGER NOT NULL DEFAULT 0 CHECK (correct >= 0 AND correct <= attempts),
    cloze_correct INTEGER NOT NULL DEFAULT 0 CHECK (cloze_correct >= 0),
    last_attempt_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, story_id)
);

DROP TRIGGER IF EXISTS user_story_progress_set_updated_at ON user_story_progress;
CREATE TRIGGER user_story_progress_set_updated_at
BEFORE UPDATE ON user_story_progress
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS user_scenario_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id TEXT NOT NULL,
    unit_id TEXT REFERENCES course_units(id) ON DELETE SET NULL,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed >= 0 AND completed <= attempts),
    last_completed_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, scenario_id)
);

DROP TRIGGER IF EXISTS user_scenario_progress_set_updated_at ON user_scenario_progress;
CREATE TRIGGER user_scenario_progress_set_updated_at
BEFORE UPDATE ON user_scenario_progress
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Immutable sync/event log
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS learning_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES user_devices(id) ON DELETE SET NULL,
    client_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'unit-started', 'unit-completed', 'dialogue-response',
        'listening-answer', 'story-answer', 'checkpoint-answer',
        'review-rated', 'letter-rated', 'quiz-review',
        'xp-awarded', 'badge-earned', 'settings-updated',
        'scenario-completed', 'sync-import'
    )),
    unit_id TEXT REFERENCES course_units(id) ON DELETE SET NULL,
    item_scope TEXT,
    item_id TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
    occurred_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, client_event_id)
);

CREATE INDEX IF NOT EXISTS learning_events_user_time_idx
    ON learning_events(user_id, occurred_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS learning_events_unit_time_idx
    ON learning_events(user_id, unit_id, occurred_at DESC)
    WHERE unit_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS learning_events_type_time_idx
    ON learning_events(user_id, event_type, occurred_at DESC);

-- Cursor support for incremental sync. The API can use received_at + id as a
-- stable cursor, or expose an opaque encoded version of these two fields.
CREATE INDEX IF NOT EXISTS learning_events_sync_cursor_idx
    ON learning_events(user_id, received_at ASC, id ASC);

-- ---------------------------------------------------------------------------
-- Client sync bookkeeping
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sync_cursors (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
    last_received_at TIMESTAMPTZ,
    last_received_event_id UUID,
    last_sync_at TIMESTAMPTZ,
    progress_version BIGINT NOT NULL DEFAULT 0 CHECK (progress_version >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, device_id)
);

DROP TRIGGER IF EXISTS sync_cursors_set_updated_at ON sync_cursors;
CREATE TRIGGER sync_cursors_set_updated_at
BEFORE UPDATE ON sync_cursors
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS data_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    format TEXT NOT NULL CHECK (format IN ('json')),
    status TEXT NOT NULL CHECK (status IN ('requested', 'ready', 'expired', 'failed')),
    object_key TEXT,
    checksum TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS data_exports_user_created_idx
    ON data_exports(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Convenience views for API reads
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW user_progress_summary AS
SELECT
    u.id AS user_id,
    COUNT(DISTINCT up.unit_id) FILTER (WHERE up.status = 'completed')::INTEGER AS completed_units,
    COUNT(DISTINCT up.unit_id)::INTEGER AS started_units,
    COALESCE(ur.xp, 0)::INTEGER AS xp,
    COALESCE(jsonb_array_length(ur.badges), 0)::INTEGER AS badge_count,
    MAX(up.last_activity_at) AS last_activity_at
FROM users u
LEFT JOIN user_unit_progress up ON up.user_id = u.id
LEFT JOIN user_rewards ur ON ur.user_id = u.id
GROUP BY u.id, ur.xp, ur.badges;

-- ---------------------------------------------------------------------------
-- Seed the current A1 course metadata
-- The content hash is a placeholder until the deployment process computes a
-- SHA-256 hash of the exact a1-course.json being served.
-- ---------------------------------------------------------------------------

INSERT INTO course_versions (schema_version, content_hash, source_name)
VALUES ('1.0', 'replace-with-a1-course-json-sha256', 'curriculum/russian/a1-course.json')
ON CONFLICT (schema_version, content_hash) DO NOTHING;

INSERT INTO course_units
    (id, course_version_id, unit_order, title, objective, status, vocabulary_count, estimated_minutes)
SELECT v.id, cv.id, v.unit_order, v.title, v.objective, v.status, v.vocabulary_count, v.estimated_minutes
FROM course_versions cv
CROSS JOIN (VALUES
    ('u01-orientation', 1, 'Orientation and sound map', 'Use high-leverage Russian in a practical beginner situation.', 'active', 100, 10),
    ('u02-greetings-introductions', 2, 'Greetings and introductions', 'Greet someone, exchange names, and say where you are from in a short Russian conversation.', 'active', 14, 15),
    ('u03-numbers-time', 3, 'Numbers, dates, and time', 'Ask and answer simple questions about numbers, days, dates, and the time of a meeting.', 'active', 16, 15),
    ('u04-people-family', 4, 'People and family', 'Describe the important people around you and ask who someone is using simple Russian sentences.', 'active', 14, 15),
    ('u05-home-objects', 5, 'Home and everyday objects', 'Talk about what is at home while reusing greetings, family, time, and meeting phrases in one connected beginner conversation.', 'active', 12, 15),
    ('u06-food-cafe', 6, 'Food and café', 'Order simple food and drinks, ask the price, and complete a polite café transaction while recycling the core conversation patterns.', 'active', 14, 15),
    ('u07-shopping-clothing', 7, 'Travel, directions, and transportation', 'Ask where a place is, understand a simple route, and use public transportation while recycling the A1 conversation core.', 'active', 15, 15),
    ('u08-daily-routine', 8, 'Hotel check-in, accommodation, and emergency help', 'Check into a hotel, report a room problem, and ask for urgent help while staying calm and clear.', 'active', 15, 15),
    ('u09-work-school', 9, 'Work, school, and languages', 'Talk simply about work, school, languages, ability, and communication repair.', 'active', 16, 15),
    ('u10-city-directions', 10, 'City and directions', 'Ask for places in the city, understand simple directions, and reach a destination by walking or transport.', 'active', 18, 15),
    ('u11-travel-stay', 11, 'Travel and accommodation', 'Buy or confirm a ticket, navigate arrival and departure, and handle simple travel or accommodation problems.', 'active', 16, 15),
    ('u12-weather-seasons', 12, 'Weather and seasons', 'Describe basic weather and seasons, choose suitable clothes, and make a simple plan.', 'active', 16, 15),
    ('u13-health-needs', 13, 'Health and immediate needs', 'Describe simple symptoms, ask for a doctor or pharmacy, and communicate immediate health needs clearly.', 'active', 16, 15),
    ('u14-preferences-free-time', 14, 'Preferences and free time', 'Express likes and dislikes, talk about hobbies, and make or decline a simple invitation.', 'active', 16, 15),
    ('u15-plans-future', 15, 'Plans and near future', 'Talk about simple future plans, arrange a time and place, and change a plan politely.', 'active', 16, 15),
    ('u16-survival-mission', 16, 'A1 survival mission', 'Combine A1 Russian in realistic survival situations: arrive, ask, repair, solve a problem, and make a plan.', 'active', 16, 20)
) AS v(id, unit_order, title, objective, status, vocabulary_count, estimated_minutes)
WHERE cv.schema_version = '1.0'
  AND cv.content_hash = 'replace-with-a1-course-json-sha256'
ON CONFLICT (id) DO UPDATE SET
    course_version_id = EXCLUDED.course_version_id,
    unit_order = EXCLUDED.unit_order,
    title = EXCLUDED.title,
    objective = EXCLUDED.objective,
    status = EXCLUDED.status,
    vocabulary_count = EXCLUDED.vocabulary_count,
    estimated_minutes = EXCLUDED.estimated_minutes,
    updated_at = now();

INSERT INTO schema_migrations (version)
VALUES ('001_initial_azbuka_schema')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ---------------------------------------------------------------------------
-- Optional rollback (run manually, in reverse dependency order)
-- ---------------------------------------------------------------------------
-- DROP VIEW IF EXISTS user_progress_summary;
-- DROP TABLE IF EXISTS data_exports, sync_cursors, learning_events,
--   user_scenario_progress, user_story_progress, user_item_progress,
--   user_unit_progress, user_rewards, user_settings, user_devices,
--   auth_tokens, sessions, users, course_units, course_versions,
--   schema_migrations CASCADE;
-- DROP FUNCTION IF EXISTS set_updated_at();
