import assert from "node:assert/strict";
import { getDb } from "../src/lib/db.ts";

const db = getDb();
const tables = db
  .prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
  `)
  .all() as { name: string }[];

const tableNames = new Set(tables.map((table) => table.name));

assert.equal(tableNames.has("users"), true);
assert.equal(tableNames.has("boards"), true);
assert.equal(tableNames.has("cards"), true);

console.log("SQLite bootstrap check passed.");
