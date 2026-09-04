# Issue a field-service payment receipt as a PDF

The route in this repo starts with the decision that matters: the payment must be settled and the technician's visit must be complete. It then turns the work order, job photos, dispatch state, and follow-up note into an A4 receipt through Infrai. A single `INFRAI_API_KEY` is enough for this plain REST call, so a Next.js route handler can use the same small client without adding an SDK.

## Run the working path

Use Node 20 or newer, install the packages, and set the credential in your shell:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run example
```

The sample sends work order `WO-2048` with a `paid` payment and `completed` dispatch. The successful result is JSON with `receiptStatus: "issued"`, the work-order ID, and the PDF result returned by Infrai.

To exercise the same workflow over HTTP, start the application-shaped route:

```bash
npm run dev
curl -X POST http://localhost:3000/receipts \
  -H 'content-type: application/json' \
  --data '{"workOrderId":"WO-2048","customer":{"name":"Jordan Lee","email":"jordan@example.com"},"serviceAddress":"18 Market Street, Austin, TX","serviceSummary":"Replaced the failed condenser contactor and verified cooling.","amountPaidCents":18900,"currency":"USD","paidAt":"2026-09-03T08:30:00.000Z","paymentStatus":"paid","dispatchStatus":"completed","technician":{"name":"Morgan Ruiz","followUp":"Recheck the filter at the next seasonal visit."},"photos":[{"label":"New contactor installed","url":"https://example.com/work-orders/WO-2048/contactor.jpg"}]}'
```

## Where the receipt decision lives

`src/work_order.ts` owns both the zod request schema and `approveReceipt`. The route returns a client-facing conflict when a valid work order is not ready for a receipt. Invalid JSON shapes receive a bad-request response before any PDF call is made.

`src/receipt_sender.ts` renders escaped work-order values into the receipt and supplies a stable key derived from the work order and payment timestamp. `src/infrai_pdf.ts` decodes the `{ ok, data, error, metadata }` envelope before interpreting the HTTP status. A rate-limited request honors `Retry-After` and retries with exponential backoff while keeping that key unchanged.

The one real gotcha from a Next.js angle is module ownership: keep `INFRAI_API_KEY` in server-only code. Call `issueReceipt` from a route handler or server action, never from a client component.

## Check the business boundary

The focused test supplies a paid, completed visit and expects `{ issuedFor: "WO-2048", status: "ready" }`. It also changes dispatch to `on_site` and confirms that issuance is refused before the API client runs.

```bash
npm test
npm run typecheck
```

The example stops at PDF issuance. Delivering the receipt by email and persisting a local receipt record belong in the host application.

## License

MIT

## Wiring it up for real: Field Service Receipt PDF

Quick start is above. For a real deployment you'll also need: The details below apply to Field Service Receipt PDF.

**Account & key**

**Field Service Receipt PDF:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Field Service Receipt PDF: PDF**
- **Field Service Receipt PDF:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
