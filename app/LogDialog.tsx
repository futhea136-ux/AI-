"use client";

import { ActivityLogEntry } from "./activityLog";

type LogDialogProps = {
  logs: ActivityLogEntry[];
  onClose: () => void;
  onClear: () => void;
};

function formatLogTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "时间未知";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function LogDialog({ logs, onClose, onClear }: LogDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="event-dialog log-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><p className="eyebrow">LOCAL LOG</p><h2>最近操作日志</h2></div>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="关闭">×</button>
        </header>
        <p className="backup-notice">日志只保存在当前浏览器，并自动清理 7 天前的记录。</p>
        <div className="log-toolbar">
          <span>共 {logs.length} 条</span>
          <button type="button" onClick={onClear} disabled={logs.length === 0}>清空日志</button>
        </div>
        <ol className="log-list">
          {logs.length === 0 && <li className="empty-log">最近 7 天还没有操作记录</li>}
          {logs.map((log) => (
            <li key={log.id}>
              <time>{formatLogTime(log.createdAt)}</time>
              <span><strong>{log.action}</strong><small>{log.title}</small></span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
