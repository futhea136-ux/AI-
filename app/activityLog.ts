export type ActivityLogEntry = {
  id: string;
  action: string;
  title: string;
  createdAt: string;
};

type LogStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const ACTIVITY_LOG_KEY = "ai-secretary-activity-logs";
export const ACTIVITY_LOG_RETENTION_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export function pruneActivityLogs(entries: ActivityLogEntry[], now = new Date()) {
  const cutoff = now.getTime() - ACTIVITY_LOG_RETENTION_DAYS * DAY_MS;
  return entries.filter((entry) => {
    const createdAt = new Date(entry.createdAt).getTime();
    return Number.isFinite(createdAt) && createdAt >= cutoff;
  });
}

export function readActivityLogs(storage: LogStorage, now = new Date()) {
  const raw = storage.getItem(ACTIVITY_LOG_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ActivityLogEntry[];
    if (!Array.isArray(parsed)) return [];
    return pruneActivityLogs(parsed, now);
  } catch {
    storage.removeItem(ACTIVITY_LOG_KEY);
    return [];
  }
}

export function cleanupActivityLogs(storage: LogStorage, now = new Date()) {
  const entries = readActivityLogs(storage, now);
  storage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(entries));
  return entries;
}

export function writeActivityLog(
  storage: LogStorage,
  action: string,
  title: string,
  now = new Date()
) {
  const entries = pruneActivityLogs(readActivityLogs(storage, now), now);
  const nextEntry: ActivityLogEntry = {
    id: `log-${now.getTime()}`,
    action,
    title,
    createdAt: now.toISOString()
  };
  const nextEntries = [nextEntry, ...entries].slice(0, 100);
  storage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(nextEntries));
  return nextEntries;
}
