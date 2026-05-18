import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { getSessionUser, getSystemSummary } from "@/lib/queries";

type LoginPageProps = {
  searchParams: Promise<{ requested?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();
  const system = getSystemSummary();
  const params = await searchParams;

  if (user) {
    redirect("/app");
  }

  if (!system.hasUsers) {
    redirect("/setup");
  }

  return (
    <main className="page-shell">
      <form className="form-card form-grid" action={loginAction}>
        <div>
          <p className="eyebrow">Sign in</p>
          <h1 className="section-title">Access your boards.</h1>
        </div>
        {params.requested ? (
          <div className="table-row">
            Sign-up request submitted. An administrator must approve your account.
          </div>
        ) : null}
        {params.error ? (
          <div className="table-row">
            Login failed. Check your credentials or account status and try again.
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required />
        </div>
        <div className="action-row">
          <button className="primary-button" type="submit">
            Sign in
          </button>
          <Link className="ghost-button" href="/signup">
            Request access
          </Link>
        </div>
      </form>
    </main>
  );
}
