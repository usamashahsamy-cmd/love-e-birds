import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const R2_REGION = process.env.R2_REGION || "auto";

function parseR2Endpoint() {
  if (!R2_ENDPOINT) return null;
  try {
    const url = new URL(R2_ENDPOINT);
    const base = `${url.protocol}//${url.host}`;
    const bucketFromPath = url.pathname.split("/").filter(Boolean)[0] ?? null;
    return { base, bucketFromPath };
  } catch {
    return null;
  }
}

const parsedEndpoint = parseR2Endpoint();
const R2_BUCKET = R2_BUCKET_NAME || parsedEndpoint?.bucketFromPath;

const R2_CONFIGURED = !!(
  parsedEndpoint &&
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  R2_BUCKET
);

const s3Client = R2_CONFIGURED
  ? new S3Client({
      region: R2_REGION,
      endpoint: parsedEndpoint.base,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    })
  : null;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function getExt(mimeType: string): string {
  return EXT[mimeType] ?? "bin";
}

export async function uploadToStorage(
  buffer: Buffer,
  mimeType: string,
  key?: string
): Promise<string> {
  const ext = getExt(mimeType);
  const finalKey = key ?? `uploads/${randomUUID()}.${ext}`;

  if (!R2_CONFIGURED || !s3Client || !parsedEndpoint || !R2_BUCKET) {
    const localPath = path.join(process.cwd(), "public", finalKey);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, buffer);
    return `/${finalKey}`;
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: finalKey,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  if (R2_PUBLIC_URL) {
    const base = R2_PUBLIC_URL.replace(/\/$/, "");
    return `${base}/${finalKey}`;
  }

  return `${parsedEndpoint.base}/${R2_BUCKET}/${finalKey}`;
}
