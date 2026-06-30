import { useI18n } from '../lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'

const coreData = [
  { scenario: { en: 'Add feature diff', zh: '加功能 diff' }, noAiops: '+67 lines', withAiops: '+32 lines', diff: '-52%' },
  { scenario: { en: 'Route code', zh: '路由代码' }, noAiops: '55 lines', withAiops: '14 lines', diff: '-75%' },
  { scenario: { en: 'Test count', zh: '测试数量' }, noAiops: '1', withAiops: '2', diff: '+100%' },
  { scenario: { en: 'Bug fix pass rate', zh: '修 Bug 通过率' }, noAiops: '0%', withAiops: '100%', diff: { en: 'TDD eliminates silent bugs', zh: 'TDD 消除静默 bug' } },
]

const scenarios = [
  {
    id: 'feature',
    icon: '✨',
    title: { en: 'Add a feature', zh: '加一个功能' },
    prompt: '/aiops add a health endpoint returning JSON with status and app version',
    steps: {
      en: [
        { phase: 'Align', desc: 'Interviews you on scope, acceptance criteria, edge cases' },
        { phase: 'Design', desc: 'Writes NOTES.md with API shape, response format' },
        { phase: 'Review', desc: 'Design reviewer checks against NOTES before coding' },
        { phase: 'Implement', desc: 'TDD: writes test first, then minimal code, then prune' },
        { phase: 'Ship', desc: 'Shows diff, waits for your approval before commit' },
      ],
      zh: [
        { phase: '对齐', desc: '访谈范围、验收标准、边界情况' },
        { phase: '设计', desc: '写 NOTES.md，确定 API 形状和响应格式' },
        { phase: '评审', desc: '设计评审员对照 NOTES 检查，再进入编码' },
        { phase: '实现', desc: 'TDD：先写测试，再写最小代码，然后 prune' },
        { phase: '交付', desc: '展示 diff，等你确认后才 commit' },
      ],
    },
    result: { en: '+32 lines, 2 tests, 0 over-engineering', zh: '+32 行代码、2 个测试、0 过度工程' },
  },
  {
    id: 'bug',
    icon: '🐛',
    title: { en: 'Fix a bug', zh: '修一个 Bug' },
    prompt: '/aiops login endpoint returns 500 since yesterday, locate and fix',
    steps: {
      en: [
        { phase: 'Diagnose', desc: 'Reads logs, traces the error to root cause' },
        { phase: 'Implement', desc: 'Minimal fix + regression test (TDD)' },
        { phase: 'Ship', desc: 'Shows diff with diagnosis notes, waits for approval' },
      ],
      zh: [
        { phase: '定位', desc: '读日志，追踪错误到根因' },
        { phase: '实现', desc: '最小修复 + 回归测试（TDD）' },
        { phase: '交付', desc: '展示 diff 和诊断笔记，等你确认' },
      ],
    },
    result: { en: 'Skips alignment — straight to diagnosis path', zh: '跳过对齐——直接走诊断路径' },
  },
  {
    id: 'architecture',
    icon: '🏗️',
    title: { en: 'Analyze architecture', zh: '分析架构' },
    prompt: '/aiops check my architecture for optimization opportunities',
    steps: {
      en: [
        { phase: 'Graph', desc: 'graphify builds AST code graph + community detection' },
        { phase: 'Scan', desc: '4 parallel agents scan from structure, data-flow, change, test angles' },
        { phase: 'Report', desc: 'Generates HTML report with deepening opportunities' },
        { phase: 'Pick', desc: 'You choose one opportunity to deepen' },
        { phase: 'Implement', desc: 'Design → implement → test the refactor' },
      ],
      zh: [
        { phase: '图谱', desc: 'graphify 构建 AST 代码图谱 + 社区检测' },
        { phase: '扫描', desc: '4 个并行 agent 从结构、数据流、变更、测试角度扫描' },
        { phase: '报告', desc: '生成 HTML 报告，标注可深化的机会' },
        { phase: '选择', desc: '你选择一个机会进行深化' },
        { phase: '实现', desc: '设计 → 实现 → 测试重构' },
      ],
    },
    result: { en: 'Data-driven refactoring, not opinion-driven', zh: '数据驱动重构，而非主观判断' },
  },
]

const codeGraphCapabilities = [
  {
    icon: '🔍', title: { en: 'Structural understanding', zh: '结构化理解' },
    desc: { en: 'Tree-sitter AST parsing — real imports, exports, function calls. No grep guessing.', zh: 'Tree-sitter AST 解析——真实的导入、导出、函数调用。不靠 grep 猜。' },
  },
  {
    icon: '🧩', title: { en: 'Community detection', zh: '社区检测' },
    desc: { en: 'Louvain clustering reveals architectural boundaries — which modules belong together.', zh: 'Louvain 聚类揭示架构边界——哪些模块归属一起。' },
  },
  {
    icon: '📊', title: { en: 'God node detection', zh: 'God node 检测' },
    desc: { en: 'Finds the modules everything depends on — data-driven refactor priorities.', zh: '找到万物依赖的模块——数据驱动的重构优先级。' },
  },
  {
    icon: '🎯', title: { en: 'Impact analysis', zh: '影响分析' },
    desc: { en: 'Queries rdeps before editing — confidence scores tell facts from hypotheses.', zh: '编辑前查询 rdeps——置信度区分事实和假设。' },
  },
]

export default function DemosPage() {
  const { lang } = useI18n()

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          {lang === 'zh' ? '实例与效果' : 'Demos & Effects'}
        </h1>
        <p className="text-muted-foreground text-base">
          {lang === 'zh'
            ? '真实场景、真实数据。看看 aiops 在实际项目中做了什么。'
            : 'Real scenarios, real data. See what aiops actually does in real projects.'}
        </p>
      </div>

      {/* ── Quick try ── */}
      <div>
        <h2 className="text-xl font-semibold mb-3">
          {lang === 'zh' ? '快速体验' : 'Try it yourself'}
        </h2>
        <Card className="bg-card/60 backdrop-blur-xl border-border">
          <CardContent className="p-5 font-mono text-sm text-[var(--green)] space-y-1.5"
            style={{ textShadow: '0 0 8px rgba(74,222,128,0.2)' }}>
            <div><span className="text-[var(--cyan)]">$</span> git clone https://github.com/yugasun/aiops-demo && cd aiops-demo</div>
            <div><span className="text-[var(--cyan)]">$</span> npm install</div>
            <div><span className="text-[var(--cyan)]">$</span> npx -y github:yugasun/aiops</div>
            <div className="text-muted-foreground text-xs mt-3 border-t border-border pt-3">
              {lang === 'zh' ? '然后在 IDE 聊天框输入任意一个场景的 prompt：' : 'Then paste any scenario prompt into your IDE chat:'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* ── Real scenarios ── */}
      <div>
        <h2 className="text-xl font-semibold mb-2">
          {lang === 'zh' ? '实际场景' : 'Real scenarios'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {lang === 'zh'
            ? '每个场景展示：你输入什么 → Agent 做了什么 → 你得到什么。'
            : 'Each scenario shows: what you type → what the agent does → what you get.'}
        </p>
        <div className="space-y-6">
          {scenarios.map((s) => (
            <Card key={s.id} className="bg-card/60 backdrop-blur-xl border-border overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-xl">{s.icon}</span>
                  {s.title[lang]}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                {/* Prompt */}
                <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm text-[var(--green)]"
                  style={{ textShadow: '0 0 6px rgba(74,222,128,0.15)' }}>
                  {s.prompt}
                </div>

                {/* Steps */}
                <div className="flex items-start gap-0 flex-wrap">
                  {s.steps[lang].map((step, i) => (
                    <div key={i} className="flex items-start gap-0">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-[0.65rem] whitespace-nowrap">
                            {step.phase}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[160px]">{step.desc}</p>
                      </div>
                      {i < s.steps[lang].length - 1 && (
                        <span className="text-muted-foreground mx-2 mt-1 text-xs font-mono">→</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Result */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
                  <span className="text-sm text-[var(--green)] font-medium">{s.result[lang]}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* ── Delivery metrics ── */}
      <div>
        <h2 className="text-xl font-semibold mb-2">
          {lang === 'zh' ? '交付质量对比' : 'Delivery quality comparison'}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {lang === 'zh'
            ? '同一个项目、同一个任务——有无 aiops 全流程的差异。'
            : 'Same project, same task — with vs without the full aiops flow.'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { num: '-52%', label: { en: 'Less diff', zh: 'Diff 减少' } },
            { num: '-75%', label: { en: 'Less route code', zh: '路由代码减少' } },
            { num: '+100%', label: { en: 'More tests', zh: '测试提升' } },
            { num: '100%', label: { en: 'Bug pass rate', zh: 'Bug 通过率' } },
          ].map((s) => (
            <Card key={s.num} className="bg-card/60 backdrop-blur-xl border-[rgba(74,222,128,0.1)] text-center"
              style={{ boxShadow: '0 0 15px rgba(74,222,128,0.06)' }}>
              <CardContent className="p-4">
                <div className="font-mono text-2xl font-bold text-[var(--green)]"
                  style={{ textShadow: '0 0 12px rgba(74,222,128,0.3)' }}>{s.num}</div>
                <div className="text-[0.72rem] text-muted-foreground mt-1">{s.label[lang]}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-card/60 backdrop-blur-xl overflow-hidden">
          <Table>
            <TableBody>
              {coreData.map((r) => (
                <TableRow key={r.scenario.en} className="border-border">
                  <TableCell className="text-sm text-muted-foreground w-1/3">{r.scenario[lang]}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground text-right">{r.noAiops}</TableCell>
                  <TableCell className="font-mono text-sm text-[var(--green)] text-right font-semibold">{r.withAiops}</TableCell>
                  <TableCell className="font-mono text-xs text-right">
                    <Badge variant="secondary">{typeof r.diff === 'object' ? r.diff[lang] : r.diff}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Separator />

      {/* ── Code Graph ── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-xl font-semibold">
            {lang === 'zh' ? '代码图谱增强 Agent 能力' : 'Code Graph enhances Agent capabilities'}
          </h2>
          <Badge variant="outline" className="font-mono text-[0.6rem] text-[var(--cyan)] border-[var(--cyan)]/30">
            graphify
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
          {lang === 'zh'
            ? 'graphify 为 AI Agent 提供结构化代码理解——AST 解析 + Louvain 社区检测。Agent 不再靠 grep 猜测，而是基于真实代码图谱做决策。'
            : 'graphify provides structured code understanding for AI agents — AST parsing + Louvain community detection. Agents decide from real code graphs, not grep guesses.'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {codeGraphCapabilities.map((cap) => (
            <Card key={cap.title.en} className="bg-card/60 backdrop-blur-xl border-border">
              <CardContent className="p-4 flex items-start gap-3">
                <span className="text-xl mt-0.5">{cap.icon}</span>
                <div>
                  <div className="font-semibold text-sm mb-1">{cap.title[lang]}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cap.desc[lang]}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
