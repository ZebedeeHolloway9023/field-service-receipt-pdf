import { approveReceipt, type ReceiptRequest } from "./work_order.js";
import { generateReceiptPdf } from "./infrai_pdf.js";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;"
  })[character] as string);
}

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100);
}

export function renderReceipt(input: ReceiptRequest): string {
  const photos = input.photos.length
    ? `<ul>${input.photos.map((photo) => `<li><a href="${escapeHtml(photo.url)}">${escapeHtml(photo.label)}</a></li>`).join("")}</ul>`
    : "<p>No work-order photos attached.</p>";
  const followUp = input.technician.followUp
    ? `<p><strong>Technician follow-up:</strong> ${escapeHtml(input.technician.followUp)}</p>`
    : "";

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;color:#17202a;margin:48px}h1{margin-bottom:4px}.total{font-size:24px}dt{font-weight:bold;margin-top:12px}dd{margin-left:0}footer{margin-top:40px;color:#566573}
</style></head><body>
<h1>Payment receipt</h1><p>Work order ${escapeHtml(input.workOrderId)}</p>
<p class="total">Paid ${escapeHtml(money(input.amountPaidCents, input.currency))}</p>
<dl><dt>Customer</dt><dd>${escapeHtml(input.customer.name)} (${escapeHtml(input.customer.email)})</dd>
<dt>Service address</dt><dd>${escapeHtml(input.serviceAddress)}</dd>
<dt>Work completed</dt><dd>${escapeHtml(input.serviceSummary)}</dd>
<dt>Paid at</dt><dd>${escapeHtml(input.paidAt)}</dd>
<dt>Technician</dt><dd>${escapeHtml(input.technician.name)}</dd></dl>
<h2>Work-order photos</h2>${photos}${followUp}
<footer>Dispatch status: completed</footer></body></html>`;
}

export async function issueReceipt(input: ReceiptRequest): Promise<{
  workOrderId: string;
  receiptStatus: "issued";
  pdf: unknown;
}> {
  approveReceipt(input);
  const pdf = await generateReceiptPdf(renderReceipt(input), `receipt:${input.workOrderId}:${input.paidAt}`);
  return { workOrderId: input.workOrderId, receiptStatus: "issued", pdf };
}
