import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '../lib/i18n'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Table, TableBody, TableCell, TableRow } from '../components/ui/table'
import { Link } from 'react-router-dom'
import { JourneyStateSection } from './JourneyStateSection'
import { BookOpen, Boxes, ChartNoAxesColumnIncreasing, GitBranch, Radar, ShieldCheck, Workflow } from 'lucide-react'

// ── Data ──────────────────────────────────────────────────────────────────────

const heroCount = 5
const useCaseIds = ['health', 'bug', 'arch', 'rbac', 'resume'] as const

const heroSignals = [
  { icon: Radar, key: 'hero.signal.route' },
  { icon: Workflow, key: 'hero.signal.resume' },
  { icon: ShieldCheck, key: 'hero.signal.approve' },
]

// ── Section wrapper ───────────────────────────────────────────────────────────

export function Section({ id, label, title, desc, children }: {
  id?: string; label: string; title: string; desc?: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="py-20 max-w-5xl mx-auto px-6">
      <div className="inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--cyan)] mb-3 ai-chip rounded-full px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)] shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        {label}
      </div>
      <h2 className="text-3xl font-bold mb-3 tracking-tight">{title}</h2>
      {desc && <p className="text-muted-foreground text-base mb-8 max-w-2xl">{desc}</p>}
      {children}
    </section>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  const { t } = useI18n()
  const [idx, setIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')

  const typeText = useCallback((text: string) => {
    setDisplayed('')
    let i = 0
    const iv = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++ }
      else clearInterval(iv)
    }, 40 + Math.random() * 60)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => { typeText(t('hero.cmd.0')) }, [t, typeText])

  const rotate = () => {
    const next = (idx + 1) % heroCount
    setIdx(next)
    typeText(t(`hero.cmd.${next}`))
  }

  return (
    <section className="relative pt-28 pb-24 text-center overflow-hidden">
      <div className="absolute top-[-18%] left-1/2 -translate-x-1/2 w-[min(95vw,1100px)] h-[620px] bg-[radial-gradient(ellipse,rgba(108,138,255,0.16)_0%,rgba(34,211,238,0.08)_35%,transparent_70%)] pointer-events-none"
        style={{ animation: 'heroGlowPulse 6s ease-in-out infinite' }} />
      <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[min(80vw,800px)] h-[320px] bg-[radial-gradient(ellipse,rgba(74,222,128,0.08)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute top-24 left-1/2 h-[1px] w-[min(88vw,900px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

      <Badge variant="outline" className="mb-6 font-mono text-xs ai-chip px-4 py-1.5"
        style={{ boxShadow: '0 0 20px rgba(74,222,128,0.12)', animation: 'fadeUp 0.6s ease both' }}>
        {t('hero.tag')}
      </Badge>

      <h1 className="text-[clamp(2rem,6vw,3.5rem)] font-bold leading-[1.15] tracking-tight mb-5 max-w-4xl mx-auto"
        style={{ animation: 'fadeUp 0.6s 0.08s ease both' }}>
        {t('hero.title.1')}
        <span className="bg-gradient-to-br from-[#6c8aff] via-[#22d3ee] to-[#4ade80] bg-clip-text text-transparent">
          {t('hero.title.2')}
        </span>
        {t('hero.title.3') && <><br />{t('hero.title.3')}</>}
        <br />{t('hero.title.4')}
      </h1>

      <p className="text-muted-foreground max-w-3xl mx-auto mb-6 text-lg leading-relaxed"
        style={{ animation: 'fadeUp 0.6s 0.16s ease both' }}>
        {t('hero.lead')}
      </p>

      <div className="flex items-center gap-2 justify-center text-xs font-mono text-[var(--cyan)] opacity-80 mb-5"
        style={{ animation: 'fadeUp 0.6s 0.2s ease both' }}>
        <span className="w-2 h-2 rounded-full bg-[var(--cyan)]" style={{ boxShadow: '0 0 10px var(--cyan)' }} />
        {t('hero.ai-status')}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-3xl mx-auto mb-8" style={{ animation: 'fadeUp 0.6s 0.22s ease both' }}>
        {heroSignals.map(({ icon: Icon, key }) => (
          <div key={key} className="ai-panel ai-panel-interactive rounded-xl px-3 py-3 flex items-center gap-2 text-left">
            <Icon className="relative h-4 w-4 text-[var(--cyan)] shrink-0" strokeWidth={1.8} />
            <span className="relative text-xs text-muted-foreground leading-snug">{t(key)}</span>
          </div>
        ))}
      </div>

      <Card className="ai-panel max-w-3xl mx-auto mb-8 backdrop-blur-2xl overflow-hidden text-left rounded-xl"
        style={{ animation: 'fadeUp 0.6s 0.24s ease both', boxShadow: '0 0 60px rgba(108,138,255,0.08), 0 0 0 1px rgba(108,138,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
        <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-[rgba(108,138,255,0.12)] font-mono text-[0.7rem] text-muted-foreground">
          <div className="flex gap-2">
            <span className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]" />
            <span className="w-[9px] h-[9px] rounded-full bg-[#febc2e]" />
            <span className="w-[9px] h-[9px] rounded-full bg-[#28c840]" />
          </div>
          <span className="opacity-60">Claude Code · Cursor · Copilot · Codex · OpenCode</span>
        </div>
        <CardContent className="relative p-5">
          <div className="font-mono text-[0.72rem] text-muted-foreground mb-2">{t('hero.terminal.label')}</div>
          <div className="font-mono text-base text-[var(--green)] min-h-[1.6em] leading-relaxed"
            style={{ textShadow: '0 0 12px rgba(74,222,128,0.25)' }}>
            {displayed}<span style={{ animation: 'cursorBlink 1s step-end infinite' }}>▊</span>
          </div>
          <div className="text-sm text-muted-foreground mt-3 border-l border-[var(--cyan)]/25 pl-3" dangerouslySetInnerHTML={{ __html: t(`hero.hint.${idx}`) }} />
          <div className="flex gap-2.5 mt-4 flex-wrap">
            <Button variant="outline" size="sm" className="ai-control font-mono text-xs h-11 px-4 hover:bg-primary/10 active:translate-y-px"
              onClick={() => navigator.clipboard.writeText(t(`hero.cmd.${idx}`))}>
              {t('hero.copy')}
            </Button>
            <Button variant="outline" size="sm" className="ai-control font-mono text-xs h-11 px-4 hover:bg-primary/10 active:translate-y-px" onClick={rotate}>
              {t('hero.rotate')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-center flex-wrap" style={{ animation: 'fadeUp 0.6s 0.32s ease both' }}>
        <Button size="lg" className="relative overflow-hidden font-mono h-12 px-7 min-w-[9rem] active:translate-y-px"
          style={{ boxShadow: '0 0 25px rgba(108,138,255,0.3)' }}
          onClick={() => document.getElementById('install')?.scrollIntoView({ behavior: 'smooth' })}>
          {t('hero.btn.install')}
          <span className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,0.08)_50%,transparent_70%)]"
            style={{ animation: 'shimmer 3s ease-in-out infinite' }} />
        </Button>
        <Button variant="outline" size="lg" className="ai-control font-mono h-12 px-7 min-w-[9rem] hover:bg-primary/10 active:translate-y-px"
          onClick={() => document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' })}>
          {t('hero.btn.examples')}
        </Button>
      </div>
    </section>
  )
}

// ── Install ───────────────────────────────────────────────────────────────────

function InstallSection() {
  const { t } = useI18n()
  const [copied, setCopied] = useState('')
  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(''), 1600) }

  const blocks = [
    { label: t('install.recommended'), cmd: 'npx -y github:yugasun/aiops' },
    { label: t('install.cli'), cmd: "npx skills@latest add yugasun/aiops -g -y --skill '*'" },
    { label: t('install.graph'), cmd: 'uv tool install graphifyy' },
  ]

  return (
    <Section id="install" label={t('install.label')} title={t('install.title')}>
      <div className="grid gap-3">
        {blocks.map((b) => (
          <Card key={b.cmd} className={cn(
            'ai-panel ai-panel-interactive backdrop-blur-xl overflow-hidden',
            b.label === t('install.recommended') && 'border-[var(--green)]/30',
          )}>
            <CardHeader className="relative flex flex-row items-center justify-between py-2.5 px-4 border-b border-border">
              <span className={cn(
                'text-xs text-muted-foreground',
                b.label === t('install.recommended') && 'text-[var(--green)] font-medium',
              )}>{b.label}</span>
              <Button variant="ghost" size="sm" className="font-mono text-[0.68rem] h-10 px-3 hover:bg-primary/10 active:translate-y-px"
                onClick={() => copy(b.cmd)}>
                {copied === b.cmd ? 'Copied' : 'Copy'}
              </Button>
            </CardHeader>
            <CardContent className="relative py-3 px-4 font-mono text-sm text-[var(--green)] overflow-x-auto"
              style={{ textShadow: '0 0 8px rgba(74,222,128,0.2)' }}>
              <span className="text-[var(--cyan)] mr-2" style={{ textShadow: '0 0 8px rgba(34,211,238,0.3)' }}>$</span>
              {b.cmd}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-[0.78rem] text-muted-foreground mt-3 px-1">{t('install.graph.desc')}</p>
    </Section>
  )
}

// ── Use Cases ─────────────────────────────────────────────────────────────────

function UseCasesSection() {
  const { t } = useI18n()
  const [active, setActive] = useState('health')

  return (
    <Section id="examples" label={t('examples.label')} title={t('examples.title')} desc={t('examples.desc')}>
      <Card className="ai-panel backdrop-blur-xl overflow-hidden">
        <Tabs value={active} onValueChange={setActive}>
          <div className="border-b border-border px-4 py-3 overflow-x-auto">
            <TabsList className="ai-control h-auto gap-1.5 p-1.5 inline-flex min-w-max rounded-xl">
              {useCaseIds.map((id) => (
                <TabsTrigger key={id} value={id}
                  className="ai-tab font-mono text-xs data-[state=active]:text-primary border border-transparent px-3 py-2.5 rounded-lg hover:bg-primary/5 hover:text-foreground cursor-pointer">
                  {t(`usecase.${id}.label`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {useCaseIds.map((id) => (
            <TabsContent key={id} value={id} className="p-5 mt-0" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
              <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr] items-start">
                <div>
                  <Badge variant="outline" className="font-mono text-[0.65rem] text-primary border-primary/30 mb-2">
                    {t(`usecase.${id}.tag`)}
                  </Badge>
                  <h3 className="text-xl font-bold mb-2">{t(`usecase.${id}.title`)}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t(`usecase.${id}.scenario`)}</p>

                  <Card className="bg-background/40 border-border/70 relative overflow-hidden">
                    <CardContent className="p-4">
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 font-mono text-[0.68rem] h-10 px-3 hover:bg-primary/10 active:translate-y-px"
                        onClick={() => navigator.clipboard.writeText(t(`hero.cmd.${useCaseIds.indexOf(id)}`))}>{t('usecase.copy')}</Button>
                      <div className="font-mono text-[0.68rem] text-muted-foreground mb-2">{t('hero.terminal.label')}</div>
                      <pre className="font-mono text-sm text-[var(--green)] whitespace-pre-wrap pr-16 leading-relaxed min-h-[3.5rem]"
                        style={{ textShadow: '0 0 8px rgba(74,222,128,0.2)' }}>
                        {t(`hero.cmd.${useCaseIds.indexOf(id)}`)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-xl border border-border/70 bg-background/30 p-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    <strong className="text-foreground">{t('usecase.youget')}</strong> {t(`usecase.${id}.outcome`)}
                  </div>
                  <div className="space-y-2">
                    {t(`usecase.${id}.flow`).split(',').map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono text-xs flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm text-foreground">{f}</span>
                        <span className="h-px flex-1 bg-border/60" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 font-mono text-[0.72rem] text-muted-foreground">{t(`usecase.${id}.meta`)}</div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </Section>
  )
}

// ── Gates ─────────────────────────────────────────────────────────────────────

function GatesSection() {
  const { t } = useI18n()

  return (
    <Section id="gates" label={t('gates.label')} title={t('gates.title')} desc={t('gates.desc')}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="ai-panel ai-panel-interactive backdrop-blur-xl hover:border-primary/30">
            <CardContent className="relative p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded bg-[var(--green-dim)] text-[var(--green)] font-mono text-xs flex items-center justify-center">
                  {i}
                </span>
                <h3 className="text-sm font-semibold">{t(`gates.${i}.name`)}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(`gates.${i}.desc`)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}

// ── Effects ───────────────────────────────────────────────────────────────────

function EffectsSection() {
  const { t } = useI18n()

  const stats = [
    { num: '-43%', key: 'effects.stats.lessCode' },
    { num: '-69%', key: 'effects.stats.leanerRoutes' },
    { num: '+100%', key: 'effects.stats.moreTests' },
    { num: '100%', key: 'effects.stats.silentBugs' },
  ]

  const compareCards = [
    { variant: 'noaiops' as const, color: 'text-muted-foreground', rows: [
      { lKey: 'effects.compare.noaiops.diff', v: '+56' },
      { lKey: 'effects.compare.noaiops.route', v: '45 lines' },
      { lKey: 'effects.compare.noaiops.overeng', vKey: 'effects.compare.noaiops.overeng.val' },
      { lKey: 'effects.compare.noaiops.test', v: '3 passed' },
    ]},
    { variant: 'withaiops' as const, color: 'text-[var(--green)]', rows: [
      { lKey: 'effects.compare.withaiops.diff', v: '+32' },
      { lKey: 'effects.compare.withaiops.route', v: '14 lines' },
      { lKey: 'effects.compare.withaiops.overeng', vKey: 'effects.compare.withaiops.overeng.val' },
      { lKey: 'effects.compare.withaiops.test', v: '4 passed' },
    ]},
  ]

  return (
    <Section id="effects" label={t('effects.label')} title={t('effects.title')}>
      <p className="text-muted-foreground text-sm mb-6">
        {t('effects.desc')}{' '}
        <Link to="/docs/demos" className="text-primary hover:underline">{t('effects.demo.link')}</Link>
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <Card key={s.num} className="ai-panel ai-panel-interactive backdrop-blur-xl text-center hover:border-[rgba(74,222,128,0.25)]"
            style={{ boxShadow: '0 0 20px rgba(74,222,128,0.08)' }}>
            <CardContent className="relative p-4">
              <div className="font-mono text-2xl font-bold text-[var(--green)]"
                style={{ textShadow: '0 0 15px rgba(74,222,128,0.4)' }}>{s.num}</div>
              <div className="text-[0.72rem] text-muted-foreground mt-1">{t(s.key)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {compareCards.map((card) => (
          <Card key={card.variant} className="ai-panel backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className={cn('font-mono text-xs', card.color)}>
                {t(`effects.compare.${card.variant}.title`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableBody>
                  {card.rows.map((r) => (
                    <TableRow key={r.lKey} className="border-border">
                      <TableCell className="text-muted-foreground text-sm py-2">{t(r.lKey)}</TableCell>
                      <TableCell className="font-mono font-semibold text-sm py-2 text-right">
                        {r.vKey ? t(r.vKey) : r.v}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}

// ── Docs Link Card ────────────────────────────────────────────────────────────

function DocsLinkSection() {
  const { t } = useI18n()

  const links = [
    { to: '/docs/getting-started', icon: BookOpen, labelKey: 'docs.link.start.label', descKey: 'docs.link.start.desc' },
    { to: '/docs/skills', icon: Boxes, labelKey: 'docs.link.skills.label', descKey: 'docs.link.skills.desc' },
    { to: '/docs/agents', icon: GitBranch, labelKey: 'docs.link.agents.label', descKey: 'docs.link.agents.desc' },
    { to: '/docs/demos', icon: ChartNoAxesColumnIncreasing, labelKey: 'docs.link.demos.label', descKey: 'docs.link.demos.desc' },
  ]

  return (
    <Section id="docs" label={t('docs.label')} title={t('docs.title')} desc={t('docs.desc')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((l) => {
          const Icon = l.icon
          return (
          <Link key={l.to} to={l.to}>
            <Card className="ai-panel ai-panel-interactive backdrop-blur-xl hover:border-primary/30 hover:bg-primary/5 cursor-pointer h-full">
              <CardContent className="p-4 min-h-[8rem]">
                <Icon className="relative h-5 w-5 mb-2 text-[var(--cyan)]" strokeWidth={1.8} />
                <div className="font-semibold text-sm mb-1">{t(l.labelKey)}</div>
                <div className="text-xs text-muted-foreground">{t(l.descKey)}</div>
              </CardContent>
            </Card>
          </Link>
          )
        })}
      </div>
    </Section>
  )
}

// ── Landing Page ──────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <main className="relative z-10 max-w-6xl mx-auto">
      <Hero />
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent max-w-4xl mx-auto" />
      <InstallSection />
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent max-w-4xl mx-auto" />
      <UseCasesSection />
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent max-w-4xl mx-auto" />
      <JourneyStateSection />
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent max-w-4xl mx-auto" />
      <GatesSection />
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent max-w-4xl mx-auto" />
      <EffectsSection />
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent max-w-4xl mx-auto" />
      <DocsLinkSection />
    </main>
  )
}
