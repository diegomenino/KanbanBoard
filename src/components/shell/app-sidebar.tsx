import Link from "next/link";
import { createBoardAction, logoutAction } from "@/app/actions";
import type { BoardSummary, SessionUser } from "@/lib/types";

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
  pathname: string;
  user: SessionUser;
  labels: SidebarLabels;
};

export function AppSidebar({ boards, pathname, user, labels }: AppSidebarProps) {
  const roleLabel =
    user.role === "ADMIN" ? "Admin" : user.role === "MEMBER" ? "Member" : "Read";

  return (
    <aside className="app-sidebar">
      <div className="sidebar-surface">
        <div className="sidebar-brand">
          <p className="sidebar-app-name">{labels.appName}</p>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <p className="sidebar-section-label">Workspace</p>
            <Link
              className={pathname === "/app" ? "sidebar-link sidebar-link--active" : "sidebar-link"}
              href="/app"
            >
              <span className="sidebar-link__icon">⌂</span>
              {labels.overview}
            </Link>
            {user.role === "ADMIN" ? (
              <Link
                className={
                  pathname.startsWith("/app/admin")
                    ? "sidebar-link sidebar-link--active"
                    : "sidebar-link"
                }
                href="/app/admin"
              >
                <span className="sidebar-link__icon">⚙</span>
                {labels.adminSettings}
              </Link>
            ) : null}
            <Link
              className={
                pathname.startsWith("/app/settings")
                  ? "sidebar-link sidebar-link--active"
                  : "sidebar-link"
                }
                href="/app/settings"
              >
              <span className="sidebar-link__icon">◌</span>
              {labels.userSettings}
            </Link>
            <Link
              className={
                pathname.startsWith("/app/board-settings")
                  ? "sidebar-link sidebar-link--active"
                  : "sidebar-link"
              }
              href="/app/board-settings"
            >
              <span className="sidebar-link__icon">⚙</span>
              {labels.boardSettings}
            </Link>
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
                    pathname === `/app/boards/${board.id}`
                      ? "sidebar-link sidebar-link--board sidebar-link--active"
                      : "sidebar-link"
                  }
                  href={`/app/boards/${board.id}`}
                >
                  <span className={`sidebar-board-dot sidebar-board-dot--${(index % 5) + 1}`} />
                  {board.name}
                </Link>
              ))}
            </div>
          </div>

        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-help-card">
            <span className="sidebar-help-card__icon">⌘</span>
            <div>
              <strong>Workspace</strong>
              <p>{user.email} - {roleLabel}</p>
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
    </aside>
  );
}
