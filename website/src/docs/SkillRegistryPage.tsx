import { useMemo } from 'react'
import { useI18n } from '../lib/i18n'
import { buildSkillCategories, buildTier2Skills, t } from '../data/registry'

export default function SkillRegistryPage() {
  const { lang } = useI18n()
  const categories = useMemo(() => buildSkillCategories(), [])
  const tier2Skills = useMemo(() => buildTier2Skills(), [])

  return (
    <article className="doc-page space-y-8">
      <header className="space-y-4">
        <h1>{lang === 'zh' ? '技能' : 'Skills'}</h1>
        <p className="lead text-muted-foreground">
          {lang === 'zh'
            ? '这些技能支撑 /aiops 的引导流程。平时从 /aiops 开始，需要时再深入查看每个能力。'
            : 'These skills power the guided /aiops workflow. Start with /aiops, then use this registry when you want the details.'}
        </p>
      </header>

      {categories.map((category) => (
        <section key={category.id} className="rounded-lg border border-border bg-card">
          <header className="space-y-2 px-4 py-5 sm:px-6">
            <h2>{t(category.title, lang)}</h2>
            <p className="text-muted-foreground">{t(category.desc, lang)}</p>
          </header>
          <dl className="divide-y divide-border rounded-b-lg border-t border-border bg-[var(--color-paper-3)]">
            {category.skills.map((skill) => (
              <div key={skill.name} className="grid gap-x-6 gap-y-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:px-6">
                <dt className="[overflow-wrap:anywhere]">
                  <code className="inline-block rounded-sm bg-[var(--color-cool-soft)] px-2 py-0.5 font-mono text-sm font-medium leading-6 text-[var(--color-cool)]">{skill.name}</code>
                  {skill.alwaysOn && (
                    <span className="mt-1 block text-sm font-medium text-primary">
                      {lang === 'zh' ? '常开' : 'Always on'}
                    </span>
                  )}
                </dt>
                <dd className="leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{t(skill.desc, lang)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section className="rounded-lg border border-border bg-card">
        <header className="space-y-2 px-4 py-5 sm:px-6">
          <h2>{lang === 'zh' ? '延后安装的 Tier 2 技能' : 'Deferred Tier 2 skills'}</h2>
          <p className="text-muted-foreground">
            {lang === 'zh'
              ? '暂不安装，通过 Tier 1 技能的路径交接。'
              : 'Installation is deferred. Tier 1 skills provide the handoff paths.'}
          </p>
        </header>
        <dl className="divide-y divide-border rounded-b-lg border-t border-border bg-[var(--color-paper-3)]">
          {tier2Skills.map((skill) => (
            <div key={skill.name} className="grid gap-x-6 gap-y-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:px-6">
              <dt className="[overflow-wrap:anywhere]">
                <code className="inline-block rounded-sm bg-[var(--color-cool-soft)] px-2 py-0.5 font-mono text-sm font-medium leading-6 text-[var(--color-cool)]">{skill.name}</code>
              </dt>
              <dd className="leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                {t(skill.handoff, lang)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  )
}
