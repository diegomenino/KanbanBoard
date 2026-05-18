"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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
  try {
    const payload = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const session = authenticateLocalUser(payload);
    await writeSessionCookie(session.sessionId);
    redirect("/app");
  } catch {
    redirect("/login?error=1");
  }
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
