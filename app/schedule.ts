export type AgendaStatus = "confirmed" | "tentative" | "completed";
export type RepeatRule = "none" | "daily" | "weekly" | "workdays" | "monthly";

export type AgendaItem = {
  id: string;
  seriesId?: string;
  date: string;
  time: string;
  title: string;
  detail: string;
  reminder: string;
  status: AgendaStatus;
  repeat: RepeatRule;
  excludedDates?: string[];
};

export const statusLabel: Record<AgendaStatus, string> = {
  confirmed: "已确认",
  tentative: "待确认",
  completed: "已完成"
};

export const repeatLabel: Record<RepeatRule, string> = {
  none: "不重复",
  daily: "每天",
  weekly: "每周",
  workdays: "每个工作日",
  monthly: "每月"
};

export function localDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function calendarMonthCells(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month - 1, 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      key: localDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate()),
      day: date.getDate(),
      otherMonth: date.getMonth() + 1 !== month
    };
  });
}

export function calendarWeekCells(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const selected = new Date(year, month - 1, day);
  const mondayOffset = (selected.getDay() + 6) % 7;
  const monday = new Date(year, month - 1, day - mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      key: localDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate()),
      day: date.getDate(),
      otherMonth: date.getMonth() + 1 !== month
    };
  });
}

export function formatDateTitle(dateKey: string) {
  const [, month, day] = dateKey.split("-").map(Number);
  return `${month}月${day}日`;
}

export function weekdayLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][
    new Date(year, month - 1, day).getDay()
  ];
}

export function createRecurringItems(item: AgendaItem, year: number, month: number) {
  if (item.repeat === "none") {
    const [itemYear, itemMonth] = item.date.split("-").map(Number);
    return itemYear === year && itemMonth === month ? [item] : [];
  }

  const [sourceYear, sourceMonth, sourceDay] = item.date.split("-").map(Number);
  const sourceDate = new Date(sourceYear, sourceMonth - 1, sourceDay);
  const daysInMonth = new Date(year, month, 0).getDate();
  const seriesId = item.seriesId || item.id;
  const occurrences: AgendaItem[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    if (date < sourceDate) continue;

    const difference = Math.floor((date.getTime() - sourceDate.getTime()) / 86400000);
    const matches =
      item.repeat === "daily" ||
      (item.repeat === "weekly" && difference % 7 === 0) ||
      (item.repeat === "workdays" && date.getDay() >= 1 && date.getDay() <= 5) ||
      (item.repeat === "monthly" && day === sourceDay);

    if (matches) {
      const dateKey = localDateKey(year, month, day);
      if (item.excludedDates?.includes(dateKey)) continue;
      occurrences.push({
        ...item,
        id: `${seriesId}-${dateKey}`,
        seriesId,
        date: dateKey
      });
    }
  }
  return occurrences;
}
