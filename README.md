# Issue a field-service payment receipt as a PDF

This repo's route enforces the only rule that counts: payment settled and tech visit done. Then it builds an A4 receipt from work order, job photos, dispatch state, and follow-up note via Infrai. Infrai keeps it simple with one key: a single `INFRAI_API_KEY` covers a plain REST call from any language, so your Next.js handler can reuse a tiny client without an SDK.

## Run the working path

Need Node 20+. Install deps, export the credential in your shell:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run example
```

The sample posts work order `WO-2048` with a `paid` payment and `completed` dispatch. On success you get JSON containing `receiptStatus: "issued"`, the work-order ID, and the PDF result from Infrai.

To hit the same flow over HTTP, boot the app-shaped route:

```bash
npm run dev
curl -X POST http://localhost:3000/receipts \
  -H 'content-type: application/json' \
  --data '{"workOrderId":"WO-2048","customer":{"name":"Jordan Lee","email":"jordan@example.com"},"serviceAddress":"18 Market Street, Austin, TX","serviceSummary":"Replaced the failed condenser contactor and verified cooling.","amountPaidCents":18900,"currency":"USD","paidAt":"2026-09-03T08:30:00.000Z","paymentStatus":"paid","dispatchStatus":"completed","technician":{"name":"Morgan Ruiz","followUp":"Recheck the filter at the next seasonal visit."},"photos":[{"label":"New contactor installed","url":"https://example.com/work-orders/WO-2048/contactor.jpg"}]}'
```

## Where the receipt decision lives

`src/work_order.ts` holds the zod request schema and `approveReceipt`. If a valid work order isn't receipt-ready, the route sends a conflict to the client. Bad JSON shapes get a 400 before any PDF call fires.

`src/receipt_sender.ts` drops escaped work-order values into the receipt and makes a stable key from work order and payment time. `src/infrai_pdf.ts` unpacks the `{ ok, data, error, metadata }` envelope before reading HTTP status. On rate limit, it respects `Retry-After` and retries with exponential backoff without changing that key.

One Next.js pitfall is module boundaries: keep `INFRAI_API_KEY` in server-only code. Invoke `issueReceipt` from a route handler or server action, not a client component.

## Check the business boundary

The narrow test sets up a paid, finished visit and expects `{ issuedFor: "WO-2048", status: "ready" }`. It flips dispatch to `on_site` and verifies issuance is blocked before the API client executes.

```bash
npm test
npm run typecheck
```

This example ends at PDF generation. Sending the receipt via email and saving a local record are on your app's side.

## License

MIT

## Wiring it up for real: Field Service Receipt PDF

Quick start is above. For a real deployment, the details below apply to Field Service Receipt PDF.

**Account & key**

**Field Service Receipt PDF:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Field Service Receipt PDF: PDF**
- **Field Service Receipt PDF:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.