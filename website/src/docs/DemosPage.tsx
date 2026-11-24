import { useI18n } from '../lib/i18n'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

const demoDocs = 'https://github.com/yugasun/aiops/blob/main/docs/demos'
const caseSetup = `git clone https://github.com/yugasun/aiops-demo && cd aiops-demo
npm install
npx -y github:yugasun/aiops`

const comparisons = [
  { metric: { en: 'Health check diff', zh: 'Health check 改动行数' }, baseline: '+67 lines', guided: '+32 lines', change: '-52%' },
  { metric: { en: 'Health route code', zh: 'Health 路由代码' }, baseline: '55 lines', guided: '14 lines', change: '-75%' },
  { metric: { en: 'Health check tests', zh: 'Health check 测试数' }, baseline: '1', guided: '2', change: '+100%' },
  { metric: { en: 'Empty-title regression case', zh: '空标题回归用例' }, baseline: '0%', guided: '100%', change: { en: 'HTTP 200 to 400', zh: 'HTTP 200 变为 400' } },
]

const scenarios = [
  {
    id: 'feature',
    title: { en: 'Add a health endpoint', zh: '添加 health 接口' },
    source: { file: 'health-check-walkthrough.md', label: { en: 'Health check walkthrough', zh: 'Health check 走查' } },
    prompt: '/aiops add a health endpoint returning JSON with status and app version',
    steps: {
      en: [
        { phase: 'Align', desc: 'Clarifies scope, acceptance criteria, and edge cases' },
        { phase: 'Design', desc: 'Turns decisions into the API shape and response format' },
        { phase: 'Review', desc: 'Checks the design before coding starts' },
        { phase: 'Implement', desc: 'Writes tests first, then the smallest working code' },
        { phase: 'Ship', desc: 'Shows the diff and waits for your approval' },
      ],
      zh: [
        { phase: '对齐', desc: '明确范围、验收标准和边界情况' },
        { phase: '设计', desc: '把决策转成 API 形状和响应格式' },
        { phase: '评审', desc: '编码前先检查设计' },
        { phase: '实现', desc: '先写测试，再写最小可用代码' },
        { phase: '交付', desc: '展示 diff，等待你确认' },
      ],
    },
    outcome: {
      en: 'The recorded walkthrough adds 32 lines and 2 tests. The response includes status and version, with 0 extra fields.',
      zh: '走查记录新增 32 行代码和 2 个测试。响应包含状态和版本，额外字段为 0 个。',
    },
  },
  {
    id: 'bug',
    title: { en: 'Diagnose and fix a bug', zh: '定位并修复缺陷' },
    source: { file: 'effect-analysis.md#实验-2-修-bugpatch-空标题验证', label: { en: 'Empty-title regression case', zh: '空标题回归用例' } },
    prompt: '/aiops login endpoint returns 500 since yesterday, locate and fix',
    steps: {
      en: [
        { phase: 'Diagnose', desc: 'Reproduces the failure and traces it to root cause' },
        { phase: 'Implement', desc: 'Adds a regression test and keeps the fix narrow' },
        { phase: 'Ship', desc: 'Shows diagnosis notes and waits for approval' },
      ],
      zh: [
        { phase: '定位', desc: '复现失败，并追踪到根因' },
        { phase: '实现', desc: '补回归测试，并保持修复范围很小' },
        { phase: '交付', desc: '展示诊断笔记，等待你确认' },
      ],
    },
    outcome: {
      en: 'A bug report starts with diagnosis. The scripted example uses an empty task title to demonstrate a regression test. The fixture returns HTTP 400 for an invalid title.',
      zh: '缺陷报告从定位开始。脚本以空任务标题演示回归测试，预设实现在标题无效时返回 HTTP 400。',
    },
  },
  {
    id: 'architecture',
    title: { en: 'Scan architecture before refactoring', zh: '重构前扫描架构' },
    source: { file: 'architecture-scan-walkthrough.md', label: { en: 'Architecture scan walkthrough', zh: '架构扫描走查' } },
    prompt: '/aiops check my architecture for optimization opportunities',
    steps: {
      en: [
        { phase: 'Inspect', desc: 'Builds evidence from code structure and dependencies' },
        { phase: 'Scan', desc: 'Looks for places where change is risky or design is shallow' },
        { phase: 'Report', desc: 'Summarizes refactor opportunities with supporting facts' },
        { phase: 'Pick', desc: 'You choose one opportunity to improve' },
        { phase: 'Implement', desc: 'Designs, tests, and implements the chosen refactor' },
      ],
      zh: [
        { phase: '检查', desc: '从代码结构和依赖关系收集证据' },
        { phase: '扫描', desc: '寻找变更风险高或设计偏浅的位置' },
        { phase: '报告', desc: '用事实支撑重构机会' },
        { phase: '选择', desc: '你选择一个值得优化的点' },
        { phase: '实现', desc: '设计、测试并实现选中的重构' },
      ],
    },
    outcome: {
      en: 'In the Django walkthrough, dependency and cohesion evidence helped prioritize splitting a shared utility module.',
      zh: '在 Django 走查中，依赖关系和内聚度帮助团队优先拆分一个共享工具模块。',
    },
  },
]

const graphWorkflow = [
  {
    title: { en: 'Check graph status', zh: '检查图谱状态' },
    command: '/code-graph status',
    detail: { en: 'Check the target worktree for usable graph data. Explore the source directly when structure is unavailable.', zh: '检查目标工作区是否已有可用图谱。图谱不可用时，直接查看源码。' },
  },
  {
    title: { en: 'Build missing structure', zh: '构建缺失的结构图谱' },
    command: '/code-graph build',
    detail: { en: 'With graphify installed, build from a clean Git worktree. Tree-sitter extracts imports, exports, and calls. Recheck status after the build.', zh: '安装 graphify 后，从干净的 Git 工作区构建。Tree-sitter 会提取导入、导出和调用关系。构建完成后再次检查状态。' },
  },
  {
    title: { en: 'Inspect clusters and highly connected modules', zh: '查看社区及连接密集的模块' },
    command: '/code-graph query communities',
    detail: { en: 'Louvain clusters suggest module boundaries. Query god-nodes to find modules with the most connections.', zh: 'Louvain 聚类提供模块边界的线索。查询 god-nodes 可找出连接最多的模块。' },
  },
  {
    title: { en: 'Trace what a change would affect', zh: '追踪改动影响范围' },
    command: '/code-graph query rdeps <node>',
    detail: { en: 'Check incoming dependencies before editing. Use confidence scores to identify inferred edges that need source verification.', zh: '编辑前检查入向依赖，并用置信度找出需要通过源码核实的推断关系。' },
  },
]

const content = {
  en: {
    title: 'Demos & Benchmarks',
    intro: 'Explore three workflows through their prompts, review steps, and outcomes. Compare the two scripted examples to see how the included implementations differ.',
    setup: 'Try the demo project',
    tryPrompt: 'Then paste a case prompt into your IDE chat. The login prompt illustrates bug triage. The demo project uses an empty task title for its regression case.',
    repoLink: 'Browse the demo repository',
    compare: 'Scripted benchmark comparison',
    method: 'The benchmark script writes predefined implementations and tests into copies of the demo project, then runs Jest and reports code and test results. The figures describe those fixtures. The script makes zero model calls.',
    reproduce: 'Run the script from the aiops repository root.',
    figures: 'These figures come from the demo overview. The detailed analysis lists different line counts and reports the full bug-fix suite separately.',
    metric: 'Metric',
    baseline: 'Baseline fixture',
    guided: 'aiops-style fixture',
    change: 'Change',
    overview: 'Demo overview',
    analysis: 'Detailed analysis',
    graph: 'Code Graph workflow',
    graphIntro: 'For an architecture scan, graphify can add structural evidence about module boundaries and dependencies.',
    graphLink: 'Code Graph build and query reference',
  },
  zh: {
    title: '实例与效果',
    intro: '通过提示词、评审步骤和结果了解三种工作流，并比较两个脚本实验中的预设实现。',
    setup: '体验示例项目',
    tryPrompt: '在 IDE 聊天框中输入案例提示词。登录示例用于展示缺陷分流，示例项目使用空任务标题作为回归用例。',
    repoLink: '浏览示例仓库',
    compare: '脚本实验对比',
    method: '实验脚本将预设的实现和测试写入示例项目的副本，再运行 Jest 并报告代码和测试结果。下方数字反映这些预设方案，脚本全程没有调用模型。',
    reproduce: '在 aiops 仓库的根目录运行脚本。',
    figures: '下方数字来自示例总览。详细分析列出了不同的代码行数，并单独报告修复场景的完整测试套件结果。',
    metric: '指标',
    baseline: '基线方案',
    guided: 'aiops 风格方案',
    change: '变化',
    overview: '示例总览',
    analysis: '详细分析',
    graph: '代码图谱工作流',
    graphIntro: '架构扫描时，可用 graphify 为模块边界和依赖关系提供结构证据。',
    graphLink: '代码图谱构建与查询参考',
  },
}

export default function DemosPage() {
  const { lang } = useI18n()
  const c = content[lang]
  const linkClass = 'text-primary underline underline-offset-4'

  return (
    <article className="doc-page min-w-0 space-y-10">
      <header className="space-y-3">
        <h1>{c.title}</h1>
        <p className="max-w-[65ch] text-muted-foreground">{c.intro}</p>
      </header>

      <section className="space-y-4">
        <h2>{c.setup}</h2>
        <pre className="overflow-x-auto rounded-md border border-border bg-card p-4 text-sm"><code>{caseSetup}</code></pre>
        <p>{c.tryPrompt}</p>
        <p className="text-sm"><a href="https://github.com/yugasun/aiops-demo" className={linkClass}>{c.repoLink}</a></p>
      </section>

      {scenarios.map((scenario) => (
        <section key={scenario.id} id={scenario.id} className="space-y-4 border-t border-border pt-6">
          <h2>{scenario.title[lang]}</h2>
          <div className="grid grid-cols-1 rounded-lg border border-border bg-card lg:grid-cols-2">
            <div className="min-w-0 rounded-t-lg border-b border-border bg-background p-4 lg:rounded-l-lg lg:rounded-tr-none lg:border-r lg:border-b-0">
              <pre className="overflow-x-auto whitespace-pre-wrap break-words border-l-2 border-primary py-2 pl-4 text-sm"><code>{scenario.prompt}</code></pre>
            </div>
            <dl className="min-w-0 divide-y divide-border px-4 text-sm">
              {scenario.steps[lang].map(({ phase, desc }) => (
                <div key={phase} className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4 lg:grid-cols-1 lg:gap-1">
                  <dt className="font-medium">{phase}</dt>
                  <dd className="text-muted-foreground">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p>{scenario.outcome[lang]}</p>
          <p className="text-sm"><a href={`${demoDocs}/${scenario.source.file}`} className={linkClass}>{scenario.source.label[lang]}</a></p>
        </section>
      ))}

      <section className="space-y-4 border-t border-border pt-6">
        <h2>{c.compare}</h2>
        <p>{c.method}</p>
        <p>{c.reproduce} <a href={`${demoDocs}/benchmark.sh`} className={linkClass}><code>bash docs/demos/benchmark.sh</code></a></p>
        <p className="text-sm text-muted-foreground">{c.figures}</p>
        <div className="hidden md:block">
          <Table className="border-y border-border" aria-label={c.compare}>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead scope="col">{c.metric}</TableHead>
                <TableHead scope="col" className="text-right whitespace-normal">{c.baseline}</TableHead>
                <TableHead scope="col" className="text-right whitespace-normal">{c.guided}</TableHead>
                <TableHead scope="col" className="text-right">{c.change}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisons.map(({ metric, baseline, guided, change }) => (
                <TableRow key={metric.en} className="border-border hover:bg-transparent">
                  <TableHead scope="row" className="py-3 whitespace-normal">{metric[lang]}</TableHead>
                  <TableCell className="text-right font-mono text-muted-foreground">{baseline}</TableCell>
                  <TableCell className="text-right font-mono">{guided}</TableCell>
                  <TableCell className="text-right font-mono text-primary">{typeof change === 'string' ? change : change[lang]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <dl className="divide-y divide-border border-y border-border text-sm md:hidden">
          {comparisons.map(({ metric, baseline, guided, change }) => (
            <div key={metric.en} className="space-y-2 py-3">
              <dt className="font-semibold">{metric[lang]}</dt>
              <dd>
                <dl className="grid grid-cols-2 gap-2">
                  <div>
                    <dt className="text-muted-foreground">{c.baseline}</dt>
                    <dd className="font-mono">{baseline}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{c.guided}</dt>
                    <dd className="font-mono">{guided}</dd>
                  </div>
                  <div className="col-span-2 flex flex-wrap gap-x-2">
                    <dt className="text-muted-foreground">{c.change}</dt>
                    <dd className="font-mono text-primary">{typeof change === 'string' ? change : change[lang]}</dd>
                  </div>
                </dl>
              </dd>
            </div>
          ))}
        </dl>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <li><a href={`${demoDocs}/README.md`} className={linkClass}>{c.overview}</a></li>
          <li><a href={`${demoDocs}/effect-analysis.md`} className={linkClass}>{c.analysis}</a></li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <h2>{c.graph}</h2>
        <p>{c.graphIntro}</p>
        <ol className="list-decimal space-y-4 border-y border-border py-4 pl-6 marker:text-primary">
          {graphWorkflow.map(({ title, command, detail }) => (
            <li key={command} className="space-y-1 pl-1">
              <h3 className="text-base">{title[lang]}</h3>
              <p className="text-sm"><code>{command}</code></p>
              <p className="text-sm text-muted-foreground">{detail[lang]}</p>
            </li>
          ))}
        </ol>
        <p className="text-sm"><a href="https://github.com/yugasun/aiops/blob/main/skills/code-graph/build-steps.md" className={linkClass}>{c.graphLink}</a></p>
      </section>
    </article>
  )
}
