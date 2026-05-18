import {
  approveUserAction,
  createCardTypeAction,
  deleteUserAction,
  disableUserAction,
  updateAuthModeAction,
} from "@/app/actions";
import { getDictionary, translateRole, translateStatus } from "@/lib/i18n";
import { getAdminDashboard, getSessionUser } from "@/lib/queries";

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  const dashboard = getAdminDashboard();
  const dictionary = getDictionary(user.preferenceLanguage);

  return (
    <>
      <section className="admin-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{dictionary.administration}</p>
            <h1>{dictionary.adminHeadline}</h1>
          </div>
        </div>
        <div className="metrics-grid" style={{ marginTop: "16px" }}>
          <article className="metric-card">
            <p className="eyebrow">{dictionary.totalUsers}</p>
            <strong>{dashboard.metrics.totalUsers}</strong>
          </article>
          <article className="metric-card">
            <p className="eyebrow">{dictionary.pending}</p>
            <strong>{dashboard.metrics.pendingUsers}</strong>
          </article>
          <article className="metric-card">
            <p className="eyebrow">{dictionary.boards}</p>
            <strong>{dashboard.metrics.totalBoards}</strong>
          </article>
        </div>
      </section>

      <section className="admin-card">
        <div className="panel-header">
          <h2>{dictionary.authenticationMode}</h2>
        </div>
        <form action={updateAuthModeAction} className="form-grid" style={{ marginTop: "16px" }}>
          <div className="field">
            <label htmlFor="authMode">{dictionary.activeMode}</label>
            <select id="authMode" name="authMode" defaultValue={dashboard.authMode}>
              <option value="local">Local email + password</option>
              <option value="ldap">LDAP</option>
              <option value="oidc">OIDC (Entra ID)</option>
            </select>
          </div>
          <div className="action-row">
            <button className="primary-button" type="submit">
              {dictionary.saveAuthMode}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="panel-header">
          <h2>{dictionary.userApprovals}</h2>
        </div>
        <div className="user-table" style={{ marginTop: "16px" }}>
          {dashboard.users.map((account) => (
            <article key={account.id} className="table-row">
              <div>
                <strong>{account.name}</strong>
                <p>{account.email}</p>
              </div>
              <div className="card-detail-grid">
                <span>
                  {dictionary.role}: {translateRole(account.role, user.preferenceLanguage)}
                </span>
                <span>
                  {dictionary.status}: {translateStatus(account.status, user.preferenceLanguage)}
                </span>
                <span>
                  {dictionary.language}: {account.preferenceLanguage}
                </span>
              </div>
              <div className="inline-actions">
                {account.status === "PENDING" ? (
                  <form action={approveUserAction}>
                    <input type="hidden" name="userId" value={account.id} />
                    <button className="primary-button" type="submit">
                      {dictionary.approve}
                    </button>
                  </form>
                ) : null}
                {account.status === "ACTIVE" ? (
                  <form action={disableUserAction}>
                    <input type="hidden" name="userId" value={account.id} />
                    <button className="secondary-button" type="submit">
                      {dictionary.disable}
                    </button>
                  </form>
                ) : null}
                <form action={deleteUserAction}>
                  <input type="hidden" name="userId" value={account.id} />
                  <button className="ghost-button" type="submit">
                    {dictionary.delete}
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <div className="panel-header">
          <h2>{dictionary.cardTypes}</h2>
        </div>
        <div className="types-grid" style={{ marginTop: "16px" }}>
          {dashboard.cardTypes.map((type) => (
            <article key={type.id} className="table-row">
              <strong>{type.name}</strong>
              <div className="card-detail-grid">
                <span>
                  {dictionary.color}: {type.color}
                </span>
                <span>{type.isExpress ? dictionary.expressEnabled : dictionary.standard}</span>
              </div>
            </article>
          ))}
        </div>
        <form action={createCardTypeAction} className="form-grid" style={{ marginTop: "18px" }}>
          <div className="field">
            <label htmlFor="name">{dictionary.typeName}</label>
            <input id="name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="color">{dictionary.color}</label>
            <input id="color" name="color" defaultValue="#1b6dd1" required />
          </div>
          <label className="inline-actions">
            <input name="isExpress" type="checkbox" />
            {dictionary.markExpressCapable}
          </label>
          <div className="action-row">
            <button className="primary-button" type="submit">
              {dictionary.addCardType}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
