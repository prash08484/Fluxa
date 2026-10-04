/**
 * MongoDB connection singleton.
 *
 * In dev, Next.js hot-reloads server modules constantly — without caching on
 * `globalThis`, we'd open a fresh MongoClient on every save and exhaust the
 * pool. In prod we just keep one client for the process lifetime.
 *
 * Default URI: mongodb://localhost:27017
 * Default db:  fluxagent
 * Override:    MONGODB_URI / MONGODB_DB env vars
 */

import { MongoClient } from "mongodb";

// Accept either MONGO_URI or MONGODB_URI (same for DB name). User-chosen
// naming varies — supporting both saves a debugging trip.
const URI =
  process.env.MONGO_URI ??
  process.env.MONGODB_URI ??
  "mongodb://localhost:27017";
const DB_NAME =
  process.env.MONGO_DB ?? process.env.MONGODB_DB ?? "fluxagent";

/** Globally-cached promise so hot reloads reuse the same client. */
function getClientPromise() {
  if (!globalThis.__fluxagent_mongo_client_promise__) {
    const client = new MongoClient(URI, {
      serverSelectionTimeoutMS: 5000,
    });
    globalThis.__fluxagent_mongo_client_promise__ = client.connect().catch((err) => {
      // Reset so the next call retries instead of being stuck with a failed promise.
      globalThis.__fluxagent_mongo_client_promise__ = null;
      throw new Error(
        `Could not connect to MongoDB at ${URI}. Is it running?\n` +
          `Start it with:  mongod --dbpath ~/data/db   (or your data dir)\n` +
          `Original error: ${err?.message ?? err}`,
      );
    });
  }
  return globalThis.__fluxagent_mongo_client_promise__;
}

export async function getClient() {
  return getClientPromise();
}

export async function getDb() {
  const client = await getClient();
  return client.db(DB_NAME);
}

/** Collections — one place that names them so we can grep. */
export const COLLECTIONS = {
  projects: "projects",
  library: "library_items",
};

/**
 * Idempotent index creation. Run once per process — cache prevents re-issuing.
 * Doesn't throw on dup-key racy creation.
 */
let indexesEnsured = null;
export async function ensureIndexes() {
  if (indexesEnsured) return indexesEnsured;
  indexesEnsured = (async () => {
    const db = await getDb();
    await Promise.all([
      db.collection(COLLECTIONS.projects).createIndexes([
        { key: { userId: 1, updatedAt: -1 }, name: "byUserUpdated" },
        { key: { id: 1 }, name: "byId", unique: true },
      ]),
      db.collection(COLLECTIONS.library).createIndexes([
        { key: { userId: 1, savedAt: -1 }, name: "byUserSaved" },
        { key: { id: 1 }, name: "byId", unique: true },
      ]),
    ]);
  })();
  return indexesEnsured;
}
