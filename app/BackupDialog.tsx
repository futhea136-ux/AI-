"use client";

import { ChangeEvent, useRef, useState } from "react";
import { exportBackup, exportIcs, importBackup } from "./backup";
import { AgendaItem } from "./schedule";

type BackupDialogProps = {
  events: AgendaItem[];
  onClose: () => void;
  onRestore: (events: AgendaItem[]) => void;
};

export default function BackupDialog({ events, onClose, onRestore }: BackupDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const restored = await importBackup(file);
      onRestore(restored);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "备份文件读取失败");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="event-dialog backup-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><p className="eyebrow">LOCAL DATA</p><h2>本地数据与备份</h2></div>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="关闭">×</button>
        </header>
        <p className="backup-notice">日程仅保存在当前浏览器。建议定期导出备份，更换设备时可手动恢复。</p>
        <div className="backup-actions">
          <button onClick={() => exportBackup(events)}>
            <span className="backup-icon">⇩</span>
            <span><strong>导出完整备份</strong><small>保存为 JSON，可恢复全部状态和重复规则</small></span>
          </button>
          <button onClick={() => inputRef.current?.click()}>
            <span className="backup-icon">⇧</span>
            <span><strong>导入备份</strong><small>使用备份文件替换当前浏览器中的日程</small></span>
          </button>
          <button onClick={() => exportIcs(events)}>
            <span className="backup-icon">日</span>
            <span><strong>导出到其他日历</strong><small>保存为 ICS，可导入系统日历或 Outlook</small></span>
          </button>
        </div>
        <input ref={inputRef} className="hidden-file-input" type="file" accept=".json,application/json" onChange={chooseFile} />
        {error && <p className="backup-error">{error}</p>}
        <footer><span /><div><button className="primary-button" onClick={onClose}>完成</button></div></footer>
      </section>
    </div>
  );
}
