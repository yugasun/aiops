# aiops

[English](README.md)

aiops 是一套 AI 工程最佳实践——以 lean 纪律为核心、可恢复的工作流，以 skills 和 agents 的形式分发到 **5 个 IDE**（Cursor、Claude Code、Codex CLI、GitHub Copilot、OpenCode）以及通用的 AGENTS.md 协议。在 AI IDE 里输入 `/aiops`，用自然语言描述你想做的工作；aiops 会带你从澄清需求走到实现、评审和最终确认。

入口：`**/aiops**`（引导式工作流，进度通过 `flow.state.yaml` 恢复）

## 它帮你解决什么

- **从任务开始** — 用自然语言描述功能、Bug 或重构
- **跟着流程推进** — aiops 补齐关键决策，显示当前步骤，并自动保存进度
- **限制 AI 乱写** — lean、TDD、prune、review 在交付前逐步检查
- **随时继续** — 进度写在 `.scratch/<功能名>/flow.state.yaml`，`/aiops 继续` 接着做
- **你保持控制权** — 只有你明确确认后才 commit
- **需要时再深入** — agent、skill、代码图谱支持更大的团队流程和架构任务

## 快速开始

```bash
npx -y github:yugasun/aiops
```

在目标项目聊天框输入：

```
/aiops 我想加一个健康检查接口
```

隔天继续：

```
/aiops 继续
```

## 接下来会发生什么

对于一个小功能，aiops 通常会：

1. 澄清范围和验收标准
2. 在编码前确认设计
3. 先写测试
4. 实现最小可用改动
5. 清理多余代码并评审 diff
6. 等你确认后再提交

Bug 会跳过不必要的对齐仪式，直接进入诊断。较大的功能可以先整理成 PRD，再拆成垂直切片逐个实现。

### 代码图谱（可选增强）

架构扫描可以使用 `/code-graph` 获取更结构化的代码理解。它基于 [graphify](https://github.com/safishamsi/graphify)，使用 Tree-sitter AST 解析和 Louvain 社区检测。这个能力是可选的；aiops 的核心流程不依赖 Python 工具。

只有当你需要更强的架构分析和影响分析时再安装：

```bash
uv tool install graphifyy
graphify --version
```

不用 uv 也可以：`pip install graphifyy` 或 `pipx install graphifyy`。

### CLI 选项

默认是**交互安装**：↑↓ 移动、空格勾选 IDE、`ctrl+a` 全选，再选项目/全局与是否装 hooks。CI 请加 `--yes`。

```bash
npx -y github:yugasun/aiops                        # 交互安装
npx -y github:yugasun/aiops --yes                  # 非交互：全部已检测 IDE、项目级、含 hooks
npx -y github:yugasun/aiops --all                  # 同 --yes

# 指定 IDE（未加 --yes 时仍会询问范围 / hooks）
npx -y github:yugasun/aiops --ide cursor
npx -y github:yugasun/aiops --ide claude
npx -y github:yugasun/aiops --ide codex
npx -y github:yugasun/aiops --ide copilot
npx -y github:yugasun/aiops --ide opencode

# 全局安装（agents/hooks/skills 都到 ~/）
npx -y github:yugasun/aiops -g

# 选择性安装
npx -y github:yugasun/aiops --skills-only     # 仅 slash-command skills（无 hooks/agents/常驻 lean）
npx -y github:yugasun/aiops --commands-only   # 同 --skills-only
npx -y github:yugasun/aiops --agents-only     # 仅 agents
npx -y github:yugasun/aiops --agents-md       # append aiops 区块到 AGENTS.md（不覆盖）
npx -y github:yugasun/aiops --no-hooks        # skills + agents，跳过 SessionStart hooks

# 查看检测到的 IDE（不安装）
npx -y github:yugasun/aiops --list

# 卸载
npx -y github:yugasun/aiops uninstall
npx -y github:yugasun/aiops uninstall --ide codex
npx -y github:yugasun/aiops --uninstall             # 同上
```

### Claude Code 插件（备选）

```
/plugin marketplace add yugasun/aiops
/plugin install aiops@aiops
```

插件命令带 `aiops:` 前缀（如 `/aiops:aiops`）；Skills CLI 安装则直接用 `/aiops`。

## 支持的 IDE

**Skills 始终安装到用户全局目录**（不会写入项目仓库）。「项目」范围只影响 agents / hooks / always-on rules；「全局」则这些也进 `~/`。

| IDE                | Skills 路径（全局）                    | Always-On（项目范围）                    | Agents（项目范围）            | Hooks                        |
| ------------------ | -------------------------------- | -------------------------------- | ----------------------- | ---------------------------- |
| **Claude Code**    | `~/.claude/skills/`              | 通过 `/lean` 触发                      | `.claude/agents/*.md`   | SessionStart + SubagentStart |
| **Cursor**         | `~/.cursor/skills/`              | `.cursor/rules/lean.mdc`         | `.cursor/agents/*.md`   | —                            |
| **Codex CLI**      | `~/.agents/skills/`              | SessionStart hooks               | `.codex/agents/*.toml`  | SessionStart + SubagentStart |
| **GitHub Copilot** | `~/.github/skills/`              | `.github/copilot-instructions.md` | `.github/agents/*.md`   | —                            |
| **OpenCode**       | `~/.config/opencode/skills/`     | 通过 `/lean` 触发                      | `.opencode/agents/*.md` | —                            |
| **通用 harness**     | —                                | 可选 append `AGENTS.md`             | —                       | —                            |

`AGENTS.md` **默认不写**。加 `--agents-md`（或交互里选 Yes）才会 append 带标记的 aiops 区块，不会覆盖你已有内容。

### Codex / Claude 持久化行为

完整安装（交互默认，或 `--yes`）会写入 skills、agents、常驻 lean 和 hooks；已有 `hooks.json` 条目会**合并**而非覆盖。

| 模式 | Skills | Hooks | Agents | 常驻 lean |
| --- | --- | --- | --- | --- |
| 默认 | 是 | 是（合并） | 是 | 是（SessionStart / IDE rules；不写 `AGENTS.md`） |
| `--skills-only` / `--commands-only` | 是 | 否 | 否 | 否 |
| `--no-hooks` | 是 | 否 | 是 | 是 |
| `--agents-only` | 否 | 否 | 是 | 否 |
| `--agents-md` | （随 agents） | — | — | append 标记区块到 `AGENTS.md` |


## 背后的能力

日常使用不需要记住这些名字。它们主要用于团队检查、定制或直接调用具体能力。

### Skills


| 层      | Skills                                                                |
| ------ | --------------------------------------------------------------------- |
| **路由** | `/aiops` — Flow Conductor，推断场景并分步引导                                   |
| **设置** | `/aiops-setup` — issue 跟踪、triage 标签、领域文档                              |
| **对齐** | `/explore`、`/grill-with-docs`、`/grilling`、`/domain-modeling`、`/architect-design` |
| **规划** | `/to-prd`、`/to-issues`、`/handoff`、`/prototype`                        |
| **交付** | `/aiops-implement` → `/lean` → `/tdd` → `/prune` → `/review`          |
| **架构** | `/improve-codebase-architecture` — 多模态扫描 + 深化机会                     |
| **基础设施** | `/code-graph` — graphify 构建代码图谱，供所有 skill 查询                    |
| **其他** | `/diagnosing-bugs`、`/triage`、`/ui-mockup`、`/gitops`                   |


完整列表：[`skills/manifest.json`](skills/manifest.json)

### Agents（9 个）


| Agent             | 角色          | 核心输出                     |
| ----------------- | ----------- | ------------------------ |
| `architect`       | 设计决策 + 技术规格 | NOTES.md, tech-spec.md   |
| `design-reviewer` | 设计评审门控      | DESIGN_REVIEW.md         |
| `planner`         | 任务拆解 + 计划   | PRD.md, plan.md, issues/ |
| `prototyper`      | 快速验证        | VERDICT.md, prototype/   |
| `builder`         | TDD 实现      | 源码 + 测试                  |
| `ui-designer`     | HTML 原型     | mockups/                 |
| `code-reviewer`   | 代码评审        | REVIEW.md                |
| `quality-auditor` | YAGNI 审计    | prune 发现                 |
| `gitops`          | Git 操作      | commit + push            |


### 交付纪律

编码前先过 lean ladder：

```
1. 这真的需要存在吗？(YAGNI)
2. 标准库能做吗？
3. 平台原生特性？
4. 已安装的依赖？
5. 一行代码？
6. 能工作的最少代码
```

交付序列：**lean → TDD → prune → review → commit**。最后的 commit 只有在你明确确认后才执行。

## 在目标项目中使用

1. 在 AI IDE 中打开项目，运行 `/aiops <任务>`
2. 跟着提示推进；aiops 会自动保存进度
3. 回来时输入 `/aiops 继续`
4. 只有团队需要 GitHub/GitLab issue 跟踪时，才添加 `aiops.yaml`

详情：[**docs/getting-started.md**](docs/getting-started.md)

## 架构

```
                    ┌─── 构建脚本 ────→ .cursor/rules/lean.mdc
                    │                   .github/copilot-instructions.md
                    │                   AGENTS.md
                    │
skills/lean/SKILL.md ─── 安装时 ────→ Cursor / Copilot: always-on rules
                    │                  Claude / Codex / OpenCode: skills 目录
                    │
                    └─── hooks ──────→ SessionStart / SubagentStart
```

**Adapter seam**（`scripts/adapters/`）在安装时将 `SKILL.md` 转为 IDE 原生格式。

```bash
node scripts/build/build-all.js    # 维护者：生成所有 IDE 原生制品
```

## 文档

- [快速开始](docs/getting-started.md)
- [Agent 注册表](docs/agent-registry.md)
- [Skill 注册表](docs/skill-registry.md)
- [项目网站](website/index.html) — 交互示例与 use cases

## 实例走查

> 真实运行记录，基于 [aiops-demo](https://github.com/yugasun/aiops-demo) 项目。[完整目录 →](docs/demos/)

- [Health Check 完整走查](docs/demos/health-check-walkthrough.md) — 一个小 API 功能如何经过澄清、TDD、评审和确认
- [架构扫描 + 代码图谱](docs/demos/architecture-scan-walkthrough.md) — 先用证据扫描架构，再选择一个重构点
- [效果对比分析](docs/demos/effect-analysis.md) — 对比直接让 AI 写和经过 aiops 流程后的交付差异
- [自动化 Benchmark](docs/demos/benchmark.sh) — `bash docs/demos/benchmark.sh` 一键运行对比实验

## 许可证

Apache 2.0 — 见 [LICENSE](LICENSE)。贡献指南：[CONTRIBUTING.md](CONTRIBUTING.md)。
