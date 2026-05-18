import Link from "next/link";
import { signupAction } from "@/app/actions";

export default function SignupPage() {
  return (
    <main className="page-shell">
      <form className="form-card form-grid" action={signupAction}>
        <div>
          <p className="eyebrow">Request access</p>
          <h1 className="section-title">Create a sign-in request.</h1>
          <p className="hero-text">
            New accounts start pending. An admin must approve them before login is
            enabled.
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
        <div className="action-row">
          <button className="primary-button" type="submit">
            Submit request
          </button>
          <Link className="ghost-button" href="/login">
            Back to login
          </Link>
        </div>
      </form>
    </main>
  );
}
