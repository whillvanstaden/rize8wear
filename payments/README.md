PayFast connection
==================

The storefront stays hosted through GitHub Pages. The existing Sites project
serves the same storefront and provides a Cloudflare Worker with a D1 orders DB.

Runtime settings (Sites secrets, never put these into the repo):
- PAYFAST_ENABLED: false until account verification and integration testing pass.
- PAYFAST_MODE: sandbox or live.
- PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY: live account values.
- PAYFAST_PASSPHRASE: optional existing live account passphrase.

API:
- GET /api/payment-config: returns enabled/sandbox flags only.
- POST /api/checkout: validates the product/size/colour/address and calculates prices
  on the server; creates an awaiting_payment record and signs PayFast fields.
- POST /api/payfast/notify: validates signature, trusted source IP, merchant,
  expected amount, order mode, and PayFast server confirmation. Only COMPLETE
  notifications mark an order paid. Repeated notifications are idempotent.
- GET /api/order-status?order=...&token=...: returns payment status only after
  checking a random per-order token. It never returns customer details.

The return/cancel browser pages cannot mark orders paid. They show the database
status. PayFast sends the merchant payment confirmation to sales@rize8wear.co.za.
Customer delivery details are retained privately in D1 and included in PayFast's
custom transaction fields; card/bank details are handled solely by PayFast.

Build: node payments/catalogue-build.mjs; node --test payments/worker.test.mjs
For the Sites checkout copy payments/ and drizzle/, then node payments/build.mjs.

Do not enable live payments until PayFast approves verification, sandbox ITN
delivery is confirmed, and the merchant has checked the settlement account.
Check the current runtime settings and paid order records before changing an
existing deployment; this checklist does not describe its current live status.

Protocol documentation: https://developers.payfast.co.za/documentation/

Checkout activation (23 November 2026)
-------------------------------------
The storefront uses PayFast for payment; WhatsApp remains a contact channel only.
Fixed door delivery and free business collection can be paid online. Quote-only
couriers stay disabled until a fee and real collection point can be confirmed.
/api/checkout accepts a random attemptToken so retries reuse the same pending
record. A changed cart starts a new attempt. Only verified COMPLETE ITN marks paid.
The customer reference is custom_str5. custom_str2 contains a private receipt
link with full items, sizes, colours, quantities and delivery details. Treat that
link as confidential. It is available in PayFast custom transaction data.
/api/order-receipt requires the random token and includes the detailed order.
No card details are collected or stored by this website.

Meta Purchase reporting
-----------------------
payments/meta-purchase.mjs sends Purchase to Pixel 1928208843860853 only after
the verified PayFast COMPLETE notification has persisted a paid order. The
amount is the order's charged total in ZAR, including delivery and discounts.
The order ID is event_id and matches the existing browser eventID. A D1 outbox
and atomic sending lease prevent simultaneous or repeated callbacks from
creating new events; ambiguous retries reuse the same ID and payment time.

Cloudflare runtime settings (never commit the token or put it in browser code):
- META_ACCESS_TOKEN: secret Conversions API token for the named Pixel.
- META_CAPI_ENABLED: true to enable reporting; absent/false leaves it disabled.
- META_CAPI_MODE: test or live. Order mode must match sandbox or live respectively.
- META_TEST_EVENT_CODE: Meta Test Events code, required in test mode and forbidden
  in live mode. Remove it before enabling live reporting.

Meta receives the paid amount/currency, order ID/time, a SHA-256-normalised email
hash, and the browser User-Agent captured during checkout. Product names,
awareness categories, delivery addresses and plain contact details are excluded.
The token is sent in the HTTPS request body, not its URL. Error records contain
only sanitised error codes. If Meta fails, the paid status remains intact and
the ITN returns 503 so PayFast can retry the same event. Automatic ambiguous
retries stop after 47 hours to stay inside Meta's 48-hour deduplication window.

Verification: node --test tests/cart.test.cjs tests/shipping.test.cjs
tests/purchase.test.cjs payments/worker.test.mjs (one command, on a single line).
Automated tests mock external services; they do not prove actual event delivery.
Before live activation, complete an isolated PayFast Sandbox order and verify
one server Purchase with the same order ID, paid amount and ZAR currency in
Meta Test Events. Keep customer checkout in live mode while testing separately.
Do not replay historical paid customer orders as new test purchases.

End-to-end verification completed on 24 November 2026: PayFast Sandbox order
R8-PF-182ff458c939165146616a073958c742 combined a men's and women's Cancer
Awareness shirt with R99 delivery, paid R599.00, and produced one processed
server Purchase in Meta Test Events (value 599, currency ZAR, matching event ID).
The D1 outbox recorded state sent, attempts 1. No real money was charged.

The isolated /sandbox/ route is off unless PAYFAST_SANDBOX_ENABLED=true. It uses
PAYFAST_SANDBOX_TOKEN_HASH and PAYFAST_SANDBOX_EXPIRES to gate checkout, and
META_SANDBOX_TEST_EVENT_CODE to restrict reports to Meta Test Events. Tokens
are submitted in POST bodies, not query strings. The browser test link carries
its short-lived key in a fragment. Sandbox callback verification stays identical
to normal PayFast verification, with the official Sandbox credentials and host.
Disable this route and remove its temporary settings after testing. Customer
PAYFAST_MODE must remain live throughout this isolated test.
