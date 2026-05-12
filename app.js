const jobTypes = {
  renovation: {
    name: "二装入场",
    short: "二装",
    risk: "medium",
    noticeTitle: "二装入场申办须知",
    noticeBody: "需提交施工合同、资质文件、成套图纸、人员资料和专项申请资料，资料齐全后启动审图与安全交底。",
    desc: "商铺二装进场、隔断调整、临时用电和成品保护。",
    remark: "需完成审图、临时用电确认、安全技术交底后方可进场。",
    defaultRisks: ["is_power_off"],
    gate: "安全交底、人员出入证、装修许可证"
  },
  wood_cleaning: {
    name: "幕墙清洗",
    short: "清洗",
    risk: "high",
    noticeTitle: "幕墙清洗作业须知",
    noticeBody: "按高空零星作业管理，需提交作业方案、人员特种作业证、保险与安全责任资料，并明确天气窗口、警戒范围与坠落防护措施。",
    desc: "幕墙立面清洗与高空绳索作业。",
    remark: "涉及高空清洗，需确认吊点、天气窗口、保险和坠物警戒。",
    defaultRisks: ["is_height_work"],
    gate: "高空作业人员校验、高空作业放行许可"
  },
  excavation: {
    name: "动土",
    short: "动土",
    risk: "high",
    noticeTitle: "动土作业须知",
    noticeBody: "需提交动土范围说明、安全专项方案，说明是否断电、是否夜间施工及现场负责人。",
    desc: "局部开挖检修并恢复地面。",
    remark: "开挖前需确认地下管线、线缆和周边结构风险。",
    defaultRisks: ["is_excavation"],
    gate: "地下管线确认、安全专项方案、现场围挡"
  },
  hot_work: {
    name: "动火",
    short: "动火",
    risk: "high",
    noticeTitle: "动火作业须知",
    noticeBody: "必须提交消防审批资料、人员从业资格证，并明确现场消防器材和风险控制措施。",
    desc: "焊接支架与切割旧管线。",
    remark: "现场需配灭火器、专职监护，动火后持续留观。",
    defaultRisks: ["is_hot_work", "is_power_off"],
    gate: "消防审批、动火监护、灭火器材确认"
  }
};

const projects = ["创智云城一期", "创智云城二期", "创智总部", "云智科园", "尚智科园", "乐府广场", "前海交易广场T1"];

const risks = [
  { code: "is_hot_work", label: "动火专项" },
  { code: "is_excavation", label: "动土专项" },
  { code: "is_power_off", label: "临时用电 / 断电" },
  { code: "is_height_work", label: "高空作业" },
  { code: "is_night_work", label: "夜间施工" }
];

const materialRules = [
  { code: "file_drawing", label: "施工图纸", desc: "二装需平面图、吊顶图、电力图；幕墙清洗需作业立面或吊点示意图。", mode: "conditional", jobs: ["renovation", "wood_cleaning"] },
  { code: "file_license", label: "营业执照", desc: "施工单位营业执照。", mode: "always" },
  { code: "file_qualification", label: "施工资质", desc: "施工单位资质证书。", mode: "always" },
  { code: "file_worker_cert", label: "人员从业资格证", desc: "身份证、特种作业证、施工人员出入证申请资料。", mode: "always" },
  { code: "file_insurance", label: "保险保单", desc: "高空或幕墙清洗作业需上传保险与风险责任资料。", mode: "risk", risks: ["is_height_work"], jobs: ["wood_cleaning"] },
  { code: "file_fire_approval", label: "消防审批资料", desc: "动火类作业必传。", mode: "conditional", jobs: ["hot_work"] },
  { code: "file_safety_plan", label: "安全专项方案", desc: "动土、高空、幕墙清洗或其他高风险作业必传。", mode: "risk", risks: ["is_excavation", "is_height_work"], jobs: ["excavation", "wood_cleaning"] },
  { code: "file_authorization", label: "授权委托书", desc: "装修负责人授权委托书、承诺书等。", mode: "conditional", jobs: ["renovation"] },
  { code: "file_deposit_receipt", label: "押金缴纳凭证", desc: "银行回单、转账截图或收据照片。", mode: "optional" },
  { code: "file_other", label: "其他附件", desc: "现场照片、补充说明或备用附件。", mode: "optional" }
];

const timelineNodes = ["提交申请", "初审分发", "楼栋管家审核", "部门经理审核", "安全监察审核", "项目经理终审", "结果通知", "资料归档"];

const defaultState = {
  page: "apply",
  jobType: "renovation",
  selectedRisks: ["is_power_off"],
  uploaded: ["file_license", "file_qualification", "file_worker_cert", "file_authorization"],
  statusIndex: 2,
  applyNo: "SQ202604130001",
  submitted: false,
  supplementDone: false
};

const storageKey = "special-work-mini-demo-v1";
let state = loadState();

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function activeJob() {
  return jobTypes[state.jobType];
}

function riskLevel() {
  if (state.jobType === "hot_work" || state.jobType === "excavation" || state.selectedRisks.includes("is_hot_work") || state.selectedRisks.includes("is_excavation") || state.selectedRisks.includes("is_height_work")) {
    return "高风险";
  }
  return state.selectedRisks.length ? "中风险" : "低风险";
}

function requiredMaterials() {
  return materialRules
    .map((item) => {
      const jobMatched = item.jobs?.includes(state.jobType);
      const riskMatched = item.risks?.some((risk) => state.selectedRisks.includes(risk));
      const required = item.mode === "always" || item.mode === "conditional" && jobMatched || item.mode === "risk" && (jobMatched || riskMatched);
      const visible = required || item.mode === "optional" || jobMatched || riskMatched;
      return { ...item, required, visible };
    })
    .filter((item) => item.visible);
}

function renderJobs() {
  const grid = document.querySelector("#jobGrid");
  grid.innerHTML = Object.entries(jobTypes)
    .map(([code, job]) => `
      <button class="job-card ${state.jobType === code ? "active" : ""}" data-job="${code}" type="button">
        <strong>${job.name}</strong>
        <span>${job.noticeBody}</span>
      </button>
    `)
    .join("");

  grid.querySelectorAll("[data-job]").forEach((button) => {
    button.addEventListener("click", () => {
      state.jobType = button.dataset.job;
      state.selectedRisks = [...jobTypes[state.jobType].defaultRisks];
      state.uploaded = ["file_license", "file_qualification", "file_worker_cert"];
      document.querySelector("#jobDesc").value = activeJob().desc;
      document.querySelector("#riskRemark").value = activeJob().remark;
      saveState();
      render();
    });
  });
}

function renderProjects() {
  const select = document.querySelector("#projectName");
  select.innerHTML = projects.map((project) => `<option>${project}</option>`).join("");
}

function renderNotice() {
  const job = activeJob();
  document.querySelector("#noticeTitle").textContent = job.noticeTitle;
  document.querySelector("#noticeBody").textContent = job.noticeBody;
  document.querySelector("#riskBadge").textContent = riskLevel();
  document.querySelector("#permitJob").textContent = job.name;
  document.querySelector("#permitRisk").textContent = riskLevel();
  document.querySelector("#permitGate").textContent = job.gate;
  document.querySelector("#permitUnit").textContent = `${document.querySelector("#projectName")?.value || projects[0]} · ${document.querySelector("#roomText")?.value || "A座 1208"}`;
}

function renderRisks() {
  const grid = document.querySelector("#riskGrid");
  grid.innerHTML = risks.map((risk) => `<button class="risk-chip ${state.selectedRisks.includes(risk.code) ? "active" : ""}" data-risk="${risk.code}" type="button">${risk.label}</button>`).join("");
  grid.querySelectorAll("[data-risk]").forEach((button) => {
    button.addEventListener("click", () => {
      const code = button.dataset.risk;
      state.selectedRisks = state.selectedRisks.includes(code)
        ? state.selectedRisks.filter((item) => item !== code)
        : [...state.selectedRisks, code];
      saveState();
      render();
    });
  });
}

function renderMaterials() {
  const materials = requiredMaterials();
  const required = materials.filter((item) => item.required);
  const uploadedRequired = required.filter((item) => state.uploaded.includes(item.code));
  document.querySelector("#materialCount").textContent = `${uploadedRequired.length}/${required.length}`;

  const html = materials.map((item) => `
    <article class="material-item">
      <div class="material-line">
        <strong>${item.label}</strong>
        <span class="material-tag ${item.required ? "required" : ""}">${item.required ? "必传" : "选传"}</span>
      </div>
      <p>${item.desc}</p>
      <div class="upload-row">
        <span class="upload-state">${state.uploaded.includes(item.code) ? "已上传" : "未上传"}</span>
        <button class="mini-link-button" data-upload="${item.code}" type="button">${state.uploaded.includes(item.code) ? "重新选择" : "模拟上传"}</button>
      </div>
    </article>
  `).join("");

  document.querySelector("#materialList").innerHTML = html;
  document.querySelector("#supplementList").innerHTML = materials
    .filter((item) => item.required || ["file_deposit_receipt", "file_other"].includes(item.code))
    .map((item) => `
      <article class="material-item">
        <div class="material-line">
          <strong>${item.label}</strong>
          <span class="material-tag ${state.uploaded.includes(item.code) ? "" : "required"}">${state.uploaded.includes(item.code) ? "已补齐" : "待补"}</span>
        </div>
        <p>${item.desc}</p>
        <div class="upload-row">
          <span class="upload-state">${state.uploaded.includes(item.code) ? "材料版本 v2" : "等待补件"}</span>
          <button class="mini-link-button" data-upload="${item.code}" type="button">模拟上传</button>
        </div>
      </article>
    `)
    .join("");

  document.querySelectorAll("[data-upload]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.uploaded.includes(button.dataset.upload)) {
        state.uploaded.push(button.dataset.upload);
      }
      saveState();
      render();
    });
  });
}

function renderTimeline() {
  const timeline = document.querySelector("#timeline");
  timeline.innerHTML = timelineNodes.map((node, index) => {
    const done = index < state.statusIndex;
    const current = index === state.statusIndex;
    const stateText = done ? "已完成" : current ? "处理中" : "待处理";
    return `
      <article class="timeline-item ${done ? "done" : ""} ${current ? "current" : ""}">
        <span class="timeline-dot"></span>
        <div>
          <div class="material-line">
            <strong>${node}</strong>
            <span class="timeline-state">${stateText}</span>
          </div>
          <p>${timelineCopy(node, index)}</p>
        </div>
      </article>
    `;
  }).join("");

  const currentNode = timelineNodes[state.statusIndex] || "资料归档";
  document.querySelector("#verifyText").textContent = `校验码 2001 · 当前正在${currentNode}`;
  document.querySelector("#resultTitle").textContent = state.statusIndex >= 6 ? "审批已通过，可查看结果单" : `待${currentNode}`;
  document.querySelector("#resultCopy").textContent = state.statusIndex >= 6 ? "结果单已生成，可在底部结果页查看放行条件。" : "审批通过后可查看结果单、装修许可证或特种作业放行许可。";
}

function timelineCopy(node, index) {
  const copy = {
    提交申请: "申请人提交作业信息、风险说明和材料清单。",
    初审分发: "系统按项目和楼栋分派到楼栋管家。",
    楼栋管家审核: "核对资料完整性，缺件时退回补件。",
    部门经理审核: "确认业务合规、工期和现场影响。",
    安全监察审核: "重点核验动火、动土、高空、夜间施工等风险措施。",
    项目经理终审: "确认是否具备施工放行条件。",
    结果通知: "生成结果单、许可证或特种作业放行许可。",
    资料归档: "审批链、材料版本和结果单归档。"
  };
  if (index === state.statusIndex && index === 2 && !state.supplementDone) {
    return "当前演示可进入补件页，补齐图纸、押金或专项方案后继续推进。";
  }
  return copy[node];
}

function switchPage(page) {
  state.page = page;
  saveState();
  document.querySelectorAll(".mini-page").forEach((node) => node.classList.toggle("hidden", node.dataset.page !== page));
  document.querySelectorAll(".tab").forEach((node) => node.classList.toggle("active", node.dataset.tabTarget === page));
}

function bindStaticEvents() {
  document.querySelectorAll("[data-tab-target]").forEach((button) => {
    button.addEventListener("click", () => switchPage(button.dataset.tabTarget));
  });

  document.querySelector("#submitApply").addEventListener("click", () => {
    const missing = requiredMaterials().filter((item) => item.required && !state.uploaded.includes(item.code));
    if (missing.length) {
      alert(`请先上传：${missing.map((item) => item.label).join("、")}`);
      return;
    }
    state.submitted = true;
    state.statusIndex = Math.max(state.statusIndex, 2);
    state.applyNo = `SQ${new Date().toISOString().slice(0, 10).replaceAll("-", "")}0001`;
    document.querySelector("#applyNo").textContent = state.applyNo;
    saveState();
    render();
    switchPage("progress");
  });

  document.querySelector("#advanceStatus").addEventListener("click", () => {
    state.statusIndex = Math.min(state.statusIndex + 1, timelineNodes.length - 1);
    saveState();
    render();
    if (state.statusIndex >= 6) {
      switchPage("result");
    }
  });

  document.querySelector("#submitSupplement").addEventListener("click", () => {
    state.supplementDone = true;
    ["file_drawing", "file_deposit_receipt", "file_safety_plan"].forEach((code) => {
      if (!state.uploaded.includes(code)) state.uploaded.push(code);
    });
    state.statusIndex = Math.max(state.statusIndex, 3);
    saveState();
    render();
    switchPage("progress");
  });

  document.querySelector("#resetDemo").addEventListener("click", () => {
    state = structuredClone(defaultState);
    localStorage.removeItem(storageKey);
    document.querySelector("#jobDesc").value = activeJob().desc;
    document.querySelector("#riskRemark").value = activeJob().remark;
    render();
    switchPage("apply");
  });

  ["projectName", "roomText"].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener("input", renderNotice);
    document.querySelector(`#${id}`).addEventListener("change", renderNotice);
  });
}

function render() {
  renderJobs();
  renderNotice();
  renderRisks();
  renderMaterials();
  renderTimeline();
}

renderProjects();
bindStaticEvents();
render();
switchPage(state.page);
