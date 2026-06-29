# 实例走查与效果分析

> 真实运行记录 + 可复现的对比实验。每个 demo 都基于 [aiops-demo](https://github.com/yugasun/aiops-demo) 项目。

## 目录

| 文件 | 类型 | 内容 |
|------|------|------|
| [health-check-walkthrough.md](health-check-walkthrough.md) | 真实走查 | 给 Express API 加 health 接口，从 `/aiops` 到 commit 的完整过程 |
| [architecture-scan-walkthrough.md](architecture-scan-walkthrough.md) | 真实走查 | graphify 构建代码图谱 → 4 视角扫描 → 深化 God module |
| [effect-analysis.md](effect-analysis.md) | 对比实验 | with/without aiops 的度量数据和关键发现 |
| [benchmark.sh](benchmark.sh) | 自动化脚本 | 一键运行对比实验，生成报告 |

## 快速体验

```bash
# 1. Clone demo 项目
git clone https://github.com/yugasun/aiops-demo && cd aiops-demo

# 2. 安装依赖
npm install

# 3. 安装 aiops skills
npx -y github:yugasun/aiops

# 4. 在 IDE 聊天框输入
/aiops 加一个 health 接口，GET /health，返回 status: ok 和 app 版本号
```

## 核心数据

| 场景 | 无 aiops | 有 aiops | 差异 |
|------|---------|---------|------|
| 加功能 diff | +67 行 | +32 行 | **-52%** |
| 路由代码 | 55 行 | 14 行 | **-75%** |
| 测试数量 | 1 个 | 2 个 | **+100%** |
| 修 Bug 测试通过率 | 0% | 100% | **TDD 消除静默 bug** |

> 详见 [effect-analysis.md](effect-analysis.md)
