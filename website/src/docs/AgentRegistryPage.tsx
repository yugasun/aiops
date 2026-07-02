import { useMemo } from 'react'
import { useI18n } from '../lib/i18n'
import {
  agentDisplay,
  artifacts,
  buildAgents,
  buildSequences,
  t,
  type Lang,
} from '../data/registry'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'

function AgentIcon({
  agentId,
  agents,
}: {
  agentId: string
  agents: ReturnType<typeof buildAgents>
}) {
  const display = agentDisplay(agentId, agents)
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-sm">{display.icon}</span>
      <span className="font-mono text-xs font-medium">{display.id}</span>
    </span>
  )
}

export default function AgentRegistryPage() {
  const { lang } = useI18n()
  const locale = lang as Lang
  const agents = useMemo(() => buildAgents(), [])
  const sequences = useMemo(() => buildSequences(), [])

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          {lang === 'zh' ? 'Agent 介绍' : 'Agents'}
        </h1>
        <p className="text-muted-foreground text-base">
          {lang === 'zh'
            ? 'aiops 会按任务类型选择负责人。每个 Agent 负责一个阶段，并留下可检查的产物。'
            : 'aiops picks the right owner for each task type. Each agent owns a phase and leaves inspectable artifacts behind.'}
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          {lang === 'zh' ? '所有 Agent' : 'All Agents'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((a) => (
            <Card key={a.id} className="bg-card/60 backdrop-blur-xl border-border hover:border-primary/20 transition-all">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">{a.icon}</span>
                  <span className="font-mono">{a.id}</span>
                </CardTitle>
                <Badge variant="outline" className={`font-mono text-[0.6rem] w-fit ${a.color}`}>
                  {t(a.role, locale)}
                </Badge>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-1 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(a.desc, locale)}
                </p>
                <div>
                  <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wider mb-1.5">
                    {lang === 'zh' ? '技能' : 'Skills'}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {a.skills.map((s) => (
                      <span key={s} className="font-mono text-[0.65rem] bg-muted px-1.5 py-0.5 rounded">
                        /{s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wider mb-1.5">
                    {lang === 'zh' ? '产出' : 'Outputs'}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {a.outputs.map((o) => (
                      <span key={o} className="font-mono text-[0.65rem] text-[var(--green)] bg-[var(--green-dim)] px-1.5 py-0.5 rounded">
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-xl font-semibold mb-4">
          {lang === 'zh' ? '调度序列' : 'Dispatch sequences'}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          {lang === 'zh'
            ? '你通常只输入 /aiops。Router 会根据任务类型选择下面的链路。架构健康任务会先经 code-graph 准备图谱（可跳过），再扫描深化机会。'
            : 'You usually start with /aiops. The router chooses one of these chains based on the task. Architecture health runs an optional code-graph build before the architecture scan.'}
        </p>
        <div className="space-y-4">
          {sequences.map((s) => (
            <Card key={s.type.en} className="bg-card/60 backdrop-blur-xl border-border">
              <CardContent className="py-4 px-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {t(s.type, locale)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {s.agents.map((agentId, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 bg-muted/80 border border-border rounded-lg px-2.5 py-1.5">
                        <AgentIcon agentId={agentId} agents={agents} />
                      </span>
                      {i < s.agents.length - 1 && (
                        <span className="text-muted-foreground text-xs font-mono">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-xl font-semibold mb-2">
          {lang === 'zh' ? '产物契约' : 'Artifact contracts'}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          {lang === 'zh'
            ? '这些文件让后续阶段知道前面做过什么，也让评审有据可查。'
            : 'These files preserve decisions for later phases and give reviewers something concrete to check.'}
        </p>
        <div className="space-y-2">
          {artifacts.map((a) => (
            <Card key={a.file} className="bg-card/40 backdrop-blur-xl border-border/50">
              <CardContent className="py-3 px-4 flex items-center gap-4 flex-wrap">
                <span className="font-mono text-sm font-bold text-foreground min-w-[140px]">{a.file}</span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">{lang === 'zh' ? '生产者' : 'Producer'}:</span>
                  <AgentIcon agentId={a.producer} agents={agents} />
                </span>
                <span className="text-muted-foreground text-xs">→</span>
                <span className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-muted-foreground">{lang === 'zh' ? '消费者' : 'Consumers'}:</span>
                  {a.consumers.map((c, i) => (
                    <span key={c} className="flex items-center gap-1">
                      <AgentIcon agentId={c} agents={agents} />
                      {i < a.consumers.length - 1 && <span className="text-muted-foreground">,</span>}
                    </span>
                  ))}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
