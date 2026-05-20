import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { getDb } from "@/lib/db";
import type {
  AppUser,
  AuthMode,
  BoardDetail,
  BoardSummary,
  CardType,
  SessionUser,
} from "@/lib/types";

const SESSION_COOKIE = "kanban_session";

function now() {
  return new Date().toISOString();
}

function setSetting(key: string, value: string) {
  const db = getDb();
  db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

function getSetting(key: string, fallback: string) {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? fallback;
}

function ensureCardTypes() {
  const db = getDb();
  const defaults = [
    ["Bug", "#8c3c18", 0],
    ["Feature", "#0c7c59", 0],
    ["Improvement", "#0f5c94", 0],
    ["Idea", "#8e4ec6", 0],
    ["Urgent", "#b94d19", 1],
  ] as const;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO card_types (name, color, is_express)
    VALUES (?, ?, ?)
  `);

  for (const item of defaults) {
    insert.run(...item);
  }
}

function ensureBoardSeed(adminId: number) {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM boards ORDER BY id LIMIT 1")
    .get() as { id: number } | undefined;

  if (existing) {
    return;
  }

  const timestamp = now();
  const board = db
    .prepare(`
      INSERT INTO boards (name, description, owner_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      "Platform Delivery",
      "Main delivery board with an express lane for operational urgency.",
      adminId,
      timestamp,
      timestamp,
    );

  const boardId = Number(board.lastInsertRowid);

  db.prepare(`
    INSERT INTO board_memberships (board_id, user_id, role)
    VALUES (?, ?, ?)
  `).run(boardId, adminId, "ADMIN");

  const insertColumn = db.prepare(`
    INSERT INTO board_columns (board_id, name, position)
    VALUES (?, ?, ?)
  `);

  const backlogId = Number(insertColumn.run(boardId, "Backlog", 1).lastInsertRowid);
  const progressId = Number(insertColumn.run(boardId, "In Progress", 2).lastInsertRowid);
  const reviewId = Number(insertColumn.run(boardId, "Review", 3).lastInsertRowid);
  const doneId = Number(insertColumn.run(boardId, "Done", 4).lastInsertRowid);

  const types = db
    .prepare("SELECT id, name FROM card_types")
    .all() as { id: number; name: string }[];
  const typeByName = Object.fromEntries(types.map((type) => [type.name, type.id]));

  const insertCard = db.prepare(`
    INSERT INTO cards (
      board_id, column_id, title, details, deadline, assignee_user_id, card_type_id,
      is_express, position, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const urgentCardId = Number(
    insertCard.run(
      boardId,
      progressId,
      "Prioritize production approval queue",
      "Review urgent access and release approvals before the next team handoff.",
      "2026-05-19",
      adminId,
      typeByName.Urgent,
      1,
      1,
      timestamp,
      timestamp,
    ).lastInsertRowid,
  );

  insertCard.run(
    boardId,
    backlogId,
    "Add LDAP configuration view",
    "Expose host, base DN, and bind account settings in the admin area.",
    "2026-05-21",
    adminId,
    typeByName.Feature,
    0,
    2,
    timestamp,
    timestamp,
  );

  insertCard.run(
    boardId,
    reviewId,
    "Refine express lane badge contrast",
    "Ensure urgent cards stay readable in both light and dark themes.",
    "2026-05-20",
    adminId,
    typeByName.Improvement,
    0,
    3,
    timestamp,
    timestamp,
  );

  insertCard.run(
    boardId,
    doneId,
    "Define production release checklist",
    "Build, lint, typecheck, test, audit, and Docker validation should be mandatory before deployment.",
    "2026-05-18",
    adminId,
    typeByName.Idea,
    0,
    4,
    timestamp,
    timestamp,
  );

  db.prepare(`
    INSERT INTO comments (card_id, author_user_id, body, created_at)
    VALUES (?, ?, ?, ?)
  `).run(
    urgentCardId,
    adminId,
    "The express lane should surface the most time-sensitive approvals first.",
    timestamp,
  );
}

export function getSystemSummary() {
  ensureCardTypes();
  return {
    hasUsers:
      Number(
        (getDb().prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number })
          .count,
      ) > 0,
    authMode: getSetting("auth.mode", "local") as AuthMode,
  };
}

export function initializeSystemAdmin(input: {
  name: string;
  email: string;
  password: string;
  authMode: AuthMode;
}) {
  const db = getDb();
  const count = (
    db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number }
  ).count;

  if (count > 0) {
    throw new Error("The workspace has already been initialized.");
  }

  const timestamp = now();
  const passwordHash = bcrypt.hashSync(input.password, 12);
  const admin = db
    .prepare(`
      INSERT INTO users (
        name, email, password_hash, role, status, theme, language, created_at, updated_at
      ) VALUES (?, ?, ?, 'ADMIN', 'ACTIVE', 'light', 'en', ?, ?)
    `)
    .run(input.name, input.email.toLowerCase(), passwordHash, timestamp, timestamp);

  const adminId = Number(admin.lastInsertRowid);

  setSetting("auth.mode", input.authMode);
  setSetting("auth.ldap.host", "");
  setSetting("auth.oidc.issuer", "");
  ensureCardTypes();
  ensureBoardSeed(adminId);

  return adminId;
}

export function signUpUser(input: { name: string; email: string; password: string }) {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(input.email.toLowerCase()) as { id: number } | undefined;

  if (existing) {
    throw new Error("That email is already registered.");
  }

  const timestamp = now();
  db.prepare(`
    INSERT INTO users (
      name, email, password_hash, role, status, theme, language, created_at, updated_at
    ) VALUES (?, ?, ?, 'MEMBER', 'PENDING', 'light', 'en', ?, ?)
  `).run(
    input.name,
    input.email.toLowerCase(),
    bcrypt.hashSync(input.password, 12),
    timestamp,
    timestamp,
  );
}

export function authenticateLocalUser(input: { email: string; password: string }) {
  const db = getDb();
  const user = db
    .prepare(`
      SELECT id, status, password_hash
      FROM users
      WHERE email = ?
    `)
    .get(input.email.toLowerCase()) as
    | {
        id: number;
        status: string;
        password_hash: string | null;
      }
    | undefined;

  if (!user || !user.password_hash) {
    throw new Error("Invalid credentials.");
  }

  if (user.status === "PENDING") {
    throw new Error("Your account is awaiting admin approval.");
  }

  if (user.status === "DISABLED") {
    throw new Error("Your account has been disabled.");
  }

  if (!bcrypt.compareSync(input.password, user.password_hash)) {
    throw new Error("Invalid credentials.");
  }

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, user.id, expiresAt, now());

  return { sessionId };
}

export async function writeSessionCookie(sessionId: string) {
  const jar = await cookies();
  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const origin = requestHeaders.get("origin");
  const isHttps = forwardedProto === "https" || origin?.startsWith("https://") === true;

  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
  }

  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    return null;
  }

  const user = getDb()
    .prepare(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.theme AS preferenceTheme,
        u.language AS preferenceLanguage
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ?
        AND s.expires_at > ?
        AND u.status = 'ACTIVE'
    `)
    .get(sessionId, now()) as SessionUser | undefined;

  return user ?? null;
}

export function getBoardsForUser(userId: number) {
  return getDb()
    .prepare(`
      SELECT b.id, b.name, owner.name AS ownerName, membership.role
      FROM board_memberships membership
      JOIN boards b ON b.id = membership.board_id
      JOIN users owner ON owner.id = b.owner_user_id
      WHERE membership.user_id = ?
      ORDER BY b.name
    `)
    .all(userId) as BoardSummary[];
}

export function createBoard(input: { userId: number; role: SessionUser["role"]; name: string }) {
  if (input.role === "READ") {
    throw new Error("You do not have permission to create boards.");
  }

  const db = getDb();
  const timestamp = now();
  const board = db
    .prepare(`
      INSERT INTO boards (name, description, owner_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      input.name,
      `${input.name} board`,
      input.userId,
      timestamp,
      timestamp,
    );

  const boardId = Number(board.lastInsertRowid);

  db.prepare(`
    INSERT INTO board_memberships (board_id, user_id, role)
    VALUES (?, ?, ?)
  `).run(boardId, input.userId, "ADMIN");

  const insertColumn = db.prepare(`
    INSERT INTO board_columns (board_id, name, position)
    VALUES (?, ?, ?)
  `);

  insertColumn.run(boardId, "Backlog", 1);
  insertColumn.run(boardId, "In Progress", 2);
  insertColumn.run(boardId, "Review", 3);
  insertColumn.run(boardId, "Done", 4);

  return boardId;
}

export function getBoardDetail(boardId: number, userId: number) {
  const db = getDb();
  const board = db
    .prepare(`
      SELECT b.id, b.name, b.owner_user_id AS ownerUserId, owner.name AS ownerName, membership.role
      FROM boards b
      JOIN users owner ON owner.id = b.owner_user_id
      JOIN board_memberships membership
        ON membership.board_id = b.id AND membership.user_id = ?
      WHERE b.id = ?
    `)
    .get(userId, boardId) as
    | {
        id: number;
        name: string;
        ownerUserId: number;
        ownerName: string;
        role: BoardDetail["role"];
      }
    | undefined;

  if (!board) {
    return null;
  }

  const columns = db
    .prepare(`
      SELECT id, name, position
      FROM board_columns
      WHERE board_id = ?
      ORDER BY position
    `)
    .all(boardId) as BoardDetail["columns"];

  const cards = db
    .prepare(`
      SELECT
        c.id,
        c.title,
        c.details,
        c.deadline,
        c.assignee_user_id AS assigneeUserId,
        c.card_type_id AS cardTypeId,
        assignee.name AS assigneeName,
        type.name AS typeName,
        type.color AS typeColor,
        c.is_express AS isExpress,
        c.column_id AS columnId,
        col.name AS columnName,
        c.position AS position,
        c.updated_at AS updatedAt
      FROM cards c
      JOIN card_types type ON type.id = c.card_type_id
      JOIN board_columns col ON col.id = c.column_id
      LEFT JOIN users assignee ON assignee.id = c.assignee_user_id
      WHERE c.board_id = ?
      ORDER BY c.is_express DESC, c.position ASC, c.updated_at DESC
    `)
    .all(boardId) as BoardDetail["cards"];

  const comments = db
    .prepare(`
      SELECT comments.id, comments.card_id AS cardId, comments.body, users.name AS authorName, comments.created_at AS createdAt
      FROM comments
      JOIN users ON users.id = comments.author_user_id
      JOIN cards ON cards.id = comments.card_id
      WHERE cards.board_id = ?
      ORDER BY comments.created_at DESC
    `)
    .all(boardId) as {
    id: number;
    cardId: number;
    body: string;
    authorName: string;
    createdAt: string;
  }[];

  const members = db
    .prepare(`
      SELECT users.id, users.name
      FROM board_memberships
      JOIN users ON users.id = board_memberships.user_id
      WHERE board_memberships.board_id = ?
        AND users.status = 'ACTIVE'
      ORDER BY users.name
    `)
    .all(boardId) as BoardDetail["members"];

  const cardTypes = db
    .prepare(`
      SELECT id, name, color, is_express AS isExpress
      FROM card_types
      ORDER BY name
    `)
    .all() as CardType[];

  const memberships = db
    .prepare(`
      SELECT
        users.id AS userId,
        users.name,
        users.email,
        board_memberships.role
      FROM board_memberships
      JOIN users ON users.id = board_memberships.user_id
      WHERE board_memberships.board_id = ?
        AND users.status = 'ACTIVE'
      ORDER BY users.name
    `)
    .all(boardId) as BoardDetail["memberships"];

  const availableUsers = db
    .prepare(`
      SELECT users.id, users.name, users.email
      FROM users
      WHERE users.status = 'ACTIVE'
        AND users.id NOT IN (
          SELECT user_id FROM board_memberships WHERE board_id = ?
        )
      ORDER BY users.name
    `)
    .all(boardId) as BoardDetail["availableUsers"];

  return {
    ...board,
    columns,
    cards: cards.map((card) => ({
      ...card,
      isExpress: Boolean(card.isExpress),
      comments: comments
        .filter((comment) => comment.cardId === card.id)
        .map((comment) => ({
          id: comment.id,
          body: comment.body,
          authorName: comment.authorName,
          createdAt: comment.createdAt,
        })),
    })),
    members,
    memberships,
    availableUsers,
    cardTypes: cardTypes.map((type) => ({
      ...type,
      isExpress: Boolean(type.isExpress),
    })),
  } satisfies BoardDetail;
}

export function getAdminDashboard() {
  const db = getDb();
  const users = db
    .prepare(`
      SELECT
        id,
        name,
        email,
        role,
        status,
        theme AS preferenceTheme,
        language AS preferenceLanguage,
        created_at AS createdAt
      FROM users
      ORDER BY
        CASE status WHEN 'PENDING' THEN 0 WHEN 'ACTIVE' THEN 1 ELSE 2 END,
        created_at DESC
    `)
    .all() as AppUser[];

  const cardTypes = db
    .prepare(`
      SELECT id, name, color, is_express AS isExpress
      FROM card_types
      ORDER BY name
    `)
    .all() as CardType[];

  return {
    users,
    cardTypes: cardTypes.map((type) => ({
      ...type,
      isExpress: Boolean(type.isExpress),
    })),
    authMode: getSetting("auth.mode", "local") as AuthMode,
    metrics: {
      totalUsers: users.length,
      pendingUsers: users.filter((user) => user.status === "PENDING").length,
      totalBoards: (
        db.prepare("SELECT COUNT(*) AS count FROM boards").get() as { count: number }
      ).count,
    },
  };
}

export function approveUser(userId: number) {
  getDb()
    .prepare(`
      UPDATE users
      SET status = 'ACTIVE', updated_at = ?
      WHERE id = ?
    `)
    .run(now(), userId);
}

export function disableUser(userId: number) {
  getDb()
    .prepare(`
      UPDATE users
      SET status = 'DISABLED', updated_at = ?
      WHERE id = ?
    `)
    .run(now(), userId);
}

export function deleteUser(userId: number) {
  getDb().prepare("DELETE FROM users WHERE id = ?").run(userId);
}

export function updateUserPreferences(input: {
  userId: number;
  theme: "light" | "dark";
  language: "en" | "es-AR";
}) {
  getDb()
    .prepare(`
      UPDATE users
      SET theme = ?, language = ?, updated_at = ?
      WHERE id = ?
    `)
    .run(input.theme, input.language, now(), input.userId);
}

export function updateAuthMode(authMode: AuthMode) {
  setSetting("auth.mode", authMode);
}

export function createCardType(input: { name: string; color: string; isExpress: boolean }) {
  getDb()
    .prepare(`
      INSERT INTO card_types (name, color, is_express)
      VALUES (?, ?, ?)
    `)
    .run(input.name, input.color, input.isExpress ? 1 : 0);
}

export function createCard(input: {
  userId: number;
  role: SessionUser["role"];
  boardId: number;
  columnId: number;
  title: string;
  cardTypeId?: number;
}) {
  if (input.role === "READ") {
    throw new Error("You do not have permission to create cards.");
  }

  const db = getDb();
  const membership = db
    .prepare(`
      SELECT role
      FROM board_memberships
      WHERE board_id = ? AND user_id = ?
    `)
    .get(input.boardId, input.userId) as { role: "ADMIN" | "MEMBER" | "READ" } | undefined;

  if (!membership || membership.role === "READ") {
    throw new Error("You do not have permission to create cards on this board.");
  }

  const selectedType = input.cardTypeId
    ? ((db
        .prepare(`
          SELECT id, is_express AS isExpress
          FROM card_types
          WHERE id = ?
        `)
        .get(input.cardTypeId) as { id: number; isExpress: number } | undefined) ?? null)
    : null;

  const fallbackType = db
    .prepare(`
      SELECT id, is_express AS isExpress
      FROM card_types
      WHERE name = 'Feature'
      LIMIT 1
    `)
    .get() as { id: number; isExpress: number } | undefined;

  const cardType = selectedType ?? fallbackType;

  if (!cardType) {
    throw new Error("Default card type is missing.");
  }

  const isExpress = cardType.isExpress ? 1 : 0;

  const nextPosition =
    (
      db
        .prepare(`
          SELECT COALESCE(MAX(position), 0) AS maxPosition
          FROM cards
          WHERE board_id = ? AND column_id = ? AND is_express = ?
        `)
        .get(input.boardId, input.columnId, isExpress) as { maxPosition: number }
    ).maxPosition + 1;

  const timestamp = now();

  db.prepare(`
    INSERT INTO cards (
      board_id,
      column_id,
      title,
      details,
      deadline,
      assignee_user_id,
      card_type_id,
      is_express,
      position,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, '', NULL, ?, ?, ?, ?, ?, ?)
  `).run(
    input.boardId,
    input.columnId,
    input.title,
    input.userId,
    cardType.id,
    isExpress,
    nextPosition,
    timestamp,
    timestamp,
  );
}

export function updateCard(input: {
  userId: number;
  role: SessionUser["role"];
  boardId: number;
  cardId: number;
  title: string;
  details: string;
  deadline: string | null;
  assigneeUserId: number | null;
  cardTypeId: number;
}) {
  if (input.role === "READ") {
    throw new Error("You do not have permission to edit cards.");
  }

  const db = getDb();
  const membership = db
    .prepare(`
      SELECT role
      FROM board_memberships
      WHERE board_id = ? AND user_id = ?
    `)
    .get(input.boardId, input.userId) as { role: "ADMIN" | "MEMBER" | "READ" } | undefined;

  if (!membership || membership.role === "READ") {
    throw new Error("You do not have permission to edit cards on this board.");
  }

  const cardType = db
    .prepare(`
      SELECT id, is_express AS isExpress
      FROM card_types
      WHERE id = ?
    `)
    .get(input.cardTypeId) as { id: number; isExpress: number } | undefined;

  if (!cardType) {
    throw new Error("Card type not found.");
  }

  db.prepare(`
    UPDATE cards
    SET title = ?, details = ?, deadline = ?, assignee_user_id = ?, card_type_id = ?, is_express = ?, updated_at = ?
    WHERE id = ? AND board_id = ?
  `).run(
    input.title,
    input.details,
    input.deadline,
    input.assigneeUserId,
    input.cardTypeId,
    cardType.isExpress ? 1 : 0,
    now(),
    input.cardId,
    input.boardId,
  );
}

export function addCardComment(input: {
  userId: number;
  boardId: number;
  cardId: number;
  body: string;
}) {
  const db = getDb();
  const membership = db
    .prepare(`
      SELECT role
      FROM board_memberships
      WHERE board_id = ? AND user_id = ?
    `)
    .get(input.boardId, input.userId) as { role: "ADMIN" | "MEMBER" | "READ" } | undefined;

  if (!membership) {
    throw new Error("You do not have access to this board.");
  }

  db.prepare(`
    INSERT INTO comments (card_id, author_user_id, body, created_at)
    VALUES (?, ?, ?, ?)
  `).run(input.cardId, input.userId, input.body, now());
}

export function deleteCard(input: {
  userId: number;
  role: SessionUser["role"];
  boardId: number;
  cardId: number;
}) {
  if (input.role === "READ") {
    throw new Error("You do not have permission to delete cards.");
  }

  const db = getDb();
  const membership = db
    .prepare(`
      SELECT role
      FROM board_memberships
      WHERE board_id = ? AND user_id = ?
    `)
    .get(input.boardId, input.userId) as { role: "ADMIN" | "MEMBER" | "READ" } | undefined;

  if (!membership || membership.role === "READ") {
    throw new Error("You do not have permission to delete cards on this board.");
  }

  db.prepare(`
    DELETE FROM cards
    WHERE id = ? AND board_id = ?
  `).run(input.cardId, input.boardId);
}

export function moveCard(input: {
  boardId: number;
  userId: number;
  cards: {
    id: number;
    columnId: number;
    position: number;
  }[];
}) {
  const board = getDb()
    .prepare(`
      SELECT membership.role
      FROM board_memberships membership
      WHERE membership.board_id = ? AND membership.user_id = ?
    `)
    .get(input.boardId, input.userId) as { role: "ADMIN" | "MEMBER" | "READ" } | undefined;

  if (!board || board.role === "READ") {
    throw new Error("You do not have permission to move cards on this board.");
  }

  const db = getDb();
  const update = db.prepare(`
    UPDATE cards
    SET column_id = ?, position = ?, updated_at = ?
    WHERE id = ? AND board_id = ?
  `);
  const timestamp = now();
  const transaction = db.transaction(
    (cards: { id: number; columnId: number; position: number }[]) => {
      for (const card of cards) {
        update.run(card.columnId, card.position, timestamp, card.id, input.boardId);
      }
    },
  );

  transaction(input.cards);
}

export function renameBoardColumn(input: {
  userId: number;
  role: SessionUser["role"];
  boardId: number;
  columnId: number;
  name: string;
}) {
  if (input.role === "READ") {
    throw new Error("You do not have permission to edit columns.");
  }

  const db = getDb();
  const membership = db
    .prepare(`
      SELECT role
      FROM board_memberships
      WHERE board_id = ? AND user_id = ?
    `)
    .get(input.boardId, input.userId) as { role: "ADMIN" | "MEMBER" | "READ" } | undefined;

  if (!membership || membership.role === "READ") {
    throw new Error("You do not have permission to edit columns on this board.");
  }

  db.prepare(`
    UPDATE board_columns
    SET name = ?
    WHERE id = ? AND board_id = ?
  `).run(input.name, input.columnId, input.boardId);
}

export function deleteBoardColumn(input: {
  userId: number;
  role: SessionUser["role"];
  boardId: number;
  columnId: number;
}) {
  if (input.role === "READ") {
    throw new Error("You do not have permission to delete columns.");
  }

  const db = getDb();
  const membership = db
    .prepare(`
      SELECT role
      FROM board_memberships
      WHERE board_id = ? AND user_id = ?
    `)
    .get(input.boardId, input.userId) as { role: "ADMIN" | "MEMBER" | "READ" } | undefined;

  if (!membership || membership.role === "READ") {
    throw new Error("You do not have permission to delete columns on this board.");
  }

  const columns = db
    .prepare(`
      SELECT id, position
      FROM board_columns
      WHERE board_id = ?
      ORDER BY position
    `)
    .all(input.boardId) as { id: number; position: number }[];

  if (columns.length <= 1) {
    throw new Error("A board must have at least one column.");
  }

  const source = columns.find((column) => column.id === input.columnId);
  if (!source) {
    throw new Error("Column not found.");
  }

  const fallback =
    columns.find((column) => column.position > source.position) ??
    columns.find((column) => column.position < source.position);

  if (!fallback) {
    throw new Error("No fallback column available.");
  }

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE cards
      SET column_id = ?, updated_at = ?
      WHERE board_id = ? AND column_id = ?
    `).run(fallback.id, now(), input.boardId, input.columnId);

    db.prepare(`
      UPDATE cards
      SET position = sorted.next_position
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY position, id) AS next_position
        FROM cards
        WHERE board_id = ? AND column_id = ? AND is_express = 0
      ) AS sorted
      WHERE cards.id = sorted.id
    `).run(input.boardId, fallback.id);

    db.prepare(`
      DELETE FROM board_columns
      WHERE id = ? AND board_id = ?
    `).run(input.columnId, input.boardId);

    db.prepare(`
      UPDATE board_columns
      SET position = position - 1
      WHERE board_id = ? AND position > ?
    `).run(input.boardId, source.position);
  });

  tx();
}

export function createBoardColumn(input: {
  userId: number;
  role: SessionUser["role"];
  boardId: number;
  name: string;
}) {
  if (input.role === "READ") {
    throw new Error("You do not have permission to create columns.");
  }

  const db = getDb();
  const membership = db
    .prepare(`
      SELECT role
      FROM board_memberships
      WHERE board_id = ? AND user_id = ?
    `)
    .get(input.boardId, input.userId) as { role: "ADMIN" | "MEMBER" | "READ" } | undefined;

  if (!membership || membership.role === "READ") {
    throw new Error("You do not have permission to create columns on this board.");
  }

  const nextPosition =
    (
      db
        .prepare(`
          SELECT COALESCE(MAX(position), 0) AS maxPosition
          FROM board_columns
          WHERE board_id = ?
        `)
        .get(input.boardId) as { maxPosition: number }
    ).maxPosition + 1;

  db.prepare(`
    INSERT INTO board_columns (board_id, name, position)
    VALUES (?, ?, ?)
  `).run(input.boardId, input.name, nextPosition);
}

export function addBoardMember(input: {
  actorUserId: number;
  actorRole: SessionUser["role"];
  boardId: number;
  userId: number;
  role: "ADMIN" | "MEMBER" | "READ";
}) {
  if (input.actorRole === "READ") {
    throw new Error("You do not have permission to manage board access.");
  }

  const db = getDb();
  const actorMembership = db
    .prepare(`
      SELECT role
      FROM board_memberships
      WHERE board_id = ? AND user_id = ?
    `)
    .get(input.boardId, input.actorUserId) as { role: "ADMIN" | "MEMBER" | "READ" } | undefined;

  if (!actorMembership || actorMembership.role !== "ADMIN") {
    throw new Error("Only board admins can manage access.");
  }

  db.prepare(`
    INSERT OR REPLACE INTO board_memberships (board_id, user_id, role)
    VALUES (?, ?, ?)
  `).run(input.boardId, input.userId, input.role);
}

export function updateBoardMemberRole(input: {
  actorUserId: number;
  actorRole: SessionUser["role"];
  boardId: number;
  userId: number;
  role: "ADMIN" | "MEMBER" | "READ";
}) {
  addBoardMember(input);
}

export function removeBoardMember(input: {
  actorUserId: number;
  actorRole: SessionUser["role"];
  boardId: number;
  userId: number;
}) {
  if (input.actorRole === "READ") {
    throw new Error("You do not have permission to manage board access.");
  }

  const db = getDb();
  const actorMembership = db
    .prepare(`
      SELECT role
      FROM board_memberships
      WHERE board_id = ? AND user_id = ?
    `)
    .get(input.boardId, input.actorUserId) as { role: "ADMIN" | "MEMBER" | "READ" } | undefined;

  if (!actorMembership || actorMembership.role !== "ADMIN") {
    throw new Error("Only board admins can manage access.");
  }

  const admins = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM board_memberships
      WHERE board_id = ? AND role = 'ADMIN'
    `)
    .get(input.boardId) as { count: number };

  const target = db
    .prepare(`
      SELECT role
      FROM board_memberships
      WHERE board_id = ? AND user_id = ?
    `)
    .get(input.boardId, input.userId) as { role: "ADMIN" | "MEMBER" | "READ" } | undefined;

  if (target?.role === "ADMIN" && admins.count <= 1) {
    throw new Error("Board must keep at least one admin.");
  }

  db.prepare(`
    DELETE FROM board_memberships
    WHERE board_id = ? AND user_id = ?
  `).run(input.boardId, input.userId);
}

export function deleteBoard(input: {
  userId: number;
  role: SessionUser["role"];
  boardId: number;
}) {
  if (input.role === "READ") {
    throw new Error("You do not have permission to delete boards.");
  }

  const db = getDb();
  const board = db
    .prepare(`
      SELECT owner_user_id AS ownerUserId
      FROM boards
      WHERE id = ?
    `)
    .get(input.boardId) as { ownerUserId: number } | undefined;

  if (!board) {
    throw new Error("Board not found.");
  }

  const membership = db
    .prepare(`
      SELECT role
      FROM board_memberships
      WHERE board_id = ? AND user_id = ?
    `)
    .get(input.boardId, input.userId) as { role: "ADMIN" | "MEMBER" | "READ" } | undefined;

  const canDelete = board.ownerUserId === input.userId || membership?.role === "ADMIN";
  if (!canDelete) {
    throw new Error("Only board owner or board admins can delete the board.");
  }

  db.prepare(`
    DELETE FROM boards
    WHERE id = ?
  `).run(input.boardId);
}
