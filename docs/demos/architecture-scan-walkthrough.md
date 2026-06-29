# Demo: 架构健康扫描 + 代码图谱

> 目标项目：一个中型 Python/Django 后端（~3000 行），技术债积累，模块边界模糊。
> 可复现 demo 项目：[yugasun/aiops-demo](https://github.com/yugasun/aiops-demo)（TypeScript 版，架构扫描流程类似）
> IDE：Claude Code
> 前置依赖：graphify（`uv tool install graphifyy`）
> 完整用时：约 25 分钟

## 场景

```
项目：order-service（Django + Celery + Redis）
规模：45 个 Python 文件，12 个 model，8 个 API endpoint
现状：模块边界不清，service 层膨胀，utils 变成 God module
```

## Step 1 — 输入

在 Claude Code 输入：

```
/aiops 帮我看看这个仓库有哪些架构可以优化
```

**AI 响应：**

> **第 1/4 步 · 扫描架构机会** (Architecture health scan)
>
> 如果代码图谱已就绪，我会基于图谱做增强分析；否则会直接探索代码。最终用 HTML 报告展示可深化的模块，你选一个我们再继续。

---

## Step 2 — 构建代码图谱

AI 检测到 graphify 已安装，开始构建图谱：

> 正在使用 graphify 构建代码图谱（Tree-sitter AST 解析 + Louvain 社区检测）...

```bash
$ graphify . --wiki --mode deep
```

**graphify 输出：**

```
Corpus: ~28,000 words · 45 files
Graph: 127 nodes · 203 edges · 8 communities
Extraction: 82% EXTRACTED · 18% INFERRED
```

**关键发现：**

**God Nodes**（连接最多的节点）：

| 排名 | 模块 | 边数 | 说明 |
|------|------|------|------|
| 1 | `utils/helpers.py` | 23 | 什么都往里塞的工具箱 |
| 2 | `services/order_service.py` | 19 | 订单相关逻辑全在这 |
| 3 | `models/base.py` | 15 | 基类 + mixin 堆叠 |

**社区划分**（Louvain 算法）：

```
Order Processing (18 nodes, cohesion: 0.72)
Payment Gateway (11 nodes, cohesion: 0.65)
User Management (9 nodes, cohesion: 0.58)
Notification System (8 nodes, cohesion: 0.61)
Inventory & Stock (7 nodes, cohesion: 0.44)
Reporting & Analytics (6 nodes, cohesion: 0.38)
API Layer (5 nodes, cohesion: 0.31)
Shared Utils (4 nodes, cohesion: 0.12) ← 最低内聚
```

> 图谱就绪：127 个节点，203 条依赖，8 个社区。开始 4 视角并行扫描...

---

## Step 3 — 多模态并行扫描

AI 启动 4 个视角 agent 并行分析：

### 视角 1：结构 agent

> 发现 3 个浅模块：
> - `utils/helpers.py` — 23 个 export，26 个 symbol，ratio 0.88 → **浅**
> - `services/order_service.py` — 处理订单创建、支付、退款、通知 → 职责过多
> - `api/views.py` — 12 个 view 全在一个文件 → **浅**

### 视角 2：数据流 agent

> 发现 2 处 seam 泄漏：
> - `order_service.py` 直接调用 `send_email()` — 订单服务不应知道邮件发送细节
> - `utils/helpers.py` 包含 `format_currency()` — 格式化工具不应在通用 utils 里

### 视角 3：变更 agent

> 发现 2 个热点：
> - `services/order_service.py` — in-degree 19 + 最近 30 天 14 次提交 → 🔴 高风险
> - `utils/helpers.py` — in-degree 23 + 最近 30 天 9 次提交 → 🟡 中风险

### 视角 4：测试 agent

> 发现 2 个未测试的关键模块：
> - `services/order_service.py` — 19 个依赖方，0 个测试文件 → 🔴
> - `payment/gateway.py` — 11 个依赖方，仅 1 个 mock 测试 → 🟡

---

## Step 4 — 交叉验证 + HTML 报告

AI 综合 4 个视角的发现，去重排序后生成报告：

> 4 视角扫描完成。生成架构报告...

```bash
$ open /tmp/architecture-review-20260629.html
```

**报告中的候选列表（节选）：**

| 候选 | 收敛度 | 说明 |
|------|--------|------|
| **拆分 utils/helpers.py** | 4/4 视角命中 | 按领域拆为 currency_utils, date_utils, string_utils |
| **深化 order_service** | 3/4 视角命中 | 提取 order_creation, order_refund, order_notification |
| **拆分 api/views.py** | 2/4 视角命中 | 按 resource 拆为 views/orders.py, views/users.py |
| **补充 order_service 测试** | 2/4 视角命中 | 先加集成测试再重构 |

> 浏览器里打开报告看完整的前后对比图。选一个候选，我们再继续深化。

**用户选择：** 拆分 utils/helpers.py

---

## Step 5 — Grill + 设计 + 实现

> **第 2/4 步 · 深化所选架构项** (Deepen)

AI 通过 grill 确认约束：

> 1. `format_currency()` 目前被 5 个模块使用 — 提取后需要更新所有 import
> 2. `parse_date_range()` 只在 reporting 里用 — 可以直接移过去
> 3. 有 3 个函数是真正的通用工具 — 保留在 utils 里

设计结论：

```
utils/
├── helpers.py          → 保留 3 个通用函数（删除 20 个）
├── currency.py         → 新文件：format_currency, parse_amount
├── date_utils.py       → 新文件：parse_date_range, format_date
└── notification.py     → 新文件：send_email, format_template
```

实现后 diff：

```
 utils/helpers.py       | -187 +12    (从 23 个函数缩减到 3 个)
 utils/currency.py      |  +45       (新)
 utils/date_utils.py    |  +38       (新)
 utils/notification.py  |  +52       (新)
 services/order.py      |   ~6       (import 路径更新)
 services/reporting.py  |   ~4       (import 路径更新)
 payment/gateway.py     |   ~3       (import 路径更新)
 7 files changed, +148 -175
```

---

## 结果

| 指标 | Before | After |
|------|--------|-------|
| `utils/helpers.py` 函数数 | 23 | 3 |
| `utils/helpers.py` in-degree | 23 | 5 |
| Shared Utils 社区 cohesion | 0.12 | 0.85（仅保留 3 个通用函数） |
| 新增测试 | — | 12 个（currency: 5, date: 4, notification: 3） |
| 模块边界清晰度 | 模糊（God module） | 按领域分离 |

### 架构变化可视化

```
Before:                          After:
                                 
  order ──┐                       order ──→ currency
  payment ┼→ helpers (23 fn)     payment ──→ currency  
  report ─┤                       report ──→ date_utils
  notify ─┘                       notify ──→ notification
                                  ┌──────────────────────┐
                                  │ helpers (3 generic)  │
                                  └──────────────────────┘
```

### 关键收益

- **locality**：改货币格式只需看 `currency.py`，不用在 23 个函数的大文件里找
- **leverage**：`currency.py` 被 5 个模块使用，但只有 3 个函数的 interface
- **可测试性**：每个新模块独立可测，不再需要 mock 整个 helpers
