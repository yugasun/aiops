import { useI18n } from '../lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'

interface Skill {
  name: string
  desc: { en: string; zh: string }
  alwaysOn?: boolean
}

interface SkillCategory {
  id: string
  icon: string
  title: { en: string; zh: string }
  desc: { en: string; zh: string }
  skills: Skill[]
}

const categories: SkillCategory[] = [
  {
    id: 'router', icon: '🧭', title: { en: 'Router & Entry', zh: '路由与入口' },
    desc: { en: 'Entry points and orchestration', zh: '入口点与流程编排' },
    skills: [
      { name: '/aiops', desc: { en: 'Entry router — Flow Conductor that infers task type, narrates steps, dispatches agents', zh: '入口路由——Flow Conductor，推断任务类型、叙述步骤、调度 agent' } },
      { name: '/aiops-setup', desc: { en: 'Per-target-project setup — issue tracker, triage labels, domain docs', zh: '项目级配置——issue 追踪、分诊标签、领域文档' } },
    ],
  },
  {
    id: 'alignment', icon: '🎯', title: { en: 'Alignment', zh: '对齐' },
    desc: { en: 'Understand before building', zh: '构建前先理解' },
    skills: [
      { name: '/grilling', desc: { en: 'Interview loop — constraints, scope, acceptance criteria', zh: '对齐访谈——约束、范围、验收标准' } },
      { name: '/grill-with-docs', desc: { en: 'Alignment grounded in CONTEXT.md + ADRs', zh: '基于 CONTEXT.md + ADR 的对齐' } },
      { name: '/domain-modeling', desc: { en: 'Glossary + ADR discipline for shared vocabulary', zh: '术语表 + ADR 纪律，建立共享词汇' } },
      { name: '/architect-design', desc: { en: 'Structured design process for architect agent', zh: '架构师 agent 的结构化设计流程' } },
      { name: '/improve-codebase-architecture', desc: { en: 'Architecture health scan — shallow modules, leaked seams, deepening opportunities', zh: '架构健康扫描——浅层模块、泄漏接缝、深化机会' } },
      { name: '/code-graph', desc: { en: 'Build and query code graph via graphify (Tree-sitter + Louvain)', zh: '通过 graphify 构建和查询代码图谱（Tree-sitter + Louvain）' } },
    ],
  },
  {
    id: 'planning', icon: '📋', title: { en: 'Planning', zh: '规划' },
    desc: { en: 'Break work into deliverable slices', zh: '拆分为可交付切片' },
    skills: [
      { name: '/to-prd', desc: { en: 'Conversation → PRD document', zh: '对话 → PRD 文档' } },
      { name: '/to-issues', desc: { en: 'PRD → vertical slices as issues', zh: 'PRD → 垂直切片 issue' } },
      { name: '/handoff', desc: { en: 'Cross-session context preservation', zh: '跨会话上下文保持' } },
      { name: '/triage', desc: { en: 'Incoming request state machine — classify and route', zh: '请求分诊状态机——分类和路由' } },
    ],
  },
  {
    id: 'delivery', icon: '🔨', title: { en: 'Delivery', zh: '交付' },
    desc: { en: 'Build, test, ship', zh: '构建、测试、交付' },
    skills: [
      { name: '/aiops-implement', desc: { en: 'Delivery overlay — hard gates for TDD, prune, review, commit approval', zh: '交付叠加层——TDD、prune、review、commit 审批的硬门' } },
      { name: '/tdd', desc: { en: 'Test-driven development — red-green-refactor', zh: '测试驱动开发——红绿重构' } },
      { name: '/prototype', desc: { en: 'Throwaway prototypes for risk validation', zh: '一次性原型，验证风险' } },
      { name: '/diagnosing-bugs', desc: { en: 'Bug diagnosis — repro, root cause, minimal fix', zh: 'Bug 诊断——复现、根因、最小修复' } },
      { name: '/gitops', desc: { en: 'Git operations: sync, commit, push', zh: 'Git 操作：sync、commit、push' } },
    ],
  },
  {
    id: 'quality', icon: '🛡️', title: { en: 'Quality Gates', zh: '质量门' },
    desc: { en: 'Guardrails during delivery', zh: '交付过程中的护栏' },
    skills: [
      { name: '/lean', desc: { en: 'Minimal-code ladder — stdlib first, shortest working diff', zh: '最小代码阶梯——stdlib 优先，最短可用 diff' }, alwaysOn: true },
      { name: '/file-refactor', desc: { en: 'File size discipline — split files over 500 lines', zh: '文件大小纪律——超过 500 行必须拆分' } },
      { name: '/prune', desc: { en: 'Over-engineering gate — cut complexity before review', zh: '过度工程门——评审前砍掉复杂度' } },
      { name: '/review', desc: { en: 'Standards + spec review — two-axis parallel check', zh: '标准 + 规格评审——双轴并行检查' } },
    ],
  },
  {
    id: 'design', icon: '🎨', title: { en: 'Design', zh: '设计' },
    desc: { en: 'Visual and UI design', zh: '视觉与 UI 设计' },
    skills: [
      { name: '/ui-mockup', desc: { en: 'HTML/CSS mockup generation for UI proposals', zh: 'HTML/CSS 草图生成，用于 UI 方案' } },
    ],
  },
]

const tier2Skills = [
  { name: 'codebase-design', handoff: { en: 'Use /domain-modeling + /grill-with-docs until forked', zh: '用 /domain-modeling + /grill-with-docs 直到独立' } },
  { name: 'writing-great-skills', handoff: { en: 'CONTEXT.md authoring principles + new-skill checklist in /aiops', zh: 'CONTEXT.md 编写原则 + /aiops 新 skill 检查表' } },
  { name: 'teach', handoff: { en: 'Not part of the engineering bundle', zh: '不属于工程 bundle' } },
]

export default function SkillRegistryPage() {
  const { lang } = useI18n()

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          {lang === 'zh' ? '技能' : 'Skills'}
        </h1>
        <p className="text-muted-foreground text-base">
          {lang === 'zh'
            ? '22 个 Tier 1 技能，覆盖从对齐到交付的完整流程。按类别浏览。'
            : '22 Tier 1 skills covering the full flow from alignment to delivery. Browse by category.'}
        </p>
      </div>

      {/* Categories */}
      {categories.map((cat) => (
        <div key={cat.id}>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-xl">{cat.icon}</span>
            <h2 className="text-lg font-semibold">{cat.title[lang]}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4 ml-8">{cat.desc[lang]}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cat.skills.map((s) => (
              <Card key={s.name} className="bg-card/60 backdrop-blur-xl border-border hover:border-primary/20 transition-all">
                <CardHeader className="pb-1.5 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="font-mono font-bold">{s.name}</span>
                    {s.alwaysOn && (
                      <Badge variant="secondary" className="font-mono text-[0.6rem]">
                        {lang === 'zh' ? '常开' : 'always-on'}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.desc[lang as keyof typeof s.desc] ?? s.desc.en}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Separator />

      {/* Tier 2 */}
      <div>
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Badge variant="outline" className="font-mono">Tier 2</Badge>
          {lang === 'zh' ? '延后' : 'Deferred'}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {lang === 'zh'
            ? '暂不安装，通过 Tier 1 技能的路径交接。'
            : 'Not installed yet. Handed off via Tier 1 skill paths.'}
        </p>
        <div className="space-y-2">
          {tier2Skills.map((s) => (
            <Card key={s.name} className="bg-card/40 backdrop-blur-xl border-border/50">
              <CardContent className="py-3 px-4 flex items-start gap-3">
                <span className="font-mono text-sm font-bold text-muted-foreground">{s.name}</span>
                <span className="text-xs text-muted-foreground">— {s.handoff[lang as keyof typeof s.handoff] ?? s.handoff.en}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
