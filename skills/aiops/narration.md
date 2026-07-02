# User-facing narration for Flow Conductor

Plain-language templates keyed by `narration_key` from `skills/aiops/scripts/phases.py`.

## Language

**Default Chinese** for all user-visible text (`title_zh`, `body_zh`, `artifact_zh`, action labels). **English only** in `title_en` — do not show `body_en` or `artifact_en` unless user asks for English.

## Template

```
**第 {step}/{total} 步 · {title_zh}** ({title_en})

{body_zh}

完成后你会得到：{artifact_zh}

[继续] / [暂停，下次再说] / [我想调整方向]
```

Expert override: `/aiops <agent-name> …` skips narration but still updates `flow.state.yaml`.

## Keys

### bootstrap

- title_zh: 项目准备
- title_en: Project setup
- body_zh: 我会用最少的问题配置 issue 跟踪和领域文档，这样后面不用记额外命令。
- artifact_zh: `docs/agents/` 配置 + 可选的 `CONTEXT.md` 布局

### triage

- title_zh: 整理待办
- title_en: Triage backlog
- body_zh: 我会把这条请求分类、核实，并写成 agent 能直接开工的 brief。
- artifact_zh: triage 状态 + agent-ready brief

### align

- title_zh: 对齐需求
- title_en: Align on the idea
- body_zh: 我会问你几个选择题，避免做错方向。有代码库时我会先自己查，再问你拿不准的。
- artifact_zh: 对齐结论（写入后续设计笔记）

### align_architecture

- title_zh: 深化所选架构项
- title_en: Deepen the chosen architecture item
- body_zh: 你已从架构报告里选了一项。我会 grill 这项改动的约束与边界，并更新领域文档。
- artifact_zh: CONTEXT.md / ADR 更新 + 对齐结论

### graph_build

- title_zh: 准备代码图谱
- title_en: Prepare code graph
- body_zh: 如果还没有代码图谱，我会先构建一份（需要 graphify）。图谱已就绪且够新就跳过，直接进入架构扫描。
- artifact_zh: `graphify-out/graph.json`（可选；跳过则扫描用有机探索）

### architecture_scan

- title_zh: 扫描架构机会
- title_en: Architecture health scan
- body_zh: 如果代码图谱已就绪，我会基于图谱做增强分析；否则会直接探索代码。最终用 HTML 报告展示可深化的模块，你选一个我们再继续。
- artifact_zh: 架构报告（临时目录）+ 你选中的 deepening candidate

### design

- title_zh: 设计方案
- title_en: Design spec
- body_zh: 把对齐结论整理成设计笔记和技术规格，供实现和评审使用。
- artifact_zh: `NOTES.md` + `tech-spec.md` + 可选的 `CONTEXT.md` / ADR 更新

### ui_mockup

- title_zh: 界面草图
- title_en: UI mockup
- body_zh: 生成可浏览器预览的 HTML/CSS 草图，确认样子再写代码。
- artifact_zh: `mockups/` + `design-notes.md`

### design_review

- title_zh: 设计评审
- title_en: Design review
- body_zh: 独立检查设计是否过度工程、是否与领域文档一致。未 APPROVE 不会进入实现。
- artifact_zh: `DESIGN_REVIEW.md`（需 Verdict: APPROVE）

### explore

- title_zh: 自由探索
- title_en: Explore ideas
- body_zh: 在动手之前，我们先聊聊想法、比较方案、权衡利弊。不会写入任何文件。
- artifact_zh: 方案对比（仅在对话中，不持久化）

### task_breakdown

- title_zh: 任务拆分
- title_en: Task breakdown
- body_zh: 把实现工作拆成有序的垂直切片子任务，每个子任务有明确验收标准，在当前会话内依次完成。
- artifact_zh: `tasks.md`（有序子任务列表）

### task_breakdown_review

- title_zh: 确认父任务
- title_en: Confirm parent tasks
- body_zh: 我已生成粗粒度父任务，请确认或调整后我再展开子任务。
- artifact_zh: 父任务列表（已确认）

### planning_prd

- title_zh: 写成 PRD
- title_en: Write PRD
- body_zh: 把设计整理成产品需求文档，方便拆任务和跨会话交接。
- artifact_zh: `PRD.md`

### planning_issues

- title_zh: 拆成子任务
- title_en: Split into issues
- body_zh: 按垂直切片拆 issue，每个 issue 有明确验收标准。
- artifact_zh: `plan.md` + `issues/*.md`

### issue_session

- title_zh: 新会话开工
- title_en: Fresh issue session
- body_zh: 建议为新 issue 开一个新聊天，避免上下文过长。我会写 handoff 并更新 journey。
- artifact_zh: handoff 摘要 + `flow.state.yaml` 中的 `current_issue`

### prototype_branch / prototype / prototype_return

- prototype_branch: 先开原型会话 — body_zh: 有个问题需要跑通代码才能定案，我会准备 handoff 给原型会话。
- prototype: 快速原型 — body_zh: 用可丢弃代码验证关键假设，不追求质量。
- prototype_return: 带回结论 — body_zh: 把原型结论写进 `VERDICT.md`，再吸收进设计或 PRD。

### diagnose

- title_zh: 定位问题
- title_en: Diagnose bug
- body_zh: 复现、缩小范围、形成假设，再进入修复。
- artifact_zh: 诊断结论 + 最小复现步骤

### implement

- title_zh: 实现与质量门
- title_en: Implement with quality gates
- body_zh: 按最小代码实现，依次经过测试、精简、评审。只有你明确要求才会提交。
- artifact_zh: 源码 + 测试 + `REVIEW.md` APPROVE

### drift_check

- title_zh: 漂移检测
- title_en: Drift check
- body_zh: 对照设计规格检查实现是否偏离，确保代码忠实于设计意图。
- artifact_zh: `DRIFT_REPORT.md`

### ship

- title_zh: 提交与推送
- title_en: Ship
- body_zh: 所有门控通过后，按你的指示 commit / push。
- artifact_zh: git commit（仅在你确认后）

### skill_authoring

- title_zh: 新技能
- title_en: New personal skill
- body_zh: 按 checklist 定义触发方式、步骤和参考文件，再编写 `SKILL.md`。
- artifact_zh: 新 skill 目录 + 注册说明
