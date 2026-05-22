"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBoardAction, logoutAction } from "@/app/actions";
import type { BoardSummary, SessionUser } from "@/lib/types";
import { AppLogo } from "@/components/shell/app-logo";

type SidebarLabels = {
  appName: string;
  overview: string;
  adminSettings: string;
  userSettings: string;
  boardSettings: string;
  boards: string;
  newBoard: string;
  createBoard: string;
  boardName: string;
  logOut: string;
};

type AppSidebarProps = {
  boards: BoardSummary[];
  user: SessionUser;
  labels: SidebarLabels;
};

export function AppSidebar({ boards, user, labels }: AppSidebarProps) {
  const pathname = usePathname() ?? "/app";
  const roleLabel =
    user.role === "ADMIN" ? "Admin" : user.role === "MEMBER" ? "Member" : "Read";
  const boardPathPrefix = "/app/boards/";

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isBoardSettingsActive =
    pathname === "/app/board-settings" || /^\/app\/boards\/\d+\/settings$/.test(pathname);

  return (
    <div className="app-sidebar-shell">
      <div className="sidebar-surface">
        <div className="sidebar-brand">
          <div className="sidebar-brand-top">
            <AppLogo className="sidebar-brand-mark" />
            <div>
              <p className="sidebar-app-name">{labels.appName}</p>
              <p className="sidebar-brand-caption">
                {boards.length} {boards.length === 1 ? "board" : "boards"}
              </p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <p className="sidebar-section-label">Workspace</p>
            <Link
              className={pathname === "/app" ? "sidebar-link sidebar-link--active" : "sidebar-link"}
              href="/app"
            >
              <span className="sidebar-link__icon">◫</span>
              {labels.overview}
            </Link>
            <Link
              className={
                isBoardSettingsActive ? "sidebar-link sidebar-link--active" : "sidebar-link"
              }
              href="/app/board-settings"
            >
              <span className="sidebar-link__icon">▣</span>
              {labels.boardSettings}
            </Link>
            <Link
              className={isActive("/app/settings") ? "sidebar-link sidebar-link--active" : "sidebar-link"}
              href="/app/settings"
            >
              <span className="sidebar-link__icon">◌</span>
              {labels.userSettings}
            </Link>
            {user.role === "ADMIN" ? (
              <Link
                className={isActive("/app/admin") ? "sidebar-link sidebar-link--active" : "sidebar-link"}
                href="/app/admin"
              >
                <span className="sidebar-link__icon">⚙</span>
                {labels.adminSettings}
              </Link>
            ) : null}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-head">
              <p className="sidebar-section-label">{labels.boards}</p>
              {user.role !== "READ" ? (
                <details className="sidebar-create">
                  <summary className="sidebar-plus" aria-label={labels.newBoard}>
                    +
                  </summary>
                  <form action={createBoardAction} className="sidebar-create-form">
                    <label className="sidebar-create-label" htmlFor="board-name">
                      {labels.boardName}
                    </label>
                    <input id="board-name" name="name" required />
                    <button className="primary-button" type="submit">
                      {labels.createBoard}
                    </button>
                  </form>
                </details>
              ) : null}
            </div>
            <div className="sidebar-board-list">
              {boards.map((board, index) => (
                <Link
                  key={board.id}
                  className={
                    pathname === `/app/boards/${board.id}` ||
                    pathname.startsWith(`${boardPathPrefix}${board.id}/`)
                      ? "sidebar-link sidebar-link--board sidebar-link--active"
                      : "sidebar-link sidebar-link--board"
                  }
                  href={`/app/boards/${board.id}`}
                >
                  <span className={`sidebar-board-dot sidebar-board-dot--${(index % 5) + 1}`} />
                  <span className="sidebar-link__label">{board.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-help-card">
            <span className="sidebar-help-card__icon">{user.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{user.name}</strong>
              <p>{user.email} · {roleLabel}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button className="sidebar-link sidebar-link--logout" type="submit">
              <span className="sidebar-link__icon">⇠</span>
              {labels.logOut}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
