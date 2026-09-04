import assert from "node:assert/strict";
import test from "node:test";
import { approveReceipt, ReceiptPolicyError, receiptRequestSchema } from "../src/work_order.js";

const completedPayment = receiptRequestSchema.parse({
  workOrderId: "WO-2048",
  customer: { name: "Jordan Lee", email: "jordan@example.com" },
  serviceAddress: "18 Market Street, Austin, TX",
  serviceSummary: "Replaced a condenser contactor.",
  amountPaidCents: 18900,
  currency: "usd",
  paidAt: "2026-09-03T08:30:00.000Z",
  paymentStatus: "paid",
  dispatchStatus: "completed",
  technician: { name: "Morgan Ruiz", followUp: "Check the filter next season." },
  photos: [{ label: "Installed part", url: "https://example.com/photo.jpg" }]
});

test("approves a paid, completed field visit", () => {
  assert.deepEqual(approveReceipt(completedPayment), { issuedFor: "WO-2048", status: "ready" });
});

test("rejects a receipt while the technician is still on site", () => {
  const activeVisit = { ...completedPayment, dispatchStatus: "on_site" as const };
  assert.throws(
    () => approveReceipt(activeVisit),
    (error) => error instanceof ReceiptPolicyError && error.code === "VISIT_NOT_COMPLETED"
  );
});
