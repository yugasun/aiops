import { useI18n } from '../lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'

interface Agent {
  id: string
  icon: string
  role: { en: string; zh: string }
  desc: { en: string; zh: string }
  skills: string[]
  outputs: string[]
  color: string
}

const agents: Agent[] = [
  {
    id: 'architect', icon: '🏛️', role: { en: 'Alignment', zh: '对齐' },
    desc: { en: 'Clarifies the problem and turns decisions into NOTES.md and tech-spec.md', zh: '澄清问题，并把决策写入 NOTES.md 和 tech-spec.md' },
    skills: ['explore', 'grilling', 'grill-with-docs', 'domain-modeling', 'architect-design', 'improve-codebase-architecture', 'code-graph'],
    outputs: ['NOTES.md', 'tech-spec.md'],
    color: 'text-purple-400',
  },
  {
    id: 'design-reviewer', icon: '🔎', role: { en: 'Design gate', zh: '设计门' },
    desc: { en: 'Checks the design before planning and implementation depend on it', zh: '在规划和实现依赖设计前先检查它' },
    skills: ['review'],
    outputs: ['DESIGN_REVIEW.md'],
    color: 'text-blue-400',
  },
  {
    id: 'planner', icon: '📐', role: { en: 'Planning', zh: '规划' },
    desc: { en: 'Turns larger work into a PRD and vertical slices', zh: '把较大的工作转成 PRD 和垂直切片' },
    skills: ['to-prd', 'to-issues', 'handoff', 'aiops-setup'],
    outputs: ['PRD.md', 'plan.md', 'issues/'],
    color: 'text-cyan-400',
  },
  {
    id: 'prototyper', icon: '🧪', role: { en: 'Prototype', zh: '原型' },
    desc: { en: 'Validates risky assumptions with disposable prototypes', zh: '用一次性原型验证高风险假设' },
    skills: ['prototype', 'lean'],
    outputs: ['VERDICT.md', 'prototype/'],
    color: 'text-amber-400',
  },
  {
    id: 'builder', icon: '🔨', role: { en: 'Delivery', zh: '交付' },
    desc: { en: 'Implements the smallest tested change that satisfies the plan', zh: '按计划实现最小且经过测试的改动' },
    skills: ['aiops-implement', 'tdd', 'lean'],
    outputs: ['source code', 'test files'],
    color: 'text-green-400',
  },
  {
    id: 'ui-designer', icon: '🎨', role: { en: 'UI design', zh: 'UI 设计' },
    desc: { en: 'Creates previewable UI mockups before product code is written', zh: '在写业务代码前创建可预览 UI 草图' },
    skills: ['ui-mockup'],
    outputs: ['mockups/', 'design-notes.md'],
    color: 'text-pink-400',
  },
  {
    id: 'code-reviewer', icon: '📋', role: { en: 'Delivery gate', zh: '交付门' },
    desc: { en: 'Reviews the diff against project standards and the originating spec', zh: '对照项目标准和原始规格评审 diff' },
    skills: ['review'],
    outputs: ['REVIEW.md'],
    color: 'text-blue-400',
  },
  {
    id: 'quality-auditor', icon: '✂️', role: { en: 'Delivery gate', zh: '交付门' },
    desc: { en: 'Flags unnecessary complexity before delivery', zh: '交付前指出不必要的复杂度' },
    skills: ['prune'],
    outputs: ['prune findings'],
    color: 'text-orange-400',
  },
  {
    id: 'gitops', icon: '🚀', role: { en: 'Delivery', zh: '交付' },
    desc: { en: 'Handles git operations after explicit approval', zh: '在明确确认后处理 git 操作' },
    skills: ['gitops'],
    outputs: ['commit + push'],
    color: 'text-emerald-400',
  },
]

const sequences = [
  { type: { en: 'Feature', zh: '功能' }, agents: ['architect', 'design-reviewer', 'planner', 'builder', 'code-reviewer', 'quality-auditor', 'gitops'] },
  { type: { en: 'Feature + UI', zh: '功能 + UI' }, agents: ['architect', 'ui-designer', 'design-reviewer', 'planner', 'builder', 'code-reviewer', 'quality-auditor', 'gitops'] },
  { type: { en: 'Bug', zh: 'Bug' }, agents: ['builder', 'code-reviewer', 'gitops'] },
  { type: { en: 'Incoming', zh: '请求' }, agents: ['triage', 'builder', 'code-reviewer', 'gitops'] },
  { type: { en: 'Prototype', zh: '原型' }, agents: ['prototyper'] },
  { type: { en: 'Architecture health', zh: '架构健康' }, agents: ['architect', 'design-reviewer', 'planner', 'builder', 'code-reviewer', 'quality-auditor', 'gitops'] },
]

const artifacts = [
  { file: 'NOTES.md', producer: 'architect', consumers: ['design-reviewer', 'planner', 'builder', 'code-reviewer'] },
  { file: 'tech-spec.md', producer: 'architect', consumers: ['design-reviewer', 'planner', 'builder', 'code-reviewer'] },
  { file: 'DESIGN_REVIEW.md', producer: 'design-reviewer', consumers: ['planner', 'architect'] },
  { file: 'PRD.md', producer: 'planner', consumers: ['builder'] },
  { file: 'plan.md', producer: 'planner', consumers: ['builder'] },
  { file: 'issues/*.md', producer: 'planner', consumers: ['builder'] },
  { file: 'VERDICT.md', producer: 'prototyper', consumers: ['architect', 'builder'] },
  { file: 'mockups/', producer: 'ui-designer', consumers: ['builder', 'code-reviewer'] },
  { file: 'REVIEW.md', producer: 'code-reviewer', consumers: ['builder', 'quality-auditor', 'gitops'] },
  { file: 'prune findings', producer: 'quality-auditor', consumers: ['builder'] },
]

function AgentIcon({ agentId }: { agentId: string }) {
  const agent = agents.find(a => a.id === agentId)
  if (!agent) return <span className="font-mono text-xs">{agentId}</span>
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-sm">{agent.icon}</span>
      <span className="font-mono text-xs font-medium">{agentId}</span>
    </span>
  )
}

export default function AgentRegistryPage() {
  const { lang } = useI18n()

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

      {/* Agent cards */}
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
                  {a.role[lang as keyof typeof a.role] ?? a.role.en}
                </Badge>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-1 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {a.desc[lang as keyof typeof a.desc] ?? a.desc.en}
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

      {/* Dispatch sequences — visual flow */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {lang === 'zh' ? '调度序列' : 'Dispatch sequences'}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          {lang === 'zh'
            ? '你通常只输入 /aiops。Router 会根据任务类型选择下面的链路。'
            : 'You usually start with /aiops. The router chooses one of these chains based on the task.'}
        </p>
        <div className="space-y-4">
          {sequences.map((s) => (
            <Card key={s.type.en} className="bg-card/60 backdrop-blur-xl border-border">
              <CardContent className="py-4 px-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {s.type[lang as keyof typeof s.type] ?? s.type.en}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {s.agents.map((agentId, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 bg-muted/80 border border-border rounded-lg px-2.5 py-1.5">
                        <AgentIcon agentId={agentId} />
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

      {/* Artifact contracts */}
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
                  <AgentIcon agentId={a.producer} />
                </span>
                <span className="text-muted-foreground text-xs">→</span>
                <span className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-muted-foreground">{lang === 'zh' ? '消费者' : 'Consumers'}:</span>
                  {a.consumers.map((c, i) => (
                    <span key={c} className="flex items-center gap-1">
                      <AgentIcon agentId={c} />
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
