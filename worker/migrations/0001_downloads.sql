PRAGMA foreign_keys = ON;

CREATE TABLE subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('mac', 'windows', 'both')),
  updates_opt_in INTEGER NOT NULL DEFAULT 0,
  consent_version TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  verified_at INTEGER,
  last_sent_at INTEGER,
  last_send_status TEXT NOT NULL DEFAULT 'pending',
  message_id TEXT
);

-- Only a hash of the emailed bearer token is persisted.
CREATE TABLE download_tokens (
  token_hash TEXT PRIMARY KEY,
  subscriber_id TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_used_at INTEGER
);
CREATE INDEX download_tokens_expiry ON download_tokens(expires_at);

-- IP addresses are never stored; keys are salted hashes with short retention.
CREATE TABLE request_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
