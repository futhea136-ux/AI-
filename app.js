const themes = document.querySelectorAll(".theme-button");
const micButton = document.querySelector("#micButton");
const voiceStatus = document.querySelector("#voiceStatus");
const voiceTimer = document.querySelector("#voiceTimer");
const transcript = document.querySelector("#transcript");
const confirmationCard = document.querySelector("#confirmationCard");
const confirmEvent = document.querySelector("#confirmEvent");
const textMode = document.querySelector("#textMode");
const textEntry = document.querySelector("#textEntry");
const scheduleInput = document.querySelector("#scheduleInput");
const cancelVoice = document.querySelector("#cancelVoice");
const toast = document.querySelector("#toast");
const grid = document.querySelector("#calendarGrid");

let listening = false;
let timerHandle;
let elapsed = 0;
let recognition;

themes.forEach((button) => {
  button.addEventListener("click", () => {
    document.body.dataset.theme = button.dataset.theme;
    themes.forEach((item) => item.classList.toggle("active", item === button));
  });
});

const monthCells = [
  [29, true], [30, true],
  ...Array.from({ length: 31 }, (_, index) => [index + 1, false]),
  [1, true], [2, true], [3, true], [4, true], [5, true], [6, true], [7, true], [8, true], [9, true]
];

const calendarEvents = {
  3: [{ label: "10:00 产品评审", status: "confirmed" }],
  7: [{ label: "14:00 设计沟通", status: "completed" }],
  10: [{ label: "时间待定 · 方案讨论", status: "tentative" }],
  15: [{ label: "09:30 周例会", status: "confirmed" }],
  18: [{ label: "16:00 健身", status: "confirmed" }],
  22: [{ label: "10:30 需求复盘", status: "completed" }],
  29: [
    { label: "09:30 项目例会", status: "completed" },
    { label: "15:00 客户沟通", status: "confirmed" }
  ],
  31: [{ label: "待定 · 产品方案", status: "tentative" }]
};

monthCells.forEach(([day, otherMonth], index) => {
  const cell = document.createElement("button");
  cell.type = "button";
  cell.className = `day-cell${otherMonth ? " other-month" : ""}${!otherMonth && day === 29 ? " today" : ""}`;
  cell.innerHTML = `<span class="day-number">${day}</span>`;

  if (!otherMonth && calendarEvents[day]) {
    calendarEvents[day].forEach((event) => {
      const item = document.createElement("span");
      item.className = `calendar-event ${event.status}`;
      item.textContent = event.label;
      cell.append(item);
    });
  }

  cell.setAttribute("aria-label", `${otherMonth ? "相邻月份" : "7月"}${day}日`);
  cell.dataset.index = index;
  grid.append(cell);
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2200);
}

function formatTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function stopListening(message = "已完成语音输入") {
  listening = false;
  document.body.classList.remove("listening");
  window.clearInterval(timerHandle);
  voiceStatus.textContent = message;
  if (recognition) {
    try { recognition.stop(); } catch (_) { /* recognition already stopped */ }
  }
}

function startListening() {
  listening = true;
  elapsed = 0;
  voiceTimer.textContent = "00:00";
  document.body.classList.add("listening");
  voiceStatus.textContent = "正在听，请说话…";
  timerHandle = window.setInterval(() => {
    elapsed += 1;
    voiceTimer.textContent = formatTime(elapsed);
  }, 1000);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    window.setTimeout(() => {
      stopListening("当前浏览器不支持语音识别，请使用文字输入");
      textEntry.classList.add("visible");
      scheduleInput.focus();
    }, 900);
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.onresult = (event) => {
    const result = Array.from(event.results).map((item) => item[0].transcript).join("");
    transcript.textContent = result || transcript.textContent;
    confirmationCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  recognition.onerror = () => stopListening("没有听清，请再试一次");
  recognition.onend = () => {
    if (listening) stopListening();
  };
  try {
    recognition.start();
  } catch (_) {
    stopListening("麦克风暂时不可用");
  }
}

micButton.addEventListener("click", () => {
  if (listening) stopListening();
  else startListening();
});

cancelVoice.addEventListener("click", () => {
  stopListening("已取消");
  voiceTimer.textContent = "00:00";
});

textMode.addEventListener("click", () => {
  textEntry.classList.toggle("visible");
  if (textEntry.classList.contains("visible")) scheduleInput.focus();
});

textEntry.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = scheduleInput.value.trim();
  if (!value) return;
  transcript.textContent = value;
  scheduleInput.value = "";
  textEntry.classList.remove("visible");
  showToast("小秘已整理这条日程");
});

confirmEvent.addEventListener("click", () => {
  confirmEvent.textContent = "已添加";
  confirmEvent.disabled = true;
  showToast("日程已添加到明天下午");
});

document.querySelectorAll(".completion-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".agenda-item");
    const completed = item.classList.toggle("completed");
    item.classList.toggle("confirmed", !completed);
    button.classList.toggle("checked", completed);
    button.textContent = completed ? "✓" : "";
    const tag = item.querySelector("em");
    tag.textContent = completed ? "已完成" : "已确认";
    showToast(completed ? "已标记完成，日程会继续保留" : "已恢复为未完成");
  });
});
