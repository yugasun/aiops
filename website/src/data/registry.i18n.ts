/** Curated bilingual copy for the docs site — not derived from SKILL.md. */

export type LocaleText = { en: string; zh: string }

export const skillCategories: Record<
  string,
  { icon: string; title: LocaleText; desc: LocaleText }
> = {
  router: {
    icon: '🧭',
    title: { en: 'Router & Entry', zh: '路由与入口' },
    desc: { en: 'Start a task and keep the flow moving', zh: '开始任务，并让流程持续推进' },
  },
  alignment: {
    icon: '🎯',
    title: { en: 'Alignment', zh: '对齐' },
    desc: { en: 'Clarify the work before code changes start', zh: '改代码前先把问题说清楚' },
  },
  planning: {
    icon: '📋',
    title: { en: 'Planning', zh: '规划' },
    desc: { en: 'Turn large ideas into work that can be delivered safely', zh: '把大想法拆成能安全交付的工作' },
  },
  delivery: {
    icon: '🔨',
    title: { en: 'Delivery', zh: '交付' },
    desc: { en: 'Make the smallest correct change and prepare it for review', zh: '做出最小正确改动，并准备评审' },
  },
  quality: {
    icon: '🛡️',
    title: { en: 'Quality Gates', zh: '质量门' },
    desc: { en: 'Prevent drift, excess code, and unreviewed changes', zh: '防止偏移、多写和未评审改动' },
  },
  design: {
    icon: '🎨',
    title: { en: 'Design', zh: '设计' },
    desc: { en: 'See UI direction before implementation', zh: '实现前先看清 UI 方向' },
  },
}

/** Keyed by skill name without leading slash. */
export const skillDescriptions: Record<string, LocaleText> = {
  aiops: {
    en: 'Main entry. Describe the work and aiops chooses the right path, step by step.',
    zh: '主入口。描述任务后，aiops 会选择合适路径并逐步推进。',
  },
  'aiops-setup': {
    en: 'Optional setup for teams that need shared trackers or domain docs.',
    zh: '可选设置。团队需要共享任务跟踪或领域文档时使用。',
  },
  grilling: {
    en: 'Asks the missing questions until scope and acceptance criteria are clear.',
    zh: '持续追问缺失信息，直到范围和验收标准清楚。',
  },
  'grill-with-docs': {
    en: 'Grounds decisions in CONTEXT.md, ADRs, and existing project notes.',
    zh: '基于 CONTEXT.md、ADR 和项目笔记做对齐。',
  },
  'domain-modeling': {
    en: 'Builds shared vocabulary so later design and review use the same terms.',
    zh: '建立共享词汇，避免后续设计和评审各说各话。',
  },
  'architect-design': {
    en: 'Turns aligned requirements into a technical design the builder can follow.',
    zh: '把已对齐需求转成 builder 能执行的技术设计。',
  },
  explore: {
    en: 'Think through an idea without creating delivery artifacts — opt-in discussion partner.',
    zh: '在不产生交付产物的情况下深入思考一个想法——可选的讨论伙伴。',
  },
  'improve-codebase-architecture': {
    en: 'Finds evidence-backed refactor opportunities before choosing one to implement.',
    zh: '先找有证据的重构机会，再选择一项实现。',
  },
  'code-graph': {
    en: 'Optional graphify-backed code graph for architecture and impact analysis.',
    zh: '可选的 graphify 代码图谱，用于架构和影响分析。',
  },
  'to-prd': {
    en: 'Turns a conversation into a concrete product brief.',
    zh: '把对话整理成明确的产品说明。',
  },
  'to-issues': {
    en: 'Splits a PRD into vertical slices that can be handled one at a time.',
    zh: '把 PRD 拆成可以逐个处理的垂直切片。',
  },
  handoff: {
    en: 'Preserves enough context for a fresh session to continue the work.',
    zh: '保存足够上下文，让新会话可以继续。',
  },
  triage: {
    en: 'Classifies incoming requests and routes them to the right path.',
    zh: '分类新请求，并路由到合适路径。',
  },
  'aiops-implement': {
    en: 'Runs lean → TDD → prune → review; invokes /file-refactor when files approach 500 lines.',
    zh: '运行 lean → TDD → prune → review；文件逼近 500 行时调用 /file-refactor。',
  },
  tdd: {
    en: 'Pins behavior with a failing test before writing the implementation.',
    zh: '先用失败测试固定行为，再写实现。',
  },
  prototype: {
    en: 'Builds a quick throwaway check when a risky idea needs proof.',
    zh: '高风险想法需要验证时，先做一次性原型。',
  },
  'diagnosing-bugs': {
    en: 'Reproduces the problem, finds the cause, and keeps the fix narrow.',
    zh: '复现问题、找到根因，并保持修复范围很小。',
  },
  gitops: {
    en: 'Handles commit and push only after the delivery work is approved.',
    zh: '交付工作确认后才处理 commit 和 push。',
  },
  lean: {
    en: 'Keeps the diff focused: use existing tools and write only what the task needs.',
    zh: '保持 diff 聚焦：优先复用，只写任务需要的代码。',
  },
  'file-refactor': {
    en: 'Splits oversized files before they become hard to understand or review.',
    zh: '文件过大时先拆分，避免难理解、难评审。',
  },
  prune: {
    en: 'Cuts speculative complexity before the code review gate.',
    zh: '代码评审前砍掉猜测性的复杂度。',
  },
  review: {
    en: 'Three modes: code (diff vs standards/spec), design (NOTES + tech-spec gate), drift (implementation vs spec before ship).',
    zh: '三种模式：code（diff 对照标准/规格）、design（设计门）、drift（发货前实现 vs 规格）。',
  },
  'ui-mockup': {
    en: 'Generates a previewable HTML mockup before the builder writes product code.',
    zh: '在 builder 写业务代码前生成可预览 HTML 草图。',
  },
}

export const tier2Handoffs: Record<string, LocaleText> = {
  'codebase-design': {
    en: 'Tier 1 vocabulary: architect-design/design-vocabulary.md; full skill deferred',
    zh: 'Tier 1 词汇表：architect-design/design-vocabulary.md；完整 skill 仍延后',
  },
  'writing-great-skills': {
    en: 'CONTEXT.md authoring principles + new-skill checklist in /aiops',
    zh: 'CONTEXT.md 编写原则 + /aiops 新 skill 检查表',
  },
  teach: {
    en: 'Not part of the engineering bundle',
    zh: '不属于工程 bundle',
  },
}

export const agentMeta: Record<
  string,
  { icon: string; color: string; role: LocaleText; desc: LocaleText }
> = {
  architect: {
    icon: '🏛️',
    color: 'text-purple-400',
    role: { en: 'Alignment', zh: '对齐' },
    desc: {
      en: 'Clarifies the problem and turns decisions into NOTES.md and tech-spec.md',
      zh: '澄清问题，并把决策写入 NOTES.md 和 tech-spec.md',
    },
  },
  'design-reviewer': {
    icon: '🔎',
    color: 'text-blue-400',
    role: { en: 'Design gate', zh: '设计门' },
    desc: {
      en: 'Design gate before planning; drift check before ship (review skill: design + drift modes)',
      zh: '规划前的设计门；发货前的漂移检查（review 技能：design + drift 模式）',
    },
  },
  planner: {
    icon: '📐',
    color: 'text-cyan-400',
    role: { en: 'Planning', zh: '规划' },
    desc: {
      en: 'Turns larger work into a PRD and vertical slices',
      zh: '把较大的工作转成 PRD 和垂直切片',
    },
  },
  prototyper: {
    icon: '🧪',
    color: 'text-amber-400',
    role: { en: 'Prototype', zh: '原型' },
    desc: {
      en: 'Validates risky assumptions with disposable prototypes',
      zh: '用一次性原型验证高风险假设',
    },
  },
  builder: {
    icon: '🔨',
    color: 'text-green-400',
    role: { en: 'Delivery', zh: '交付' },
    desc: {
      en: 'Implements the smallest tested change that satisfies the plan',
      zh: '按计划实现最小且经过测试的改动',
    },
  },
  'ui-designer': {
    icon: '🎨',
    color: 'text-pink-400',
    role: { en: 'UI design', zh: 'UI 设计' },
    desc: {
      en: 'Creates previewable UI mockups before product code is written',
      zh: '在写业务代码前创建可预览 UI 草图',
    },
  },
  'code-reviewer': {
    icon: '📋',
    color: 'text-blue-400',
    role: { en: 'Delivery gate', zh: '交付门' },
    desc: {
      en: 'Reviews the diff in code mode (standards + spec vs REVIEW.md)',
      zh: '以 code 模式评审 diff（对照标准与规格，产出 REVIEW.md）',
    },
  },
  'quality-auditor': {
    icon: '✂️',
    color: 'text-orange-400',
    role: { en: 'Delivery gate', zh: '交付门' },
    desc: {
      en: 'Flags unnecessary complexity before delivery',
      zh: '交付前指出不必要的复杂度',
    },
  },
  gitops: {
    icon: '🚀',
    color: 'text-emerald-400',
    role: { en: 'Delivery', zh: '交付' },
    desc: {
      en: 'Handles git operations after explicit approval',
      zh: '在明确确认后处理 git 操作',
    },
  },
}

export const sequenceTypeLabels: Record<string, LocaleText> = {
  Feature: { en: 'Feature', zh: '功能' },
  'Feature + UI': { en: 'Feature + UI', zh: '功能 + UI' },
  Bug: { en: 'Bug', zh: 'Bug' },
  Incoming: { en: 'Incoming', zh: '请求' },
  Prototype: { en: 'Prototype', zh: '原型' },
  'Architecture health': { en: 'Architecture health', zh: '架构健康' },
}

/** Virtual agent row for triage in dispatch sequences. */
export const virtualAgents: Record<string, { icon: string }> = {
  triage: { icon: '📥' },
}
