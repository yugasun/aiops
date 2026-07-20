import { useI18n } from '../lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'

const content = {
  en: {
    title: 'Getting Started',
    subtitle: 'Install once, then run your first guided task in a target project.',
    promise: 'Three minutes to the first /aiops run',
    prereqs: {
      title: 'Prerequisites',
      items: ['Node.js 18+', 'Cursor, Claude Code, Codex, Copilot, or OpenCode', 'A codebase for agent-assisted development'],
    },
    steps: [
      {
        num: 1, title: 'Install aiops',
        body: [
          { cmd: 'npx -y github:yugasun/aiops', desc: 'Recommended — single command' },
          { cmd: "npx skills@latest add yugasun/aiops -g -y --skill '*'", desc: 'Skills CLI (global)' },
          { cmd: 'curl -fsSL https://raw.githubusercontent.com/yugasun/aiops/main/install.sh | bash', desc: 'Alternative via curl' },
          { cmd: 'npx -y github:yugasun/aiops uninstall', desc: 'Remove installed aiops files' },
        ],
        note: 'Interactive: ↑↓/space/ctrl+a IDEs, then scope + hooks. Skills always → ~/ (never project tree). AGENTS.md off by default. CI: --yes. Restart IDE after install.',
      },
      {
        num: 2, title: 'Start from your project chat',
        body: [
          { cmd: '/aiops Add a health check endpoint', desc: 'Describe the change in your project chat' },
          { cmd: '/aiops continue', desc: 'Resume the saved task later' },
          { cmd: '/aiops-setup', desc: 'Explicit setup (usually not needed)' },
        ],
        note: 'Most projects need no setup. aiops tracks work locally by default; add aiops.yaml only when a team wants GitHub/GitLab issue tracking.',
      },
      {
        num: 3, title: 'Let the workflow guide the work',
        body: [],
        note: 'aiops shows the current step, asks for the missing decisions, runs the delivery checks, and commits only when you ask.',
      },
    ],
    afterTitle: 'After you type /aiops',
    after: [
      { title: 'Task routing', body: 'aiops decides whether this is a feature, bug, architecture task, or larger planning job.' },
      { title: 'Step-by-step prompts', body: 'You see the current phase instead of guessing which skill or agent to invoke.' },
      { title: 'Saved progress', body: 'The workflow writes state under .scratch/ so a later session can continue safely.' },
      { title: 'Delivery checks', body: 'Implementation goes through tests, pruning, code review, drift check against tech-spec, and your final commit approval.' },
    ],
    example: {
      title: 'Example — health endpoint',
      desc: 'A small feature usually stays in one session: clarify scope, agree the API shape, write tests first, implement the smallest change, review, then wait for your commit approval.',
    },
    journey: {
      title: 'Resume later',
      desc: 'Every task saves its current step in .scratch/<slug>/flow.state.yaml. Resume with /aiops continue — no extra setup needed.',
      how: [
        { title: 'Start a task', body: 'Type /aiops and describe your goal. aiops infers whether this is a feature, bug, or architecture task.' },
        { title: 'Pick up later', body: 'Type /aiops continue. aiops reads the saved state and resumes from the last verified step.' },
        { title: 'Keep gates honest', body: 'Before moving forward, aiops checks required artifacts such as an approved design review.' },
      ],
      note: 'The state file is for the workflow. You normally do not edit it by hand.',
    },
    troubleshoot: [
      { p: '/aiops not found', f: 'Re-run installer; restart IDE' },
      { p: 'Stale skill behavior', f: 'Re-install to refresh skills' },
      { p: 'Wrong skill cited', f: 'Check skill-registry.md' },
      { p: 'flow.state.yaml corrupted', f: 'Delete .scratch/<slug>/ and re-run /aiops' },
    ],
  },
  zh: {
    title: '快速开始',
    subtitle: '安装一次，然后在目标项目里跑通第一个引导式任务。',
    promise: '三分钟跑通第一次 /aiops',
    prereqs: {
      title: '前置条件',
      items: ['Node.js 18+', 'Cursor、Claude Code、Codex、Copilot 或 OpenCode', '一个你想用 AI 辅助开发的代码库'],
    },
    steps: [
      {
        num: 1, title: '安装 aiops',
        body: [
          { cmd: 'npx -y github:yugasun/aiops', desc: '推荐 — 单条命令' },
          { cmd: "npx skills@latest add yugasun/aiops -g -y --skill '*'", desc: 'Skills CLI 全局安装' },
          { cmd: 'npx -y github:yugasun/aiops uninstall', desc: '卸载已安装的 aiops 文件' },
        ],
        note: '交互安装：↑↓/空格/ctrl+a 选 IDE，再选范围与 hooks。Skills 始终进 ~/（不写进项目）。默认不写 AGENTS.md。CI 用 --yes。装完重启 IDE。',
      },
      {
        num: 2, title: '从项目聊天框开始',
        body: [
          { cmd: '/aiops 加一个 health 接口', desc: '在项目聊天框里描述这次改动' },
          { cmd: '/aiops 继续', desc: '稍后恢复已保存的任务' },
        ],
        note: '大多数项目不需要额外配置。aiops 默认在本地记录任务；团队需要 GitHub/GitLab issue 时再加 aiops.yaml。',
      },
      {
        num: 3, title: '让工作流带着推进',
        body: [],
        note: 'aiops 会显示当前步骤，补齐必要决策，跑完交付检查，并且只在你要求时提交。',
      },
    ],
    afterTitle: '输入 /aiops 之后',
    after: [
      { title: '任务分流', body: 'aiops 判断这是功能、Bug、架构任务，还是需要先规划的大任务。' },
      { title: '分步提示', body: '你会看到当前阶段，不需要猜该调用哪个 skill 或 agent。' },
      { title: '自动保存进度', body: '工作流把状态写到 .scratch/，后续会话可以安全接上。' },
      { title: '交付检查', body: '实现会经过测试、精简、代码评审、对照 tech-spec 的漂移检查，最后等你确认提交。' },
    ],
    example: {
      title: '示例 — health 接口',
      desc: '小功能通常一次会话完成：明确范围，确认接口形状，先写测试，再做最小实现，评审后等你确认提交。',
    },
    journey: {
      title: '稍后继续',
      desc: '每个任务都会把当前步骤保存在 .scratch/<slug>/flow.state.yaml。输入 /aiops 继续即可恢复，无需额外操作。',
      how: [
        { title: '开始任务', body: '输入 /aiops 并描述目标。aiops 会判断这是功能、Bug 还是架构任务。' },
        { title: '稍后恢复', body: '输入 /aiops 继续。aiops 读取保存状态，从上次验证通过的位置接着走。' },
        { title: '保持门控真实', body: '推进前，aiops 会检查必要产物，例如已经通过的设计评审。' },
      ],
      note: '状态文件属于工作流内部数据，通常不需要手动编辑。',
    },
    troubleshoot: [
      { p: '不认识 /aiops', f: '重新安装，重启 IDE' },
      { p: '技能行为像旧版', f: '重新安装以更新 skills' },
      { p: '技能引用错误', f: '查看 skill-registry.md' },
      { p: 'flow.state.yaml 损坏', f: '删除 .scratch/<slug>/ 后重新运行 /aiops' },
    ],
  },
}

export default function GettingStartedPage() {
  const { lang } = useI18n()
  const c = content[lang]

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-[linear-gradient(135deg,rgba(108,138,255,0.14),rgba(34,211,238,0.06)_45%,rgba(14,15,22,0.72))] p-6">
        <div className="absolute right-4 top-4 h-24 w-24 rounded-full border border-primary/20 opacity-40" />
        <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-[var(--cyan-glow)] blur-2xl" />
        <Badge variant="outline" className="mb-4 border-[var(--cyan)]/30 text-[var(--cyan)] bg-background/40 font-mono">
          {c.promise}
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 max-w-2xl">{c.title}</h1>
        <p className="text-muted-foreground max-w-2xl">{c.subtitle}</p>
      </div>

      {/* Prerequisites */}
      <div className="rounded-xl border border-border/70 bg-card/40 p-5">
        <h2 className="text-lg font-semibold mb-3">{c.prereqs.title}</h2>
        <ul className="grid gap-2 sm:grid-cols-3">
          {c.prereqs.items.map((p, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2 rounded-lg bg-background/35 border border-border/50 px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] shadow-[0_0_12px_rgba(74,222,128,0.7)]" /> {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      <div className="relative space-y-4">
        <div className="absolute left-4 top-6 bottom-6 w-px bg-gradient-to-b from-primary/60 via-[var(--cyan)]/40 to-transparent" />
        {c.steps.map((step) => (
          <div key={step.num} className="relative pl-11">
            <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 font-mono text-sm text-primary shadow-[0_0_24px_rgba(108,138,255,0.18)]">
              {step.num}
            </div>
            <Card className="bg-card/60 backdrop-blur-xl border-border/80 overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-border/70">
                <CardTitle className="text-base">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {step.body.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {step.body.map((b, i) => (
                      <div key={i} className="rounded-lg border border-border/70 bg-background/35 overflow-hidden">
                        <div className="px-3 py-2 border-b border-border/60 text-xs text-muted-foreground">{b.desc}</div>
                        <div className="px-3 py-2.5 font-mono text-sm text-[var(--green)]"
                          style={{ textShadow: '0 0 8px rgba(74,222,128,0.2)' }}>
                          <span className="text-[var(--cyan)] mr-2">$</span>{b.cmd}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{step.note}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">{c.afterTitle}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {c.after.map((item, i) => (
            <Card key={item.title} className="bg-card/55 border-border/80">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-[var(--cyan)]">0{i + 1}</span>
                  <div className="font-semibold text-sm">{item.title}</div>
                </div>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Example */}
      <div>
        <h2 className="text-lg font-semibold mb-2">{c.example.title}</h2>
        <p className="text-sm text-muted-foreground">{c.example.desc}</p>
      </div>

      {/* Journey State */}
      <div>
        <h2 className="text-lg font-semibold mb-2">{c.journey.title}</h2>
        <p className="text-sm text-muted-foreground mb-3">{c.journey.desc}</p>
        <div className="space-y-3 mb-3">
          {c.journey.how.map((h, i) => (
            <Card key={i} className="bg-card/60 backdrop-blur-xl border-border">
              <CardContent className="p-4">
                <div className="font-semibold text-sm mb-1">{h.title}</div>
                <p className="text-sm text-muted-foreground">{h.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{c.journey.note}</p>
      </div>

      {/* Troubleshooting */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Troubleshooting</h2>
        <Card className="bg-card/60 backdrop-blur-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="font-mono text-[0.65rem] uppercase tracking-wider">Problem</TableHead>
                <TableHead className="font-mono text-[0.65rem] uppercase tracking-wider">Fix</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {c.troubleshoot.map((t, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell className="font-mono text-xs">{t.p}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{t.f}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
