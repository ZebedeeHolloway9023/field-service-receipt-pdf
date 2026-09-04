import { z } from "zod";

export const receiptRequestSchema = z.object({
  workOrderId: z.string().min(1),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email()
  }),
  serviceAddress: z.string().min(1),
  serviceSummary: z.string().min(1),
  amountPaidCents: z.number().int().positive(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  paidAt: z.string().datetime(),
  paymentStatus: z.enum(["pending", "paid", "refunded"]),
  dispatchStatus: z.enum(["scheduled", "en_route", "on_site", "completed", "cancelled"]),
  technician: z.object({
    name: z.string().min(1),
    followUp: z.string().min(1).optional()
  }),
  photos: z.array(z.object({
    label: z.string().min(1),
    url: z.string().url()
  })).max(12).default([])
});

export type ReceiptRequest = z.infer<typeof receiptRequestSchema>;

export class ReceiptPolicyError extends Error {
  readonly code: "PAYMENT_NOT_SETTLED" | "VISIT_NOT_COMPLETED";

  constructor(code: "PAYMENT_NOT_SETTLED" | "VISIT_NOT_COMPLETED", message: string) {
    super(message);
    this.name = "ReceiptPolicyError";
    this.code = code;
  }
}

export function approveReceipt(input: ReceiptRequest): { issuedFor: string; status: "ready" } {
  if (input.paymentStatus !== "paid") {
    throw new ReceiptPolicyError("PAYMENT_NOT_SETTLED", "A receipt requires a settled payment.");
  }
  if (input.dispatchStatus !== "completed") {
    throw new ReceiptPolicyError("VISIT_NOT_COMPLETED", "Complete the field visit before issuing its receipt.");
  }
  return { issuedFor: input.workOrderId, status: "ready" };
}
