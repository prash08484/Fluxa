/**
 * Library store — MongoDB backed.
 * Saved artefacts the user keeps across projects. v1: ideas only.
 */

import { randomUUID } from "node:crypto";
import { getDb, COLLECTIONS, ensureIndexes } from "../db/mongo.js";

async function col() {
  await ensureIndexes();
  const db = await getDb();
  return db.collection(COLLECTIONS.library);
}

function strip(doc) {
  if (!doc) return null;
  // eslint-disable-next-line no-unused-vars
  const { _id, ...rest } = doc;
  return rest;
}

export async function createItem({ userId, type, sourceProjectId, payload, note }) {
  if (!userId) throw new Error("createItem: userId required.");
  const c = await col();
  const record = {
    id: randomUUID(),
    userId,
    type,
    sourceProjectId: sourceProjectId ?? null,
    payload,
    note: note ?? null,
    savedAt: new Date().toISOString(),
  };
  await c.insertOne({ ...record });
  return record;
}

export async function listItems(userId, { type } = {}) {
  const c = await col();
  const filter = type ? { userId, type } : { userId };
  const docs = await c.find(filter).sort({ savedAt: -1 }).toArray();
  return docs.map(strip);
}

export async function deleteItem(id, userId) {
  const c = await col();
  const result = await c.deleteOne({ id, userId });
  return result.deletedCount > 0;
}
