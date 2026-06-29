# 效果分析：aiops 前后对比

> 两个实验，同一 demo 项目（[aiops-demo](https://github.com/yugasun/aiops-demo)）。
> 自动化：`bash docs/demos/benchmark.sh`（可复现）

---

## 实验 1: 加功能（Health Check）

**任务**: 给 Express API 加 `GET /health`，返回 `{ status: "ok", version }`
**项目**: task-api（Express + TypeScript，~180 行）

### 对比结果（自动化 benchmark 实测数据）

| 指标 | 无 aiops | 有 aiops | 差异 |
|------|---------|---------|------|
| **总 diff 行数** | +56 | +32 | **-43%** |
| **路由代码** | 45 行 | 14 行 | **-69%** |
| **测试代码** | 9 行（1 个测试） | 16 行（2 个测试） | **+100% 测试覆盖** |
| **测试结果** | 3 passed | 4 passed | +1 个专属测试 |
| **过度工程** | memory/uptime/ready/live | 无 | **prune 有效** |
| **设计文档** | 无 | NOTES.md | **可追溯** |

### 无 aiops 时 AI 自行添加的内容

AI 倾向于"多做点有用的"，但用户只要 `status` + `version`：

```typescript
// 无 aiops: 55 行，AI 加了用户没要求的东西
interface HealthStatus {
  status: "ok" | "degraded" | "error";
  version: string;
  timestamp: string;      // ← 用户没要求
  uptime: number;         // ← 用户没要求
  memory: {               // ← 用户没要求
    used: number; total: number; percentage: number;
  };
  environment: string;    // ← 用户没要求
}
router.get("/health/ready", ...)   // ← 用户没要求
router.get("/health/live", ...)    // ← 用户没要求
```

### 有 aiops 时的实现

YAGNI ladder + prune 阻止了过度工程：

```typescript
// 有 aiops: 14 行，只返回用户要求的字段
const { version } = JSON.parse(
  readFileSync(join(__dirname, "../../package.json"), "utf8")
);
router.get("/health", (_req, res) => {
  res.json({ status: "ok", version });
});
```

---

## 实验 2: 修 Bug（PATCH 空标题验证）

**任务**: 修复 `PATCH /api/tasks/:id` 允许空标题的 bug
**项目**: 同上，新增一个暴露 bug 的测试用例

### 测试用例

```typescript
it("PATCH should reject empty title", async () => {
  const res = await request(app).patch("/api/tasks/1").send({ title: "" });
  expect(res.status).toBe(400);  // 期望返回 400
});
```

### 对比结果

| 指标 | 无 aiops | 有 aiops | 差异 |
|------|---------|---------|------|
| **diff 行数** | +1/-1 | +4/-1 | 更多行但更正确 |
| **测试结果** | ❌ FAILS | ✅ PASSES | **关键差异** |
| **返回码** | 200（静默忽略） | 400（明确拒绝） | **行为正确性** |
| **诊断过程** | 无（直觉修复） | 假设 → 验证 → 修复 | **可追溯** |

### 无 aiops 的修复（静默 bug）

```diff
-  if (req.body.title !== undefined) task.title = req.body.title;
+  if (req.body.title !== undefined && req.body.title !== "") task.title = req.body.title;
// 静默忽略空标题，返回 200 — 测试期望 400，仍然 FAILS
```

**问题**：修复了"不更新空标题"，但没修复"应该返回 400"。这是**静默 bug**——表面看起来修了，但行为不符合测试预期。

### 有 aiops 的修复（TDD 驱动）

```diff
-  if (req.body.title !== undefined) task.title = req.body.title;
+  if (req.body.title !== undefined) {
+    if (!req.body.title.trim()) return res.status(400).json({ error: "title cannot be empty" });
+    task.title = req.body.title;
+  }
// 明确返回 400 — 测试通过
```

---

## 汇总

| 场景 | 指标 | 无 aiops | 有 aiops | 改善 |
|------|------|---------|---------|------|
| **加功能** | 总 diff | +56 行 | +32 行 | **-43%** |
| **加功能** | 路由代码 | 45 行 | 14 行 | **-69%** |
| **加功能** | 测试数量 | 1 个 | 2 个 | **+100%** |
| **修 Bug** | 测试通过率 | 2/3 (67%) | 3/3 (100%) | **+33%** |
| **修 Bug** | 静默 bug | 存在 | 消除 | **TDD 驱动** |

### 关键发现

1. **YAGNI ladder 砍掉 75% 路由代码** — AI 倾向于"多做点有用的"，但用户只要 status + version
2. **TDD 让行为正确** — 无 aiops 时 AI 只修"表面症状"，测试仍失败；有 aiops 时 TDD 驱动正确实现
3. **代码量差异显著** — 同一需求，有 aiops 的 diff 只有无 aiops 的一半
4. **aiops 不只是"少写代码"** — 而是通过 TDD + prune 确保代码**正确且精简**

### 复现

```bash
# 自动化对比（推荐）
bash docs/demos/benchmark.sh

# 或手动复现
git clone https://github.com/yugasun/aiops-demo && cd aiops-demo
npm install && npx -y github:yugasun/aiops
# 在 IDE 输入: /aiops 加一个 health 接口，GET /health，返回 status: ok 和 app 版本号
```

## 下一步实验

- [x] 加功能场景（Health Check）
- [x] 修 Bug 场景（PATCH 空标题验证）
- [ ] 大功能场景（RBAC，多 issue 拆分）
- [ ] 架构优化场景（graphify 代码图谱 + deepening）
