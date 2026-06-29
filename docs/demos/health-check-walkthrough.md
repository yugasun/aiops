# Demo: 给 Express API 加 Health Check 接口

> **真实运行记录** — 通过 aiops skills 在 [yugasun/aiops-demo](https://github.com/yugasun/aiops-demo) 项目上执行。
> IDE：Claude Code
> 日期：2026-06-29
> 完整用时：~5 分钟（含对齐、设计、TDD、prune、review）

## 目标项目

```bash
# 项目结构（运行前）
task-api/
├── src/
│   ├── app.ts              # Express 入口
│   ├── routes/tasks.ts     # CRUD 任务路由
│   └── middleware/error.ts  # 错误处理
├── test/
│   └── tasks.test.ts       # 现有测试（2 个，全部通过）
├── package.json            # version: "1.2.3"
└── tsconfig.json
```

**运行前测试基线**: `Tests: 2 passed, 2 total`

---

## Step 1 — 输入

在 IDE 聊天框输入：

```
/aiops 加一个 health 接口，GET /health，返回 status: ok 和 app 版本号
```

AI 自动推断 `task_kind: feature_idea`，创建 `flow.state.yaml`：

```yaml
version: 1
slug: health-check
task_kind: feature_idea
delivery_mode: single_session
user_description: "加一个 health 接口，GET /health，返回 status: ok 和 app 版本号"
current_phase_id: alignment
phases_done: []
gates_satisfied: []
```

---

## Step 2 — 对齐 + 设计

AI 确认：版本号从 `package.json` 读取，只返回 `status` 和 `version`，不引入新依赖。

生成 `.scratch/health-check/NOTES.md`：

```markdown
# Design Notes: health-check

## Problem Statement
API 缺少健康检查端点，运维无法通过 HTTP 判断服务状态和版本。

## Design Decisions

### Decision 1: 路由位置
- **选择**: 新建 `src/routes/health.ts`，在 `app.ts` 注册
- **理由**: 独立模块，不影响现有路由；deletion test ✓
- **替代方案**: 放在 routes/tasks.ts 里 → 耦合，违反深度原则

### Decision 2: 版本号读取
- **选择**: 启动时读取 package.json，缓存在模块变量
- **理由**: 一次读取，零运行时开销

## Scope
- **In scope**: GET /health 路由 + 注册 + 测试
- **Out of scope**: 数据库健康检查、详细诊断
```

---

## Step 3 — TDD（测试驱动）

### 🔴 RED — 先写测试

```typescript
// test/health.test.ts
import request from "supertest";
import app from "../src/app";

describe("Health API", () => {
  it("GET /health returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", version: "1.2.3" });
  });

  it("GET /health version matches package.json", async () => {
    const pkg = require("../package.json");
    const res = await request(app).get("/health");
    expect(res.body.version).toBe(pkg.version);
  });
});
```

运行结果：

```
FAIL test/health.test.ts
  Health API
    ✕ GET /health returns 200 with status ok (11 ms)
    ✕ GET /health version matches package.json (2 ms)

    Expected: 200
    Received: 404

Tests: 2 failed, 2 total
```

### 🟢 GREEN — 最小实现

```typescript
// src/routes/health.ts (14 行)
import { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";

const { version } = JSON.parse(
  readFileSync(join(__dirname, "../../package.json"), "utf8")
);

const router = Router();
router.get("/health", (_req, res) => {
  res.json({ status: "ok", version });
});

export default router;
```

```typescript
// src/app.ts — 加 2 行
import healthRouter from "./routes/health";
// ...
app.use(healthRouter);
```

运行结果：

```
PASS test/health.test.ts
PASS test/tasks.test.ts

Test Suites: 2 passed, 2 total
Tests:       4 passed, 4 total
```

---

## Step 4 — 质量门

### Prune（精简）

> 14 行路由 + 2 行注册，没有过度工程。**Lean already ✓**

### Review（评审）

> 无安全问题，无过度工程，符合 tech-spec。**APPROVE ✓**

---

## Step 5 — Diff 统计

```
 src/app.ts           |  2 ++
 src/routes/health.ts | 14 ++++++++++++++
 test/health.test.ts  | 16 ++++++++++++++++
 3 files changed, 32 insertions(+)
```

完整 diff：

```diff
diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,11 +1,13 @@
 import express from "express";
 import taskRouter from "./routes/tasks";
+import healthRouter from "./routes/health";
 import { errorHandler } from "./middleware/error";

 const app = express();
 app.use(express.json());

 app.use("/api/tasks", taskRouter);
+app.use(healthRouter);
 app.use(errorHandler);

diff --git a/src/routes/health.ts b/src/routes/health.ts
new file mode 100644
--- /dev/null
+++ b/src/routes/health.ts
@@ -0,0 +1,14 @@
+import { Router } from "express";
+import { readFileSync } from "fs";
+import { join } from "path";
+
+const { version } = JSON.parse(
+  readFileSync(join(__dirname, "../../package.json"), "utf8")
+);
+
+const router = Router();
+router.get("/health", (_req, res) => {
+  res.json({ status: "ok", version });
+});
+
+export default router;
```

---

## Step 6 — 提交（等你确认）

```bash
$ git add -A && git commit -m "feat: add GET /health endpoint"
```

---

## 结果

| 指标 | 数值 |
|------|------|
| 新增文件 | 2 个（`health.ts` 14 行 + `health.test.ts` 16 行） |
| 修改文件 | 1 个（`app.ts` 加 2 行） |
| **总 diff** | **+32 行** |
| 测试 | 2 → 4 个（新增 2 个，全部通过） |
| 引入依赖 | 0 |
| AI 迭代 | 1 轮（无返工） |
| TDD 验证 | RED → GREEN 一次通过 |

### flow.state.yaml 最终状态

```yaml
version: 1
slug: health-check
task_kind: feature_idea
delivery_mode: single_session
user_description: "加一个 health 接口，GET /health，返回 status: ok 和 app 版本号"
current_phase_id: ship
phases_done: [alignment, design_spec, delivery]
gates_satisfied: [prune_done, review_approve, ready_for_commit]
```

### 项目结构（运行后）

```
task-api/
├── src/
│   ├── app.ts              # +2 行（注册 health 路由）
│   ├── routes/
│   │   ├── tasks.ts        # 未改动
│   │   └── health.ts       # 🆕 14 行
│   └── middleware/error.ts  # 未改动
├── test/
│   ├── tasks.test.ts       # 未改动
│   └── health.test.ts      # 🆕 16 行
├── .scratch/health-check/
│   ├── flow.state.yaml     # 进度状态
│   └── NOTES.md            # 设计笔记
└── package.json            # 未改动
```

---

## 复现此 Demo

**方式 A：使用 demo 项目**（推荐）

```bash
# 1. Clone demo 项目
git clone https://github.com/yugasun/aiops-demo && cd aiops-demo

# 2. 安装依赖
npm install

# 3. 安装 aiops
npx -y github:yugasun/aiops

# 4. 在 IDE 聊天框输入
/aiops 加一个 health 接口，GET /health，返回 status: ok 和 app 版本号
```

**方式 B：从零创建**

```bash
# 1. 创建 Express + TypeScript 项目
mkdir task-api && cd task-api
npm init -y
npm install express
npm install -D typescript @types/express @types/node jest ts-jest supertest @types/supertest @types/jest
npx tsc --init

# 2. 创建 src/app.ts 和 src/routes/tasks.ts（见上文"目标项目"结构）
# 3. 安装 aiops
npx -y github:yugasun/aiops

# 4. 在 IDE 聊天框输入
/aiops 加一个 health 接口，GET /health，返回 status: ok 和 app 版本号
```

> **注意**：demo 项目是独立仓库，不在 aiops bundle 内。这体现了 aiops 的核心设计——skills bundle 安装到任何目标项目，而不是目标项目嵌入 bundle。
