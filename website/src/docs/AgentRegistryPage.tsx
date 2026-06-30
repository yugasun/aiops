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
    desc: { en: 'Interviews the user, grounds in CONTEXT.md + ADRs, produces NOTES.md and tech-spec.md', zh: '访谈用户，基于 CONTEXT.md + ADR 对齐，产出 NOTES.md 和 tech-spec.md' },
    skills: ['grilling', 'grill-with-docs', 'domain-modeling', 'architect-design', 'improve-codebase-architecture', 'code-graph'],
    outputs: ['NOTES.md', 'tech-spec.md'],
    color: 'text-purple-400',
  },
  {
    id: 'design-reviewer', icon: '🔎', role: { en: 'Design gate', zh: '设计门' },
    desc: { en: 'Reviews design against NOTES and spec before planning starts', zh: '在规划前对照 NOTES 和规格评审设计' },
    skills: ['review'],
    outputs: ['DESIGN_REVIEW.md'],
    color: 'text-blue-400',
  },
  {
    id: 'planner', icon: '📐', role: { en: 'Planning', zh: '规划' },
    desc: { en: 'Converts alignment into PRD, breaks into vertical-slice issues', zh: '将对齐结果转化为 PRD，拆分为垂直切片 issue' },
    skills: ['to-prd', 'to-issues', 'handoff', 'aiops-setup'],
    outputs: ['PRD.md', 'plan.md', 'issues/'],
    color: 'text-cyan-400',
  },
  {
    id: 'prototyper', icon: '🧪', role: { en: 'Prototype', zh: '原型' },
    desc: { en: 'Builds throwaway prototypes to validate risky assumptions', zh: '构建一次性原型验证高风险假设' },
    skills: ['prototype', 'lean'],
    outputs: ['VERDICT.md', 'prototype/'],
    color: 'text-amber-400',
  },
  {
    id: 'builder', icon: '🔨', role: { en: 'Delivery', zh: '交付' },
    desc: { en: 'Implements code with TDD discipline and lean principles', zh: '以 TDD 纪律和 lean 原则实现代码' },
    skills: ['aiops-implement', 'tdd', 'lean'],
    outputs: ['source code', 'test files'],
    color: 'text-green-400',
  },
  {
    id: 'ui-designer', icon: '🎨', role: { en: 'UI design', zh: 'UI 设计' },
    desc: { en: 'Generates HTML/CSS mockups for UI proposals', zh: '为 UI 方案生成 HTML/CSS 草图' },
    skills: ['ui-mockup'],
    outputs: ['mockups/', 'design-notes.md'],
    color: 'text-pink-400',
  },
  {
    id: 'code-reviewer', icon: '📋', role: { en: 'Delivery gate', zh: '交付门' },
    desc: { en: 'Reviews diff against standards and originating spec', zh: '对照标准和原始规格评审 diff' },
    skills: ['review'],
    outputs: ['REVIEW.md'],
    color: 'text-blue-400',
  },
  {
    id: 'quality-auditor', icon: '✂️', role: { en: 'Delivery gate', zh: '交付门' },
    desc: { en: 'Prunes over-engineering — shorter diff before ship', zh: '裁剪过度工程——交付前缩短 diff' },
    skills: ['prune'],
    outputs: ['prune findings'],
    color: 'text-orange-400',
  },
  {
    id: 'gitops', icon: '🚀', role: { en: 'Delivery', zh: '交付' },
    desc: { en: 'Handles git sync, commit, and push', zh: '处理 git sync、commit 和 push' },
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
            ? '9 个专用 Agent，从对齐到交付的完整链路。技能是动词，Agent 是名词。'
            : '9 specialized agents covering the full chain from alignment to delivery. Skills are verbs; agents are nouns.'}
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
            ? '不同任务类型的 Agent 调度链路。Router 自动选择，用户也可直接指定。'
            : 'Agent dispatch chains by task type. The router selects automatically, or users can invoke directly.'}
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
            ? 'Agent 通过 .scratch/<feature>/ 中的文件通信。生产者写入，消费者读取。'
            : 'Agents communicate through .scratch/<feature>/ files. Producers write; consumers read.'}
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
