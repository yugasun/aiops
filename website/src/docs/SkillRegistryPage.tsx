import { useMemo } from 'react'
import { useI18n } from '../lib/i18n'
import { buildSkillCategories, buildTier2Skills, t, type Lang } from '../data/registry'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'

export default function SkillRegistryPage() {
  const { lang } = useI18n()
  const locale = lang as Lang
  const categories = useMemo(() => buildSkillCategories(), [])
  const tier2Skills = useMemo(() => buildTier2Skills(), [])

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

      {categories.map((cat) => (
        <div key={cat.id}>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-xl">{cat.icon}</span>
            <h2 className="text-lg font-semibold">{t(cat.title, locale)}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4 ml-8">{t(cat.desc, locale)}</p>
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
                    {t(s.desc, locale)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Separator />

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
                <span className="text-xs text-muted-foreground">— {t(s.handoff, locale)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
