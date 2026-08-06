"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import EventDialog from "./EventDialog";
import BackupDialog from "./BackupDialog";
import ReminderPanel from "./ReminderPanel";
import { DueReminder, dueReminders, reminderText } from "./reminders";
import { followUpQuestion, parseCommand, ParsedCommand } from "./assistant";
import {
  AgendaItem,
  calendarMonthCells,
  calendarWeekCells,
  createRecurringItems,
  formatDateTitle,
  localDateKey,
  repeatLabel,
  statusLabel,
  weekdayLabel
} from "./schedule";

const initialAgenda: AgendaItem[] = [];

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

export default function Home() {
  const [agenda, setAgenda] = useState<AgendaItem[]>(initialAgenda);
  const [selectedDate, setSelectedDate] = useState("2026-07-29");
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 6, 1));
  const [calendarView, setCalendarView] = useState<"month" | "week" | "list">("month");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; event: AgendaItem } | null>(null);
  const [backupOpen, setBackupOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReminder, setActiveReminder] = useState<DueReminder | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [hydrated, setHydrated] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [localHelpOpen, setLocalHelpOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [textVisible, setTextVisible] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [command, setCommand] = useState<ParsedCommand>(() => parseCommand("", new Date(2026, 6, 29)));
  const [hasCommand, setHasCommand] = useState(false);
  const [assistantReply, setAssistantReply] = useState("想安排什么？你可以直接告诉我。");
  const [pendingText, setPendingText] = useState("");
  const [toast, setToast] = useState("");
  const [added, setAdded] = useState(false);
  const [greeting, setGreeting] = useState("您好");
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const listeningRef = useRef(false);
  const voiceFinalTextRef = useRef("");
  const voiceInterimTextRef = useRef("");
  const finishVoiceOnEndRef = useRef(false);
  const voiceSubmittedRef = useRef(false);
  const voiceFallbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 11 ? "早上好" : hour < 18 ? "下午好" : "晚上好");
    setOnline(navigator.onLine);
  }, []);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !("serviceWorker" in navigator)) return;
    const basePath = window.location.pathname.startsWith("/AI-/") ? "/AI-" : "";
    navigator.serviceWorker.register(`${basePath}/sw.js`).then((registration) => {
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      });
    }).catch(() => undefined);

    const handleControllerChange = () => setUpdateReady(true);
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
  }, [hydrated]);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", () => setInstallPrompt(null), { once: true });
    return () => window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
  }, []);

  async function installApp() {
    if (!installPrompt) {
      setInstallHelpOpen(true);
      return;
    }
    await installPrompt.prompt();
    setInstallPrompt(null);
  }

  const calendarYear = currentMonth.getFullYear();
  const calendarMonth = currentMonth.getMonth() + 1;
  const today = new Date();
  const todayKey = localDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const visibleEvents = useMemo(
    () => agenda.flatMap((item) => createRecurringItems(item, calendarYear, calendarMonth)),
    [agenda, calendarMonth, calendarYear]
  );
  const visibleCells = useMemo(
    () => calendarView === "week" ? calendarWeekCells(selectedDate) : calendarMonthCells(calendarYear, calendarMonth),
    [calendarMonth, calendarView, calendarYear, selectedDate]
  );
  const displayEvents = useMemo(() => {
    if (calendarView !== "week") return visibleEvents;
    const months = Array.from(new Set(visibleCells.map((cell) => cell.key.slice(0, 7))));
    return months.flatMap((yearMonth) => {
      const [year, month] = yearMonth.split("-").map(Number);
      return agenda.flatMap((item) => createRecurringItems(item, year, month));
    });
  }, [agenda, calendarView, visibleCells, visibleEvents]);
  const selectedAgenda = useMemo(
    () => {
      const [year, month] = selectedDate.split("-").map(Number);
      return agenda.flatMap((item) => createRecurringItems(item, year, month))
      .filter((item) => item.date === selectedDate)
      .sort((first, second) => first.time.localeCompare(second.time));
    },
    [agenda, selectedDate]
  );
  const searchableEvents = useMemo(() => {
    const months = new Set<string>();
    agenda.forEach((item) => months.add(item.date.slice(0, 7)));
    months.add(todayKey.slice(0, 7));
    months.add(`${calendarYear}-${String(calendarMonth).padStart(2, "0")}`);
    return Array.from(months).flatMap((yearMonth) => {
      const [year, month] = yearMonth.split("-").map(Number);
      return agenda.flatMap((item) => createRecurringItems(item, year, month));
    });
  }, [agenda, calendarMonth, calendarYear, todayKey]);
  const searchResults = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return [];
    const unique = new Map<string, AgendaItem>();
    searchableEvents.forEach((event) => {
      const content = `${event.title} ${event.detail} ${event.date} ${event.time}`.toLowerCase();
      if (content.includes(keyword)) {
        unique.set(`${event.id}-${event.date}`, event);
      }
    });
    return Array.from(unique.values())
      .sort((first, second) => `${first.date}${first.time}`.localeCompare(`${second.date}${second.time}`))
      .slice(0, 20);
  }, [searchQuery, searchableEvents]);
  const todayAgenda = useMemo(
    () => agenda
      .flatMap((item) => createRecurringItems(item, today.getFullYear(), today.getMonth() + 1))
      .filter((item) => item.date === todayKey),
    [agenda, todayKey]
  );
  const tentativeTodayCount = todayAgenda.filter((item) => item.status === "tentative").length;
  const completedCount = selectedAgenda.filter((item) => item.status === "completed").length;

  useEffect(() => {
    const saved = window.localStorage.getItem("ai-secretary-events");
    if (saved) {
      try {
        setAgenda(JSON.parse(saved) as AgendaItem[]);
      } catch {
        window.localStorage.removeItem("ai-secretary-events");
      }
    }
    const current = new Date();
    const currentKey = localDateKey(current.getFullYear(), current.getMonth() + 1, current.getDate());
    setSelectedDate(currentKey);
    setCurrentMonth(new Date(current.getFullYear(), current.getMonth(), 1));
    setHydrated(true);
    setNotificationPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem("ai-secretary-events", JSON.stringify(agenda));
    }
  }, [agenda, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const check = () => {
      const delivered = new Set<string>(JSON.parse(window.localStorage.getItem("ai-secretary-delivered-reminders") || "[]"));
      const [nextReminder] = dueReminders(visibleEvents, new Date(), delivered);
      if (!nextReminder) return;

      delivered.add(nextReminder.key);
      window.localStorage.setItem("ai-secretary-delivered-reminders", JSON.stringify(Array.from(delivered).slice(-200)));
      setActiveReminder(nextReminder);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`日程提醒：${nextReminder.event.title}`, {
          body: `${nextReminder.event.time} · ${nextReminder.event.detail || "打开 AI 小秘查看详情"}`,
          tag: nextReminder.key
        });
      }
    };
    check();
    const timer = window.setInterval(check, 15_000);
    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", checkWhenVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [hydrated, visibleEvents]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function handleAssistantInput(text: string) {
    setAdded(false);
    const combined = pendingText ? `${pendingText} ${text}` : text;
    const parsed = parseCommand(combined, new Date());
    const question = followUpQuestion(parsed);
    setTranscript(text);
    setCommand(parsed);
    setHasCommand(true);

    if (question) {
      setPendingText(combined);
      setAssistantReply(question);
      return;
    }

    setPendingText("");
    if (parsed.action === "query") {
      const queryDate = parsed.date || selectedDate;
      const [queryYear, queryMonth] = queryDate.split("-").map(Number);
      const count = agenda
        .flatMap((item) => createRecurringItems(item, queryYear, queryMonth))
        .filter((item) => item.date === queryDate).length;
      setCurrentMonth(new Date(queryYear, queryMonth - 1, 1));
      setSelectedDate(queryDate);
      setAssistantReply(`${formatDateTitle(queryDate)}共有 ${count} 项安排，已经为你打开。`);
      setCommand(parsed);
      return;
    }
    const actionReplies = {
      create: "我已整理好这条日程，请确认后添加。",
      update: "我找到了相关日程，请确认是否修改。",
      delete: "删除后日程将不再显示，请确认。",
      complete: "我找到了相关日程，请确认标记为已完成。",
      query: ""
    };
    setAssistantReply(actionReplies[parsed.action]);
  }

  function findCommandTarget(parsed: ParsedCommand) {
    const targetDate = parsed.date || selectedDate;
    const [targetYear, targetMonth] = targetDate.split("-").map(Number);
    const candidates = agenda
      .flatMap((item) => createRecurringItems(item, targetYear, targetMonth))
      .filter((item) => item.date === targetDate);
    return candidates.find((item) =>
      parsed.title.includes(item.title) || item.title.includes(parsed.title)
    ) || candidates[0];
  }

  function executeCommand() {
    if (command.action === "query") return;
    if (command.action === "create") {
      const event: AgendaItem = {
        id: `event-${Date.now()}`,
        date: command.date || selectedDate,
        time: command.time || "待定",
        title: command.title || "未命名日程",
        detail: command.uncertainFields.includes("地点") ? "地点待确认" : "",
        reminder: command.reminder,
        status: command.status,
        repeat: command.repeat
      };
      setAgenda((items) => [...items, event]);
      setSelectedDate(event.date);
      setAdded(true);
      setAssistantReply("日程已经添加。你还可以继续说话修改它。");
      showToast("语音日程已添加");
      return;
    }

    const target = findCommandTarget(command);
    if (!target) {
      setAssistantReply("没有找到符合条件的日程，请换一种说法。");
      showToast("未找到相关日程");
      return;
    }
    const sourceId = target.seriesId || target.id;

    if (command.action === "delete") {
      setAgenda((items) => items.filter((item) => item.id !== sourceId));
      setAssistantReply("日程已经删除。");
      showToast("日程已删除");
      return;
    }

    setAgenda((items) => items.map((item) => {
      if (item.id !== sourceId) return item;
      if (command.action === "complete") return { ...item, status: "completed" };
      return {
        ...item,
        date: command.date || item.date,
        time: command.time || item.time,
        title: item.title,
        status: command.status,
        repeat: command.repeat !== "none" ? command.repeat : item.repeat,
        reminder: command.reminderSpecified ? command.reminder : item.reminder
      };
    }));
    setAssistantReply(command.action === "complete" ? "已标记完成，日程仍会保留。" : "日程已经修改。");
    showToast(command.action === "complete" ? "已标记完成" : "日程已修改");
  }

  function toggleCompleted(event: AgendaItem) {
    setAgenda((items) => items.map((item) => {
      const targetId = event.seriesId || event.id;
      if (item.id !== targetId) return item;
      const completed = event.status === "completed";
      showToast(completed ? "已恢复为未完成" : "已标记完成，日程会继续保留");
      return { ...item, status: completed ? "confirmed" : "completed" };
    }));
  }

  function newEvent(): AgendaItem {
    return {
      id: `event-${Date.now()}`,
      date: selectedDate,
      time: "09:00",
      title: "",
      detail: "",
      reminder: "15m",
      status: "confirmed",
      repeat: "none"
    };
  }

  function saveEvent(event: AgendaItem) {
    const sourceId = event.seriesId || event.id;
    const originalDate = dialog?.event.date || event.date;
    const isSeriesOccurrence = Boolean(event.seriesId);
    const updateAll = !isSeriesOccurrence || window.confirm("这是重复日程。确定修改全部重复日程吗？\n选择“取消”将只修改本次。");

    setAgenda((items) => {
      if (isSeriesOccurrence && !updateAll) {
        return [
          ...items.map((item) => item.id === sourceId
            ? { ...item, excludedDates: Array.from(new Set([...(item.excludedDates || []), originalDate])) }
            : item
          ),
          {
            ...event,
            id: `event-${Date.now()}`,
            seriesId: undefined,
            repeat: "none" as const,
            excludedDates: undefined
          }
        ];
      }
      const existing = items.some((item) => item.id === sourceId);
      if (!existing) return [...items, { ...event, id: sourceId, seriesId: undefined }];
      return items.map((item) => item.id === sourceId
        ? { ...event, id: sourceId, seriesId: undefined }
        : item
      );
    });
    setSelectedDate(event.date);
    setDialog(null);
    showToast(dialog?.mode === "create" ? "日程已创建" : "日程已保存");
  }

  function deleteEvent(event: AgendaItem) {
    const sourceId = event.seriesId || event.id;
    const isSeries = event.repeat !== "none" || Boolean(event.seriesId);
    const deleteAll = !isSeries || window.confirm("这是重复日程。确定删除全部重复日程吗？\n选择“取消”将只删除本次。");

    if (deleteAll) {
      setAgenda((items) => items.filter((item) => item.id !== sourceId));
      showToast(isSeries ? "全部重复日程已删除" : "日程已删除");
    } else {
      setAgenda((items) => items.map((item) => item.id === sourceId
        ? { ...item, excludedDates: Array.from(new Set([...(item.excludedDates || []), event.date])) }
        : item
      ));
      showToast("仅本次日程已删除");
    }
    setDialog(null);
  }

  function restoreBackup(events: AgendaItem[]) {
    if (!window.confirm(`备份中有 ${events.length} 条日程，将替换当前浏览器中的全部日程。确定继续吗？`)) return;
    setAgenda(events);
    setBackupOpen(false);
    showToast("备份恢复完成");
  }

  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    showToast(permission === "granted" ? "浏览器通知已开启" : "未开启浏览器通知，页面内提醒仍有效");
  }

  function toggleListening() {
    if (listening) {
      listeningRef.current = false;
      finishVoiceOnEndRef.current = true;
      setVoiceProcessing(true);
      voiceFallbackTimerRef.current = window.setTimeout(submitCapturedVoice, 1200);
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognitionClass =
      (window as Window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setTextVisible(true);
      showToast("当前浏览器不支持语音识别，请使用文字输入");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "zh-CN";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript || "";
        if (result.isFinal) voiceFinalTextRef.current += text;
        else interim += text;
      }
      voiceInterimTextRef.current = interim;
      const fullText = `${voiceFinalTextRef.current}${interim}`.trim();
      if (fullText) setTranscript(fullText);
    };
    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" && listeningRef.current) return;
      listeningRef.current = false;
      setListening(false);
      setVoiceProcessing(false);
      showToast("没有听清，请再试一次");
    };
    recognition.onend = () => {
      if (finishVoiceOnEndRef.current) {
        finishVoiceOnEndRef.current = false;
        submitCapturedVoice();
        return;
      }
      if (listeningRef.current) {
        window.setTimeout(() => {
          try {
            recognition.start();
          } catch {
            listeningRef.current = false;
            setListening(false);
          }
        }, 150);
        return;
      }
      setListening(false);
    };
    recognitionRef.current = recognition;
    voiceFinalTextRef.current = "";
    voiceInterimTextRef.current = "";
    finishVoiceOnEndRef.current = false;
    voiceSubmittedRef.current = false;
    if (voiceFallbackTimerRef.current !== null) {
      window.clearTimeout(voiceFallbackTimerRef.current);
      voiceFallbackTimerRef.current = null;
    }
    setVoiceProcessing(false);
    listeningRef.current = true;
    setListening(true);
    recognition.start();
  }

  function submitCapturedVoice() {
    if (voiceSubmittedRef.current) return;
    const text = `${voiceFinalTextRef.current}${voiceInterimTextRef.current}`.trim();
    if (!text) {
      setVoiceProcessing(false);
      showToast("没有听到有效内容，请再试一次");
      return;
    }
    voiceSubmittedRef.current = true;
    if (voiceFallbackTimerRef.current !== null) {
      window.clearTimeout(voiceFallbackTimerRef.current);
      voiceFallbackTimerRef.current = null;
    }
    handleAssistantInput(text);
    setVoiceProcessing(false);
  }

  function cancelListening() {
    listeningRef.current = false;
    finishVoiceOnEndRef.current = false;
    voiceSubmittedRef.current = true;
    voiceFinalTextRef.current = "";
    voiceInterimTextRef.current = "";
    if (voiceFallbackTimerRef.current !== null) {
      window.clearTimeout(voiceFallbackTimerRef.current);
      voiceFallbackTimerRef.current = null;
    }
    recognitionRef.current?.stop();
    setListening(false);
    setVoiceProcessing(false);
  }

  function submitText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = String(form.get("schedule") || "").trim();
    if (!value) return;
    handleAssistantInput(value);
    setTextVisible(false);
    event.currentTarget.reset();
    showToast("小秘已整理这条日程");
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="AI 小秘首页">
          <span className="brand-mark">秘</span>
          <span><strong>AI 小秘</strong><small>会听、会记、会提醒</small></span>
        </a>
        <div className="product-mode">
          <span className="mode-spark">✦</span>
          <span><strong>智能日历</strong><small>专业效率 × AI 对话</small></span>
        </div>
        <div className="topbar-actions">
          <button className="reminder-button" onClick={() => setReminderOpen(true)} aria-label="提醒中心">
            <span>铃</span>
            {notificationPermission !== "granted" && <i />}
          </button>
          <button className="backup-button" onClick={() => setSearchOpen(true)}>搜索</button>
          <button className="backup-button" onClick={() => setBackupOpen(true)}>备份</button>
          <button className="backup-button" onClick={installApp}>{installPrompt ? "安装" : "安装说明"}</button>
          <button
            className={`avatar local-status ${online ? "online" : "offline"}`}
            aria-label="本地数据状态"
            onClick={() => setLocalHelpOpen(true)}
          >
            {online ? "本地" : "离线"}
          </button>
        </div>
      </header>

      <section className="workspace">
        <aside className="assistant-panel">
          <div className="assistant-heading">
            <div className="assistant-orb"><span /></div>
            <div>
              <p className="eyebrow">AI ASSISTANT</p>
              <h1>{greeting}，有什么可以帮你？</h1>
              <p>今天有 {todayAgenda.length} 项安排，{tentativeTodayCount} 项待确认。</p>
            </div>
          </div>

          <div className="conversation">
            <div className="message assistant-message">
              <span className="message-dot" /><p>{assistantReply}</p>
            </div>
            {transcript && <div className="message user-message"><p>{transcript}</p></div>}
            {hasCommand && !listening && !voiceProcessing && command.missingFields.length > 0 && (
              <div className="command-missing-note" role="status">
                <strong>还不能确认</strong>
                <p>
                  已识别：{command.title || "未识别事项"}
                  {command.time ? `，${command.time}` : ""}
                  ；还需要：{command.missingFields.join("、")}
                </p>
              </div>
            )}
            {hasCommand && !listening && !voiceProcessing && command.action !== "query" && command.missingFields.length === 0 && (
            <div className="event-confirmation">
              <div className="confirmation-top">
                <span className="success-icon">✓</span>
                <div>
                  <small>{command.action === "create" ? "准备创建" : command.action === "update" ? "准备修改" : command.action === "delete" ? "准备删除" : "准备完成"}</small>
                  <strong>{command.title || "相关日程"}</strong>
                </div>
                <span className={`status-chip ${command.status}`}>{statusLabel[command.status]}</span>
              </div>
              <dl>
                <div>
                  <dt>日期</dt>
                  <dd>{command.date ? formatDateTitle(command.date) : "按当前日历"}{command.assumedDate === "today" ? "（默认今天）" : ""}</dd>
                </div>
                <div><dt>时间</dt><dd className={command.time === "待定" ? "uncertain" : ""}>{command.time || "保持原时间"}</dd></div>
                <div><dt>重复</dt><dd>{repeatLabel[command.repeat]}</dd></div>
                <div><dt>提醒</dt><dd>{reminderText(command.reminder)}</dd></div>
              </dl>
              <div className="confirmation-actions">
                <button className="text-button" onClick={() => setTextVisible(true)}>修改</button>
                <button
                  className="primary-button"
                  disabled={added}
                  onClick={executeCommand}
                >
                  {added && command.action === "create" ? "已添加" : command.action === "create" ? "确认添加" : command.action === "delete" ? "确认删除" : command.action === "complete" ? "确认完成" : "确认修改"}
                </button>
              </div>
            </div>
            )}
          </div>

          <div className="voice-box">
            <div className="voice-status">
              <span className="listening-dot" />
              <span>{voiceProcessing ? "正在整理语音…" : listening ? "正在听，停顿后可继续；再点麦克风完成" : "点击麦克风开始说话"}</span>
              <time>00:00</time>
            </div>
            <div className="waveform" aria-hidden="true">
              {Array.from({ length: 11 }, (_, index) => <i key={index} />)}
            </div>
            <div className="voice-controls">
              <button className="input-mode" onClick={() => setTextVisible((value) => !value)} aria-label="文字输入">⌨</button>
              <button className="mic-button" onClick={toggleListening} disabled={voiceProcessing} aria-label={listening ? "完成语音输入" : "开始语音输入"}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-5a3.5 3.5 0 0 0-7 0v5A3.5 3.5 0 0 0 12 15Z"/>
                  <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/>
                </svg>
              </button>
              <button className="input-mode" onClick={cancelListening} aria-label="取消输入">×</button>
            </div>
            <form className={`text-entry${textVisible ? " visible" : ""}`} onSubmit={submitText}>
              <input name="schedule" type="text" placeholder="例如：周五下午和王总见面，时间待定" />
              <button type="submit">发送</button>
            </form>
            <p className="voice-hint">试着说：“周五的会议改到下午四点”</p>
          </div>
        </aside>

        <section className="calendar-panel">
          <header className="calendar-header">
            <div><p className="eyebrow">MY CALENDAR</p><h2>{calendarYear}年 {calendarMonth}月</h2></div>
            <div className="calendar-tools">
              <div className="view-tabs">
                <button className={calendarView === "month" ? "active" : ""} onClick={() => setCalendarView("month")}>月</button>
                <button className={calendarView === "week" ? "active" : ""} onClick={() => setCalendarView("week")}>周</button>
                <button className={calendarView === "list" ? "active" : ""} onClick={() => setCalendarView("list")}>日程</button>
              </div>
              <button className="today-button" onClick={() => {
                const today = new Date();
                setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelectedDate(localDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate()));
              }}>今天</button>
              <button className="icon-button" aria-label="上个月" onClick={() => {
                const previous = new Date(calendarYear, calendarMonth - 2, 1);
                setCurrentMonth(previous);
                setSelectedDate(localDateKey(previous.getFullYear(), previous.getMonth() + 1, 1));
              }}>‹</button>
              <button className="icon-button" aria-label="下个月" onClick={() => {
                const next = new Date(calendarYear, calendarMonth, 1);
                setCurrentMonth(next);
                setSelectedDate(localDateKey(next.getFullYear(), next.getMonth() + 1, 1));
              }}>›</button>
            </div>
          </header>
          <div className="weekdays" aria-hidden="true">
            {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((day) => <span key={day}>{day}</span>)}
          </div>
          {calendarView !== "list" ? (
          <div className={`calendar-grid${calendarView === "week" ? " week-grid" : ""}`} aria-label={`${calendarYear}年${calendarMonth}月日历`}>
            {visibleCells.map(({ key, day, otherMonth }) => (
              <button
                type="button"
                className={`day-cell${otherMonth ? " other-month" : ""}${key === todayKey ? " today" : ""}${selectedDate === key ? " selected" : ""}`}
                key={key}
                aria-label={`${key}日程`}
                onClick={() => {
                  setSelectedDate(key);
                }}
              >
                <span className="day-number">{day}</span>
                {displayEvents.filter((event) => event.date === key).slice(0, 3).map((event, eventIndex) => (
                  <span className={`calendar-event ${event.status}`} key={eventIndex}>{event.time} {event.title}</span>
                ))}
              </button>
            ))}
          </div>
          ) : (
            <div className="calendar-list">
              {visibleEvents.length === 0 ? <p>本月没有日程</p> : visibleEvents
                .slice()
                .sort((first, second) => `${first.date}${first.time}`.localeCompare(`${second.date}${second.time}`))
                .map((event) => (
                  <button key={`${event.id}-${event.date}`} onClick={() => setSelectedDate(event.date)}>
                    <time>{formatDateTitle(event.date)}<small>{event.time}</small></time>
                    <span><strong>{event.title}</strong><small>{event.detail || repeatLabel[event.repeat]}</small></span>
                    <em className={event.status}>{statusLabel[event.status]}</em>
                  </button>
                ))}
            </div>
          )}
          <div className="calendar-legend">
            <span><i className="confirmed-key" />已确认</span>
            <span><i className="tentative-key" />待确认</span>
            <span><i className="completed-key">✓</i>已完成</span>
          </div>
        </section>

        <aside className="detail-panel">
          <header className="detail-header">
            <div>
              <p className="eyebrow">SELECTED DAY</p>
              <h2>{formatDateTitle(selectedDate)}</h2>
              <span>{weekdayLabel(selectedDate)} · {selectedAgenda.length}项安排</span>
            </div>
            <button className="add-button" aria-label="新增日程" onClick={() => setDialog({ mode: "create", event: newEvent() })}>＋</button>
          </header>
          <div className="day-progress">
            <div><span>当日进度</span><strong>{completedCount} / {selectedAgenda.length}</strong></div>
            <div className="progress-track"><span style={{ width: `${selectedAgenda.length ? completedCount / selectedAgenda.length * 100 : 0}%` }} /></div>
          </div>
          <ol className="agenda-list">
            {selectedAgenda.length === 0 && (
              <li className="empty-agenda">
                <span>这一天还没有安排</span>
                <button onClick={() => setDialog({ mode: "create", event: newEvent() })}>新增日程</button>
              </li>
            )}
            {selectedAgenda.map((item) => (
              <li className={`agenda-item ${item.status}`} key={item.id}>
                <time>{item.time}</time>
                <button
                  className={`completion-toggle${item.status === "completed" ? " checked" : ""}`}
                  onClick={() => toggleCompleted(item)}
                  aria-label={item.status === "completed" ? "恢复为未完成" : "标记为已完成"}
                >
                  {item.status === "completed" ? "✓" : ""}
                </button>
                <div>
                  <strong>{item.title}</strong><span>{item.detail}</span>
                  <em>{statusLabel[item.status]}{item.repeat !== "none" ? ` · ${repeatLabel[item.repeat]}` : ""}</em>
                </div>
                <button
                  className="more-button"
                  aria-label="修改日程"
                  onClick={() => setDialog({ mode: "edit", event: item })}
                >•••</button>
              </li>
            ))}
          </ol>
          <div className="focus-card">
            <span className="focus-icon">✦</span>
            <div><small>小秘建议</small><p>下午两场安排间隔充足，无时间冲突。</p></div>
          </div>
        </aside>
      </section>
      {dialog && (
        <EventDialog
          event={dialog.event}
          mode={dialog.mode}
          onClose={() => setDialog(null)}
          onSave={saveEvent}
          onDelete={dialog.mode === "edit" ? deleteEvent : undefined}
        />
      )}
      {backupOpen && (
        <BackupDialog
          events={agenda}
          onClose={() => setBackupOpen(false)}
          onRestore={restoreBackup}
        />
      )}
      {reminderOpen && (
        <ReminderPanel
          events={visibleEvents}
          permission={notificationPermission}
          onClose={() => setReminderOpen(false)}
          onRequestPermission={requestNotificationPermission}
        />
      )}
      {installHelpOpen && (
        <section className="install-help" role="dialog" aria-modal="true" aria-label="安装说明">
          <div>
            <strong>安装 AI 小秘</strong>
            <p>Chrome 或 Edge：点地址栏右侧的安装图标，或打开右上角菜单，选择“应用 / 安装此网站”。</p>
            <p>如果已经安装过，浏览器就不会再显示安装按钮。</p>
          </div>
          <button onClick={() => setInstallHelpOpen(false)}>知道了</button>
        </section>
      )}
      {searchOpen && (
        <section className="search-panel" role="dialog" aria-modal="true" aria-label="搜索日程">
          <header>
            <strong>搜索日程</strong>
            <button onClick={() => setSearchOpen(false)} aria-label="关闭搜索">×</button>
          </header>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            autoFocus
            placeholder="输入关键词，例如：会议、王总、烧水"
          />
          <div className="search-results">
            {!searchQuery.trim() && <p>输入关键词后，会在本地日程中查找。</p>}
            {searchQuery.trim() && searchResults.length === 0 && <p>没有找到匹配日程。</p>}
            {searchResults.map((event) => (
              <button
                key={`${event.id}-${event.date}`}
                onClick={() => {
                  const [year, month] = event.date.split("-").map(Number);
                  setCurrentMonth(new Date(year, month - 1, 1));
                  setSelectedDate(event.date);
                  setSearchOpen(false);
                }}
              >
                <time>{formatDateTitle(event.date)}<small>{event.time}</small></time>
                <span><strong>{event.title}</strong><small>{event.detail || statusLabel[event.status]}</small></span>
                <em className={event.status}>{statusLabel[event.status]}</em>
              </button>
            ))}
          </div>
        </section>
      )}
      {localHelpOpen && (
        <section className="install-help" role="dialog" aria-modal="true" aria-label="本地数据说明">
          <div>
            <strong>{online ? "本机保存中" : "离线可用中"}</strong>
            <p>日程保存在当前浏览器本机，不需要数据库，也不会自动上传。</p>
            <p>{online ? "当前网络正常；断网后已缓存页面仍可打开。" : "当前离线；可以查看和编辑本地日程，语音识别可能受浏览器限制。"}</p>
          </div>
          <button onClick={() => setLocalHelpOpen(false)}>知道了</button>
        </section>
      )}
      {activeReminder && (
        <section className="reminder-alert" role="alertdialog" aria-modal="true">
          <span className="alert-icon">铃</span>
          <div>
            <small>日程提醒</small>
            <strong>{activeReminder.event.title}</strong>
            <p>{activeReminder.event.time} · {activeReminder.event.detail || "日程即将开始"}</p>
          </div>
          <button onClick={() => setActiveReminder(null)}>知道了</button>
        </section>
      )}
      {updateReady && (
        <section className="update-notice" role="status">
          <div>
            <strong>发现新版本</strong>
            <p>刷新后即可使用最新功能，已保存的日程不会丢失。</p>
          </div>
          <button onClick={() => window.location.reload()}>刷新</button>
        </section>
      )}
      <div className={`toast${toast ? " visible" : ""}`} role="status">{toast}</div>
    </main>
  );
}
