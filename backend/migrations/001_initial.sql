-- Detailor Database Schema
-- Run: psql $DATABASE_URL -f migrations/001_initial.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         VARCHAR(20) UNIQUE NOT NULL,   -- +233XXXXXXXXX
  name          VARCHAR(120),
  role          VARCHAR(20) NOT NULL DEFAULT 'customer',  -- customer | technician | admin
  is_active     BOOLEAN DEFAULT TRUE,
  push_token    TEXT,                           -- Expo push token
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── OTP Codes ───────────────────────────────────────────────────────────────
CREATE TABLE otp_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       VARCHAR(20) NOT NULL,
  code        VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON otp_codes (phone, used);

-- ─── Vans ────────────────────────────────────────────────────────────────────
CREATE TABLE vans (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name      VARCHAR(80) NOT NULL,   -- "Van 1", "Van A"
  plate     VARCHAR(20) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- ─── Technician Profiles ─────────────────────────────────────────────────────
CREATE TABLE technician_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  van_id        UUID REFERENCES vans(id),
  is_available  BOOLEAN DEFAULT TRUE,
  current_lat   DECIMAL(10,8),
  current_lng   DECIMAL(11,8),
  last_seen_at  TIMESTAMPTZ
);

-- ─── Vehicles ────────────────────────────────────────────────────────────────
CREATE TABLE vehicles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  make        VARCHAR(60) NOT NULL,
  model       VARCHAR(60) NOT NULL,
  year        SMALLINT,
  color       VARCHAR(40),
  plate       VARCHAR(20),
  notes       TEXT,
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON vehicles (user_id);

-- ─── Service Bundles ─────────────────────────────────────────────────────────
CREATE TABLE service_bundles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(80) NOT NULL,           -- "Full detail"
  description       TEXT,
  includes          TEXT[],                         -- ["Vacuum","Dash","Glass"]
  price_ghs         DECIMAL(10,2) NOT NULL,
  duration_minutes  SMALLINT NOT NULL DEFAULT 90,
  sort_order        SMALLINT DEFAULT 0,
  is_active         BOOLEAN DEFAULT TRUE
);

-- Seed bundles
INSERT INTO service_bundles (name, description, includes, price_ghs, duration_minutes, sort_order) VALUES
  ('Exterior only',  'Wash, tires & glass',             ARRAY['Hand wash','Tyre dressing','Glass clean'], 80.00,  60,  1),
  ('Interior only',  'Vacuum, dashboard & glass',        ARRAY['Vacuum','Dashboard wipe','Glass clean'],   80.00,  60,  2),
  ('Full detail',    'Complete interior + exterior',     ARRAY['Hand wash','Vacuum','Dashboard','Glass'],   140.00, 120, 3),
  ('Full + wax',     'Full detail + carnauba protection',ARRAY['Hand wash','Vacuum','Dashboard','Glass','Carnauba wax'], 200.00, 150, 4);

-- ─── Jobs ────────────────────────────────────────────────────────────────────
CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL REFERENCES users(id),
  technician_id   UUID REFERENCES users(id),
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id),
  bundle_id       UUID NOT NULL REFERENCES service_bundles(id),

  status          VARCHAR(30) NOT NULL DEFAULT 'pending',
  -- pending → confirmed → en_route → arrived → in_progress → completed | cancelled

  scheduled_at    TIMESTAMPTZ NOT NULL,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,

  location_lat    DECIMAL(10,8) NOT NULL,
  location_lng    DECIMAL(11,8) NOT NULL,
  location_address TEXT,

  total_amount_ghs  DECIMAL(10,2) NOT NULL,
  payment_status    VARCHAR(20) DEFAULT 'unpaid',  -- unpaid | paid | refunded
  payment_ref       TEXT,

  customer_notes    TEXT,
  tech_notes        TEXT,

  is_subscription   BOOLEAN DEFAULT FALSE,
  subscription_id   UUID,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON jobs (customer_id, status);
CREATE INDEX ON jobs (technician_id, status);
CREATE INDEX ON jobs (scheduled_at);

-- ─── Photos ──────────────────────────────────────────────────────────────────
CREATE TABLE photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL,   -- pre_inspection | post_completion | damage_note
  url         TEXT NOT NULL,
  caption     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON photos (job_id, type);

-- ─── Payments ────────────────────────────────────────────────────────────────
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES jobs(id),
  amount_ghs      DECIMAL(10,2) NOT NULL,
  provider        VARCHAR(20) DEFAULT 'momo',
  momo_reference  TEXT UNIQUE,
  status          VARCHAR(20) DEFAULT 'pending',  -- pending | successful | failed
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Subscriptions ───────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id       UUID NOT NULL REFERENCES users(id),
  bundle_id         UUID NOT NULL REFERENCES service_bundles(id),
  vehicle_id        UUID NOT NULL REFERENCES vehicles(id),
  status            VARCHAR(20) DEFAULT 'active',  -- active | paused | cancelled
  frequency         VARCHAR(20) DEFAULT 'weekly',  -- weekly | biweekly | monthly
  next_service_date DATE NOT NULL,
  location_lat      DECIMAL(10,8),
  location_lng      DECIMAL(11,8),
  location_address  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON subscriptions (customer_id, status);

-- ─── Ratings ─────────────────────────────────────────────────────────────────
CREATE TABLE ratings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id        UUID UNIQUE NOT NULL REFERENCES jobs(id),
  customer_id   UUID NOT NULL REFERENCES users(id),
  technician_id UUID NOT NULL REFERENCES users(id),
  stars         SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── updated_at trigger ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at    BEFORE UPDATE ON jobs    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
