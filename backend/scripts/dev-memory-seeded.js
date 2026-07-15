// Same as dev-memory.js (ephemeral in-memory MongoDB, wiped on exit) but also
// seeds a fully-unlocked test account with fake data before the API starts,
// so the frontend has something to click through immediately.
import "dotenv/config";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.JWT_SECRET ||= "dev-only-secret-not-for-production";

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri("whatsapp-crm-ci");

console.log(`[dev-memory-seeded] in-memory MongoDB ready -> ${process.env.MONGODB_URI}`);

mongoose.set("strictQuery", true);
await mongoose.connect(process.env.MONGODB_URI);

const { seedTestAccount } = await import("./seedTestAccount.js");
const result = await seedTestAccount();
console.log(`[dev-memory-seeded] test account ready -> email=${result.email} password=${result.password}`);
console.log(`[dev-memory-seeded] seeded ${result.contacts} contacts, ${result.messages} messages, ${result.products} products`);

await mongoose.disconnect();

await import("../src/index.js");

process.on("SIGINT", async () => {
  await mongod.stop();
  process.exit(0);
});
