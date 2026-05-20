export type UserRole = "ADMIN" | "MEMBER" | "READ";
export type UserStatus = "PENDING" | "ACTIVE" | "DISABLED";
export type AuthMode = "local" | "ldap" | "oidc";
export type UserLanguage = "en" | "es-AR";

export type BoardSummary = {
  id: number;
  name: string;
  ownerName: string;
  role: UserRole;
};

export type BoardCard = {
  id: number;
  title: string;
  details: string;
  deadline: string | null;
  assigneeUserId: number | null;
  assigneeName: string | null;
  cardTypeId: number;
  typeName: string;
  typeColor: string;
  isExpress: boolean;
  columnId: number;
  columnName: string;
  position: number;
  updatedAt: string;
  comments: {
    id: number;
    body: string;
    authorName: string;
    createdAt: string;
  }[];
};

export type BoardColumn = {
  id: number;
  name: string;
  position: number;
};

export type BoardDetail = {
  id: number;
  name: string;
  ownerUserId: number;
  ownerName: string;
  role: UserRole;
  columns: BoardColumn[];
  cards: BoardCard[];
  members: {
    id: number;
    name: string;
  }[];
  memberships: {
    userId: number;
    name: string;
    email: string;
    role: UserRole;
  }[];
  availableUsers: {
    id: number;
    name: string;
    email: string;
  }[];
  cardTypes: CardType[];
};

export type AppUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  preferenceTheme: "light" | "dark";
  preferenceLanguage: UserLanguage;
  createdAt: string;
};

export type CardType = {
  id: number;
  name: string;
  color: string;
  isExpress: boolean;
};

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  preferenceTheme: "light" | "dark";
  preferenceLanguage: UserLanguage;
};
