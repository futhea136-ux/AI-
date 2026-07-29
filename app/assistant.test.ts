import assert from "node:assert/strict";
import test from "node:test";
import { parseCommand } from "./assistant.ts";

test("只说未来时间时默认创建在今天", () => {
  const command = parseCommand("我要添加晚上七点十五分要烧水的任务", new Date(2026, 6, 29, 18, 0));
  assert.equal(command.title, "烧水");
  assert.equal(command.time, "19:15");
  assert.equal(command.date, "2026-07-29");
  assert.equal(command.assumedDate, "today");
  assert.deepEqual(command.missingFields, []);
});

test("只说已经过去的时间时追问日期", () => {
  const command = parseCommand("晚上七点十五分烧水", new Date(2026, 6, 29, 20, 0));
  assert.equal(command.date, undefined);
  assert.deepEqual(command.missingFields, ["日期"]);
});

test("明确说明明天时不使用默认日期", () => {
  const command = parseCommand("明天晚上七点十五分烧水", new Date(2026, 6, 29, 20, 0));
  assert.equal(command.date, "2026-07-30");
  assert.equal(command.assumedDate, undefined);
  assert.deepEqual(command.missingFields, []);
});

test("语音新建日程默认在开始时提醒", () => {
  const command = parseCommand("明天晚上七点烧水", new Date(2026, 6, 29, 18, 0));
  assert.equal(command.reminder, "start");
  assert.equal(command.reminderSpecified, false);
});

test("用户可以明确创建不提醒的日程", () => {
  const command = parseCommand("明天晚上七点烧水，不用提醒", new Date(2026, 6, 29, 18, 0));
  assert.equal(command.reminder, "none");
  assert.equal(command.reminderSpecified, true);
});

test("提前提醒要求优先于新建默认值", () => {
  const command = parseCommand("明天晚上七点烧水，提前十五分钟提醒", new Date(2026, 6, 29, 18, 0));
  assert.equal(command.reminder, "15m");
  assert.equal(command.reminderSpecified, true);
});

test("修改命令未提提醒时保留原设置", () => {
  const command = parseCommand("把明天烧水改到晚上八点", new Date(2026, 6, 29, 18, 0));
  assert.equal(command.action, "update");
  assert.equal(command.reminder, "none");
  assert.equal(command.reminderSpecified, false);
});
