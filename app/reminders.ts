import { AgendaItem } from "./schedule";

export type DueReminder = {
  key: string;
  event: AgendaItem;
  eventAt: Date;
  reminderAt: Date;
};

export function eventDateTime(event: AgendaItem) {
  if (!/^\d{2}:\d{2}$/.test(event.time)) return null;
  const [year, month, day] = event.date.split("-").map(Number);
  const [hour, minute] = event.time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function reminderOffsetMs(reminder: string) {
  if (reminder === "start") return 0;
  const match = reminder.match(/^(\d+)(m|h|d)$/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (match[2] === "m") return amount * 60_000;
  if (match[2] === "h") return amount * 3_600_000;
  return amount * 86_400_000;
}

export function reminderForEvent(event: AgendaItem): DueReminder | null {
  if (event.status === "completed" || event.reminder === "none") return null;
  const eventAt = eventDateTime(event);
  const offset = reminderOffsetMs(event.reminder);
  if (!eventAt || offset === null) return null;
  const reminderAt = new Date(eventAt.getTime() - offset);
  return {
    key: `${event.id}:${reminderAt.toISOString()}`,
    event,
    eventAt,
    reminderAt
  };
}

export function dueReminders(
  events: AgendaItem[],
  now = new Date(),
  delivered = new Set<string>(),
  toleranceMs = 60_000
) {
  return events
    .map(reminderForEvent)
    .filter((reminder): reminder is DueReminder => {
      if (!reminder || delivered.has(reminder.key)) return false;
      const elapsed = now.getTime() - reminder.reminderAt.getTime();
      return elapsed >= 0 && elapsed <= toleranceMs;
    });
}

export function upcomingReminders(events: AgendaItem[], now = new Date(), limit = 5) {
  return events
    .map(reminderForEvent)
    .filter((reminder): reminder is DueReminder => Boolean(reminder && reminder.reminderAt >= now))
    .sort((first, second) => first.reminderAt.getTime() - second.reminderAt.getTime())
    .slice(0, limit);
}

export function reminderText(reminder: string) {
  if (reminder === "none") return "不提醒";
  if (reminder === "start") return "开始时";
  const match = reminder.match(/^(\d+)(m|h|d)$/);
  if (!match) return reminder;
  const unit = match[2] === "m" ? "分钟" : match[2] === "h" ? "小时" : "天";
  return `提前 ${match[1]} ${unit}`;
}
