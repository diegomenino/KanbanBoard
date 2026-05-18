import type { UserLanguage, UserRole } from "@/lib/types";

type Dictionary = {
  appName: string;
  loggedInAs: string;
  overview: string;
  adminSettings: string;
  userSettings: string;
  boardSettings: string;
  boards: string;
  newBoard: string;
  createBoard: string;
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
  boardAccess: string;
  addUserToBoard: string;
  user: string;
  accessRole: string;
  grantAccess: string;
  updateAccess: string;
  removeAccess: string;
  boardName: string;
  logOut: string;
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
  workspaceOverview: string;
  keepNextActionObvious: string;
  baselineSummary: string;
  yourBoards: string;
  roleOnBoard: string;
  adminMetrics: string;
  openAdminArea: string;
  users: string;
  pendingApprovals: string;
  administration: string;
  adminHeadline: string;
  totalUsers: string;
  pending: string;
  authenticationMode: string;
  activeMode: string;
  saveAuthMode: string;
  userApprovals: string;
  role: string;
  status: string;
  language: string;
  approve: string;
  disable: string;
  delete: string;
  cardTypes: string;
  color: string;
  expressEnabled: string;
  standard: string;
  typeName: string;
  markExpressCapable: string;
  addCardType: string;
  personalPreferences: string;
  settingsHeadline: string;
  theme: string;
  light: string;
  dark: string;
  english: string;
  spanishArgentina: string;
  savePreferences: string;
  admin: string;
  member: string;
  read: string;
  active: string;
  disabled: string;
  pendingStatus: string;
};

const dictionaries: Record<UserLanguage, Dictionary> = {
  en: {
    appName: "KanbanBoard",
    loggedInAs: "Logged in as",
    overview: "Overview",
    adminSettings: "Admin Settings",
    userSettings: "User settings",
    boardSettings: "Board settings",
    boards: "Boards",
    newBoard: "New board",
    createBoard: "Create board",
    newCard: "New card",
    createCard: "Create card",
    editCard: "Edit card",
    saveCard: "Save card",
    cancel: "Cancel",
    cardTitle: "Card title",
    cardDetails: "Card details",
    deadline: "Deadline",
    cardType: "Card type",
    commentThread: "Comment thread",
    addComment: "Add comment",
    addColumn: "Add column",
    columnName: "Column name",
    editColumnName: "Edit column name",
    deleteColumn: "Delete column",
    boardAccess: "Board access",
    addUserToBoard: "Add user to board",
    user: "User",
    accessRole: "Access role",
    grantAccess: "Grant access",
    updateAccess: "Update access",
    removeAccess: "Remove access",
    boardName: "Board name",
    logOut: "Log Out",
    board: "Board",
    owner: "Owner",
    yourRole: "Your role",
    dragToMoveCards: "Drag to move cards",
    readOnlyAccess: "Read-only access",
    expressLane: "Express Lane",
    urgentOnly: "Urgent only",
    dropCardHere: "Drop a card here",
    assignee: "Assignee",
    unassigned: "Unassigned",
    comments: "comments",
    workspaceOverview: "Workspace overview",
    keepNextActionObvious: "Keep the next action obvious.",
    baselineSummary:
      "This baseline includes board ownership, approval-aware user management, runtime auth mode storage, and an urgent express lane.",
    yourBoards: "Your boards",
    roleOnBoard: "Role on board",
    adminMetrics: "Admin metrics",
    openAdminArea: "Open admin area",
    users: "Users",
    pendingApprovals: "Pending approvals",
    administration: "Administration",
    adminHeadline: "Users, auth mode, and card taxonomy.",
    totalUsers: "Total users",
    pending: "Pending",
    authenticationMode: "Authentication mode",
    activeMode: "Active mode",
    saveAuthMode: "Save auth mode",
    userApprovals: "User approvals",
    role: "Role",
    status: "Status",
    language: "Language",
    approve: "Approve",
    disable: "Disable",
    delete: "Delete",
    cardTypes: "Card types",
    color: "Color",
    expressEnabled: "Express-enabled",
    standard: "Standard",
    typeName: "Type name",
    markExpressCapable: "Mark as express-capable",
    addCardType: "Add card type",
    personalPreferences: "User settings",
    settingsHeadline: "Personal preferences stay personal.",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    english: "English",
    spanishArgentina: "Español (Argentina)",
    savePreferences: "Save preferences",
    admin: "Admin",
    member: "Member",
    read: "Read",
    active: "Active",
    disabled: "Disabled",
    pendingStatus: "Pending",
  },
  "es-AR": {
    appName: "KanbanBoard",
    loggedInAs: "Sesión iniciada",
    overview: "Resumen",
    adminSettings: "Configuración admin",
    userSettings: "Configuración de usuario",
    boardSettings: "Configuración del tablero",
    boards: "Tableros",
    newBoard: "Nuevo tablero",
    createBoard: "Crear tablero",
    newCard: "Nueva tarjeta",
    createCard: "Crear tarjeta",
    editCard: "Editar tarjeta",
    saveCard: "Guardar tarjeta",
    cancel: "Cancelar",
    cardTitle: "Título de la tarjeta",
    cardDetails: "Detalles de la tarjeta",
    deadline: "Fecha límite",
    cardType: "Tipo de tarjeta",
    commentThread: "Hilo de comentarios",
    addComment: "Agregar comentario",
    addColumn: "Agregar columna",
    columnName: "Nombre de columna",
    editColumnName: "Editar nombre de columna",
    deleteColumn: "Eliminar columna",
    boardAccess: "Acceso al tablero",
    addUserToBoard: "Agregar usuario al tablero",
    user: "Usuario",
    accessRole: "Rol de acceso",
    grantAccess: "Otorgar acceso",
    updateAccess: "Actualizar acceso",
    removeAccess: "Quitar acceso",
    boardName: "Nombre del tablero",
    logOut: "Cerrar sesión",
    board: "Tablero",
    owner: "Propietario",
    yourRole: "Tu rol",
    dragToMoveCards: "Arrastrá para mover tarjetas",
    readOnlyAccess: "Acceso solo lectura",
    expressLane: "Carril expreso",
    urgentOnly: "Solo urgentes",
    dropCardHere: "Soltá una tarjeta acá",
    assignee: "Asignado",
    unassigned: "Sin asignar",
    comments: "comentarios",
    workspaceOverview: "Resumen del espacio",
    keepNextActionObvious: "Que la próxima acción sea obvia.",
    baselineSummary:
      "Esta base incluye propiedad de tableros, gestión de usuarios con aprobación, configuración de autenticación en tiempo de ejecución y un carril expreso para urgencias.",
    yourBoards: "Tus tableros",
    roleOnBoard: "Rol en el tablero",
    adminMetrics: "Métricas admin",
    openAdminArea: "Abrir área admin",
    users: "Usuarios",
    pendingApprovals: "Aprobaciones pendientes",
    administration: "Administración",
    adminHeadline: "Usuarios, modo de autenticación y taxonomía de tarjetas.",
    totalUsers: "Usuarios totales",
    pending: "Pendientes",
    authenticationMode: "Modo de autenticación",
    activeMode: "Modo activo",
    saveAuthMode: "Guardar modo de autenticación",
    userApprovals: "Aprobaciones de usuarios",
    role: "Rol",
    status: "Estado",
    language: "Idioma",
    approve: "Aprobar",
    disable: "Desactivar",
    delete: "Eliminar",
    cardTypes: "Tipos de tarjeta",
    color: "Color",
    expressEnabled: "Habilitado para expreso",
    standard: "Estándar",
    typeName: "Nombre del tipo",
    markExpressCapable: "Marcar como apto para expreso",
    addCardType: "Agregar tipo de tarjeta",
    personalPreferences: "Configuración de usuario",
    settingsHeadline: "Las preferencias personales siguen siendo personales.",
    theme: "Tema",
    light: "Claro",
    dark: "Oscuro",
    english: "Inglés",
    spanishArgentina: "Español (Argentina)",
    savePreferences: "Guardar preferencias",
    admin: "Admin",
    member: "Miembro",
    read: "Lectura",
    active: "Activo",
    disabled: "Desactivado",
    pendingStatus: "Pendiente",
  },
};

export function getDictionary(language: UserLanguage) {
  return dictionaries[language];
}

export function translateRole(role: UserRole, language: UserLanguage) {
  const dictionary = getDictionary(language);
  if (role === "ADMIN") return dictionary.admin;
  if (role === "MEMBER") return dictionary.member;
  return dictionary.read;
}

export function translateStatus(
  status: "ACTIVE" | "DISABLED" | "PENDING",
  language: UserLanguage,
) {
  const dictionary = getDictionary(language);
  if (status === "ACTIVE") return dictionary.active;
  if (status === "DISABLED") return dictionary.disabled;
  return dictionary.pendingStatus;
}
