import { useI18n } from '../lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'

const content = {
  en: {
    title: 'Getting Started',
    subtitle: 'Install and use the bundle in a target project',
    prereqs: {
      title: 'Prerequisites',
      items: ['Node.js 18+', 'Cursor, Claude Code, Codex, Copilot, or Windsurf', 'A codebase for agent-assisted development'],
    },
    steps: [
      {
        num: 1, title: 'Install',
        body: [
          { cmd: 'npx -y github:yugasun/aiops', desc: 'Recommended — single command' },
          { cmd: "npx skills@latest add yugasun/aiops -g -y --skill '*'", desc: 'Skills CLI (global)' },
          { cmd: 'curl -fsSL https://raw.githubusercontent.com/yugasun/aiops/main/install.sh | bash', desc: 'Alternative via curl' },
        ],
        note: 'Options: --ide cursor, -g (global), --list, --skills-only, --agents-only. Restart IDE after install.',
      },
      {
        num: 2, title: 'Start in your project',
        body: [
          { cmd: '/aiops Add a health check endpoint', desc: 'Open your project in the AI IDE, type in chat' },
          { cmd: '/aiops continue', desc: 'Resume from flow.state.yaml' },
          { cmd: '/aiops-setup', desc: 'Explicit setup (usually not needed)' },
        ],
        note: 'First run bootstraps silently (local markdown issues by default). Add aiops.yaml at repo root for GitHub/GitLab teams.',
      },
      {
        num: 3, title: 'Follow the flow',
        body: [],
        note: 'The Flow Conductor shows step N/M: Align → Design → Design review → Implement → Commit only when you ask.',
      },
    ],
    example: {
      title: 'Example — health endpoint',
      desc: 'Single-session feature: align → design → design review → implement (lean → tdd → prune → review) → commit only when you ask.',
    },
    journey: {
      title: 'Journey state',
      desc: 'The Flow Conductor saves progress in .scratch/<slug>/flow.state.yaml. Resume with /aiops continue — no extra setup needed.',
      how: [
        { title: 'Start a task', body: 'Type /aiops and describe your goal. The conductor infers task type, shows step N/M, and saves state automatically.' },
        { title: 'Resume later', body: 'Type /aiops continue (or 继续). The conductor reads flow.state.yaml and picks up from your current step.' },
        { title: 'Gate checks', body: 'Before advancing, the conductor verifies that gate artifacts (e.g. DESIGN_REVIEW.md with APPROVE) exist. No manual commands needed.' },
      ],
      note: 'State management is fully automatic — you never need to touch flow.state.yaml or run any CLI commands.',
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
    subtitle: '在目标项目中安装和使用',
    prereqs: {
      title: '前置条件',
      items: ['Node.js 18+', 'Cursor、Claude Code、Codex、Copilot 或 Windsurf', '一个你想用 AI 辅助开发的代码库'],
    },
    steps: [
      {
        num: 1, title: '安装',
        body: [
          { cmd: 'npx -y github:yugasun/aiops', desc: '推荐 — 单条命令' },
          { cmd: "npx skills@latest add yugasun/aiops -g -y --skill '*'", desc: 'Skills CLI 全局安装' },
        ],
        note: '可选参数：--ide cursor、-g（全局）、--list。装完重启 IDE。',
      },
      {
        num: 2, title: '在项目中开始',
        body: [
          { cmd: '/aiops 加一个 health 接口', desc: '打开项目，在聊天框输入' },
          { cmd: '/aiops 继续', desc: '从 flow.state.yaml 恢复' },
        ],
        note: '首次运行自动静默配置。团队用 GitHub/GitLab 时加 aiops.yaml。',
      },
      {
        num: 3, title: '跟着流程走',
        body: [],
        note: 'Flow Conductor 显示「第 N/M 步」：对齐 → 设计 → 设计评审 → 实现 → 你确认后提交。',
      },
    ],
    example: {
      title: '示例 — health 接口',
      desc: '单次会话功能：对齐 → 设计 → 设计评审 → 实现（lean → tdd → prune → review）→ 你确认后提交。',
    },
    journey: {
      title: 'Journey 状态',
      desc: 'Flow Conductor 将进度保存在 .scratch/<slug>/flow.state.yaml。输入 /aiops 继续即可恢复，无需额外操作。',
      how: [
        { title: '开始任务', body: '输入 /aiops 并描述目标。Conductor 自动判断任务类型，显示第 N/M 步，并保存状态。' },
        { title: '稍后恢复', body: '输入 /aiops 继续。Conductor 读取 flow.state.yaml，从当前步骤接着走。' },
        { title: 'Gate 检查', body: '推进前 Conductor 自动验证 gate 产物（如 DESIGN_REVIEW.md 包含 APPROVE）。无需手动命令。' },
      ],
      note: '状态管理完全自动 —— 你不需要手动操作 flow.state.yaml 或运行任何 CLI 命令。',
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">{c.title}</h1>
        <p className="text-muted-foreground">{c.subtitle}</p>
      </div>

      {/* Prerequisites */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{c.prereqs.title}</h2>
        <ul className="space-y-1.5">
          {c.prereqs.items.map((p, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="text-[var(--green)]">✓</span> {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      {c.steps.map((step) => (
        <div key={step.num}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">{step.num}</Badge>
            {step.title}
          </h2>
          {step.body.length > 0 && (
            <div className="space-y-2 mb-3">
              {step.body.map((b, i) => (
                <Card key={i} className="bg-card/60 backdrop-blur-xl border-border">
                  <CardHeader className="py-2 px-4 border-b border-border">
                    <CardTitle className="text-xs text-muted-foreground font-normal">{b.desc}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2.5 px-4 font-mono text-sm text-[var(--green)]"
                    style={{ textShadow: '0 0 8px rgba(74,222,128,0.2)' }}>
                    <span className="text-[var(--cyan)] mr-2">$</span>{b.cmd}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">{step.note}</p>
        </div>
      ))}

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
