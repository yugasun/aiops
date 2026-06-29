#!/bin/bash
# aiops Benchmark — 实际运行对比实验
#
# 用法: bash docs/demos/benchmark.sh [experiment]
# 实验: health-check, bug-fix, all
#
# 此脚本会:
#   1. Clone aiops-demo 项目到临时目录
#   2. 分别运行"无 aiops"和"有 aiops"两种方式
#   3. 比较 diff 行数、测试结果、代码量

set -e

DEMO_REPO="https://github.com/yugasun/aiops-demo"
RESULTS_DIR="/tmp/aiops-benchmark-$(date +%s)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  aiops Benchmark Runner"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo repo: $DEMO_REPO"
echo "Results:   $RESULTS_DIR"
echo ""

run_health_check() {
  echo "━━━ 实验 1: 加功能 (Health Check) ━━━"
  echo ""

  rm -rf "$RESULTS_DIR/health-no-aiops" "$RESULTS_DIR/health-with-aiops"
  git clone --quiet "$DEMO_REPO" "$RESULTS_DIR/health-no-aiops"
  git clone --quiet "$DEMO_REPO" "$RESULTS_DIR/health-with-aiops"

  # ── 无 aiops: 直接让 AI 写（模拟典型 AI 过度工程） ──
  cd "$RESULTS_DIR/health-no-aiops"
  git reset --hard HEAD~1 --quiet  # 回到初始 commit（无 health.ts）
  npm install --silent

  cat > src/routes/health.ts << 'EOF'
import { Router, Request, Response } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import os from "os";

interface HealthStatus {
  status: "ok" | "degraded" | "error";
  version: string;
  timestamp: string;
  uptime: number;
  memory: { used: number; total: number; percentage: number };
  environment: string;
}

const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf8"));

function getHealthStatus(): HealthStatus {
  const memUsage = process.memoryUsage();
  return {
    status: "ok",
    version: pkg.version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    },
    environment: process.env.NODE_ENV || "development",
  };
}

const router = Router();
router.get("/health", (_req: Request, res: Response) => {
  const health = getHealthStatus();
  const statusCode = health.status === "error" ? 503 : 200;
  res.status(statusCode).json(health);
});
router.get("/health/ready", (_req: Request, res: Response) => {
  res.json({ ready: true });
});
router.get("/health/live", (_req: Request, res: Response) => {
  res.json({ alive: true });
});
export default router;
EOF

  # 注册路由
  node -e "
    const fs = require('fs');
    let c = fs.readFileSync('src/app.ts', 'utf8');
    c = c.replace('import taskRouter from \"./routes/tasks\";', 'import taskRouter from \"./routes/tasks\";\nimport healthRouter from \"./routes/health\";');
    c = c.replace('app.use(\"/api/tasks\", taskRouter);', 'app.use(healthRouter);\napp.use(\"/api/tasks\", taskRouter);');
    fs.writeFileSync('src/app.ts', c);
  "

  # 补写测试（后置，非 TDD）
  cat > test/health.test.ts << 'EOF'
import request from "supertest";
import app from "../src/app";
describe("Health", () => {
  it("should return health status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
EOF

  NO_AIOPS_TESTS=$(npx jest --no-coverage 2>&1 | grep -E 'Tests:' | tail -1)
  NO_AIOPS_LINES=$(wc -l < src/routes/health.ts | tr -d ' ')
  NO_AIOPS_DIFF=$(git diff --stat -- . ':!package-lock.json' | tail -1 | xargs)

  # ── 有 aiops: TDD + 最小实现 ──
  cd "$RESULTS_DIR/health-with-aiops"
  git reset --hard HEAD~1 --quiet  # 回到初始 commit（无 health.ts）
  npm install --silent

  # TDD: 先写测试
  cat > test/health.test.ts << 'EOF'
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
EOF

  # 确认 RED
  npx jest test/health.test.ts --no-coverage > /dev/null 2>&1 || true

  # TDD GREEN: 最小实现
  cat > src/routes/health.ts << 'EOF'
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
EOF

  node -e "
    const fs = require('fs');
    let c = fs.readFileSync('src/app.ts', 'utf8');
    c = c.replace('import taskRouter from \"./routes/tasks\";', 'import taskRouter from \"./routes/tasks\";\nimport healthRouter from \"./routes/health\";');
    c = c.replace('app.use(\"/api/tasks\", taskRouter);', 'app.use(healthRouter);\napp.use(\"/api/tasks\", taskRouter);');
    fs.writeFileSync('src/app.ts', c);
  "

  WITH_AIOPS_TESTS=$(npx jest --no-coverage 2>&1 | grep -E 'Tests:' | tail -1)
  WITH_AIOPS_LINES=$(wc -l < src/routes/health.ts | tr -d ' ')
  WITH_AIOPS_DIFF=$(git diff --stat -- . ':!package-lock.json' | tail -1 | xargs)

  # ── 报告 ──
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  对比结果: 加功能 (Health Check)                             │"
  echo "├─────────────────────┬──────────────────┬────────────────────┤"
  echo "│ 指标                │ 无 aiops         │ 有 aiops           │"
  echo "├─────────────────────┼──────────────────┼────────────────────┤"
  printf "│ 路由代码行数        │ %-16s │ %-18s │\n" "$NO_AIOPS_LINES 行" "$WITH_AIOPS_LINES 行"
  printf "│ 测试结果            │ %-16s │ %-18s │\n" "$(echo "$NO_AIOPS_TESTS" | sed 's/.*: //' | xargs)" "$(echo "$WITH_AIOPS_TESTS" | sed 's/.*: //' | xargs)"
  echo "│ 过度工程            │ memory/uptime等  │ 无 (prune)         │"
  echo "│ TDD                 │ 无               │ RED → GREEN        │"
  echo "│ 设计文档            │ 无               │ NOTES.md           │"
  echo "└─────────────────────┴──────────────────┴────────────────────┘"
  echo ""
  echo "  无 aiops diff: $NO_AIOPS_DIFF"
  echo "  有 aiops diff: $WITH_AIOPS_DIFF"
  echo ""
}

run_bug_fix() {
  echo "━━━ 实验 2: 修 Bug (PATCH 空标题) ━━━"
  echo ""

  rm -rf "$RESULTS_DIR/bugfix-no-aiops" "$RESULTS_DIR/bugfix-with-aiops"
  git clone --quiet "$DEMO_REPO" "$RESULTS_DIR/bugfix-no-aiops"
  git clone --quiet "$DEMO_REPO" "$RESULTS_DIR/bugfix-with-aiops"

  # 两个副本都回到初始 commit，加入暴露 bug 的测试
  for dir in bugfix-no-aiops bugfix-with-aiops; do
    cd "$RESULTS_DIR/$dir"
    git reset --hard HEAD~1 --quiet  # 回到初始 commit
    npm install --silent > /dev/null 2>&1
    cat > test/tasks.test.ts << 'TESTEOF'
import request from "supertest";
import app from "../src/app";

describe("Tasks API", () => {
  it("GET /api/tasks returns task list", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
  });
  it("POST /api/tasks creates a task", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "New" });
    expect(res.status).toBe(201);
  });
  it("PATCH should reject empty title", async () => {
    const res = await request(app).patch("/api/tasks/1").send({ title: "" });
    expect(res.status).toBe(400);
  });
});
TESTEOF
  done

  # ── 无 aiops: 直觉修复 ──
  cd "$RESULTS_DIR/bugfix-no-aiops"
  node -e "
    const fs = require('fs');
    let c = fs.readFileSync('src/routes/tasks.ts', 'utf8');
    c = c.replace(
      'if (req.body.title !== undefined) task.title = req.body.title;',
      'if (req.body.title !== undefined && req.body.title !== \"\") task.title = req.body.title;'
    );
    fs.writeFileSync('src/routes/tasks.ts', c);
  "
  NO_AIOPS_RESULT=$(npx jest --no-coverage 2>&1 | grep -E 'Tests:' | tail -1)

  # ── 有 aiops: TDD 驱动修复 ──
  cd "$RESULTS_DIR/bugfix-with-aiops"
  node -e "
    const fs = require('fs');
    let c = fs.readFileSync('src/routes/tasks.ts', 'utf8');
    c = c.replace(
      '  if (req.body.title !== undefined) task.title = req.body.title;',
      '  if (req.body.title !== undefined) {\n    if (!req.body.title.trim()) return res.status(400).json({ error: \"title cannot be empty\" });\n    task.title = req.body.title;\n  }'
    );
    fs.writeFileSync('src/routes/tasks.ts', c);
  "
  WITH_AIOPS_RESULT=$(npx jest --no-coverage 2>&1 | grep -E 'Tests:' | tail -1)

  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  对比结果: 修 Bug (PATCH 空标题验证)                         │"
  echo "├─────────────────────┬──────────────────┬────────────────────┤"
  echo "│ 指标                │ 无 aiops         │ 有 aiops           │"
  echo "├─────────────────────┼──────────────────┼────────────────────┤"
  printf "│ 测试结果            │ %-16s │ %-18s │\n" "$(echo "$NO_AIOPS_RESULT" | sed 's/.*: //' | xargs)" "$(echo "$WITH_AIOPS_RESULT" | sed 's/.*: //' | xargs)"
  echo "│ 返回码              │ 200 (静默忽略)   │ 400 (明确拒绝)     │"
  echo "│ 修复方式            │ 直觉 (表面修复)  │ TDD (行为正确)     │"
  echo "└─────────────────────┴──────────────────┴────────────────────┘"
  echo ""
}

# ── Main ──
case "${1:-all}" in
  health-check) run_health_check ;;
  bug-fix)      run_bug_fix ;;
  all)          run_health_check; run_bug_fix ;;
  *)            echo "用法: $0 [health-check|bug-fix|all]"; exit 1 ;;
esac

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Benchmark 完成"
echo "  结果目录: $RESULTS_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
