const DATA_URLS = ["data/student_ai_impact.csv", "student_ai_impact.csv"];

const VIEWS = {
  majorUseGpa: {
    title: "전공과 AI 사용 목적의 관계",
    kicker: "평균 GPA 변화량",
    rowField: "Major_Category",
    colField: "Primary_Use_Case",
    valueType: "gpaDelta",
    unit: "점",
    palette: "gpa",
    detail: "GPA 변화량"
  },
  timeBurnout: {
    title: "AI 사용 시간과 기존 공부 시간의 균형",
    kicker: "평균 번아웃 위험",
    rowField: "Weekly_GenAI_Hours",
    colField: "Traditional_Study_Hours",
    rowBucket: hourBucket,
    colBucket: hourBucket,
    rowOrder: ["0-5h", "5-10h", "10-15h", "15-20h", "20h+"],
    colOrder: ["0-5h", "5-10h", "10-15h", "15-20h", "20h+"],
    valueType: "burnoutScore",
    unit: "/3",
    palette: "risk",
    detail: "번아웃 위험"
  },
  yearDependency: {
    title: "학년과 AI 의존도의 시험 불안 패턴",
    kicker: "평균 시험 불안",
    rowField: "Year_of_Study",
    colField: "Perceived_AI_Dependency",
    rowOrder: ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"],
    colOrder: ["1", "2", "3", "4", "5"],
    colLabelType: "dependency",
    valueType: "anxiety",
    unit: "/10",
    palette: "risk",
    detail: "시험 불안"
  },
  skillTools: {
    title: "프롬프트 실력과 도구 다양성의 학습 유지",
    kicker: "평균 학습 유지 점수",
    rowField: "Prompt_Engineering_Skill",
    colField: "Tool_Diversity",
    rowOrder: ["Beginner", "Intermediate", "Advanced"],
    colOrder: ["1", "2", "3", "4", "5"],
    colLabelType: "toolCount",
    valueType: "retention",
    unit: "점",
    palette: "positive",
    detail: "학습 유지"
  },
  policyUseGpa: {
    title: "학교 AI 정책과 사용 목적의 관계",
    kicker: "평균 GPA 변화량",
    rowField: "Institutional_Policy",
    colField: "Primary_Use_Case",
    valueType: "gpaDelta",
    unit: "점",
    palette: "gpa",
    detail: "GPA 변화량"
  }
};

const state = {
  rows: [],
  currentView: "majorUseGpa"
};

const el = {
  sourceStatus: document.querySelector("#sourceStatus"),
  rowCount: document.querySelector("#rowCount"),
  avgAiHours: document.querySelector("#avgAiHours"),
  avgAnxiety: document.querySelector("#avgAnxiety"),
  avgRetention: document.querySelector("#avgRetention"),
  avgGpaDelta: document.querySelector("#avgGpaDelta"),
  chartKicker: document.querySelector("#chartKicker"),
  chartTitle: document.querySelector("#chartTitle"),
  sampleNote: document.querySelector("#sampleNote"),
  heatmap: document.querySelector("#heatmap"),
  detail: document.querySelector("#cellDetail"),
  metricExplain: document.querySelector("#metricExplain"),
  legend: document.querySelector("#legend"),
  legendText: document.querySelector("#legendText"),
  csvInput: document.querySelector("#csvInput"),
  thesisText: document.querySelector("#thesisText"),
  usageBars: document.querySelector("#usageBars"),
  burnoutBars: document.querySelector("#burnoutBars"),
  policyBars: document.querySelector("#policyBars")
};

init();

async function init() {
  bindControls();
  if (window.STUDENT_AI_CSV) {
    loadCsv(window.STUDENT_AI_CSV, "내장 CSV");
    return;
  }

  try {
    const text = await fetchFirstCsv(DATA_URLS);
    loadCsv(text, "기본 CSV");
  } catch (error) {
    el.sourceStatus.textContent = "CSV 파일 선택 필요";
    el.heatmap.innerHTML = `<div class="error">브라우저 보안 설정 때문에 CSV를 자동으로 읽지 못했습니다. 왼쪽에서 CSV 파일을 직접 선택해 주세요.</div>`;
  }
}

async function fetchFirstCsv(urls) {
  let lastError;
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function bindControls() {
  document.querySelectorAll(".mode").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".mode").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.currentView = button.dataset.view;
      render();
    });
  });

  el.csvInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadCsv(String(reader.result), file.name);
    reader.readAsText(file);
  });
}

function loadCsv(text, label) {
  state.rows = parseCsv(text);
  el.sourceStatus.textContent = `${label} · ${formatNumber(state.rows.length)}행`;
  render();
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",");
  return lines.map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    row.Pre_Semester_GPA = Number(row.Pre_Semester_GPA);
    row.Weekly_GenAI_Hours = Number(row.Weekly_GenAI_Hours);
    row.Tool_Diversity = Number(row.Tool_Diversity);
    row.Traditional_Study_Hours = Number(row.Traditional_Study_Hours);
    row.Perceived_AI_Dependency = Number(row.Perceived_AI_Dependency);
    row.Anxiety_Level_During_Exams = Number(row.Anxiety_Level_During_Exams);
    row.Post_Semester_GPA = Number(row.Post_Semester_GPA);
    row.Skill_Retention_Score = Number(row.Skill_Retention_Score);
    return row;
  });
}

function render() {
  if (!state.rows.length) return;
  renderSummary();
  renderEvidence();
  renderHeatmap(VIEWS[state.currentView]);
}

function renderSummary() {
  const rows = state.rows;
  const avgAi = average(rows, (row) => row.Weekly_GenAI_Hours);
  const avgAnxiety = average(rows, (row) => row.Anxiety_Level_During_Exams);
  const avgRetention = average(rows, (row) => row.Skill_Retention_Score);
  const avgDelta = average(rows, (row) => row.Post_Semester_GPA - row.Pre_Semester_GPA);
  el.rowCount.textContent = formatNumber(rows.length);
  el.avgAiHours.textContent = `${avgAi.toFixed(1)}h`;
  el.avgAnxiety.textContent = `${avgAnxiety.toFixed(1)}/10`;
  el.avgRetention.textContent = `${avgRetention.toFixed(1)}`;
  el.avgGpaDelta.textContent = `${signed(avgDelta, 3)}점`;
}

function renderEvidence() {
  const useGpa = groupedAverage("Primary_Use_Case", (row) => row.Post_Semester_GPA - row.Pre_Semester_GPA);
  const burnoutByAi = groupedAverage(
    (row) => hourBucket(row.Weekly_GenAI_Hours),
    (row) => valueFor(row, "burnoutScore")
  );
  const policyGpa = groupedAverage("Institutional_Policy", (row) => row.Post_Semester_GPA - row.Pre_Semester_GPA);

  renderBars(el.usageBars, useGpa, {
    valueLabel: (value) => `${signed(value, 3)}점`,
    labelType: "default",
    tone: "positive"
  });
  renderBars(el.burnoutBars, burnoutByAi, {
    valueLabel: (value) => `${value.toFixed(2)}/3`,
    labelType: "default",
    tone: "risk",
    order: ["0-5h", "5-10h", "10-15h", "15-20h", "20h+"]
  });
  renderBars(el.policyBars, policyGpa, {
    valueLabel: (value) => `${signed(value, 3)}점`,
    labelType: "default",
    tone: "policy"
  });

  el.thesisText.textContent =
    "데이터를 보면 AI 사용은 단순한 사용량보다 사용 목적, 의존도, 기존 공부 시간과 함께 볼 때 더 분명한 패턴이 나타납니다.";
}

function groupedAverage(groupFieldOrFn, valueFn) {
  const groups = new Map();
  state.rows.forEach((row) => {
    const label = String(typeof groupFieldOrFn === "function" ? groupFieldOrFn(row) : row[groupFieldOrFn]);
    if (!groups.has(label)) groups.set(label, { label, sum: 0, count: 0 });
    const group = groups.get(label);
    group.sum += valueFn(row);
    group.count += 1;
  });
  return [...groups.values()]
    .map((group) => ({ ...group, value: group.sum / group.count }))
    .sort((a, b) => b.value - a.value);
}

function renderBars(target, items, options) {
  const sorted = options.order
    ? [...items].sort((a, b) => options.order.indexOf(a.label) - options.order.indexOf(b.label))
    : [...items].sort((a, b) => b.value - a.value);
  const values = sorted.map((item) => item.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const range = max - min || 1;

  target.innerHTML = sorted
    .map((item) => {
      const width = Math.max(4, ((item.value - min) / range) * 100);
      const label = formatAxisLabel(item.label, options.labelType);
      const tone = options.tone || "";
      return `
        <div class="bar-row">
          <div class="bar-meta">
            <span>${label}</span>
            <strong>${options.valueLabel(item.value)}</strong>
          </div>
          <div class="bar-track">
            <div class="bar-fill ${tone}" style="width: ${width}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderHeatmap(view) {
  el.chartKicker.textContent = view.kicker;
  el.chartTitle.textContent = view.title;

  const matrix = buildMatrix(view);
  const rows = view.rowOrder || sortLabels([...matrix.rows]);
  const cols = view.colOrder || sortLabels([...matrix.cols]);
  const values = [...matrix.cells.values()].filter((cell) => cell.count > 0).map((cell) => cell.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  el.sampleNote.textContent = `${rows.length} × ${cols.length} 그룹`;
  updateLegend(view, min, max);
  el.detail.textContent = buildInsight(view, matrix);
  el.metricExplain.textContent = metricExplanation(view);

  el.heatmap.style.gridTemplateColumns = `minmax(120px, 1.1fr) repeat(${cols.length}, minmax(98px, 1fr))`;
  el.heatmap.innerHTML = "";
  el.heatmap.appendChild(axisCell(""));
  cols.forEach((col) => el.heatmap.appendChild(axisCell(formatAxisLabel(col, view.colLabelType))));

  rows.forEach((rowLabel) => {
    el.heatmap.appendChild(axisCell(formatAxisLabel(rowLabel, view.rowLabelType), "axis"));
    cols.forEach((colLabel) => {
      const key = `${rowLabel}|||${colLabel}`;
      const cell = matrix.cells.get(key);
      el.heatmap.appendChild(valueCell(cell, rowLabel, colLabel, view, min, max));
    });
  });
}

function buildMatrix(view) {
  const grouped = new Map();
  const rows = new Set();
  const cols = new Set();

  state.rows.forEach((row) => {
    const rowLabel = String(view.rowBucket ? view.rowBucket(row[view.rowField]) : row[view.rowField]);
    const colLabel = String(view.colBucket ? view.colBucket(row[view.colField]) : row[view.colField]);
    const key = `${rowLabel}|||${colLabel}`;
    const value = valueFor(row, view.valueType);
    rows.add(rowLabel);
    cols.add(colLabel);
    if (!grouped.has(key)) grouped.set(key, { sum: 0, count: 0 });
    const group = grouped.get(key);
    group.sum += value;
    group.count += 1;
  });

  grouped.forEach((group) => {
    group.value = group.sum / group.count;
  });

  return { cells: grouped, rows, cols };
}

function buildInsight(view, matrix) {
  const ranked = [...matrix.cells.entries()]
    .filter(([, cell]) => cell.count > 0)
    .sort((a, b) => b[1].value - a[1].value);
  if (!ranked.length) return "표시할 조사 결과가 없습니다.";

  const [topKey, topCell] = ranked[0];
  const [topRow, topCol] = topKey.split("|||");
  const topLabel = `${formatAxisLabel(topRow, view.rowLabelType)} × ${formatAxisLabel(topCol, view.colLabelType)}`;

  if (view.valueType === "gpaDelta") {
    const [bottomKey, bottomCell] = ranked[ranked.length - 1];
    const [bottomRow, bottomCol] = bottomKey.split("|||");
    const bottomLabel = `${formatAxisLabel(bottomRow, view.rowLabelType)} × ${formatAxisLabel(bottomCol, view.colLabelType)}`;
    return `조사 결과, ${topLabel} 조합의 GPA 변화량(학기 후 GPA - 학기 전 GPA)이 ${formatValue(topCell.value, view)}로 가장 높고, ${bottomLabel} 조합은 ${formatValue(bottomCell.value, view)}로 가장 낮습니다.`;
  }

  if (view.valueType === "burnoutScore") {
    return `조사 결과, ${topLabel} 조합에서 평균 번아웃 위험이 ${formatValue(topCell.value, view)}로 가장 높게 나타났습니다.`;
  }

  if (view.valueType === "anxiety") {
    return `조사 결과, ${topLabel} 그룹의 평균 시험 불안이 ${formatValue(topCell.value, view)}로 가장 높게 나타났습니다.`;
  }

  if (view.valueType === "retention") {
    return `조사 결과, ${topLabel} 조합의 평균 학습 유지 점수가 ${formatValue(topCell.value, view)}로 가장 높게 나타났습니다.`;
  }

  return `조사 결과, ${topLabel} 조합의 평균값이 ${formatValue(topCell.value, view)}로 가장 높게 나타났습니다.`;
}

function metricExplanation(view) {
  if (view.valueType === "gpaDelta") {
    return "여기서 +0.200점은 해당 그룹의 평균 GPA가 학기 전보다 학기 후에 0.200점 올랐다는 뜻입니다. 계산식은 학기 후 GPA - 학기 전 GPA입니다.";
  }
  if (view.valueType === "burnoutScore") {
    return "번아웃 위험은 Low=1, Medium=2, High=3으로 바꾼 뒤 그룹별 평균을 낸 값입니다.";
  }
  if (view.valueType === "anxiety") {
    return "시험 불안은 10점 척도 응답의 그룹별 평균입니다. 값이 높을수록 시험 중 불안을 더 크게 느낀다는 뜻입니다.";
  }
  if (view.valueType === "retention") {
    return "학습 유지 점수는 해당 그룹 학생들의 Skill Retention Score 평균입니다. 값이 높을수록 학습 내용을 더 잘 유지한 것으로 해석합니다.";
  }
  return "셀의 값은 해당 그룹 학생들의 평균값입니다.";
}

function valueFor(row, type) {
  if (type === "gpaDelta") return row.Post_Semester_GPA - row.Pre_Semester_GPA;
  if (type === "burnoutScore") return { Low: 1, Medium: 2, High: 3 }[row.Burnout_Risk_Level] || 0;
  if (type === "anxiety") return row.Anxiety_Level_During_Exams;
  if (type === "retention") return row.Skill_Retention_Score;
  return 0;
}

function valueCell(cell, rowLabel, colLabel, view, min, max) {
  const button = document.createElement("button");
  button.className = "cell";
  if (!cell) {
    button.innerHTML = "<strong>-</strong><span>0명</span>";
    button.disabled = true;
    return button;
  }

  const value = cell.value;
  button.style.background = colorFor(value, min, max, view.palette);
  button.innerHTML = `<strong>${formatValue(value, view)}</strong><span>${formatNumber(cell.count)}명</span>`;
  button.addEventListener("click", () => {
    const note = view.valueType === "gpaDelta" ? " (학기 후 GPA - 학기 전 GPA)" : "";
    el.detail.textContent = `${formatAxisLabel(rowLabel, view.rowLabelType)} × ${formatAxisLabel(colLabel, view.colLabelType)}: ${view.detail}${note} 평균 ${formatValue(value, view)}, 표본 ${formatNumber(cell.count)}명`;
  });
  return button;
}

function axisCell(text, extra = "corner") {
  const div = document.createElement("div");
  div.className = `axis ${extra}`;
  div.textContent = text;
  return div;
}

function colorFor(value, min, max, palette) {
  const ratio = max === min ? 0.5 : (value - min) / (max - min);
  if (palette === "risk") return mixColor([242, 246, 239], [190, 18, 60], ratio);
  if (palette === "positive") return mixColor([239, 246, 255], [15, 118, 110], ratio);
  if (palette === "gpa") {
    const centered = Math.max(-1, Math.min(1, value / Math.max(Math.abs(min), Math.abs(max), 0.001)));
    return centered >= 0
      ? mixColor([246, 247, 242], [15, 118, 110], centered)
      : mixColor([246, 247, 242], [202, 138, 4], Math.abs(centered));
  }
  return mixColor([237, 245, 241], [15, 118, 110], ratio);
}

function mixColor(a, b, t) {
  const color = a.map((part, index) => Math.round(part + (b[index] - part) * t));
  return `rgb(${color[0]} ${color[1]} ${color[2]})`;
}

function updateLegend(view, min, max) {
  if (view.palette === "risk") {
    el.legend.style.background = "linear-gradient(90deg, #f2f6ef, #e7a33e, #be123c)";
    el.legendText.textContent = `낮음 ${formatValue(min, view)} · 높음 ${formatValue(max, view)}`;
  } else if (view.palette === "gpa") {
    el.legend.style.background = "linear-gradient(90deg, #ca8a04, #f6f7f2, #0f766e)";
    el.legendText.textContent = `GPA 변화량: 감소 ${formatValue(min, view)} · 증가 ${formatValue(max, view)}`;
  } else {
    el.legend.style.background = "linear-gradient(90deg, #eff6ff, #88bcb0, #0f766e)";
    el.legendText.textContent = `낮음 ${formatValue(min, view)} · 높음 ${formatValue(max, view)}`;
  }
}

function hourBucket(value) {
  if (value < 5) return "0-5h";
  if (value < 10) return "5-10h";
  if (value < 15) return "10-15h";
  if (value < 20) return "15-20h";
  return "20h+";
}

function sortLabels(labels) {
  return labels.sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

function average(rows, accessor) {
  return rows.reduce((sum, row) => sum + accessor(row), 0) / rows.length;
}

function formatValue(value, view) {
  if (view.valueType === "gpaDelta") return `${signed(value, 3)}점`;
  if (view.valueType === "burnoutScore") return `${value.toFixed(2)}${view.unit}`;
  if (view.valueType === "anxiety") return `${value.toFixed(2)}${view.unit}`;
  return `${value.toFixed(1)}${view.unit}`;
}

function signed(value, digits) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatLabel(value) {
  const labels = {
    STEM: "STEM",
    Humanities: "인문",
    Business: "경영",
    Medical: "의학",
    Arts: "예술",
    Freshman: "1학년",
    Sophomore: "2학년",
    Junior: "3학년",
    Senior: "4학년",
    Graduate: "대학원",
    Beginner: "초급",
    Intermediate: "중급",
    Advanced: "고급",
    Allowed_With_Citation: "출처 표기 허용",
    Strict_Ban: "엄격 금지",
    No_Policy: "정책 없음",
    Actively_Encouraged: "적극 권장",
    Copywriting: "글쓰기",
    Drafting: "초안 작성",
    Ideation: "아이디어",
    Summarizing_Reading: "읽기 요약",
    Debugging: "디버깅",
    Troubleshooting: "문제 해결",
    Coding: "코딩",
    Translation: "번역",
    Direct_Answer_Generation: "직접 답변 생성"
  };
  return String(value)
    .split("/")
    .map((part) => labels[part] || labels[value] || part.replaceAll("_", " "))
    .join(" / ");
}

function formatAxisLabel(value, type) {
  const text = String(value);
  if (type === "dependency") {
    const labels = {
      1: "1 낮음",
      2: "2 약간 낮음",
      3: "3 보통",
      4: "4 높음",
      5: "5 매우 높음"
    };
    return labels[text] || text;
  }
  if (type === "toolCount") {
    return `${text}개 도구`;
  }
  return formatLabel(text);
}
