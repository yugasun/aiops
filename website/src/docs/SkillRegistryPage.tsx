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
    desc: { en: 'Start a task and keep the flow moving', zh: '开始任务，并让流程持续推进' },
    skills: [
      { name: '/aiops', desc: { en: 'Main entry. Describe the work and aiops chooses the right path, step by step.', zh: '主入口。描述任务后，aiops 会选择合适路径并逐步推进。' } },
      { name: '/aiops-setup', desc: { en: 'Optional setup for teams that need shared trackers or domain docs.', zh: '可选设置。团队需要共享任务跟踪或领域文档时使用。' } },
    ],
  },
  {
    id: 'alignment', icon: '🎯', title: { en: 'Alignment', zh: '对齐' },
    desc: { en: 'Clarify the work before code changes start', zh: '改代码前先把问题说清楚' },
    skills: [
      { name: '/grilling', desc: { en: 'Asks the missing questions until scope and acceptance criteria are clear.', zh: '持续追问缺失信息，直到范围和验收标准清楚。' } },
      { name: '/grill-with-docs', desc: { en: 'Grounds decisions in CONTEXT.md, ADRs, and existing project notes.', zh: '基于 CONTEXT.md、ADR 和项目笔记做对齐。' } },
      { name: '/domain-modeling', desc: { en: 'Builds shared vocabulary so later design and review use the same terms.', zh: '建立共享词汇，避免后续设计和评审各说各话。' } },
      { name: '/architect-design', desc: { en: 'Turns aligned requirements into a technical design the builder can follow.', zh: '把已对齐需求转成 builder 能执行的技术设计。' } },
      { name: '/explore', desc: { en: 'Think through an idea without creating delivery artifacts — opt-in discussion partner.', zh: '在不产生交付产物的情况下深入思考一个想法——可选的讨论伙伴。' } },
      { name: '/improve-codebase-architecture', desc: { en: 'Finds evidence-backed refactor opportunities before choosing one to implement.', zh: '先找有证据的重构机会，再选择一项实现。' } },
      { name: '/code-graph', desc: { en: 'Optional graphify-backed code graph for architecture and impact analysis.', zh: '可选的 graphify 代码图谱，用于架构和影响分析。' } },
    ],
  },
  {
    id: 'planning', icon: '📋', title: { en: 'Planning', zh: '规划' },
    desc: { en: 'Turn large ideas into work that can be delivered safely', zh: '把大想法拆成能安全交付的工作' },
    skills: [
      { name: '/to-prd', desc: { en: 'Turns a conversation into a concrete product brief.', zh: '把对话整理成明确的产品说明。' } },
      { name: '/to-issues', desc: { en: 'Splits a PRD into vertical slices that can be handled one at a time.', zh: '把 PRD 拆成可以逐个处理的垂直切片。' } },
      { name: '/handoff', desc: { en: 'Preserves enough context for a fresh session to continue the work.', zh: '保存足够上下文，让新会话可以继续。' } },
      { name: '/triage', desc: { en: 'Classifies incoming requests and routes them to the right path.', zh: '分类新请求，并路由到合适路径。' } },
    ],
  },
  {
    id: 'delivery', icon: '🔨', title: { en: 'Delivery', zh: '交付' },
    desc: { en: 'Make the smallest correct change and prepare it for review', zh: '做出最小正确改动，并准备评审' },
    skills: [
      { name: '/aiops-implement', desc: { en: 'Runs the delivery ladder: lean, TDD, prune, review, then approval.', zh: '运行交付阶梯：lean、TDD、prune、review，然后等待确认。' } },
      { name: '/tdd', desc: { en: 'Pins behavior with a failing test before writing the implementation.', zh: '先用失败测试固定行为，再写实现。' } },
      { name: '/prototype', desc: { en: 'Builds a quick throwaway check when a risky idea needs proof.', zh: '高风险想法需要验证时，先做一次性原型。' } },
      { name: '/diagnosing-bugs', desc: { en: 'Reproduces the problem, finds the cause, and keeps the fix narrow.', zh: '复现问题、找到根因，并保持修复范围很小。' } },
      { name: '/gitops', desc: { en: 'Handles commit and push only after the delivery work is approved.', zh: '交付工作确认后才处理 commit 和 push。' } },
    ],
  },
  {
    id: 'quality', icon: '🛡️', title: { en: 'Quality Gates', zh: '质量门' },
    desc: { en: 'Prevent drift, excess code, and unreviewed changes', zh: '防止偏移、多写和未评审改动' },
    skills: [
      { name: '/lean', desc: { en: 'Keeps the diff focused: use existing tools and write only what the task needs.', zh: '保持 diff 聚焦：优先复用，只写任务需要的代码。' }, alwaysOn: true },
      { name: '/file-refactor', desc: { en: 'Splits oversized files before they become hard to understand or review.', zh: '文件过大时先拆分，避免难理解、难评审。' } },
      { name: '/prune', desc: { en: 'Cuts speculative complexity before the code review gate.', zh: '代码评审前砍掉猜测性的复杂度。' } },
      { name: '/review', desc: { en: 'Checks the diff against both project standards and the originating spec.', zh: '同时对照项目标准和原始规格检查 diff。' } },
    ],
  },
  {
    id: 'design', icon: '🎨', title: { en: 'Design', zh: '设计' },
    desc: { en: 'See UI direction before implementation', zh: '实现前先看清 UI 方向' },
    skills: [
      { name: '/ui-mockup', desc: { en: 'Generates a previewable HTML mockup before the builder writes product code.', zh: '在 builder 写业务代码前生成可预览 HTML 草图。' } },
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
            ? '这些技能支撑 /aiops 的引导流程。平时从 /aiops 开始，需要时再深入查看每个能力。'
            : 'These skills power the guided /aiops workflow. Start with /aiops, then use this registry when you want the details.'}
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
