import crypto from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: Boolean(process.env.S3_ENDPOINT), // required by most S3-compatible providers (MinIO, Scaleway, OVH)
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function createPresignedUpload(contentType) {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw Object.assign(new Error("Type de fichier non supporté"), { status: 400 });
  }

  const extension = contentType.split("/")[1];
  const key = `products/${crypto.randomUUID()}.${extension}`;

  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 60 * 5 }
  );

  const publicUrl = `${process.env.S3_PUBLIC_BASE_URL}/${key}`;

  return { uploadUrl, publicUrl };
}
