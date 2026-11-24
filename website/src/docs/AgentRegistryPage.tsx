import { useMemo } from 'react'
import { useI18n } from '../lib/i18n'
import { artifacts, buildAgents, sequences, t } from '../data/registry'

export default function AgentRegistryPage() {
  const { lang } = useI18n()
  const agents = useMemo(() => buildAgents(), [])
  const producer = lang === 'zh' ? '生产者' : 'Producer'
  const consumers = lang === 'zh' ? '消费者' : 'Consumers'

  return (
    <article className="doc-page space-y-12">
      <header className="space-y-4">
        <h1>{lang === 'zh' ? 'Agent 介绍' : 'Agents'}</h1>
        <p className="lead text-muted-foreground">
          {lang === 'zh'
            ? 'aiops 会按任务类型选择负责人。每个 Agent 负责一个阶段，并留下可检查的产物。'
            : 'aiops picks the right owner for each task type. Each agent owns a phase and leaves inspectable artifacts behind.'}
        </p>
      </header>

      <section className="space-y-4">
        <h2>{lang === 'zh' ? '所有 Agent' : 'All Agents'}</h2>
        <ul role="list" className="divide-y divide-border rounded-lg border border-border bg-card">
          {agents.map((agent) => (
            <li key={agent.id} className="grid gap-x-6 gap-y-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:px-6">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-primary [overflow-wrap:anywhere]">
                  <code className="font-mono">{agent.id}</code>
                </h3>
                <p className="text-sm font-medium text-foreground">{t(agent.role, lang)}</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">{t(agent.desc, lang)}</p>
                <dl className="grid gap-x-6 gap-y-2 border-t border-border pt-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold">{lang === 'zh' ? '技能' : 'Skills'}</dt>
                    <dd className="mt-1 font-mono text-muted-foreground [overflow-wrap:anywhere]">
                      {agent.skills.map((skill) => `/${skill}`).join(', ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">{lang === 'zh' ? '产出' : 'Outputs'}</dt>
                    <dd className="mt-1 font-mono text-muted-foreground [overflow-wrap:anywhere]">
                      {agent.outputs.join(', ')}
                    </dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <header className="space-y-2">
          <h2>{lang === 'zh' ? '示例流程' : 'Example routes'}</h2>
          <p className="text-muted-foreground">
            {lang === 'zh'
              ? '示例假设已有代码库、跟踪器已配置，且采用单会话交付。条件分支分别展示相对于示例的变化；多个条件组合时以实际计划为准。交付阶段由 /aiops-implement 执行实现、测试、精简和代码评审。'
              : 'Examples assume an existing codebase, a configured tracker, and single-session delivery. Each branch varies the example individually; the live plan resolves combinations. Delivery runs implementation, tests, Prune, and code review through /aiops-implement.'}
          </p>
        </header>
        <div className="border-y border-border">
          <ul role="list" className="divide-y divide-border">
            {sequences.map((sequence) => (
              <li key={sequence.taskKind} className="grid items-start gap-x-5 gap-y-2 py-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
                <h3 className="self-start pt-1 text-sm font-semibold text-foreground">{t(sequence.title, lang)}</h3>
                <div className="space-y-3">
                  <ol className="route-phases">
                    {sequence.phases.map((phase) => (
                      <li key={phase.phase_id}>
                        {t(phase.title, lang)}
                        <span className="route-phase-details">
                          <code>{phase.skill}</code>
                          <span>{phase.agent || 'Flow Conductor'}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  {sequence.branches.length > 0 && (
                    <details className="text-sm text-muted-foreground">
                      <summary className="cursor-pointer">{lang === 'zh' ? '条件分支' : 'Conditional branches'}</summary>
                      <ul className="mt-2 list-disc space-y-2 pl-5">
                        {sequence.branches.map((branch) => (
                          <li key={branch.id}>
                            {t(branch.title, lang)}.{' '}
                            {branch.remove > 0
                              ? `${lang === 'zh' ? '替换' : 'Replace'} ${sequence.phases.slice(branch.start, branch.start + branch.remove).map((phase) => t(phase.title, lang)).join(' → ')}`
                              : branch.start > 0
                                ? (lang === 'zh' ? `${t(sequence.phases[branch.start - 1].title, lang)}之后` : `After ${t(sequence.phases[branch.start - 1].title, lang)}`)
                                : lang === 'zh' ? '开头' : 'At the start'}
                            {' → '}{branch.phases.map((phase) => `${t(phase.title, lang)} (${phase.skill}, ${phase.agent || 'Flow Conductor'})`).join(' → ')}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <header className="space-y-2">
          <h2 id="artifact-contracts">{lang === 'zh' ? '产物契约' : 'Artifact contracts'}</h2>
          <p className="text-muted-foreground">
            {lang === 'zh'
              ? '这些文件让后续阶段知道前面做过什么，也让评审有据可查。'
              : 'These files preserve decisions for later phases and give reviewers something concrete to check.'}
          </p>
        </header>
        <div className="hidden overflow-x-auto rounded-lg border border-border bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:block" role="region" aria-labelledby="artifact-contracts" tabIndex={0}>
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th scope="col" className="py-3 pl-4 pr-4 font-semibold">{lang === 'zh' ? '文件' : 'File'}</th>
                <th scope="col" className="py-3 pr-4 font-semibold">{producer}</th>
                <th scope="col" className="py-3 pr-4 font-semibold">{consumers}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {artifacts.map((artifact) => (
                <tr key={artifact.file} className="align-top">
                  <th scope="row" className="py-3 pl-4 pr-4 font-semibold text-primary">
                    <code className="font-mono">{artifact.file}</code>
                  </th>
                  <td className="py-3 pr-4 text-muted-foreground">
                    <code className="font-mono">{artifact.producer}</code>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    <code className="font-mono">{artifact.consumers.join(', ')}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="divide-y divide-border rounded-lg border border-border bg-card text-sm sm:hidden">
          {artifacts.map((artifact) => (
            <div key={artifact.file} className="space-y-2 px-4 py-3">
              <dt className="font-semibold text-primary [overflow-wrap:anywhere]"><code>{artifact.file}</code></dt>
              <dd>
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-muted-foreground">
                  <dt className="font-medium text-foreground">{producer}</dt>
                  <dd className="[overflow-wrap:anywhere]"><code>{artifact.producer}</code></dd>
                  <dt className="font-medium text-foreground">{consumers}</dt>
                  <dd className="[overflow-wrap:anywhere]"><code>{artifact.consumers.join(', ')}</code></dd>
                </dl>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  )
}
