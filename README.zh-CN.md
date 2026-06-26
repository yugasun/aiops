# aiops

[English](README.md)

面向 AI 辅助软件开发的 agent skills bundle —— grill 对齐、plan 规划、implement 实现、ship 交付，全程硬质量门控。安装一次，跨 **6 个 AI IDE** 使用。

入口 skill：`/aiops`

## 核心特性

- **19 个 skills** 覆盖完整开发生命周期：对齐 → 规划 → 交付 → 评审 → 发布
- **8 个专业 agents** 带制品契约和调度序列
- **始终生效的 lean 纪律** —— YAGNI ladder 自动注入每次编码 turn（Cursor `.mdc`、Copilot instructions、Windsurf `.mdc`）
- **多 IDE 可移植** —— 单一 source of truth（`SKILL.md`），adapter seam 编译为各 IDE 原生格式
- **生命周期 hooks** —— SessionStart/SubagentStart 注入，覆盖 Claude Code 和 Codex
- **AGENTS.md 生成** —— 项目级 agent 协议文件，兼容任意 harness

## 快速开始

```bash
# 安装到所有检测到的 AI IDE（项目级，默认）
npx -y github:yugasun/aiops

# 或通过 curl
curl -fsSL https://raw.githubusercontent.com/yugasun/aiops/main/install.sh | bash
```

### CLI 选项

```bash
# 指定 IDE
npx -y github:yugasun/aiops --ide cursor
npx -y github:yugasun/aiops --ide claude
npx -y github:yugasun/aiops --ide codex
npx -y github:yugasun/aiops --ide copilot
npx -y github:yugasun/aiops --ide windsurf

# 全局安装（到 ~/）
npx -y github:yugasun/aiops -g

# 选择性安装
npx -y github:yugasun/aiops --skills-only     # 仅 skills
npx -y github:yugasun/aiops --agents-only     # 仅 agents

# 查看检测到的 IDE（不安装）
npx -y github:yugasun/aiops --list

# 卸载
npx -y github:yugasun/aiops --uninstall
```

### Claude Code 插件（备选）

```
/plugin marketplace add yugasun/aiops
/plugin install aiops@aiops
```

## 支持的 IDE

| IDE | Skills 路径 | Always-On | Agents | Hooks |
| --- | --- | --- | --- | --- |
| **Claude Code** | `.claude/skills/` | 通过 `/lean` 触发 | `.claude/agents/*.md` | SessionStart + SubagentStart |
| **Cursor** | `.cursor/skills/` | `.cursor/rules/lean.mdc` | `.cursor/agents/*.md` | — |
| **Codex CLI** | `.agents/skills/` | 通过 `AGENTS.md` | `.codex/agents/*.toml` | — |
| **Windsurf** | `.windsurf/skills/` | `.windsurf/rules/lean.mdc` | `.windsurf/agents/*.md` | — |
| **GitHub Copilot** | `.github/skills/` | `.github/copilot-instructions.md` | `.github/agents/*.md` | — |
| **通用 harness** | — | `AGENTS.md`（项目根目录） | — | — |

## 功能清单

### Skills（19 个 Tier 1）

| 层 | Skills |
| --- | --- |
| **路由** | `/aiops` — 选择任务类型和流程 |
| **设置** | `/aiops-setup` — issue 跟踪、triage 标签、领域文档 |
| **对齐** | `/grill-with-docs`、`/grilling`、`/domain-modeling` |
| **规划** | `/to-prd`、`/to-issues`、`/handoff`、`/prototype` |
| **交付** | `/aiops-implement` → `/lean` → `/tdd` → `/prune` → `/review` |
| **架构** | `/improve-codebase-architecture` — 扫描深化机会 |
| **其他** | `/diagnosing-bugs`、`/triage`、`/ui-mockup`、`/gitops` |

完整列表：[`skills/manifest.json`](skills/manifest.json)

### Agents（8 个）

| Agent | 角色 | 核心输出 |
| --- | --- | --- |
| `architect` | 设计决策 + 技术规格 | NOTES.md, tech-spec.md |
| `planner` | 任务拆解 + 计划 | PRD.md, plan.md, issues/ |
| `prototyper` | 快速验证 | VERDICT.md, prototype/ |
| `builder` | TDD 实现 | 源码 + 测试 |
| `ui-designer` | HTML 原型 | mockups/ |
| `code-reviewer` | 代码评审 | REVIEW.md |
| `quality-auditor` | YAGNI 审计 | prune 发现 |
| `gitops` | Git 操作 | commit + push |

### Lean 纪律（始终生效）

YAGNI ladder 在支持的 IDE 中自动注入每次编码 turn：

```
1. 这真的需要存在吗？(YAGNI)
2. 标准库能做吗？
3. 平台原生特性？
4. 已安装的依赖？
5. 一行代码？
6. 能工作的最少代码
```

交付序列：**lean → TDD → prune → review → commit**（仅在用户确认后提交）。

## 架构

```
                    ┌─── 构建脚本 ────→ .cursor/rules/lean.mdc
                    │                   .github/copilot-instructions.md
                    │                   .windsurf/rules/lean.mdc
                    │                   AGENTS.md
                    │
skills/lean/SKILL.md ─── 安装时 ────→ Cursor: .cursor/rules/lean.mdc (always-on)
                    │                  Copilot: .github/copilot-instructions.md
                    │                  Windsurf: .windsurf/rules/lean.mdc
                    │                  Claude/Codex: skills 目录 (复制)
                    │
                    └─── hooks ──────→ SessionStart: lean ladder 注入上下文
                                       SubagentStart: 精简版 lean 提醒
```

**Adapter seam**（`scripts/adapters/`）在安装时将 `SKILL.md` 转换为 IDE 原生格式。添加新 IDE = 写一个 adapter 文件。

**构建脚本**（`scripts/build/`）预生成制品，可提交到 repo：

```bash
node scripts/build/build-all.js    # 生成所有 IDE 原生制品
```

## 在目标项目中使用

1. 运行一次 `/aiops-setup`（issue 跟踪、标签、`CONTEXT.md` 布局）
2. 每个新任务运行 `/aiops`

详情：**[docs/getting-started.md](docs/getting-started.md)**

## 验证（维护者）

```bash
bash scripts/verify.sh          # 源文件检查（skills + agents）
node scripts/build/build-all.js # 生成 IDE 原生制品
```

## 文档

- [快速开始](docs/getting-started.md) — 安装、设置、示例开发流程
- [Agent 注册表](docs/agent-registry.md) — agents、调度序列、制品契约
- [Skill 注册表](docs/skill-registry.md) — 安装路径 + 允许引用

## 许可证

Apache 2.0 — 见 [LICENSE](LICENSE)。贡献指南：[CONTRIBUTING.md](CONTRIBUTING.md)。
