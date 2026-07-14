import crypto from "node:crypto";

const BASE_URL = () => process.env.GENIUSPAY_BASE_URL || "https://pay.genius.ci/api/v1";

function headers() {
  const apiKey = process.env.GENIUSPAY_API_KEY;
  const apiSecret = process.env.GENIUSPAY_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("GENIUSPAY_API_KEY / GENIUSPAY_API_SECRET are not configured");
  }
  return {
    "X-API-Key": apiKey,
    "X-API-Secret": apiSecret,
    "Content-Type": "application/json",
  };
}

/**
 * Create a payment / checkout link.
 * Docs: https://pay.genius.ci/doc — POST /merchant/payments
 */
export async function createPayment({ amount, currency = "XOF", description, customer, metadata }) {
  const res = await fetch(`${BASE_URL()}/merchant/payments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      amount,
      currency,
      description,
      customer,
      metadata,
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    const message = body?.message || `GeniusPay create payment failed (HTTP ${res.status})`;
    throw new Error(message);
  }
  return body.data;
}

/**
 * Fetch the latest status of a payment by its reference.
 * Docs: GET /merchant/payments/{reference}
 */
export async function getPaymentStatus(reference) {
  const res = await fetch(`${BASE_URL()}/merchant/payments/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: headers(),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    const message = body?.message || `GeniusPay get payment failed (HTTP ${res.status})`;
    throw new Error(message);
  }
  return body.data;
}

/**
 * Register a webhook endpoint with GeniusPay.
 * Docs: POST /merchant/webhooks
 */
export async function registerWebhook({ url, name = "WhatsApp CRM CI", events }) {
  const res = await fetch(`${BASE_URL()}/merchant/webhooks`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name,
      url,
      events: events || ["payment.success", "payment.failed"],
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    const message = body?.message || `GeniusPay register webhook failed (HTTP ${res.status})`;
    throw new Error(message);
  }
  return body.data;
}

/**
 * Verify the HMAC-SHA256 signature GeniusPay attaches to webhook requests.
 * Headers sent by GeniusPay: X-Webhook-Signature, X-Webhook-Timestamp
 * (also X-Webhook-Event / X-Webhook-Delivery / X-Webhook-Environment, informational only).
 *
 * signature = HMAC-SHA256(timestamp + "." + rawBody, GENIUSPAY_WEBHOOK_SECRET)
 *
 * `rawBody` MUST be the exact raw request body string (not re-serialized JSON),
 * otherwise key ordering/whitespace differences will break the signature check.
 */
export function verifyWebhookSignature({ rawBody, timestamp, signature }) {
  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("GENIUSPAY_WEBHOOK_SECRET is not configured");
  if (!rawBody || !timestamp || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== signatureBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
