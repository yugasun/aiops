import { useI18n } from '../lib/i18n'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

const installCommand = 'npx -y github:yugasun/aiops'

const installOptions = [
  { command: `${installCommand} --yes`, use: { en: 'Run without prompts in CI', zh: '在 CI 中免交互安装' } },
  { command: "npx skills@latest add yugasun/aiops -g -y --skill '*'", use: { en: 'Install globally with the Skills CLI', zh: '使用 Skills CLI 全局安装' } },
  { command: 'curl -fsSL https://raw.githubusercontent.com/yugasun/aiops/main/install.sh | bash', use: { en: 'Install via curl', zh: '使用 curl 安装' } },
  { command: `${installCommand} uninstall`, use: { en: 'Remove installed aiops files', zh: '卸载已安装的 aiops 文件' } },
]

const content = {
  en: {
    title: 'Getting started',
    intro: 'Install aiops from the repository where you want to work, then start a task in your IDE chat.',
    prerequisites: 'Prerequisites',
    requirements: ['Node.js 18+', 'Cursor, Claude Code, Codex, Copilot, or OpenCode', 'A codebase for agent-assisted development'],
    install: 'Install aiops',
    installNotes: 'Use the up and down arrows, Space, or Ctrl+A to select IDEs. Then choose the install scope and hooks. Restart your IDE when the installer finishes.',
    installScope: 'Skills always go in your home directory. Project scope installs agents, hooks, and rules in the repository. The installer leaves AGENTS.md alone by default.',
    options: 'Installer options',
    command: 'Command',
    purpose: 'Use',
    start: 'Start a task',
    chat: 'Open the project and describe the change in your IDE chat.',
    prompt: '/aiops Add a health check endpoint',
    setup: 'aiops tracks tasks locally by default, with no separate setup step. To configure a team’s GitHub or GitLab issue tracker, use /aiops-setup or add aiops.yaml at the repository root.',
    follow: 'Follow the workflow',
    routing: 'aiops routes the request to a feature, bug fix, architecture task, or larger planning workflow. It shows the current phase and asks for decisions as they come up.',
    example: 'For the health endpoint, agree on scope and the API response, write a failing test, then make the smallest change that passes it. Before delivery, aiops prunes excess code, reviews the diff, and checks it against the tech-spec. It commits only when you ask.',
    resume: 'Resume saved work',
    resumeCommand: '/aiops continue',
    resumeNote: 'aiops saves progress in .scratch/<slug>/flow.state.yaml and resumes from the last verified step. It checks required artifacts, such as an approved design review, before advancing. Leave routine state updates to the workflow.',
    troubleshooting: 'Troubleshooting',
    problem: 'Problem',
    fix: 'Fix',
    issues: [
      { problem: '/aiops not found', fix: 'Run the installer again and restart your IDE.' },
      { problem: 'Stale skill behavior', fix: 'Reinstall to refresh the skills.' },
      { problem: 'Wrong skill cited', fix: 'Check', reference: 'https://github.com/yugasun/aiops/blob/main/docs/skill-registry.md' },
      { problem: 'flow.state.yaml corrupted', fix: 'Move the affected .scratch/<slug>/ directory aside, then run /aiops again.' },
    ],
  },
  zh: {
    title: '快速开始',
    intro: '在要开发的项目仓库中安装 aiops，然后在 IDE 聊天框中启动任务。',
    prerequisites: '前置条件',
    requirements: ['Node.js 18+', 'Cursor、Claude Code、Codex、Copilot 或 OpenCode', '一个用于 AI 辅助开发的代码库'],
    install: '安装 aiops',
    installNotes: '使用方向键、空格键或 Ctrl+A 选择 IDE，然后选择安装范围和 hooks。安装完成后重启 IDE。',
    installScope: 'Skills 始终安装在用户主目录。项目级安装会把 agents、hooks 和规则放进仓库。安装器默认保留现有的 AGENTS.md。',
    options: '安装选项',
    command: '命令',
    purpose: '用途',
    start: '启动任务',
    chat: '打开项目，在 IDE 聊天框中描述要做的改动。',
    prompt: '/aiops 加一个 health 接口',
    setup: 'aiops 默认在本地记录任务，无需单独配置。团队需要对接 GitHub 或 GitLab issue 时，可使用 /aiops-setup 或在仓库根目录添加 aiops.yaml。',
    follow: '按工作流推进',
    routing: 'aiops 会将请求分流到功能开发、缺陷修复、架构分析或大型任务规划，并在每个阶段提示需要确认的事项。',
    example: '以 health 接口为例，先确认范围和 API 响应格式，写一个会失败的测试，再做能通过测试的最小改动。交付前，aiops 会精简代码、评审 diff，并对照 tech-spec 检查偏差。提交由你发起。',
    resume: '恢复已保存的任务',
    resumeCommand: '/aiops 继续',
    resumeNote: 'aiops 将进度保存在 .scratch/<slug>/flow.state.yaml，从上次验证通过的步骤恢复。进入下一阶段前会检查必备产物，例如已通过的设计评审。状态文件通常由工作流维护。',
    troubleshooting: '故障排查',
    problem: '问题',
    fix: '处理方式',
    issues: [
      { problem: '不认识 /aiops', fix: '重新运行安装器并重启 IDE。' },
      { problem: '技能行为像旧版', fix: '重新安装以更新 skills。' },
      { problem: '技能引用错误', fix: '查看', reference: 'https://github.com/yugasun/aiops/blob/main/docs/skill-registry.md' },
      { problem: 'flow.state.yaml 损坏', fix: '先移走受影响的 .scratch/<slug>/ 目录，再运行 /aiops。' },
    ],
  },
}

export default function GettingStartedPage() {
  const { lang } = useI18n()
  const c = content[lang]

  return (
    <article className="doc-page min-w-0 space-y-10">
      <header className="space-y-3">
        <h1>{c.title}</h1>
        <p className="max-w-[65ch] text-muted-foreground">{c.intro}</p>
      </header>

      <section className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-6">
        <h2>{c.prerequisites}</h2>
        <ul className="divide-y divide-border text-sm leading-relaxed text-foreground">
          {c.requirements.map((requirement) => (
            <li key={requirement} className="py-2.5">{requirement}</li>
          ))}
        </ul>
      </section>

      <section className="min-w-0 space-y-4 border-t border-border pt-6">
        <h2><span className="font-mono text-primary">1.</span>{' '}{c.install}</h2>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border border-l-4 border-l-primary bg-card px-4 py-6 font-mono text-base font-semibold text-primary sm:px-6 sm:py-8 sm:text-lg"><code className="[overflow-wrap:anywhere]">{installCommand}</code></pre>
        <p>{c.installNotes}</p>
        <p>{c.installScope}</p>

        <h3 className="pt-2">{c.options}</h3>
        <Table className="border-y border-border" aria-label={c.options}>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead scope="col">{c.command}</TableHead>
              <TableHead scope="col">{c.purpose}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installOptions.map(({ command, use }) => (
              <TableRow key={command} className="border-border hover:bg-transparent">
                <TableCell className="py-3 align-top whitespace-normal [overflow-wrap:anywhere]"><code>{command}</code></TableCell>
                <TableCell className="py-3 align-top whitespace-normal text-muted-foreground">{use[lang]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="min-w-0 space-y-4 border-t border-border pt-6">
        <h2><span className="font-mono text-primary">2.</span>{' '}{c.start}</h2>
        <p>{c.chat}</p>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-card p-4 font-mono text-sm"><code className="[overflow-wrap:anywhere]">{c.prompt}</code></pre>
        <p>{c.setup}</p>
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <h2><span className="font-mono text-primary">3.</span>{' '}{c.follow}</h2>
        <p>{c.routing}</p>
        <p>{c.example}</p>
      </section>

      <section className="min-w-0 space-y-4 border-t border-border pt-6">
        <h2><span className="font-mono text-primary">4.</span>{' '}{c.resume}</h2>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-card p-4 font-mono text-sm"><code className="[overflow-wrap:anywhere]">{c.resumeCommand}</code></pre>
        <p>{c.resumeNote}</p>
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <h2>{c.troubleshooting}</h2>
        <Table className="border-y border-border" aria-label={c.troubleshooting}>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead scope="col">{c.problem}</TableHead>
              <TableHead scope="col">{c.fix}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {c.issues.map((issue) => (
              <TableRow key={issue.problem} className="border-border hover:bg-transparent">
                <TableHead scope="row" className="py-3 align-top whitespace-normal">{issue.problem}</TableHead>
                <TableCell className="py-3 align-top whitespace-normal text-muted-foreground">
                  {issue.fix}
                  {issue.reference ? (
                    <> <a href={issue.reference} className="text-primary underline underline-offset-4">skill-registry.md</a></>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </article>
  )
}
