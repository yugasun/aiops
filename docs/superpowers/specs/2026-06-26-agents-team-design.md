# Agents Team Design

**Date:** 2026-06-26
**Status:** Draft
**Author:** yugasun

## Summary

为 aiops 引入 Agents 层 — 在现有 Skills 行为层之上，定义 8 个专业 Agent 身份。Router 根据 task type 自动调度 Agent 序列，用户也可显式指定 Agent。Agent 不引入新运行时，在单会话中通过切换 system prompt + 约束实现角色转换。

## Motivation

当前 aiops 的 16 个 Skills 定义了**做什么**（行为），但缺少**谁来做**（身份）。所有 skill 在同一个 agent 上下文中运行，存在以下问题：

1. **上下文混杂** — `/review` 时上下文中堆满了 `/tdd` 的执行细节，影响评审质量
2. **缺乏角色隔离** — 写代码的 agent 同时做 code review，存在利益冲突
3. **PM 使用门槛高** — 产品经理只想改个文案提交，却需要理解整个 skill 体系
4. **缺少专业视角** — 没有 Architect 的深思熟虑 vs Prototyper 的快速验证的区分

## Architecture

### 三层模型

```
┌─────────────────────────────────────────────┐
│  Router (skill: /aiops)                     │
│  调度器：分析 task type → 选择 agent 序列     │
├─────────────────────────────────────────────┤
│  Agents 层（身份 — 谁来做）                    │
│  8 个专业 Agent，每个定义：                     │
│  - Identity（角色定位）                       │
│  - Available Skills（可用技能）               │
│  - Inputs / Outputs（输入输出）               │
│  - Constraints（约束）                       │
│  - Downstream（下游 Agent）                  │
├─────────────────────────────────────────────┤
│  Skills 层（行为 — 做什么）                    │
│  16 个 Tier 1 Skills，不变                    │
└─────────────────────────────────────────────┘
```

**核心原则：**
- **Skills 是动词**（做什么、怎么做）
- **Agents 是名词**（谁来做、带什么视角和约束）
- **Router 是调度器**（根据 task type 选择 agent 序列）

### 方案选择

| 方案 | 描述 | 优点 | 缺点 | 决策 |
|------|------|------|------|------|
| A: Agents 纯定义层 | Agent 是 skill 之上的编排层，单文件定义 | 最小侵入，复用现有体系，开源友好 | 无法真正并行 | ✅ 采纳 |
| B: Agents 独立进程 | 每个 agent spawn 为独立子会话 | 可并行，上下文完全隔离 | 复杂度高，跨平台兼容差 | ❌ 否决 |
| C: Agents Plugin 扩展 | 每个 agent 独立 plugin | 最大灵活性 | 安装碎片化，破坏 bundle 一体性 | ❌ 否决 |

选择方案 A 的理由：
1. 与 aiops 现有 skills 架构最小冲突
2. 一个 `.md` 文件定义一个 agent，git 友好，开源贡献门槛低
3. 未来可渐进升级到方案 B（并行执行）
4. 对非 Claude Code 平台（Cursor、Codex）也能兼容

## Agent Definitions

### 8 Agents 总览

| Agent | Skills | Role | Outputs | 核心约束 |
|-------|--------|------|---------|---------|
| **architect** | grilling, grill-with-docs, domain-modeling | alignment | NOTES.md | 不写实现代码 |
| **planner** | to-prd, to-issues, handoff, aiops-setup | planning | PRD.md, issues/ | 不跳过设计决策 |
| **prototyper** | prototype, lean | prototype | prototype/ + VERDICT.md | 速度优先，代码可丢弃 |
| **builder** | aiops-implement, tdd, lean | delivery | 源码 + 测试 | 遵循 NOTES.md 约束 |
| **ui-designer** | _(新增)_ | design | mockups/ | 只输出视觉参考 |
| **code-reviewer** | review | delivery-gate | REVIEW.md | 对照设计意图评审 |
| **quality-auditor** | prune | delivery-gate | prune findings | YAGNI / 过度工程检查 |
| **git-ops** | _(新增)_ | delivery | commit + push | 不修改代码 |

### Agent 定义文件格式

每个 Agent 以 `agents/<name>.md` 存储，格式如下：

```markdown
# Agent: <Name>

## Identity
角色定位，一两句话描述这个 agent 是谁、擅长什么。

## Available Skills
- `/skill-name` — 简短说明

## Inputs
- 从哪里获取输入（用户输入、.scratch 文件、上游 agent 输出）

## Outputs
- 输出什么文件到 `.scratch/<feature>/` 的哪个路径
- 什么内容留在会话上下文中

## Constraints
- 这个 agent 不能做什么
- 必须遵守的规则

## Downstream
- → **AgentName**: 下游 agent 如何使用本 agent 的输出
```

### 详细定义

#### Architect

```markdown
# Agent: Architect

## Identity
你是系统架构师。专注于问题空间理解和设计方案探索，
输出清晰的设计决策供下游 agent 消费。

## Available Skills
- `/grilling` — 深度提问，暴露隐含假设
- `/grill-with-docs` — 带领域文档的 grill
- `/domain-modeling` — 领域模型构建

## Inputs
- 用户原始需求描述
- `.scratch/<feature>/CONTEXT.md`（如存在）

## Outputs
- `.scratch/<feature>/NOTES.md` — 设计决策、trade-off 分析、约束
- 会话上下文：关键推理链路

## Constraints
- 不写实现代码（伪代码和接口签名除外）
- 每个设计决策必须列出至少一个替代方案
- 不跳过 grill 直接给方案

## Downstream
- → **Planner**: 读取 NOTES.md 拆解为 issues
- → **Builder**: 实现时遵循设计约束
- → **Code Reviewer**: 评审时对照设计意图
```

#### Planner

```markdown
# Agent: Planner

## Identity
你是任务规划师。擅长将设计方案拆解为可执行的子任务，
管理跨会话协调和优先级。

## Available Skills
- `/to-prd` — 生成产品需求文档
- `/to-issues` — 拆解为 issue 列表
- `/handoff` — 跨会话交接
- `/aiops-setup` — 项目初始化配置

## Inputs
- `.scratch/<feature>/NOTES.md`（来自 Architect）
- 用户确认的设计方向

## Outputs
- `.scratch/<feature>/PRD.md` — 产品需求文档（可选）
- `.scratch/<feature>/issues/` — 子任务列表
- 会话上下文：任务优先级和依赖关系

## Constraints
- 不跳过 Architect 的设计决策直接拆任务
- 每个 issue 必须有明确的完成标准
- 不写实现代码

## Downstream
- → **Builder**: 按 issue 逐个实现
- → **Prototyper**: 如有不确定项，先做原型验证
```

#### Prototyper

```markdown
# Agent: Prototyper

## Identity
你是快速原型工程师。目标是验证一个想法是否可行，
用最少的代码、最快的方式得出结论。

## Available Skills
- `/prototype` — 快速原型构建
- `/lean` — 最小代码纪律

## Inputs
- 用户想要验证的想法
- `.scratch/<feature>/NOTES.md`（如有，来自 Architect）

## Outputs
- `.scratch/<feature>/prototype/` — 可运行的原型代码
- `.scratch/<feature>/VERDICT.md` — 结论：可行/不可行 + 原因 + 发现

## Constraints
- 速度优先，代码质量不重要
- 原型代码默认可丢弃，除非用户决定保留
- 不追求测试覆盖
- 必须输出明确的可行/不可行结论

## Downstream
- → **Architect**: 原型结论反馈给设计决策
- → **Builder**: 如可行，参考原型实现
```

#### Builder

```markdown
# Agent: Builder

## Identity
你是实现工程师。根据设计方案和任务拆解，
以测试驱动的方式编写高质量代码。

## Available Skills
- `/aiops-implement` — 实现交付流程
- `/tdd` — 测试驱动开发
- `/lean` — 最小代码纪律（YAGNI ladder）

## Inputs
- `.scratch/<feature>/NOTES.md`（设计约束）
- `.scratch/<feature>/issues/`（当前 issue）
- `.scratch/<feature>/mockups/`（如有 UI 设计）
- `.scratch/<feature>/prototype/`（如有原型参考）

## Outputs
- 源码文件和测试文件
- 会话上下文：实现决策、调试过程

## Constraints
- 遵循 NOTES.md 中的设计约束
- TDD 先写测试再写实现
- Lean ladder：stdlib > 第三方 > 自写
- 不自行修改设计方案，有疑问回溯给 Architect

## Downstream
- → **Code Reviewer**: 评审代码变更
- → **Quality Auditor**: 检查过度工程
```

#### UI Designer

```markdown
# Agent: UI Designer

## Identity
你是界面设计师。将需求转化为视觉参考，
输出 HTML mockup 或 SVG 供 Builder 实现。

## Available Skills
- _(新增 skill: ui-mockup)_

## Inputs
- 用户描述的 UI 需求
- `.scratch/<feature>/NOTES.md`（设计约束）

## Outputs
- `.scratch/<feature>/mockups/` — HTML mockup、SVG、视觉参考

## Constraints
- 只输出视觉参考，不写业务逻辑代码
- Mockup 使用 HTML/CSS 实现，可在浏览器中预览
- 标注关键交互和布局决策

## Downstream
- → **Builder**: 参考 mockup 实现前端代码
- → **Code Reviewer**: 对照 mockup 检查 UI 还原度
```

#### Code Reviewer

```markdown
# Agent: Code Reviewer

## Identity
你是代码评审员。以独立第三方视角审查代码变更，
关注正确性、可维护性和设计一致性。

## Available Skills
- `/review` — 代码评审

## Inputs
- Git diff（当前变更）
- `.scratch/<feature>/NOTES.md`（设计意图，用于对照）
- `.scratch/<feature>/mockups/`（如有，用于 UI 还原度检查）

## Outputs
- `.scratch/<feature>/REVIEW.md` — 评审意见列表

## Constraints
- 不修改代码，只输出 findings
- 必须对照 NOTES.md 检查实现是否符合设计
- 区分 blocking（必须修复）和 non-blocking（建议改进）

## Downstream
- → **Builder**: 修复 blocking findings
- → **Quality Auditor**: 在 reviewer 通过后做进一步检查
```

#### Quality Auditor

```markdown
# Agent: Quality Auditor

## Identity
你是质量审计员。专注于发现过度工程和 YAGNI 违规，
确保代码精简、没有不必要的抽象。

## Available Skills
- `/prune` — 过度工程审查

## Inputs
- Git diff（当前变更）
- `.scratch/<feature>/REVIEW.md`（Code Reviewer 已通过）

## Outputs
- 会话内输出 prune findings
- Blocking: 必须简化才能提交
- Non-blocking: 建议简化但不阻塞

## Constraints
- 只在 Code Reviewer 通过后运行
- 关注点：不必要的抽象、过早优化、过度设计
- 不重新评审正确性（那是 Code Reviewer 的职责）

## Downstream
- → **Builder**: 简化 blocking findings
- → **Git Ops**: 所有 gate 通过后提交
```

#### Git Ops

```markdown
# Agent: Git Ops

## Identity
你是版本控制操作员。负责代码的同步、提交和推送，
确保变更被正确记录到版本库。

## Available Skills
- _(内建 git 操作能力)_

## Inputs
- 当前工作区的代码变更
- `.scratch/<feature>/NOTES.md`（用于生成有意义的 commit message）

## Outputs
- Git commit（带规范的 commit message）
- Push 确认

## Constraints
- 不修改任何代码
- Commit message 遵循 Conventional Commits
- 推送前确认用户同意
- 支持操作：pull（同步）、add、commit、push、branch

## Downstream
- 终端 agent，无下游
```

## Router Dispatch

### 交互模式

**默认：Router 自动调度（用户无感）**

```
用户: /aiops 做一个用户登录功能
Router: 分析 → Feature 任务 → 自动依次调用:
        Architect → Planner → Builder → Code Reviewer → Quality Auditor → Git Ops
```

**显式指定 Agent：**

```
/aiops architect 设计系统架构    → 只跑 Architect
/aiops builder 实现这个功能      → 只跑 Builder（从 .scratch/ 读取上游输出）
/aiops git-ops 提交代码          → 只跑 Git Ops
/aiops ui-designer 画个登录页    → 只跑 UI Designer
/aiops prototyper 验证 WebSocket  → 只跑 Prototyper
```

### Task Type → Agent 序列

| Task Type | Agent 序列 | 入口条件 |
|-----------|-----------|---------|
| **Feature** | Architect → Planner → Builder → Code Reviewer → Quality Auditor → Git Ops | 用户描述新功能 |
| **Feature + UI** | Architect → UI Designer → Planner → Builder → Code Reviewer → Quality Auditor → Git Ops | 涉及 UI 变更 |
| **Bug** | Builder → Code Reviewer → Git Ops | 跳过 Architect |
| **Incoming** | Router triage → Builder → Code Reviewer → Git Ops | 先分类再处理 |
| **Prototype** | Prototyper | 独立使用，不进 delivery 链 |
| **Architecture health** | Architect → Builder → Code Reviewer → Git Ops | Architect 做 grill + 设计 |

### 调度规则

1. 用户调用 `/aiops <描述>`
2. Router 分析 task type → 选择 agent 序列
3. 每个 agent 完成后：
   - 输出写入 `.scratch/<feature>/` 对应文件
   - Router 自动激活下一个 agent
   - 下一个 agent 读取上游输出作为输入
4. 全程在同一个 Claude Code 会话中
5. 切换 agent 时，system prompt 切换为该 agent 的 Identity + Constraints

## Context Passing

### 机制：文件持久化 + 会话上下文

| 类型 | 机制 | 示例 |
|------|------|------|
| **关键决策** | 写入 `.scratch/` 文件 | 设计选型、trade-off、约束 |
| **执行细节** | 留在会话上下文 | 具体的代码讨论、调试过程 |
| **跨会话恢复** | 新 agent 启动时读取 `.scratch/` 文件 | 新 session 里 Builder 读取 NOTES.md |

### .scratch 目录规范

```
.scratch/
└── <feature-slug>/
    ├── CONTEXT.md         # /aiops-setup 生成
    ├── NOTES.md           # Architect 输出
    ├── PRD.md             # Planner 输出（可选）
    ├── VERDICT.md         # Prototyper 输出（可选）
    ├── issues/            # Planner 拆解的子任务
    │   ├── 001-xxx.md
    │   └── 002-xxx.md
    ├── mockups/           # UI Designer 输出（可选）
    │   └── *.html / *.svg
    ├── prototype/         # Prototyper 输出（可选）
    └── REVIEW.md          # Code Reviewer 输出
```

**命名约定：** feature-slug 由 Router 根据用户描述自动生成（如 "做一个用户登录功能" → `login`），用户可覆盖。

## Project Structure

```
aiops/
├── agents/                       # Agent 定义层（新增）
│   ├── architect.md
│   ├── planner.md
│   ├── builder.md
│   ├── code-reviewer.md
│   ├── quality-auditor.md
│   ├── git-ops.md
│   ├── ui-designer.md
│   └── prototyper.md
├── skills/                       # Skills 行为层（现有）
│   ├── aiops/                    # Router skill — 增加 agent 调度逻辑
│   ├── aiops-implement/
│   ├── tdd/
│   └── ...
├── docs/
│   ├── getting-started.md        # 更新：agents 概念说明
│   ├── skill-registry.md         # 更新：agent → skill 映射表
│   └── agent-registry.md         # 新增：agent 完整文档
├── skills/manifest.json          # 更新：增加 agents 数组
└── scripts/
```

## Manifest Schema

```json
{
  "manifestVersion": 2,
  "version": "1.2.0",
  "tier1": [ ... ],
  "tier2Deferred": [ ... ],
  "agents": [
    {
      "name": "architect",
      "skills": ["grilling", "grill-with-docs", "domain-modeling"],
      "role": "alignment",
      "outputs": [".scratch/<feature>/NOTES.md"]
    },
    {
      "name": "planner",
      "skills": ["to-prd", "to-issues", "handoff", "aiops-setup"],
      "role": "planning",
      "outputs": [".scratch/<feature>/PRD.md", ".scratch/<feature>/issues/"]
    },
    {
      "name": "prototyper",
      "skills": ["prototype", "lean"],
      "role": "prototype",
      "outputs": [".scratch/<feature>/prototype/", ".scratch/<feature>/VERDICT.md"]
    },
    {
      "name": "builder",
      "skills": ["aiops-implement", "tdd", "lean"],
      "role": "delivery",
      "outputs": ["source code", "test files"]
    },
    {
      "name": "ui-designer",
      "skills": [],
      "role": "design",
      "outputs": [".scratch/<feature>/mockups/"]
    },
    {
      "name": "code-reviewer",
      "skills": ["review"],
      "role": "delivery-gate",
      "outputs": [".scratch/<feature>/REVIEW.md"]
    },
    {
      "name": "quality-auditor",
      "skills": ["prune"],
      "role": "delivery-gate",
      "outputs": ["prune findings"]
    },
    {
      "name": "git-ops",
      "skills": [],
      "role": "delivery",
      "outputs": ["git commits", "push confirmation"]
    }
  ]
}
```

## MVP Scope

| Phase | Agents | Skills 新增 | 理由 |
|-------|--------|------------|------|
| **Phase 1** | architect, planner, builder, code-reviewer, git-ops | git-ops skill | 覆盖主 delivery 链路 |
| **Phase 2** | quality-auditor, prototyper, ui-designer | ui-mockup skill | 增量补充 |

## Non-Goals

- 不实现多 agent 并行执行（未来可渐进升级）
- 不为每个 agent 创建独立进程或子会话
- 不改变现有 skills 的定义和行为
- 不引入新的安装机制（复用 `npx skills@latest add`）

## Open Questions

1. **UI Designer 是否需要新增 skill**（如 `ui-mockup`）还是直接用 agent 定义中的能力？
2. **Git Ops 是否需要支持 squash merge、rebase 等高级操作？**
3. **Agent 是否需要 Tier 分级**（类似 skills 的 Tier 1 / Tier 2 deferred）？
