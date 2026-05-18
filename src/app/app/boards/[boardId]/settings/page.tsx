import {
  addBoardMemberAction,
  removeBoardMemberAction,
  updateBoardMemberRoleAction,
} from "@/app/actions";
import { getDictionary } from "@/lib/i18n";
import { getBoardDetail, getSessionUser } from "@/lib/queries";

type BoardSettingsPageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardSettingsPage({ params }: BoardSettingsPageProps) {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  const { boardId } = await params;
  const board = getBoardDetail(Number(boardId), user.id);
  if (!board || board.role !== "ADMIN") {
    return null;
  }

  const dictionary = getDictionary(user.preferenceLanguage);

  return (
    <section className="panel">
      <div className="panel-header">
        <strong>{dictionary.boardAccess}</strong>
      </div>
      <form action={addBoardMemberAction} className="form-grid" style={{ marginTop: "12px" }}>
        <input type="hidden" name="boardId" value={board.id} />
        <div className="field">
          <label htmlFor="board-access-user">{dictionary.user}</label>
          <select id="board-access-user" name="userId" required>
            <option value="">{dictionary.addUserToBoard}</option>
            {board.availableUsers.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} ({candidate.email})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="board-access-role">{dictionary.accessRole}</label>
          <select id="board-access-role" name="role" defaultValue="MEMBER">
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
            <option value="READ">Read</option>
          </select>
        </div>
        <div className="action-row">
          <button className="primary-button" type="submit">
            {dictionary.grantAccess}
          </button>
        </div>
      </form>
      <div className="form-grid" style={{ marginTop: "12px" }}>
        {board.memberships.map((membership) => (
          <article key={membership.userId} className="table-row">
            <strong>{membership.name}</strong>
            <p>{membership.email}</p>
            <form action={updateBoardMemberRoleAction} className="inline-actions">
              <input type="hidden" name="boardId" value={board.id} />
              <input type="hidden" name="userId" value={membership.userId} />
              <select name="role" defaultValue={membership.role}>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
                <option value="READ">Read</option>
              </select>
              <button className="secondary-button" type="submit">
                {dictionary.updateAccess}
              </button>
            </form>
            <form action={removeBoardMemberAction}>
              <input type="hidden" name="boardId" value={board.id} />
              <input type="hidden" name="userId" value={membership.userId} />
              <button className="ghost-button" type="submit">
                {dictionary.removeAccess}
              </button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
