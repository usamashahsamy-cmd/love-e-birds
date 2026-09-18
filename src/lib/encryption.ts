import "server-only";

import crypto from "crypto";

export type PaymentType = "UPI" | "BANK_CARD" | "BANK_ACCOUNT" | "WALLET";

function getKey(): Buffer {
  const secret = process.env.PAYMENT_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptDetails(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptDetails(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

export function maskDetails(type: PaymentType, details: string): string {
  switch (type) {
    case "UPI": {
      const [name, ...rest] = details.split("@");
      const domain = rest.join("@");
      const visible = name.length > 3 ? name.slice(0, 3) : name;
      return `${visible}•••@${domain}`;
    }
    case "BANK_CARD": {
      const digits = details.replace(/\s+/g, "");
      const last4 = digits.slice(-4);
      return `•••• •••• •••• ${last4}`;
    }
    case "BANK_ACCOUNT": {
      const last4 = details.replace(/\s+/g, "").slice(-4);
      return `Account •••• ${last4}`;
    }
    case "WALLET": {
      return `${details.slice(0, 3)}•••`;
    }
  }
}