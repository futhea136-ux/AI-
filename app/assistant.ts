import { AgendaStatus, RepeatRule, localDateKey } from "./schedule";

export type AssistantAction = "create" | "update" | "delete" | "complete" | "query";

export type ParsedCommand = {
  action: AssistantAction;
  raw: string;
  title: string;
  date?: string;
  time?: string;
  status: AgendaStatus;
  repeat: RepeatRule;
  reminder: string;
  uncertainFields: string[];
  missingFields: string[];
};

const weekdayMap: Record<string, number> = {
  日: 0, 天: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function chineseNumber(value: string) {
  if (/^\d+$/.test(value)) return Number(value);
  const digits: Record<string, number> = {
    零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5,
    六: 6, 七: 7, 八: 8, 九: 9
  };
  if (value === "十") return 10;
  if (value.startsWith("十")) return 10 + (digits[value[1]] || 0);
  if (value.includes("十")) {
    const [tens, ones] = value.split("十");
    return (digits[tens] || 0) * 10 + (digits[ones] || 0);
  }
  return digits[value] ?? Number.NaN;
}

function parseDate(text: string, reference: Date) {
  const exact = text.match(/(?:(\d{4})年)?(\d{1,2})月(\d{1,2})[日号]?/);
  if (exact) {
    return localDateKey(Number(exact[1] || reference.getFullYear()), Number(exact[2]), Number(exact[3]));
  }

  if (/后天/.test(text)) {
    const date = addDays(reference, 2);
    return localDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }
  if (/明天/.test(text)) {
    const date = addDays(reference, 1);
    return localDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }
  if (/今天/.test(text)) {
    return localDateKey(reference.getFullYear(), reference.getMonth() + 1, reference.getDate());
  }

  const weekday = text.match(/(下周|本周|这周|周|星期)([一二三四五六日天])/);
  if (weekday) {
    const target = weekdayMap[weekday[2]];
    const current = reference.getDay();
    let difference = (target - current + 7) % 7;
    if (weekday[1] === "下周") {
      const daysUntilNextMonday = (8 - current) % 7 || 7;
      difference = daysUntilNextMonday + (target === 0 ? 6 : target - 1);
    }
    else if (difference === 0 && weekday[1] === "周") difference = 7;
    const date = addDays(reference, difference);
    return localDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }
  return undefined;
}

function parseTime(text: string) {
  if (/时间.{0,4}(待定|没确定|不确定)|几点.{0,3}(待定|没确定|不确定)/.test(text)) return "待定";

  const colon = text.match(/(\d{1,2})[:：](\d{2})/);
  if (colon) return `${String(Number(colon[1])).padStart(2, "0")}:${colon[2]}`;

  const chinese = text.match(/(凌晨|早上|上午|中午|下午|傍晚|晚上)?\s*([0-9一二两三四五六七八九十]{1,3})点(?:(半)|([0-9一二两三四五六七八九十]{1,3})分?)?/);
  if (!chinese) return undefined;
  let hour = chineseNumber(chinese[2]);
  const period = chinese[1] || "";
  if (["下午", "傍晚", "晚上"].includes(period) && hour < 12) hour += 12;
  if (period === "凌晨" && hour === 12) hour = 0;
  const minute = chinese[3] ? 30 : chinese[4] ? chineseNumber(chinese[4]) : 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseReminder(text: string) {
  const reminder = text.match(/提前\s*(\d+)\s*(分钟|小时|天)/);
  if (!reminder) return /提醒我|提醒一下/.test(text) ? "start" : "none";
  const amount = Number(reminder[1]);
  if (reminder[2] === "分钟") return `${amount}m`;
  if (reminder[2] === "小时") return `${amount}h`;
  return `${amount}d`;
}

function parseRepeat(text: string): RepeatRule {
  if (/每个?工作日|周一到周五/.test(text)) return "workdays";
  if (/每天|每日/.test(text)) return "daily";
  if (/每周|每星期/.test(text)) return "weekly";
  if (/每月/.test(text)) return "monthly";
  return "none";
}

function parseAction(text: string): AssistantAction {
  if (/删除|取消|不要了/.test(text)) return "delete";
  if (/完成了|已完成|做完了|结束了/.test(text)) return "complete";
  if (/修改|改到|改成|挪到|推迟|提前到/.test(text)) return "update";
  if (/有什么安排|哪些安排|查一下|查询|日程是什么/.test(text)) return "query";
  return "create";
}

function extractTitle(text: string) {
  return text
    .replace(/(今天|明天|后天|下周|本周|这周|星期|周)[一二三四五六日天]?/g, "")
    .replace(/(?:\d{4}年)?\d{1,2}月\d{1,2}[日号]?/g, "")
    .replace(/(凌晨|早上|上午|中午|下午|傍晚|晚上)?\s*[0-9一二两三四五六七八九十]{1,3}(?:点(?:半|[0-9一二两三四五六七八九十]{1,3}分?)?|[:：]\d{2})/g, "")
    .replace(/提前\s*\d+\s*(分钟|小时|天)/g, "")
    .replace(/每个?工作日|周一到周五|每天|每日|每周|每星期|每月/g, "")
    .replace(/请|帮我|提醒我|提醒一下|创建|新增|安排|日程|修改|删除|取消|把|改到|改成|挪到|推迟|完成了|已完成|做完了|结束了/g, "")
    .replace(/^我/, "")
    .replace(/时间.{0,5}(待定|没确定|不确定)/g, "")
    .replace(/可能|暂定|待定|还不确定|没确定|不确定/g, "")
    .replace(/[，。,.！!？?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseCommand(text: string, reference = new Date()): ParsedCommand {
  const action = parseAction(text);
  const date = parseDate(text, reference);
  const parsedTime = parseTime(text);
  const uncertain = /可能|暂定|待定|没确定|不确定|还不确定/.test(text);
  const time = parsedTime || (action === "create" && uncertain ? "待定" : undefined);
  const uncertainFields: string[] = [];
  if (/地点.{0,5}(待定|没确定|不确定)/.test(text)) uncertainFields.push("地点");
  if (time === "待定") uncertainFields.push("时间");

  const title = extractTitle(text);
  const missingFields: string[] = [];
  if (action === "create") {
    if (!title) missingFields.push("事项");
    if (!date) missingFields.push("日期");
    if (!time && !uncertain) missingFields.push("时间");
  }

  return {
    action,
    raw: text,
    title,
    date,
    time,
    status: uncertain ? "tentative" : "confirmed",
    repeat: parseRepeat(text),
    reminder: parseReminder(text),
    uncertainFields,
    missingFields
  };
}

export function followUpQuestion(command: ParsedCommand) {
  if (!command.missingFields.length) return "";
  const missing = command.missingFields[0];
  if (missing === "事项") return "这项安排的名称是什么？";
  if (missing === "日期") return "安排在哪一天？";
  return "安排在几点？如果还没确定，也可以说“时间待定”。";
}
