export type Role = "parent" | "kid";

export type CurrentUser = {
  id: number;
  familyId: number;
  familyName: string;
  username: string;
  name: string;
  role: Role;
  emoji: string;
  color: string;
};

export type Member = {
  id: number;
  username: string;
  name: string;
  role: Role;
  emoji: string;
  color: string;
};

export type CompletionStatus = "open" | "done" | "approved";

export type Chore = {
  id: number;
  title: string;
  emoji: string;
  points: number;
  daysMask: number;
  assigneeId: number | null;
  active: number;
};

export type ChartCell = Chore & {
  status: CompletionStatus;
  dueDate: string;
  doneAt: string | null;
  approvedAt: string | null;
};

export type LeaderboardRow = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  role: Role;
  points: number;
};

export type LedgerEntry = {
  id: number;
  userId: number;
  userName: string;
  userEmoji: string;
  userColor: string;
  amount: number;
  reason: string;
  kind: "chore" | "bonus" | "penalty" | "reward";
  createdAt: string;
};

export type Reward = {
  id: number;
  title: string;
  emoji: string;
  cost: number;
  stock: number;
  active: number;
};

export type ActionState = {
  error?: string;
  ok?: boolean;
} | null;
