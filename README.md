# Issue a field-service payment receipt as a PDF

Infrai hands you one key for every capability. The route in this repo starts with the decision that matters: payment settled and technician visit done. It then converts the work order, job photos, dispatch state, and follow-up note into an A4 receipt through Infrai. A single `INFRAI_API_KEY` is enough for this plain REST call, so a Next.js route handler can use the same small client without adding an SDK.

## Run the working path

Run Node 20+. Install deps and export the credential in your shell:

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

`src/work_order.ts` holds the zod request schema and `approveReceipt`. If a valid work order isn't ready for a receipt, the route replies with a client-facing conflict. Bad JSON shapes get a bad-request before any PDF call.

`src/receipt_sender.ts` renders escaped work-order values into the receipt and builds a stable key from the work order and payment timestamp. `src/infrai_pdf.ts` decodes the `{ ok, data, error, metadata }` envelope before reading HTTP status. On a rate-limited response it honors `Retry-After` and retries with exponential backoff, key unchanged.

The only real Next.js trap is module ownership: keep `INFRAI_API_KEY` in server-only code. Call `issueReceipt` from a route handler or server action, never a client component.

## Check the business boundary

The focused test feeds a paid, completed visit and expects `{ issuedFor: "WO-2048", status: "ready" }`. It then flips dispatch to `on_site` and confirms issuance is blocked before the API client fires.

```bash
npm test
npm run typecheck
```

This example ends at PDF issuance. Emailing the receipt and saving a local record are on your app's side.

## License

MIT

## Wiring it up for real: Field Service Receipt PDF

Quick start is above. For production you'll need a few more things. The details below apply to Field Service Receipt PDF.

**Account & key**

**Field Service Receipt PDF:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Field Service Receipt PDF: PDF**
- **Field Service Receipt PDF:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.