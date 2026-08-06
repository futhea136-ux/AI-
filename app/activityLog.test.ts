import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVITY_LOG_KEY,
  clearActivityLogs,
  cleanupActivityLogs,
  pruneActivityLogs,
  writeActivityLog
} from "./activityLog.ts";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    },
    dump: () => data
  };
}

test("日志只保留最近7天", () => {
  const now = new Date("2026-08-06T12:00:00.000Z");
  const entries = pruneActivityLogs([
    { id: "old", action: "delete", title: "旧日程", createdAt: "2026-07-29T11:59:59.000Z" },
    { id: "keep", action: "create", title: "新日程", createdAt: "2026-07-30T12:00:00.000Z" }
  ], now);

  assert.deepEqual(entries.map((entry) => entry.id), ["keep"]);
});

test("写入新日志时会同步清理过期日志", () => {
  const storage = memoryStorage({
    [ACTIVITY_LOG_KEY]: JSON.stringify([
      { id: "old", action: "delete", title: "旧日程", createdAt: "2026-07-29T11:59:59.000Z" }
    ])
  });

  const entries = writeActivityLog(storage, "create", "烧水", new Date("2026-08-06T12:00:00.000Z"));

  assert.equal(entries.length, 1);
  assert.equal(entries[0].title, "烧水");
});

test("页面启动清理会移除7天前日志", () => {
  const storage = memoryStorage({
    [ACTIVITY_LOG_KEY]: JSON.stringify([
      { id: "old", action: "update", title: "旧修改", createdAt: "2026-07-29T00:00:00.000Z" },
      { id: "keep", action: "complete", title: "完成事项", createdAt: "2026-08-05T00:00:00.000Z" }
    ])
  });

  const entries = cleanupActivityLogs(storage, new Date("2026-08-06T12:00:00.000Z"));

  assert.deepEqual(entries.map((entry) => entry.id), ["keep"]);
});

test("可以手动清空本地日志", () => {
  const storage = memoryStorage({
    [ACTIVITY_LOG_KEY]: JSON.stringify([
      { id: "keep", action: "create", title: "烧水", createdAt: "2026-08-06T12:00:00.000Z" }
    ])
  });

  const entries = clearActivityLogs(storage);

  assert.deepEqual(entries, []);
  assert.equal(storage.dump()[ACTIVITY_LOG_KEY], "[]");
});
