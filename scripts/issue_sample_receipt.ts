import { issueReceipt } from "../src/receipt_sender.js";
import { receiptRequestSchema } from "../src/work_order.js";

const input = receiptRequestSchema.parse({
  workOrderId: "WO-2048",
  customer: { name: "Jordan Lee", email: "jordan@example.com" },
  serviceAddress: "18 Market Street, Austin, TX",
  serviceSummary: "Replaced the failed condenser contactor and verified cooling.",
  amountPaidCents: 18900,
  currency: "USD",
  paidAt: "2026-09-03T08:30:00.000Z",
  paymentStatus: "paid",
  dispatchStatus: "completed",
  technician: { name: "Morgan Ruiz", followUp: "Recheck the filter at the next seasonal visit." },
  photos: [
    { label: "New contactor installed", url: "https://example.com/work-orders/WO-2048/contactor.jpg" }
  ]
});

console.log(JSON.stringify(await issueReceipt(input), null, 2));
