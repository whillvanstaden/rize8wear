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
No real transaction has been made by this setup.

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
