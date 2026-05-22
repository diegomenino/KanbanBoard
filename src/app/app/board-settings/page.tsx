import {
  addBoardMemberAction,
  deleteBoardAction,
  removeBoardMemberAction,
  updateBoardMemberRoleAction,
} from "@/app/actions";
import { getDictionary } from "@/lib/i18n";
import { getBoardDetail, getBoardsForUser, getSessionUser } from "@/lib/queries";

type BoardSettingsPageProps = {
  searchParams: Promise<{ boardId?: string }>;
};

export default async function BoardSettingsPage({ searchParams }: BoardSettingsPageProps) {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  const boards = getBoardsForUser(user.id);
  const params = await searchParams;
  const requestedBoardId = Number(params.boardId);
  const selectedBoardId =
    Number.isFinite(requestedBoardId) && boards.some((board) => board.id === requestedBoardId)
      ? requestedBoardId
      : boards[0]?.id;

  const board = selectedBoardId ? getBoardDetail(selectedBoardId, user.id) : null;
  const dictionary = getDictionary(user.preferenceLanguage);

  return (
    <section className="panel">
      <div className="panel-header">
        <strong>{dictionary.boardAccess}</strong>
      </div>

      <form action="/app/board-settings" className="form-grid" style={{ marginTop: "12px" }}>
        <div className="field">
          <label htmlFor="selected-board">{dictionary.board}</label>
          <select
            id="selected-board"
            name="boardId"
            defaultValue={selectedBoardId ? String(selectedBoardId) : ""}
          >
            {boards.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="action-row">
          <button className="secondary-button" type="submit">
            {dictionary.boardSettings}
          </button>
        </div>
      </form>

      {!board ? (
        <p style={{ marginTop: "12px" }}>No boards available.</p>
      ) : board.role !== "ADMIN" && board.ownerUserId !== user.id ? (
        <p style={{ marginTop: "12px" }}>You need board admin access to change these settings.</p>
      ) : (
        <div className="board-access-stack" style={{ marginTop: "12px" }}>
          <section className="board-access-card">
            <div className="board-access-card__header">
              <strong>{dictionary.addPerson}</strong>
            </div>
            <form action={addBoardMemberAction} className="board-access-form">
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
              <button className="primary-button" type="submit">
                {dictionary.grantAccess}
              </button>
            </form>
          </section>

          <section className="board-access-card">
            <div className="board-access-card__header">
              <strong>{dictionary.boardMembers}</strong>
            </div>
            <div className="board-member-list">
              {board.memberships.map((membership) => (
                <article key={membership.userId} className="board-member-row">
                  <div className="board-member-row__identity">
                    <strong>{membership.name}</strong>
                    <p>{membership.email}</p>
                  </div>
                  <div className="board-member-row__actions">
                    <form action={updateBoardMemberRoleAction} className="board-member-role-form">
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
                  </div>
                </article>
              ))}
            </div>
          </section>
          <form action={deleteBoardAction}>
            <input type="hidden" name="boardId" value={board.id} />
            <button className="ghost-button" type="submit">
              {dictionary.deleteBoard}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
