/**
 * Project metadata store — MongoDB backed.
 *
 * Each project is one video. Pipeline state lives in the LangGraph
 * checkpointer (Mongo too, separate collections), keyed by the same id.
 *
 * Ownership is always enforced via userId. Other users' records return null,
 * never throw — to avoid leaking existence.
 *
 * The exported surface is the same as the old in-memory store, but every
 * call is now `async`.
 */

import { randomUUID } from "node:crypto";
import { getDb, COLLECTIONS, ensureIndexes } from "../db/mongo.js";

async function col() {
  await ensureIndexes();
  const db = await getDb();
  return db.collection(COLLECTIONS.projects);
}

function strip(doc) {
  if (!doc) return null;
  // eslint-disable-next-line no-unused-vars
  const { _id, ...rest } = doc;
  return rest;
}

export async function createProject({
  userId,
  name,
  description = null,
  coverImageUrl = null,
  brief = null,
}) {
  if (!userId) throw new Error("createProject: userId required.");
  const c = await col();
  const now = new Date().toISOString();
  const record = {
    id: randomUUID(),
    userId,
    name,
    description,
    coverImageUrl,
    brief,
    status: brief ? "in_progress" : "draft",
    createdAt: now,
    updatedAt: now,
  };
  await c.insertOne({ ...record });
  return record;
}

export async function getProject(id, userId) {
  const c = await col();
  const doc = await c.findOne({ id, userId });
  return strip(doc);
}

export async function listProjects(userId) {
  const c = await col();
  const docs = await c
    .find({ userId })
    .sort({ updatedAt: -1 })
    .toArray();
  return docs.map(strip);
}

export async function updateProject(id, userId, patch) {
  const c = await col();
  const now = new Date().toISOString();
  // Drop any fields the caller shouldn't be able to change.
  // eslint-disable-next-line no-unused-vars
  const { id: _i, userId: _u, createdAt: _c, ...safe } = patch ?? {};
  const result = await c.findOneAndUpdate(
    { id, userId },
    { $set: { ...safe, updatedAt: now } },
    { returnDocument: "after" },
  );
  return strip(result);
}

export async function deleteProject(id, userId) {
  const c = await col();
  const result = await c.deleteOne({ id, userId });
  return result.deletedCount > 0;
}
