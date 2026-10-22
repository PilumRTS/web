-- Persistent suppression and purpose-scoped bearer links; never store plaintext tokens.
ALTER TABLE subscribers ADD COLUMN updates_unsubscribed_at INTEGER;
ALTER TABLE subscribers ADD COLUMN updates_changed_at INTEGER;
ALTER TABLE subscribers ADD COLUMN updates_consent_source TEXT;
CREATE TABLE email_preference_tokens (
  token_hash TEXT PRIMARY KEY,
  subscriber_id TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('preferences', 'unsubscribe')),
  created_at INTEGER NOT NULL
);
CREATE INDEX email_preference_tokens_subscriber ON email_preference_tokens(subscriber_id);
