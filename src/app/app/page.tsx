import Link from "next/link";
import { getDictionary, translateRole } from "@/lib/i18n";
import { getAdminDashboard, getBoardsForUser, getSessionUser } from "@/lib/queries";

export default async function AppHomePage() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const boards = getBoardsForUser(user.id);
  const admin = user.role === "ADMIN" ? getAdminDashboard() : null;
  const dictionary = getDictionary(user.preferenceLanguage);

  return (
    <>
      <section className="overview-hero">
        <div className="overview-hero__copy">
          <p className="eyebrow">{dictionary.workspaceOverview}</p>
          <h1>{dictionary.keepNextActionObvious}</h1>
          <p className="hero-text">{dictionary.baselineSummary}</p>
        </div>
        <div className="overview-hero__stats">
          <article className="metric-card">
            <p className="eyebrow">{dictionary.boards}</p>
            <strong>{boards.length}</strong>
            <span>{dictionary.workspaceVisibility}</span>
          </article>
          <article className="metric-card">
            <p className="eyebrow">{dictionary.role}</p>
            <strong>{translateRole(user.role, user.preferenceLanguage)}</strong>
            <span>{dictionary.accountEmail}: {user.email}</span>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{dictionary.yourBoards}</h2>
        </div>
        <div className="board-summary-grid" style={{ marginTop: "16px" }}>
          {boards.map((board) => (
            <Link key={board.id} className="board-summary-card" href={`/app/boards/${board.id}`}>
              <div className="board-summary-card__top">
                <strong>{board.name}</strong>
                <span className="status-pill">{translateRole(board.role, user.preferenceLanguage)}</span>
              </div>
              <span>
                {dictionary.owner}: {board.ownerName}
              </span>
              <span>
                {dictionary.roleOnBoard}: {translateRole(board.role, user.preferenceLanguage)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {admin ? (
        <section className="panel">
          <div className="panel-header">
            <h2>{dictionary.adminMetrics}</h2>
            <Link className="ghost-button" href="/app/admin">
              {dictionary.openAdminArea}
            </Link>
          </div>
          <div className="metrics-grid" style={{ marginTop: "16px" }}>
            <article className="metric-card">
              <p className="eyebrow">{dictionary.users}</p>
              <strong>{admin.metrics.totalUsers}</strong>
            </article>
            <article className="metric-card">
              <p className="eyebrow">{dictionary.pendingApprovals}</p>
              <strong>{admin.metrics.pendingUsers}</strong>
            </article>
            <article className="metric-card">
              <p className="eyebrow">{dictionary.boards}</p>
              <strong>{admin.metrics.totalBoards}</strong>
            </article>
          </div>
        </section>
      ) : null}
    </>
  );
}
