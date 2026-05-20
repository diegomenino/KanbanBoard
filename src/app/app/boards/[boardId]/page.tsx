import { notFound } from "next/navigation";
import { BoardView } from "@/components/board/board-view";
import { getDictionary, translateRole } from "@/lib/i18n";
import { getBoardDetail, getSessionUser } from "@/lib/queries";

type BoardPageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const { boardId } = await params;
  const board = getBoardDetail(Number(boardId), user.id);
  const dictionary = getDictionary(user.preferenceLanguage);

  if (!board) {
    notFound();
  }

  return (
    <BoardView
      board={board}
      canEdit={board.role !== "READ"}
      labels={{
        board: dictionary.board,
        owner: dictionary.owner,
        yourRole: dictionary.yourRole,
        dragToMoveCards: dictionary.dragToMoveCards,
        readOnlyAccess: dictionary.readOnlyAccess,
        expressLane: dictionary.expressLane,
        urgentOnly: dictionary.urgentOnly,
        dropCardHere: dictionary.dropCardHere,
        assignee: dictionary.assignee,
        unassigned: dictionary.unassigned,
        comments: dictionary.comments,
        roleText: translateRole(board.role, user.preferenceLanguage),
        newCard: dictionary.newCard,
        createCard: dictionary.createCard,
        editCard: dictionary.editCard,
        saveCard: dictionary.saveCard,
        deleteCard: dictionary.deleteCard,
        cancel: dictionary.cancel,
        cardTitle: dictionary.cardTitle,
        cardDetails: dictionary.cardDetails,
        deadline: dictionary.deadline,
        cardType: dictionary.cardType,
        commentThread: dictionary.commentThread,
        addComment: dictionary.addComment,
        addColumn: dictionary.addColumn,
        columnName: dictionary.columnName,
        editColumnName: dictionary.editColumnName,
        deleteColumn: dictionary.deleteColumn,
      }}
    />
  );
}
