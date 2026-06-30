import { useI18n } from '../lib/i18n'
import { cn } from '../lib/utils'
import { Card, CardContent } from '../components/ui/card'
import { Section } from './Landing'

export function JourneyStateSection() {
  const { t } = useI18n()

  const steps = [
    { input: t('journey.demo.input1'), step: t('journey.demo.step1'), dim: false },
    { input: '', step: t('journey.demo.desc1'), dim: true },
    { input: t('journey.demo.input2'), step: t('journey.demo.step2'), highlight: true },
    { input: '', step: t('journey.demo.desc2'), dim: true },
  ]

  return (
    <Section id="journey" label={t('journey.label')} title={t('journey.title')} desc={t('journey.desc')}>
      {/* Resume experience demo */}
      <Card className="max-w-2xl mx-auto mb-5 bg-[rgba(14,15,22,0.85)] backdrop-blur-2xl border-[rgba(108,138,255,0.12)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(108,138,255,0.08)] font-mono text-[0.7rem] text-muted-foreground">
          <span>{t('journey.demo.title')}</span>
          <span className="opacity-50">/aiops</span>
        </div>
        <CardContent className="p-5 font-mono text-sm leading-relaxed space-y-3">
          {steps.map((s, i) => (
            <div key={i} className={cn(
              'transition-all',
              s.dim && 'opacity-50 text-xs',
              s.highlight && 'text-[var(--green)]',
            )}>
              {s.input && (
                <div className="flex gap-2">
                  <span className="text-[var(--cyan)]">›</span>
                  <span style={s.highlight ? { textShadow: '0 0 12px rgba(74,222,128,0.25)' } : undefined}>
                    {s.input}
                  </span>
                </div>
              )}
              {s.step && (
                <div className={cn('ml-4', !s.dim && 'text-muted-foreground')}>
                  {s.step}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card/60 backdrop-blur-xl border-border hover:border-[rgba(74,222,128,0.25)] transition-all"
            style={{ boxShadow: '0 0 15px rgba(74,222,128,0.05)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  'w-6 h-6 rounded text-xs flex items-center justify-center font-mono font-bold',
                  i === 1 && 'bg-[var(--green)]/15 text-[var(--green)]',
                  i === 2 && 'bg-[var(--cyan)]/15 text-[var(--cyan)]',
                  i === 3 && 'bg-[var(--accent)]/15 text-[var(--accent)]',
                )}>{i}</span>
                <span className="font-semibold text-sm">{t(`journey.card.${i}.name`)}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t(`journey.card.${i}.desc`)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}
