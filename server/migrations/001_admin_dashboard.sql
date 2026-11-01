CREATE TABLE IF NOT EXISTS admin_identities (
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('administrator', 'super_admin')),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (issuer, subject)
);

CREATE TABLE IF NOT EXISTS admin_dashboard_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'pending_verification', 'suspended', 'restricted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_dashboard_transactions (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount >= 0),
  total_debited NUMERIC(18, 2) NOT NULL CHECK (total_debited >= 0),
  status TEXT NOT NULL CHECK (status IN ('initiated', 'pending', 'successful', 'failed', 'reversed', 'refunded')),
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_dashboard_transactions_created_at_idx
  ON admin_dashboard_transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_dashboard_transactions_status_idx
  ON admin_dashboard_transactions (status);

CREATE TABLE IF NOT EXISTS admin_dashboard_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'degraded', 'disabled')),
  latency_ms INTEGER CHECK (latency_ms IS NULL OR latency_ms >= 0),
  last_checked_at TIMESTAMPTZ
);
