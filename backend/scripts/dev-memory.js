// Local-only convenience: runs the API against an in-memory MongoDB instead
// of a real one, so the app can be clicked through without installing/
// running MongoDB. Never use this for anything beyond local UI preview —
// all data is wiped on process exit.
import "dotenv/config";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.JWT_SECRET ||= "dev-only-secret-not-for-production";

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri("whatsapp-crm-ci");

console.log(`[dev-memory] in-memory MongoDB ready -> ${process.env.MONGODB_URI}`);

await import("../src/index.js");

process.on("SIGINT", async () => {
  await mongod.stop();
  process.exit(0);
});
