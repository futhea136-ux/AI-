import assert from "node:assert/strict";
import test from "node:test";
import { dueReminders } from "./reminders.ts";
import type { AgendaItem } from "./schedule.ts";

function event(overrides: Partial<AgendaItem> = {}): AgendaItem {
  return {
    id: "event-1",
    date: "2026-07-29",
    time: "15:00",
    title: "客户沟通",
    detail: "",
    reminder: "15m",
    status: "confirmed",
    repeat: "none",
    ...overrides
  };
}

test("提前提醒错过原触发点后，在事项开始前仍会补发", () => {
  const now = new Date(2026, 6, 29, 14, 50);
  assert.equal(dueReminders([event()], now).length, 1);
});

test("提前提醒在事项开始后不再补发", () => {
  const now = new Date(2026, 6, 29, 15, 1);
  assert.equal(dueReminders([event()], now).length, 0);
});

test("开始时提醒允许在十分钟内补发", () => {
  const now = new Date(2026, 6, 29, 15, 5);
  assert.equal(dueReminders([event({ reminder: "start" })], now).length, 1);
});

test("已送达、已完成和不提醒事项不会重复提醒", () => {
  const now = new Date(2026, 6, 29, 14, 50);
  const current = event();
  const [reminder] = dueReminders([current], now);
  assert.equal(dueReminders([current], now, new Set([reminder.key])).length, 0);
  assert.equal(dueReminders([event({ status: "completed" })], now).length, 0);
  assert.equal(dueReminders([event({ reminder: "none" })], now).length, 0);
});
