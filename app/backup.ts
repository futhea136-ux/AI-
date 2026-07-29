import { AgendaItem } from "./schedule";

type BackupFile = {
  app: "AI 小秘";
  version: 1;
  exportedAt: string;
  events: AgendaItem[];
};

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportBackup(events: AgendaItem[]) {
  const backup: BackupFile = {
    app: "AI 小秘",
    version: 1,
    exportedAt: new Date().toISOString(),
    events
  };
  download(
    JSON.stringify(backup, null, 2),
    `AI小秘-日程备份-${new Date().toISOString().slice(0, 10)}.json`,
    "application/json"
  );
}

function isAgendaItem(value: unknown): value is AgendaItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return ["id", "date", "time", "title", "status", "repeat"].every((key) => typeof item[key] === "string");
}

export async function importBackup(file: File) {
  const parsed = JSON.parse(await file.text()) as Partial<BackupFile>;
  if (parsed.app !== "AI 小秘" || parsed.version !== 1 || !Array.isArray(parsed.events)) {
    throw new Error("不是有效的 AI 小秘备份文件");
  }
  if (!parsed.events.every(isAgendaItem)) {
    throw new Error("备份文件中的日程数据不完整");
  }
  return parsed.events;
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function icsDate(date: string) {
  return date.replaceAll("-", "");
}

function icsDateTime(date: string, time: string) {
  return `${icsDate(date)}T${time.replace(":", "")}00`;
}

function repeatRule(item: AgendaItem) {
  if (item.repeat === "daily") return "RRULE:FREQ=DAILY";
  if (item.repeat === "weekly") return "RRULE:FREQ=WEEKLY";
  if (item.repeat === "monthly") return "RRULE:FREQ=MONTHLY";
  if (item.repeat === "workdays") return "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";
  return "";
}

function reminderTrigger(reminder: string) {
  if (reminder === "start") return "TRIGGER:PT0M";
  const match = reminder.match(/^(\d+)(m|h|d)$/);
  if (!match) return "";
  const unit = match[2] === "m" ? "M" : match[2] === "h" ? "H" : "D";
  return `TRIGGER:-PT${match[1]}${unit}`;
}

export function exportIcs(events: AgendaItem[]) {
  const generated = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AI Secretary//Local Calendar//CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ];

  events.forEach((item) => {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${escapeIcs(item.id)}@ai-secretary.local`);
    lines.push(`DTSTAMP:${generated}`);
    if (item.time === "待定") {
      lines.push(`DTSTART;VALUE=DATE:${icsDate(item.date)}`);
    } else {
      lines.push(`DTSTART:${icsDateTime(item.date, item.time)}`);
    }
    lines.push(`SUMMARY:${escapeIcs(item.title)}`);
    if (item.detail) lines.push(`DESCRIPTION:${escapeIcs(item.detail)}`);
    lines.push(`STATUS:${item.status === "tentative" ? "TENTATIVE" : "CONFIRMED"}`);
    lines.push(`X-AI-SECRETARY-STATUS:${item.status.toUpperCase()}`);
    const rule = repeatRule(item);
    if (rule) lines.push(rule);
    const trigger = reminderTrigger(item.reminder);
    if (trigger) {
      lines.push("BEGIN:VALARM");
      lines.push(trigger);
      lines.push("ACTION:DISPLAY");
      lines.push(`DESCRIPTION:${escapeIcs(item.title)}`);
      lines.push("END:VALARM");
    }
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");

  download(
    `${lines.join("\r\n")}\r\n`,
    `AI小秘-日历-${new Date().toISOString().slice(0, 10)}.ics`,
    "text/calendar;charset=utf-8"
  );
}
