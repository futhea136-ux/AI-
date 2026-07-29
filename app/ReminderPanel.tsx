"use client";

import { AgendaItem } from "./schedule";
import { reminderText, upcomingReminders } from "./reminders";

type ReminderPanelProps = {
  events: AgendaItem[];
  permission: NotificationPermission | "unsupported";
  onClose: () => void;
  onRequestPermission: () => void;
};

export default function ReminderPanel({
  events,
  permission,
  onClose,
  onRequestPermission
}: ReminderPanelProps) {
  const upcoming = upcomingReminders(events);
  const permissionText =
    permission === "granted" ? "浏览器通知已开启" :
    permission === "denied" ? "浏览器通知已被拒绝，可在浏览器设置中修改" :
    permission === "unsupported" ? "当前浏览器不支持系统通知" :
    "尚未开启浏览器通知";

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="event-dialog reminder-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><p className="eyebrow">REMINDERS</p><h2>提醒中心</h2></div>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <div className={`permission-card ${permission}`}>
          <span className="permission-icon">铃</span>
          <div><strong>{permissionText}</strong><small>页面打开时，页面内提醒始终有效。</small></div>
          {permission === "default" && <button onClick={onRequestPermission}>开启通知</button>}
        </div>

        <div className="upcoming-section">
          <h3>接下来的提醒</h3>
          {upcoming.length === 0 ? (
            <p className="empty-reminders">暂时没有即将到来的提醒</p>
          ) : (
            <ol>
              {upcoming.map((item) => (
                <li key={item.key}>
                  <time>
                    {item.reminderAt.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                    {" "}
                    {item.reminderAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </time>
                  <div><strong>{item.event.title}</strong><span>{reminderText(item.event.reminder)}</span></div>
                  <em className={item.event.status}>{item.event.status === "tentative" ? "待确认" : "已确认"}</em>
                </li>
              ))}
            </ol>
          )}
        </div>
        <p className="reminder-limit">关闭网页或电脑休眠后，浏览器可能无法触发提醒。重要日程建议同时导出到系统日历。</p>
      </section>
    </div>
  );
}
