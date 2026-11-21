export type MatchStatus = "scheduled" | "played";

export interface MatchRecord {
  id?: string;
  opponent: string;
  competition: string;
  date: string;
  time: string;
  venue: string;
  status: MatchStatus;
  teamScore: number | null;
  opponentScore: number | null;
  goals: number;
  assists: number;
  minutes: number;
}

export type MatchDraft = Omit<MatchRecord, "id">;

const storageKey = "mypitch.matches.v1";
const mockApiUrl = import.meta.env.VITE_MOCKAPI_URL?.trim();

export function getDataMode(): "local" | "mockapi" {
  return mockApiUrl ? "mockapi" : "local";
}

function isMatchRecord(value: unknown): value is MatchRecord {
  if (!value || typeof value !== "object") return false;
  const match = value as Record<string, unknown>;
  return (
    (match.id === undefined || typeof match.id === "string") &&
    typeof match.opponent === "string" &&
    typeof match.competition === "string" &&
    typeof match.date === "string" &&
    typeof match.time === "string" &&
    typeof match.venue === "string" &&
    (match.status === "scheduled" || match.status === "played") &&
    (match.teamScore === null || typeof match.teamScore === "number") &&
    (match.opponentScore === null || typeof match.opponentScore === "number") &&
    typeof match.goals === "number" &&
    typeof match.assists === "number" &&
    typeof match.minutes === "number"
  );
}

function parseMatches(value: unknown): MatchRecord[] {
  if (!Array.isArray(value) || !value.every(isMatchRecord)) {
    throw new Error("Dữ liệu nhận được không đúng định dạng trận đấu.");
  }
  return value;
}

function readLocalMatches(): MatchRecord[] {
  const stored = window.localStorage.getItem(storageKey);
  return stored ? parseMatches(JSON.parse(stored) as unknown) : [];
}

function writeLocalMatches(matches: MatchRecord[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(matches));
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    throw new Error(
      `MockAPI trả về lỗi ${response.status}. Kiểm tra URL, resource và quyền truy cập.`
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function apiUrl(id?: string) {
  if (!mockApiUrl) throw new Error("Chưa cấu hình URL MockAPI.");
  return id ? `${mockApiUrl.replace(/\/$/, "")}/${encodeURIComponent(id)}` : mockApiUrl;
}

export async function getMatches(): Promise<MatchRecord[]> {
  if (!mockApiUrl) return readLocalMatches();
  return parseMatches(await request<unknown>(apiUrl()));
}

export async function saveMatch(draft: MatchDraft, id?: string): Promise<MatchRecord> {
  if (!mockApiUrl) {
    const matches = readLocalMatches();
    const saved: MatchRecord = { ...draft, id: id ?? crypto.randomUUID() };
    writeLocalMatches(
      id ? matches.map((match) => (match.id === id ? saved : match)) : [...matches, saved]
    );
    return saved;
  }
  const saved = await request<unknown>(apiUrl(id), {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(draft),
  });
  if (!isMatchRecord(saved))
    throw new Error("MockAPI đã lưu nhưng trả về dữ liệu không đúng định dạng.");
  return saved;
}

export async function deleteMatch(id: string): Promise<void> {
  if (!mockApiUrl) {
    writeLocalMatches(readLocalMatches().filter((match) => match.id !== id));
    return;
  }
  await request<void>(apiUrl(id), { method: "DELETE" });
}
