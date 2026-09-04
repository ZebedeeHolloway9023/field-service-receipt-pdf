import { createServer } from "node:http";
import { ZodError } from "zod";
import { InfraiError } from "./infrai_pdf.js";
import { issueReceipt } from "./receipt_sender.js";
import { ReceiptPolicyError, receiptRequestSchema } from "./work_order.js";

function reply(response: import("node:http").ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/receipts") {
    reply(response, 404, { error: "Route not found" });
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const input = receiptRequestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    reply(response, 201, await issueReceipt(input));
  } catch (error) {
    if (error instanceof SyntaxError) {
      reply(response, 400, { error: "Request body must be valid JSON" });
    } else if (error instanceof ZodError) {
      reply(response, 400, { error: "Invalid receipt request", issues: error.issues });
    } else if (error instanceof ReceiptPolicyError) {
      reply(response, 409, { error: error.message, code: error.code });
    } else if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      reply(response, status, { error: error.message, code: error.code });
    } else {
      reply(response, 500, { error: "Receipt could not be issued" });
    }
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Receipt service listening on http://localhost:${port}`));
