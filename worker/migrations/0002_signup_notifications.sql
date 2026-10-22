-- Transactional outbox: one event for each genuinely new unique subscriber.
-- Snapshot only collected signup facts; never include IPs or download tokens.
CREATE TABLE signup_notifications (
  subscriber_id TEXT PRIMARY KEY REFERENCES subscribers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  platform TEXT NOT NULL,
  updates_opt_in INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'signup',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL,
  lease_until INTEGER NOT NULL DEFAULT 0,
  claim_id TEXT,
  delivered_at INTEGER,
  discord_message_id TEXT
);
CREATE INDEX signup_notifications_due ON signup_notifications(delivered_at, next_attempt_at, lease_until);
CREATE TRIGGER queue_new_signup AFTER INSERT ON subscribers BEGIN
  INSERT INTO signup_notifications (subscriber_id, email, platform, updates_opt_in, created_at, next_attempt_at)
  VALUES (NEW.id, NEW.email, NEW.platform, NEW.updates_opt_in, NEW.created_at, NEW.created_at);
END;
