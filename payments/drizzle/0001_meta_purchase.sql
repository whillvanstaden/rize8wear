CREATE TABLE meta_purchase_events (
 order_id TEXT PRIMARY KEY NOT NULL REFERENCES orders(id),
 state TEXT NOT NULL DEFAULT 'pending',
 attempts INTEGER NOT NULL DEFAULT 0,
 lease_until INTEGER,
 sent_at INTEGER,
 last_error TEXT
);
