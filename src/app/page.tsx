import Link from "next/link";
import { getSystemSummary } from "@/lib/queries";

const highlights = [
  "Multiple boards with owner-scoped access control",
  "Urgent express lane with clear visual priority",
  "Approval-based sign-up flow and role-aware permissions",
  "Per-user theme and language preferences",
];

export default function Home() {
  const system = getSystemSummary();

  return (
    <main className="marketing-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Production-ready Kanban for serious teams</p>
          <h1>Keep urgent work visible without making the board noisy.</h1>
          <p className="hero-text">
            A polished Kanban board with owner-managed boards, approval-based
            onboarding, and a dedicated express lane for urgent cards.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href={system.hasUsers ? "/login" : "/setup"}>
              {system.hasUsers ? "Sign in" : "Initialize workspace"}
            </Link>
            <Link className="secondary-button" href="/signup">
              Request access
            </Link>
          </div>
        </div>
        <div className="hero-board-card">
          <div className="hero-board-top">
            <span className="status-pill status-pill--urgent">Express lane</span>
            <span className="muted-label">{system.authMode.toUpperCase()} auth</span>
          </div>
          <div className="express-preview">
            <div className="express-card">
              <span className="type-pill type-pill--urgent">Urgent</span>
              <strong>Review highest-priority work first</strong>
              <span className="muted-label">Owner: Operations</span>
            </div>
          </div>
          <div className="column-preview-grid">
            {["Backlog", "In Progress", "Review", "Done"].map((column) => (
              <div key={column} className="preview-column">
                <h3>{column}</h3>
                {column === "Backlog" ? (
                  <div className="preview-card">
                    <span className="type-pill">Feature</span>
                  </div>
                ) : null}
                {column === "Review" ? (
                  <div className="preview-card">
                    <span className="type-pill">Feature</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {highlights.map((highlight) => (
          <article key={highlight} className="feature-card">
            <h2>{highlight}</h2>
          </article>
        ))}
      </section>

      <section className="auth-panel">
        <div>
          <p className="eyebrow">Authentication</p>
          <h2>Local, LDAP, or OIDC selected at runtime.</h2>
        </div>
        <p className="hero-text">
          The active auth mode lives in the database so administrators can steer
          the instance without rebuilding the container.
        </p>
      </section>
    </main>
  );
}
