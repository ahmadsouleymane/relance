import crypto from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Built lazily (not at module load) so a missing/invalid S3_REGION only
// breaks this feature's requests, not the whole API's startup — the AWS SDK
// throws synchronously from the S3Client constructor when region resolution
// fails, and this module is imported from index.js's top-level route wiring.
function getClient() {
  return new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT), // required by most S3-compatible providers (MinIO, Scaleway, OVH)
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
}

export async function createPresignedUpload(contentType) {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw Object.assign(new Error("Type de fichier non supporté"), { status: 400 });
  }

  const extension = contentType.split("/")[1];
  const key = `products/${crypto.randomUUID()}.${extension}`;

  const uploadUrl = await getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 60 * 5 }
  );

  const publicUrl = `${process.env.S3_PUBLIC_BASE_URL}/${key}`;

  return { uploadUrl, publicUrl };
}
