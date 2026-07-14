import "dotenv/config";
import { createPresignedUpload } from "../src/services/storage.js";

const { uploadUrl, publicUrl } = await createPresignedUpload("image/png");

const body = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108020000009077" +
    "5344000000097048597300000ec300000ec301c76fa8640000000774494d45" +
    "07e8010101010101010101010101010000000c4944415478da6360000002" +
    "0001a5f645400000000049454e44ae426082",
  "hex"
);

const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "image/png" }, body });
if (!putRes.ok) throw new Error(`PUT failed: ${putRes.status} ${await putRes.text()}`);

const getRes = await fetch(publicUrl);
console.log(`GET ${publicUrl} -> ${getRes.status}`);
console.log(getRes.ok ? "OK: fichier accessible publiquement" : "ECHEC: fichier inaccessible");
