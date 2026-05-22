import { updatePreferencesAction } from "@/app/actions";
import { APP_RELEASE, getVersionLabel } from "@/lib/app-version";
import { getDictionary } from "@/lib/i18n";
import { getSessionUser } from "@/lib/queries";

export default async function SettingsPage() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const dictionary = getDictionary(user.preferenceLanguage);

  return (
    <section className="settings-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{dictionary.personalPreferences}</p>
          <h1>{dictionary.settingsHeadline}</h1>
        </div>
      </div>
      <form action={updatePreferencesAction} className="form-grid" style={{ marginTop: "16px" }}>
        <input type="hidden" name="userId" value={user.id} />
        <div className="field">
          <label htmlFor="theme">{dictionary.theme}</label>
          <select id="theme" name="theme" defaultValue={user.preferenceTheme}>
            <option value="light">{dictionary.light}</option>
            <option value="dark">{dictionary.dark}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="language">{dictionary.language}</label>
          <select id="language" name="language" defaultValue={user.preferenceLanguage}>
            <option value="en">{dictionary.english}</option>
            <option value="es-AR">{dictionary.spanishArgentina}</option>
          </select>
        </div>
        <div className="action-row">
          <button className="primary-button" type="submit">
            {dictionary.savePreferences}
          </button>
        </div>
      </form>
      <section className="settings-version-card">
        <div>
          <p className="eyebrow">{dictionary.appVersion}</p>
          <strong>{getVersionLabel()}</strong>
        </div>
        <div>
          <p className="eyebrow">{dictionary.releaseChannel}</p>
          <span>{APP_RELEASE}</span>
        </div>
      </section>
    </section>
  );
}
