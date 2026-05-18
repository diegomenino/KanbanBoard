"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState, useTransition } from "react";
import {
  addCommentAction,
  createColumnAction,
  createCardAction,
  deleteColumnAction,
  renameColumnAction,
  updateBoardArrangementAction,
  updateCardAction,
} from "@/app/actions";
import type { BoardCard, BoardDetail } from "@/lib/types";

type BoardViewProps = {
  board: BoardDetail;
  canEdit: boolean;
  labels: {
    board: string;
    owner: string;
    yourRole: string;
    dragToMoveCards: string;
    readOnlyAccess: string;
    expressLane: string;
    urgentOnly: string;
    dropCardHere: string;
    assignee: string;
    unassigned: string;
    comments: string;
    roleText: string;
    newCard: string;
    createCard: string;
    editCard: string;
    saveCard: string;
    cancel: string;
    cardTitle: string;
    cardDetails: string;
    deadline: string;
    cardType: string;
    commentThread: string;
    addComment: string;
    addColumn: string;
    columnName: string;
    editColumnName: string;
    deleteColumn: string;
  };
};

type ColumnCards = Record<number, BoardCard[]>;
type CardEditorState = {
  cardId: number;
  title: string;
  details: string;
  deadline: string;
  assigneeUserId: string;
  cardTypeId: string;
};

function buildInitialColumns(board: BoardDetail) {
  const result: ColumnCards = {};
  for (const column of board.columns) {
    result[column.id] = board.cards
      .filter((card) => !card.isExpress && card.columnId === column.id)
      .sort((left, right) => left.position - right.position);
  }
  return result;
}

function buildArrangement(columns: ColumnCards) {
  return Object.values(columns).flatMap((cards) =>
    cards.map((card, index) => ({
      id: card.id,
      columnId: card.columnId,
      position: index + 1,
    })),
  );
}

function findCardColumn(columns: ColumnCards, cardId: number) {
  for (const [columnId, cards] of Object.entries(columns)) {
    if (cards.some((card) => card.id === cardId)) {
      return Number(columnId);
    }
  }
  return null;
}

function getOverColumnId(overId: string, columns: ColumnCards) {
  if (overId.startsWith("column-")) {
    return Number(overId.replace("column-", ""));
  }
  return findCardColumn(columns, Number(overId));
}

function getOverIndex(overId: string, targetCards: BoardCard[]) {
  if (overId.startsWith("column-")) {
    return targetCards.length;
  }
  const index = targetCards.findIndex((card) => String(card.id) === overId);
  return index === -1 ? targetCards.length : index;
}

function SortableCard({
  card,
  labels,
  canEdit,
  onOpen,
}: {
  card: BoardCard;
  labels: BoardViewProps["labels"];
  canEdit: boolean;
  onOpen: (card: BoardCard) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(card.id) });

  return (
    <article
      ref={setNodeRef}
      className="board-card"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      onDoubleClick={() => {
        if (canEdit) {
          onOpen(card);
        }
      }}
      {...attributes}
      {...listeners}
    >
      <div className="board-card__topline">
        <span className="board-card__circle">◌</span>
        <span className="board-card__type">{card.typeName}</span>
      </div>
      <strong className="board-card__title">{card.title}</strong>
      <p className="board-card__details">{card.details}</p>
      <div className="board-card__chips">
        <span className="board-chip">{card.position}</span>
        {card.deadline ? <span className="board-chip">{card.deadline}</span> : null}
        {card.isExpress ? <span className="board-chip board-chip--urgent">{labels.urgentOnly}</span> : null}
      </div>
      <div className="board-card__footer">
        <span className="board-card__owner">
          ◌ {card.assigneeName ?? labels.unassigned}
        </span>
        <span className="board-card__meta">
          {card.comments.length} {labels.comments}
        </span>
      </div>
    </article>
  );
}

function ColumnDropZone({
  boardId,
  columnId,
  title,
  cards,
  labels,
  canEdit,
  onOpenCard,
}: {
  boardId: number;
  columnId: number;
  title: string;
  cards: BoardCard[];
  labels: BoardViewProps["labels"];
  canEdit: boolean;
  onOpenCard: (card: BoardCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${columnId}` });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <section className="column-card">
      <div className="panel-header panel-header--column">
        <div className="inline-actions">
          <h3 className="column-card__title">{title}</h3>
          <span className="column-card__count">{cards.length}</span>
        </div>
        <div className="inline-actions">
          {canEdit ? (
            <details className="column-create" open={isCreateOpen}>
              <summary
                className="column-plus"
                aria-label={labels.newCard}
                onClick={(event) => {
                  event.preventDefault();
                  setIsCreateOpen((current) => !current);
                }}
              >
                +
              </summary>
              <form action={createCardAction} className="column-create-form">
                <input type="hidden" name="boardId" value={boardId} />
                <input type="hidden" name="columnId" value={columnId} />
                <label className="column-create-label" htmlFor={`card-title-${columnId}`}>
                  {labels.cardTitle}
                </label>
                <input id={`card-title-${columnId}`} name="title" required />
                <div className="action-row">
                  <button className="primary-button" type="submit">
                    {labels.createCard}
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    {labels.cancel}
                  </button>
                </div>
              </form>
            </details>
          ) : null}
          {canEdit ? (
            <details className="column-menu-details">
              <summary className="column-menu" aria-label="Column menu">
                ...
              </summary>
              <div className="column-menu-popover">
                <form action={renameColumnAction} className="column-menu-form">
                  <input type="hidden" name="boardId" value={boardId} />
                  <input type="hidden" name="columnId" value={columnId} />
                  <input name="name" defaultValue={title} required />
                  <button type="submit">{labels.editColumnName}</button>
                </form>
                <form action={deleteColumnAction}>
                  <input type="hidden" name="boardId" value={boardId} />
                  <input type="hidden" name="columnId" value={columnId} />
                  <button type="submit" className="column-menu-delete">
                    {labels.deleteColumn}
                  </button>
                </form>
              </div>
            </details>
          ) : null}
        </div>
      </div>
      <SortableContext items={cards.map((card) => String(card.id))} strategy={rectSortingStrategy}>
        <div
          ref={setNodeRef}
          className="form-grid board-column-dropzone"
          style={{
            marginTop: "14px",
            outline: isOver ? "2px solid rgba(12, 124, 89, 0.28)" : "none",
            outlineOffset: "6px",
          }}
        >
          {cards.length === 0 ? (
            <div className="empty-state">{labels.dropCardHere}</div>
          ) : (
            cards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                labels={labels}
                canEdit={canEdit}
                onOpen={onOpenCard}
              />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}

export function BoardView({ board, canEdit, labels }: BoardViewProps) {
  const [columnCards, setColumnCards] = useState<ColumnCards>(() => buildInitialColumns(board));
  const [expressCards, setExpressCards] = useState<BoardCard[]>(
    () =>
      board.cards
        .filter((card) => card.isExpress)
        .sort((left, right) => left.position - right.position),
  );
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [editor, setEditor] = useState<CardEditorState | null>(null);
  const [isExpressCreateOpen, setIsExpressCreateOpen] = useState(false);
  const [isColumnCreateOpen, setIsColumnCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const expressTypes = useMemo(() => board.cardTypes.filter((type) => type.isExpress), [board.cardTypes]);
  const defaultExpressTypeId = expressTypes[0]?.id ?? "";
  const defaultColumnId = board.columns[0]?.id ?? null;
  const activeCard = activeCardId
    ? Object.values(columnCards)
        .flat()
        .find((card) => card.id === activeCardId) ?? null
    : null;
  const editableCard = editor
    ? Object.values(columnCards)
        .flat()
        .find((card) => card.id === editor.cardId) ?? null
    : null;

  function persist(columns: ColumnCards) {
    const cards = buildArrangement(columns);
    startTransition(async () => {
      await updateBoardArrangementAction({
        boardId: board.id,
        cards,
      });
    });
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveCardId(null);

    if (!canEdit || !event.over) {
      return;
    }

    const activeId = Number(event.active.id);
    const overId = String(event.over.id);
    const sourceColumnId = findCardColumn(columnCards, activeId);
    const targetColumnId = getOverColumnId(overId, columnCards);

    if (!sourceColumnId || !targetColumnId) {
      return;
    }

    const sourceCards = columnCards[sourceColumnId];
    const targetCards = columnCards[targetColumnId];
    const activeIndex = sourceCards.findIndex((card) => card.id === activeId);

    if (activeIndex === -1) {
      return;
    }

    const activeItem = sourceCards[activeIndex];

    if (sourceColumnId === targetColumnId) {
      const overIndex = getOverIndex(overId, sourceCards);
      if (activeIndex === overIndex) {
        return;
      }

      const reordered = arrayMove(sourceCards, activeIndex, overIndex);
      const next = {
        ...columnCards,
        [sourceColumnId]: reordered.map((card, index) => ({
          ...card,
          position: index + 1,
        })),
      };
      setColumnCards(next);
      persist(next);
      return;
    }

    const nextSource = sourceCards.filter((card) => card.id !== activeId);
    const insertIndex = getOverIndex(overId, targetCards);
    const nextTarget = [...targetCards];
    nextTarget.splice(insertIndex, 0, { ...activeItem, columnId: targetColumnId });

    const next = {
      ...columnCards,
      [sourceColumnId]: nextSource.map((card, index) => ({
        ...card,
        position: index + 1,
      })),
      [targetColumnId]: nextTarget.map((card, index) => ({
        ...card,
        columnId: targetColumnId,
        position: index + 1,
      })),
    };

    setColumnCards(next);
    persist(next);
  }

  function openEditor(card: BoardCard) {
    setEditor({
      cardId: card.id,
      title: card.title,
      details: card.details,
      deadline: card.deadline ?? "",
      assigneeUserId: card.assigneeUserId ? String(card.assigneeUserId) : "",
      cardTypeId: String(card.cardTypeId),
    });
  }

  function closeEditor() {
    setEditor(null);
  }

  function onEditSubmit(formData: FormData) {
    startTransition(async () => {
      await updateCardAction(formData);

      const cardId = Number(formData.get("cardId"));
      const title = String(formData.get("title"));
      const details = String(formData.get("details") ?? "");
      const deadline = String(formData.get("deadline") ?? "");
      const assigneeUserId = String(formData.get("assigneeUserId") ?? "");
      const cardTypeId = Number(formData.get("cardTypeId"));
      const selectedType = board.cardTypes.find((type) => type.id === cardTypeId);
      const shouldBeExpress = Boolean(selectedType?.isExpress);

      setColumnCards((current) => {
        const next = { ...current };
        for (const [columnId, cards] of Object.entries(current)) {
          const mapped = cards.map((card) =>
            card.id === cardId
              ? {
                  ...card,
                  title,
                  details,
                  deadline: deadline || null,
                  assigneeUserId: assigneeUserId ? Number(assigneeUserId) : null,
                  assigneeName:
                    board.members.find((member) => String(member.id) === assigneeUserId)?.name ??
                    null,
                  cardTypeId,
                  typeName: selectedType?.name ?? card.typeName,
                  typeColor: selectedType?.color ?? card.typeColor,
                  isExpress: shouldBeExpress,
                }
              : card,
          );
          next[Number(columnId)] = shouldBeExpress
            ? mapped.filter((card) => card.id !== cardId).map((card, index) => ({
                ...card,
                position: index + 1,
              }))
            : mapped;
        }
        return next;
      });

      if (shouldBeExpress) {
        setExpressCards((current) => {
          const inColumns = Object.values(columnCards)
            .flat()
            .find((card) => card.id === cardId);
          if (!inColumns) {
            return current;
          }
          const nextCard: BoardCard = {
            ...inColumns,
            title,
            details,
            deadline: deadline || null,
            assigneeUserId: assigneeUserId ? Number(assigneeUserId) : null,
            assigneeName:
              board.members.find((member) => String(member.id) === assigneeUserId)?.name ?? null,
            cardTypeId,
            typeName: selectedType?.name ?? inColumns.typeName,
            typeColor: selectedType?.color ?? inColumns.typeColor,
            isExpress: true,
          };
          return [...current.filter((card) => card.id !== cardId), nextCard];
        });
      }

      setEditor(null);
    });
  }

  return (
    <div className="board-shell">
      <div className="board-header board-header--compact">
        <div>
          <p className="eyebrow">{labels.board}</p>
          <h1 className="board-shell__title">{board.name}</h1>
          <p className="board-shell__subtitle">
            {labels.owner}: {board.ownerName} · {labels.yourRole}: {labels.roleText}
          </p>
        </div>
        <div className="board-shell__hint">
          {canEdit ? (
            <details className="column-create" open={isColumnCreateOpen}>
              <summary
                className="primary-button"
                onClick={(event) => {
                  event.preventDefault();
                  setIsColumnCreateOpen((current) => !current);
                }}
              >
                + {labels.addColumn}
              </summary>
              <form action={createColumnAction} className="column-create-form" style={{ marginLeft: "auto" }}>
                <input type="hidden" name="boardId" value={board.id} />
                <label className="column-create-label" htmlFor="new-column-name">
                  {labels.columnName}
                </label>
                <input id="new-column-name" name="name" required />
                <div className="action-row">
                  <button className="primary-button" type="submit">
                    {labels.addColumn}
                  </button>
                  <button className="ghost-button" type="button" onClick={() => setIsColumnCreateOpen(false)}>
                    {labels.cancel}
                  </button>
                </div>
              </form>
            </details>
          ) : (
            labels.readOnlyAccess
          )}
        </div>
      </div>

      <div className="board-express-lane board-express-lane--compact">
        <div className="panel-header">
          <strong>{labels.expressLane}</strong>
          <div className="inline-actions">
            <span className="status-pill status-pill--urgent">{labels.urgentOnly}</span>
            {canEdit && defaultColumnId && expressTypes.length > 0 ? (
              <details className="column-create" open={isExpressCreateOpen}>
                <summary
                  className="column-plus"
                  aria-label={labels.newCard}
                  onClick={(event) => {
                    event.preventDefault();
                    setIsExpressCreateOpen((current) => !current);
                  }}
                >
                  +
                </summary>
                <form action={createCardAction} className="column-create-form">
                  <input type="hidden" name="boardId" value={board.id} />
                  <input type="hidden" name="columnId" value={defaultColumnId} />
                  <label className="column-create-label" htmlFor="express-card-title">
                    {labels.cardTitle}
                  </label>
                  <input id="express-card-title" name="title" required />
                  <div className="field" style={{ gap: "6px" }}>
                    <label htmlFor="express-card-type">{labels.cardType}</label>
                    <select id="express-card-type" name="cardTypeId" defaultValue={String(defaultExpressTypeId)}>
                      {expressTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="action-row">
                    <button className="primary-button" type="submit">
                      {labels.createCard}
                    </button>
                    <button className="ghost-button" type="button" onClick={() => setIsExpressCreateOpen(false)}>
                      {labels.cancel}
                    </button>
                  </div>
                </form>
              </details>
            ) : null}
          </div>
        </div>
        <div className="board-columns board-columns--express" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {expressCards.map((card) => (
            <article key={card.id} className="board-card">
              <div className="board-card__topline">
                <span className="board-card__circle">◌</span>
                <span className="board-card__type">{card.typeName}</span>
              </div>
              <strong className="board-card__title">{card.title}</strong>
              <p className="board-card__details">{card.details}</p>
            </article>
          ))}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(event) => setActiveCardId(Number(event.active.id))}
        onDragEnd={onDragEnd}
      >
        <div className="board-columns-scroll">
          <div className="board-columns board-columns--kanban">
            {board.columns.map((column) => (
              <ColumnDropZone
                key={column.id}
                boardId={board.id}
                columnId={column.id}
                title={column.name}
                cards={columnCards[column.id] ?? []}
                labels={labels}
                canEdit={canEdit}
                onOpenCard={openEditor}
              />
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeCard ? (
            <div className="drag-overlay">
              <article className="board-card">
                <strong>{activeCard.title}</strong>
              </article>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {editor && editableCard ? (
        <div className="card-editor-backdrop" onClick={closeEditor}>
          <div className="card-editor-modal" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <h2>{labels.editCard}</h2>
            </div>
            <form action={onEditSubmit} className="form-grid" style={{ marginTop: "16px" }}>
              <input type="hidden" name="boardId" value={board.id} />
              <input type="hidden" name="cardId" value={editableCard.id} />
              <div className="field">
                <label htmlFor="edit-title">{labels.cardTitle}</label>
                <input
                  id="edit-title"
                  name="title"
                  defaultValue={editor.title}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="edit-details">{labels.cardDetails}</label>
                <textarea
                  id="edit-details"
                  name="details"
                  defaultValue={editor.details}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-card-type">{labels.cardType}</label>
                <select id="edit-card-type" name="cardTypeId" defaultValue={editor.cardTypeId}>
                  {board.cardTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="edit-assignee">{labels.assignee}</label>
                <select id="edit-assignee" name="assigneeUserId" defaultValue={editor.assigneeUserId}>
                  <option value="">{labels.unassigned}</option>
                  {board.members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="edit-deadline">{labels.deadline}</label>
                <input
                  id="edit-deadline"
                  name="deadline"
                  type="date"
                  defaultValue={editor.deadline}
                />
              </div>
              <div className="action-row">
                <button className="primary-button" type="submit" disabled={isPending}>
                  {labels.saveCard}
                </button>
                <button className="ghost-button" type="button" onClick={closeEditor}>
                  {labels.cancel}
                </button>
              </div>
            </form>
            <div className="form-grid" style={{ marginTop: "18px" }}>
              <div className="panel-header">
                <strong>{labels.commentThread}</strong>
              </div>
              {editableCard.comments.map((comment) => (
                <article key={comment.id} className="comment-card">
                  <p>{comment.body}</p>
                  <p className="eyebrow">
                    {comment.authorName} · {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </article>
              ))}
              <form action={addCommentAction} className="form-grid">
                <input type="hidden" name="boardId" value={board.id} />
                <input type="hidden" name="cardId" value={editableCard.id} />
                <div className="field">
                  <label htmlFor="new-comment">{labels.addComment}</label>
                  <textarea id="new-comment" name="body" required />
                </div>
                <div className="action-row">
                  <button className="secondary-button" type="submit">
                    {labels.addComment}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
