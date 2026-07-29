"use client";

import { FormEvent } from "react";
import {
  AgendaItem,
  AgendaStatus,
  RepeatRule,
  repeatLabel,
  statusLabel
} from "./schedule";

type EventDialogProps = {
  event: AgendaItem;
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (event: AgendaItem) => void;
  onDelete?: (event: AgendaItem) => void;
};

export default function EventDialog({
  event,
  mode,
  onClose,
  onSave,
  onDelete
}: EventDialogProps) {
  function submit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    const form = new FormData(eventForm.currentTarget);
    onSave({
      ...event,
      title: String(form.get("title") || "").trim(),
      date: String(form.get("date")),
      time: String(form.get("time") || "09:00"),
      detail: String(form.get("detail") || "").trim(),
      reminder: String(form.get("reminder") || "none"),
      status: String(form.get("status")) as AgendaStatus,
      repeat: String(form.get("repeat")) as RepeatRule
    });
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="event-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-dialog-title"
        onMouseDown={(eventMouse) => eventMouse.stopPropagation()}
      >
        <header>
          <div>
            <p className="eyebrow">SCHEDULE</p>
            <h2 id="event-dialog-title">{mode === "create" ? "新增日程" : "修改日程"}</h2>
          </div>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <form onSubmit={submit}>
          <label className="field full-field">
            <span>日程名称</span>
            <input name="title" defaultValue={event.title} required autoFocus placeholder="输入日程名称" />
          </label>
          <div className="field-row">
            <label className="field">
              <span>日期</span>
              <input name="date" type="date" defaultValue={event.date} required />
            </label>
            <label className="field">
              <span>时间</span>
              <input name="time" type="time" defaultValue={event.time === "待定" ? "" : event.time} />
            </label>
          </div>
          <label className="field full-field">
            <span>地点或备注</span>
            <input name="detail" defaultValue={event.detail} placeholder="例如：会议室 B" />
          </label>
          <div className="field-row">
            <label className="field">
              <span>状态</span>
              <select name="status" defaultValue={event.status}>
                {(Object.keys(statusLabel) as AgendaStatus[]).map((value) => (
                  <option value={value} key={value}>{statusLabel[value]}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>重复</span>
              <select name="repeat" defaultValue={event.repeat}>
                {(Object.keys(repeatLabel) as RepeatRule[]).map((value) => (
                  <option value={value} key={value}>{repeatLabel[value]}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field full-field">
            <span>提醒</span>
            <select name="reminder" defaultValue={event.reminder}>
              <option value="none">不提醒</option>
              <option value="start">日程开始时</option>
              <option value="5m">提前 5 分钟</option>
              <option value="15m">提前 15 分钟</option>
              <option value="30m">提前 30 分钟</option>
              <option value="1d">提前 1 天</option>
            </select>
          </label>

          <footer>
            {mode === "edit" && onDelete ? (
              <button type="button" className="danger-button" onClick={() => onDelete(event)}>删除</button>
            ) : <span />}
            <div>
              <button type="button" className="text-button" onClick={onClose}>取消</button>
              <button type="submit" className="primary-button">保存日程</button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
