"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDatabasePath, resetDbConnection } from "@/lib/db";
import {
  approveUser,
  authenticateLocalUser,
  clearSessionCookie,
  createBoard,
  createCard,
  createCardType,
  deleteUser,
  disableUser,
  getSessionUser,
  initializeSystemAdmin,
  moveCard,
  signUpUser,
  renameBoardColumn,
  deleteBoardColumn,
  createBoardColumn,
  addBoardMember,
  removeBoardMember,
  updateBoardMemberRole,
  updateAuthMode,
  addCardComment,
  deleteCard,
  deleteBoard,
  updateCard,
  updateUserPreferences,
  writeSessionCookie,
} from "@/lib/queries";

const setupSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(10),
  authMode: z.enum(["local", "ldap", "oidc"]),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(10),
});

export async function initializeSystemAction(formData: FormData) {
  const payload = setupSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    authMode: formData.get("authMode"),
  });

  initializeSystemAdmin(payload);
  const session = authenticateLocalUser({
    email: payload.email,
    password: payload.password,
  });
  await writeSessionCookie(session.sessionId);
  redirect("/app");
}

export async function loginAction(formData: FormData) {
  let payload:
    | {
        email: string;
        password: string;
      }
    | undefined;

  try {
    payload = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  } catch {
    redirect("/login?error=1");
  }

  if (!payload) {
    redirect("/login?error=1");
  }

  try {
    const session = authenticateLocalUser(payload);
    await writeSessionCookie(session.sessionId);
  } catch {
    redirect("/login?error=1");
  }

  redirect("/app");
}

export async function signupAction(formData: FormData) {
  const payload = signupSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  signUpUser(payload);
  redirect("/login?requested=1");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function approveUserAction(formData: FormData) {
  approveUser(Number(formData.get("userId")));
  redirect("/app/admin");
}

export async function disableUserAction(formData: FormData) {
  disableUser(Number(formData.get("userId")));
  redirect("/app/admin");
}

export async function deleteUserAction(formData: FormData) {
  deleteUser(Number(formData.get("userId")));
  redirect("/app/admin");
}

export async function updateAuthModeAction(formData: FormData) {
  updateAuthMode(z.enum(["local", "ldap", "oidc"]).parse(formData.get("authMode")));
  redirect("/app/admin");
}

export async function createCardTypeAction(formData: FormData) {
  createCardType({
    name: z.string().min(2).parse(formData.get("name")),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).parse(formData.get("color")),
    isExpress: formData.get("isExpress") === "on",
  });
  redirect("/app/admin");
}

export async function updatePreferencesAction(formData: FormData) {
  updateUserPreferences({
    userId: Number(formData.get("userId")),
    theme: z.enum(["light", "dark"]).parse(formData.get("theme")),
    language: z.enum(["en", "es-AR"]).parse(formData.get("language")),
  });

  revalidatePath("/", "layout");
  revalidatePath("/app", "layout");
  revalidatePath("/app/settings");
  redirect("/app/settings");
}

const boardArrangementSchema = z.object({
  boardId: z.number(),
  cards: z.array(
    z.object({
      id: z.number(),
      columnId: z.number(),
      position: z.number().int().positive(),
    }),
  ),
});

const createBoardSchema = z.object({
  name: z.string().min(2).max(80),
});

const createCardSchema = z.object({
  boardId: z.coerce.number().int().positive(),
  columnId: z.coerce.number().int().positive(),
  title: z.string().min(2).max(160),
  cardTypeId: z.coerce.number().int().positive().optional(),
});

const updateCardSchema = z.object({
  boardId: z.coerce.number().int().positive(),
  cardId: z.coerce.number().int().positive(),
  title: z.string().min(2).max(160),
  details: z.string().max(4000),
  deadline: z.string().optional(),
  assigneeUserId: z.coerce.number().int().positive().nullable(),
  cardTypeId: z.coerce.number().int().positive(),
});

const addCommentSchema = z.object({
  boardId: z.coerce.number().int().positive(),
  cardId: z.coerce.number().int().positive(),
  body: z.string().min(1).max(2000),
});

const renameColumnSchema = z.object({
  boardId: z.coerce.number().int().positive(),
  columnId: z.coerce.number().int().positive(),
  name: z.string().min(1).max(80),
});

const deleteColumnSchema = z.object({
  boardId: z.coerce.number().int().positive(),
  columnId: z.coerce.number().int().positive(),
});

const createColumnSchema = z.object({
  boardId: z.coerce.number().int().positive(),
  name: z.string().min(1).max(80),
});

const boardAccessSchema = z.object({
  boardId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
  role: z.enum(["ADMIN", "MEMBER", "READ"]),
});

const removeBoardAccessSchema = z.object({
  boardId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
});

export async function updateBoardArrangementAction(input: {
  boardId: number;
  cards: { id: number; columnId: number; position: number }[];
}) {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role === "READ") {
    return;
  }

  const payload = boardArrangementSchema.parse(input);
  moveCard({
    boardId: payload.boardId,
    userId: user.id,
    cards: payload.cards,
  });
  revalidatePath(`/app/boards/${payload.boardId}`);
}

export async function createBoardAction(formData: FormData) {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const payload = createBoardSchema.parse({
    name: formData.get("name"),
  });

  const boardId = createBoard({
    userId: user.id,
    role: user.role,
    name: payload.name,
  });

  revalidatePath("/app", "layout");
  redirect(`/app/boards/${boardId}`);
}

export async function createCardAction(formData: FormData) {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role === "READ") {
    return;
  }

  const payload = createCardSchema.parse({
    boardId: formData.get("boardId"),
    columnId: formData.get("columnId"),
    title: formData.get("title"),
    cardTypeId:
      formData.get("cardTypeId") && String(formData.get("cardTypeId")).trim() !== ""
        ? formData.get("cardTypeId")
        : undefined,
  });

  createCard({
    userId: user.id,
    role: user.role,
    boardId: payload.boardId,
    columnId: payload.columnId,
    title: payload.title,
    cardTypeId: payload.cardTypeId,
  });

  revalidatePath(`/app/boards/${payload.boardId}`);
  redirect(`/app/boards/${payload.boardId}`);
}

export async function updateCardAction(formData: FormData) {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role === "READ") {
    return;
  }

  const payload = updateCardSchema.parse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    title: formData.get("title"),
    details: formData.get("details") ?? "",
    deadline: formData.get("deadline") ?? undefined,
    assigneeUserId:
      formData.get("assigneeUserId") && String(formData.get("assigneeUserId")).trim() !== ""
        ? formData.get("assigneeUserId")
        : null,
    cardTypeId: formData.get("cardTypeId"),
  });

  updateCard({
    userId: user.id,
    role: user.role,
    boardId: payload.boardId,
    cardId: payload.cardId,
    title: payload.title,
    details: payload.details,
    deadline: payload.deadline ? payload.deadline : null,
    assigneeUserId: payload.assigneeUserId,
    cardTypeId: payload.cardTypeId,
  });

  revalidatePath(`/app/boards/${payload.boardId}`);
}

export async function addCommentAction(formData: FormData) {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role === "READ") {
    return;
  }

  const payload = addCommentSchema.parse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    body: formData.get("body"),
  });

  addCardComment({
    userId: user.id,
    boardId: payload.boardId,
    cardId: payload.cardId,
    body: payload.body,
  });

  revalidatePath(`/app/boards/${payload.boardId}`);
  redirect(`/app/boards/${payload.boardId}`);
}

export async function renameColumnAction(formData: FormData) {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role === "READ") {
    return;
  }

  const payload = renameColumnSchema.parse({
    boardId: formData.get("boardId"),
    columnId: formData.get("columnId"),
    name: formData.get("name"),
  });

  renameBoardColumn({
    userId: user.id,
    role: user.role,
    boardId: payload.boardId,
    columnId: payload.columnId,
    name: payload.name,
  });

  revalidatePath(`/app/boards/${payload.boardId}`);
  redirect(`/app/boards/${payload.boardId}`);
}

export async function deleteColumnAction(formData: FormData) {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role === "READ") {
    return;
  }

  const payload = deleteColumnSchema.parse({
    boardId: formData.get("boardId"),
    columnId: formData.get("columnId"),
  });

  deleteBoardColumn({
    userId: user.id,
    role: user.role,
    boardId: payload.boardId,
    columnId: payload.columnId,
  });

  revalidatePath(`/app/boards/${payload.boardId}`);
  redirect(`/app/boards/${payload.boardId}`);
}

export async function createColumnAction(formData: FormData) {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role === "READ") {
    return;
  }

  const payload = createColumnSchema.parse({
    boardId: formData.get("boardId"),
    name: formData.get("name"),
  });

  createBoardColumn({
    userId: user.id,
    role: user.role,
    boardId: payload.boardId,
    name: payload.name,
  });

  revalidatePath(`/app/boards/${payload.boardId}`);
  redirect(`/app/boards/${payload.boardId}`);
}

export async function addBoardMemberAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const payload = boardAccessSchema.parse({
    boardId: formData.get("boardId"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  addBoardMember({
    actorUserId: user.id,
    actorRole: user.role,
    boardId: payload.boardId,
    userId: payload.userId,
    role: payload.role,
  });

  revalidatePath(`/app/boards/${payload.boardId}`);
  redirect(`/app/boards/${payload.boardId}`);
}

export async function updateBoardMemberRoleAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const payload = boardAccessSchema.parse({
    boardId: formData.get("boardId"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  updateBoardMemberRole({
    actorUserId: user.id,
    actorRole: user.role,
    boardId: payload.boardId,
    userId: payload.userId,
    role: payload.role,
  });

  revalidatePath(`/app/boards/${payload.boardId}`);
  redirect(`/app/boards/${payload.boardId}`);
}

export async function removeBoardMemberAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const payload = removeBoardAccessSchema.parse({
    boardId: formData.get("boardId"),
    userId: formData.get("userId"),
  });

  removeBoardMember({
    actorUserId: user.id,
    actorRole: user.role,
    boardId: payload.boardId,
    userId: payload.userId,
  });

  revalidatePath(`/app/boards/${payload.boardId}`);
  redirect(`/app/boards/${payload.boardId}`);
}

export async function deleteCardAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role === "READ") {
    return;
  }

  const payload = z
    .object({
      boardId: z.coerce.number().int().positive(),
      cardId: z.coerce.number().int().positive(),
    })
    .parse({
      boardId: formData.get("boardId"),
      cardId: formData.get("cardId"),
    });

  deleteCard({
    userId: user.id,
    role: user.role,
    boardId: payload.boardId,
    cardId: payload.cardId,
  });

  revalidatePath(`/app/boards/${payload.boardId}`);
  redirect(`/app/boards/${payload.boardId}`);
}

export async function deleteBoardAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const payload = z
    .object({
      boardId: z.coerce.number().int().positive(),
    })
    .parse({
      boardId: formData.get("boardId"),
    });

  deleteBoard({
    userId: user.id,
    role: user.role,
    boardId: payload.boardId,
  });

  revalidatePath("/app", "layout");
  revalidatePath("/app/board-settings");
  redirect("/app/board-settings");
}

export async function restoreBackupAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const file = formData.get("backup");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/app/admin?restore=error");
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const signature = bytes.subarray(0, 16).toString("utf8");
    if (signature !== "SQLite format 3\u0000") {
      redirect("/app/admin?restore=error");
    }

    const databasePath = getDatabasePath();
    const tempPath = path.join(path.dirname(databasePath), `restore-${Date.now()}.sqlite`);
    await fs.writeFile(tempPath, bytes);

    // Validate the uploaded file can be opened as SQLite before replacing live data.
    const { default: Database } = await import("better-sqlite3");
    const checkDb = new Database(tempPath, { readonly: true });
    checkDb.pragma("quick_check");
    checkDb.close();

    resetDbConnection();
    await fs.copyFile(tempPath, databasePath);
    await fs.rm(tempPath, { force: true });
    await fs.rm(`${databasePath}-wal`, { force: true });
    await fs.rm(`${databasePath}-shm`, { force: true });

    revalidatePath("/", "layout");
    revalidatePath("/app", "layout");
    revalidatePath("/app/admin");
    redirect("/app/admin?restore=ok");
  } catch {
    redirect("/app/admin?restore=error");
  }
}
