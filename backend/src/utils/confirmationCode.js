import crypto from "node:crypto";

export function generateConfirmationCode() {
  return crypto.randomInt(100000, 1000000).toString(); // 6 digits, "482913"
}
