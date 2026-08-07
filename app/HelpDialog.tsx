"use client";

type HelpDialogProps = {
  onClose: () => void;
};

const checks = [
  "说或输入：明天晚上七点十五分提醒我烧水",
  "确认卡出现后点“确认添加”",
  "用搜索查找关键词，例如会议、王总、烧水",
  "点右上角本地，查看日志和本机保存说明",
  "点备份，导出 JSON 或 ICS 文件"
];

export default function HelpDialog({ onClose }: HelpDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="event-dialog help-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><p className="eyebrow">GUIDE</p><h2>使用说明与验收</h2></div>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="关闭">×</button>
        </header>
        <div className="help-block">
          <h3>怎么用</h3>
          <p>直接说话或输入一句日程，小秘会整理成确认卡。确认后才会写入日历。</p>
        </div>
        <div className="help-block">
          <h3>数据在哪里</h3>
          <p>日程、日志和提醒记录都保存在当前浏览器本机，不需要账号或数据库。换设备时请用备份导出和恢复。</p>
        </div>
        <div className="help-block">
          <h3>提醒限制</h3>
          <p>免费静态原型只能在页面打开或已安装应用可运行时检查提醒；网页完全关闭后的后台定时提醒不保证触发。</p>
        </div>
        <div className="help-block">
          <h3>验收清单</h3>
          <ol>
            {checks.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </div>
      </section>
    </div>
  );
}
