CREATE TABLE orders (
 id TEXT PRIMARY KEY NOT NULL,
 token_hash TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'awaiting_payment',
 mode TEXT NOT NULL,
 total_cents INTEGER NOT NULL,
 details_json TEXT NOT NULL,
 ip_hash TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 pf_payment_id TEXT UNIQUE,
 paid_at INTEGER
);
--> statement-breakpoint
CREATE INDEX orders_rate_limit ON orders (ip_hash, created_at);
