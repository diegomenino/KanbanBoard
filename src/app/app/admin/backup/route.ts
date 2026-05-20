import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getDatabasePath, getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/queries";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const databasePath = getDatabasePath();
  const snapshotPath = path.join(
    path.dirname(databasePath),
    `backup-snapshot-${Date.now()}.sqlite`,
  );

  await getDb().backup(snapshotPath);
  const bytes = await fs.readFile(snapshotPath);
  await fs.rm(snapshotPath, { force: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="kanban-backup-${timestamp}.sqlite"`,
    },
  });
}
