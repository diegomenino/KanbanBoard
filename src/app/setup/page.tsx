import { redirect } from "next/navigation";
import { initializeSystemAction } from "@/app/actions";
import { getSystemSummary } from "@/lib/queries";

export default function SetupPage() {
  const system = getSystemSummary();

  if (system.hasUsers) {
    redirect("/login");
  }

  return (
    <main className="page-shell">
      <form className="form-card form-grid" action={initializeSystemAction}>
        <div>
          <p className="eyebrow">First run setup</p>
          <h1 className="section-title">Create the first administrator.</h1>
          <p className="hero-text">
            This initializes the workspace, seeds the first board, and stores the
            active authentication mode in SQLite.
          </p>
        </div>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={10} required />
        </div>
        <div className="field">
          <label htmlFor="authMode">Authentication mode</label>
          <select id="authMode" name="authMode" defaultValue="local">
            <option value="local">Local email + password</option>
            <option value="ldap">LDAP</option>
            <option value="oidc">OIDC (Entra ID)</option>
          </select>
        </div>
        <div className="action-row">
          <button className="primary-button" type="submit">
            Initialize workspace
          </button>
        </div>
      </form>
    </main>
  );
}
