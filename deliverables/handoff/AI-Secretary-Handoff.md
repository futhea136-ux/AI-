# AI 小秘交接文档

## 项目信息

- 项目名称：AI 小秘
- 项目类型：免费静态 Web/PWA 原型
- 公开地址：https://futhea136-ux.github.io/AI-/
- 仓库：https://github.com/futhea136-ux/AI-.git
- 本地路径：`D:\Users\华为\Documents\drink water\ai-secretary`

## 技术栈

- Next.js
- React
- TypeScript
- GitHub Pages 静态部署
- 浏览器 localStorage 本地存储

## 当前状态

免费原型 v1.0 已完成并通过验收。核心功能包括语音/文字日程、日历、提醒、搜索、备份、日志、安装说明和本地说明。

## 运行与验证

```powershell
pnpm test
pnpm typecheck
pnpm build
```

当前测试数量：15 项。

## 数据边界

- 无账号
- 无数据库
- 无云同步
- 无真实 AI API
- 数据保存在当前浏览器本机
- 日志保留 7 天，可手动清空

## 发布方式

提交到 `main` 后推送到 GitHub，GitHub Pages 会更新公开页面。

## 后续建议

短期先试用 1-2 天，记录真实问题，再做 v1.1 修复版。

正式产品阶段可考虑：

- 登录和多设备同步
- 后端数据库
- 真正 AI 语义识别
- 手机后台可靠提醒
- Google Calendar / Outlook Calendar 同步
- 隐私与权限设置
