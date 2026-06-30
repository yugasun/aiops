import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '../lib/i18n'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Table, TableBody, TableCell, TableRow } from '../components/ui/table'
import { Separator } from '../components/ui/separator'
import { Link } from 'react-router-dom'

// ── Data ──────────────────────────────────────────────────────────────────────

const heroCount = 5
const useCaseIds = ['health', 'bug', 'arch', 'rbac', 'resume'] as const

// ── Section wrapper ───────────────────────────────────────────────────────────

export function Section({ id, label, title, desc, children }: {
  id?: string; label: string; title: string; desc?: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="py-20 max-w-5xl mx-auto px-6">
      <div className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--cyan)] mb-2"
        style={{ textShadow: '0 0 10px rgba(34,211,238,0.3)' }}>
        // {label}
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
    <section className="relative pt-32 pb-24 text-center overflow-hidden">
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[min(95vw,1100px)] h-[600px] bg-[radial-gradient(ellipse,rgba(108,138,255,0.12)_0%,rgba(34,211,238,0.06)_35%,transparent_70%)] pointer-events-none"
        style={{ animation: 'heroGlowPulse 6s ease-in-out infinite' }} />
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[min(80vw,800px)] h-[300px] bg-[radial-gradient(ellipse,rgba(74,222,128,0.08)_0%,transparent_60%)] pointer-events-none" />

      <Badge variant="outline" className="mb-6 font-mono text-xs text-[var(--green)] bg-[var(--green-dim)] border-[rgba(74,222,128,0.25)] px-4 py-1.5"
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

      <div className="flex items-center gap-2 justify-center text-xs font-mono text-[var(--cyan)] opacity-80 mb-8"
        style={{ animation: 'fadeUp 0.6s 0.2s ease both' }}>
        <span className="w-2 h-2 rounded-full bg-[var(--cyan)]"
          style={{ boxShadow: '0 0 10px var(--cyan)', animation: 'aiPulse 2s ease-in-out infinite' }} />
        {t('hero.ai-status')}
      </div>

      <Card className="max-w-3xl mx-auto mb-8 bg-[rgba(14,15,22,0.85)] backdrop-blur-2xl border-[rgba(108,138,255,0.12)] overflow-hidden text-left rounded-xl"
        style={{ animation: 'fadeUp 0.6s 0.24s ease both', boxShadow: '0 0 60px rgba(108,138,255,0.08), 0 0 0 1px rgba(108,138,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(108,138,255,0.08)] font-mono text-[0.7rem] text-muted-foreground">
          <div className="flex gap-2">
            <span className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]" />
            <span className="w-[9px] h-[9px] rounded-full bg-[#febc2e]" />
            <span className="w-[9px] h-[9px] rounded-full bg-[#28c840]" />
          </div>
          <span className="opacity-60">Cursor / Claude Code / Codex</span>
        </div>
        <CardContent className="p-5">
          <div className="font-mono text-[0.72rem] text-muted-foreground mb-2">{t('hero.terminal.label')}</div>
          <div className="font-mono text-base text-[var(--green)] min-h-[1.6em] leading-relaxed"
            style={{ textShadow: '0 0 12px rgba(74,222,128,0.25)' }}>
            {displayed}<span style={{ animation: 'cursorBlink 1s step-end infinite' }}>▊</span>
          </div>
          <div className="text-sm text-muted-foreground mt-3" dangerouslySetInnerHTML={{ __html: t(`hero.hint.${idx}`) }} />
          <div className="flex gap-2.5 mt-4 flex-wrap">
            <Button variant="outline" size="sm" className="font-mono text-xs h-8"
              onClick={() => navigator.clipboard.writeText(t(`hero.cmd.${idx}`))}>
              {t('hero.copy')}
            </Button>
            <Button variant="outline" size="sm" className="font-mono text-xs h-8" onClick={rotate}>
              {t('hero.rotate')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-center flex-wrap mb-12" style={{ animation: 'fadeUp 0.6s 0.32s ease both' }}>
        <Button size="lg" className="relative overflow-hidden font-mono h-11 px-7"
          style={{ boxShadow: '0 0 25px rgba(108,138,255,0.3)' }}
          onClick={() => document.getElementById('install')?.scrollIntoView({ behavior: 'smooth' })}>
          {t('hero.btn.install')}
          <span className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,0.08)_50%,transparent_70%)]"
            style={{ animation: 'shimmer 3s ease-in-out infinite' }} />
        </Button>
        <Button variant="outline" size="lg" className="font-mono h-11 px-7"
          onClick={() => document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' })}>
          {t('hero.btn.examples')}
        </Button>
        <Button variant="outline" size="lg" className="font-mono h-11 px-7"
          onClick={() => window.open('https://github.com/yugasun/aiops', '_blank')}>
          {t('hero.btn.github')}
        </Button>
      </div>

      <div className="flex justify-center gap-4 sm:gap-6 flex-wrap max-w-3xl mx-auto" style={{ animation: 'fadeUp 0.6s 0.4s ease both' }}>
        {[
          { num: '21', key: 'stat.skills' },
          { num: '9', key: 'stat.agents' },
          { num: '6', key: 'stat.ides' },
          { num: '-43%', key: 'stat.diff' },
        ].map((s) => (
          <div key={s.key} className="flex-1 min-w-[120px] bg-card/40 backdrop-blur-xl border border-border/50 rounded-xl px-5 py-4 text-center hover:border-primary/20 transition-all">
            <div className="font-mono text-2xl font-bold bg-gradient-to-br from-[var(--accent)] to-[var(--cyan)] bg-clip-text text-transparent">
              {s.num}
            </div>
            <div className="text-[0.72rem] text-muted-foreground uppercase tracking-wider mt-1">{t(s.key)}</div>
          </div>
        ))}
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
      <div className="space-y-3">
        {blocks.map((b) => (
          <Card key={b.cmd} className="bg-card/70 backdrop-blur-xl border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between py-2.5 px-4 border-b border-border">
              <span className="text-xs text-muted-foreground">{b.label}</span>
              <Button variant="ghost" size="sm" className="font-mono text-[0.68rem] h-6 px-2"
                onClick={() => copy(b.cmd)}>
                {copied === b.cmd ? 'Copied' : 'Copy'}
              </Button>
            </CardHeader>
            <CardContent className="py-3 px-4 font-mono text-sm text-[var(--green)]"
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
      <Card className="bg-card/70 backdrop-blur-xl border-primary/10 overflow-hidden">
        <Tabs value={active} onValueChange={setActive}>
          <div className="border-b border-border px-4 py-3">
            <TabsList className="bg-muted/50 h-auto gap-1.5 p-1">
              {useCaseIds.map((id) => (
                <TabsTrigger key={id} value={id}
                  className="font-mono text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30 border border-transparent px-3 py-1.5 rounded-lg">
                  {t(`usecase.${id}.label`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {useCaseIds.map((id) => (
            <TabsContent key={id} value={id} className="p-5 mt-0" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
              <Badge variant="outline" className="font-mono text-[0.65rem] text-primary border-primary/30 mb-2">
                {t(`usecase.${id}.tag`)}
              </Badge>
              <h3 className="text-lg font-bold mb-2">{t(`usecase.${id}.title`)}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t(`usecase.${id}.scenario`)}</p>

              <Card className="bg-muted/50 border-border mb-4 relative">
                <CardContent className="p-3">
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2 font-mono text-[0.68rem] h-6 px-2"
                    onClick={() => navigator.clipboard.writeText(t(`hero.cmd.${useCaseIds.indexOf(id)}`))}>{t('usecase.copy')}</Button>
                  <pre className="font-mono text-sm text-[var(--green)] whitespace-pre-wrap pr-14"
                    style={{ textShadow: '0 0 8px rgba(74,222,128,0.2)' }}>
                    {t(`hero.cmd.${useCaseIds.indexOf(id)}`)}
                  </pre>
                </CardContent>
              </Card>

              <Separator className="mb-3" />
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">{t('usecase.youget')}</strong> {t(`usecase.${id}.outcome`)}
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {t(`usecase.${id}.flow`).split(',').map((f, i, arr) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="font-mono text-xs">{f}</Badge>
                      {i < arr.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
                    </span>
                  ))}
                </div>
                <div className="mt-2 font-mono text-[0.72rem] text-muted-foreground">{t(`usecase.${id}.meta`)}</div>
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
  const [active, setActive] = useState('0')

  return (
    <Section id="gates" label={t('gates.label')} title={t('gates.title')} desc={t('gates.desc')}>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="bg-muted/50 h-auto gap-1 p-1 mb-4 flex flex-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <TabsTrigger key={i} value={String(i)}
              className="font-mono text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent px-3 py-1.5 rounded-lg">
              <span className={cn(
                'w-[18px] h-[18px] rounded text-[0.65rem] flex items-center justify-center mr-1.5',
                Number(active) >= i ? 'bg-[var(--green)] text-[var(--bg)]' : 'bg-muted'
              )} style={Number(active) >= i ? { boxShadow: '0 0 8px rgba(74,222,128,0.3)' } : {}}>
                {i}
              </span>
              {t(`gates.${i}.name`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {[1, 2, 3, 4, 5].map((i) => (
          <TabsContent key={i} value={String(i)}>
            <Card className="bg-card/60 backdrop-blur-xl">
              <CardContent className="p-4 text-sm text-muted-foreground min-h-[4rem]">
                {t(`gates.${i}.desc`)}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
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
          <Card key={s.num} className="bg-card/60 backdrop-blur-xl border-[rgba(74,222,128,0.1)] text-center hover:border-[rgba(74,222,128,0.25)] transition-all"
            style={{ boxShadow: '0 0 20px rgba(74,222,128,0.08)' }}>
            <CardContent className="p-4">
              <div className="font-mono text-2xl font-bold text-[var(--green)]"
                style={{ textShadow: '0 0 15px rgba(74,222,128,0.4)' }}>{s.num}</div>
              <div className="text-[0.72rem] text-muted-foreground mt-1">{t(s.key)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {compareCards.map((card) => (
          <Card key={card.variant} className="bg-card/60 backdrop-blur-xl">
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
    { to: '/docs/getting-started', icon: '→', labelKey: 'docs.link.start.label', descKey: 'docs.link.start.desc' },
    { to: '/docs/skills', icon: '⚡', labelKey: 'docs.link.skills.label', descKey: 'docs.link.skills.desc' },
    { to: '/docs/agents', icon: '🤖', labelKey: 'docs.link.agents.label', descKey: 'docs.link.agents.desc' },
    { to: '/docs/demos', icon: '📊', labelKey: 'docs.link.demos.label', descKey: 'docs.link.demos.desc' },
  ]

  return (
    <Section id="docs" label={t('docs.label')} title={t('docs.title')} desc={t('docs.desc')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((l) => (
          <Link key={l.to} to={l.to}>
            <Card className="bg-card/60 backdrop-blur-xl border-border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="text-lg mb-1">{l.icon}</div>
                <div className="font-semibold text-sm mb-1">{t(l.labelKey)}</div>
                <div className="text-xs text-muted-foreground">{t(l.descKey)}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
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
      <GatesSection />
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent max-w-4xl mx-auto" />
      <EffectsSection />
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent max-w-4xl mx-auto" />
      <DocsLinkSection />
    </main>
  )
}
