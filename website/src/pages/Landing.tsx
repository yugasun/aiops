import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Link } from 'react-router-dom'
import { JourneyStateSection } from './JourneyStateSection'
import { sequences, t as localize } from '../data/registry'
import { BookOpen, Boxes, ChartNoAxesColumnIncreasing, Copy, Download, GitBranch, Radar, RotateCw, ShieldCheck, Terminal, Workflow } from 'lucide-react'

// ── Data ──────────────────────────────────────────────────────────────────────

const heroCount = 5
const useCaseIds = ['health', 'bug', 'arch', 'rbac', 'resume'] as const

const featureSteps = sequences.find((route) => route.taskKind === 'feature_idea')!.phases

const heroSignals = [
  { icon: Radar, key: 'hero.signal.route' },
  { icon: Workflow, key: 'hero.signal.resume' },
  { icon: ShieldCheck, key: 'hero.signal.approve' },
]

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ id, title, desc, children }: {
  id: string; title: string; desc?: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="landing-section">
      <div className="site-container section-layout">
        <header className="section-heading">
          <h2>{title}</h2>
          {desc && <p>{desc}</p>}
        </header>
        {children}
      </div>
    </section>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  const { t } = useI18n()
  const [idx, setIdx] = useState(0)
  const [copyResult, setCopyResult] = useState<{ command: string; ok: boolean } | null>(null)
  const command = t(`hero.cmd.${idx}`)

  const rotate = () => {
    setIdx((current) => (current + 1) % heroCount)
    setCopyResult(null)
  }

  return (
    <section className="landing-hero" aria-labelledby="site-title">
      <div className="site-container intro-grid">
        <div className="intro-copy">
          <h1 id="site-title">
            <span className="hero-invocation">{t('hero.prompt')} <code>/aiops</code></span>{' '}
            {t('hero.title')}
          </h1>
          <p className="lead">{t('hero.lead')}</p>
        </div>

        <ul className="hero-signals" role="list">
          {heroSignals.map(({ icon: Icon, key }) => (
            <li key={key}><Icon aria-hidden="true" />{t(key)}</li>
          ))}
        </ul>

        <figure className="hero-console" data-slot="workflow" data-kind="product" data-ui>
          <figcaption className="record-label"><Terminal aria-hidden="true" />{t('hero.terminal.label')}</figcaption>
          <div className="record-prompt">
            <pre aria-live="polite"><code>{command}</code></pre>
            <p dangerouslySetInnerHTML={{ __html: t(`hero.hint.${idx}`) }} />
            <div className="record-actions">
              <button type="button" className="site-action" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(command)
                  setCopyResult({ command, ok: true })
                } catch {
                  setCopyResult({ command, ok: false })
                }
              }}>
                <Copy aria-hidden="true" />
                <span aria-live="polite">{copyResult?.command === command && copyResult.ok ? t('copy.done') : t('hero.copy')}</span>
              </button>
              <button type="button" className="site-action" onClick={rotate}><RotateCw aria-hidden="true" />{t('hero.rotate')}</button>
            </div>
            {copyResult?.command === command && !copyResult.ok && <p role="status">{t('copy.failed')}</p>}
          </div>
        </figure>

        <div className="hero-actions">
          <a className="site-action primary" href="#install"><Download aria-hidden="true" />{t('hero.btn.install')}</a>
          <a className="site-action" href="#examples">{t('hero.btn.examples')}</a>
        </div>
      </div>
    </section>
  )
}

// ── Install ───────────────────────────────────────────────────────────────────

function InstallSection() {
  const { t } = useI18n()
  const [copied, setCopied] = useState('')
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied((current) => current === text ? '' : current), 1600)
    } catch {
      setCopied('')
    }
  }

  const blocks = [
    { label: t('install.recommended'), cmd: 'npx -y github:yugasun/aiops' },
    { label: t('install.cli'), cmd: "npx skills@latest add yugasun/aiops -g -y --skill '*'" },
    { label: t('install.graph'), cmd: 'uv tool install graphifyy' },
  ]

  return (
    <Section id="install" title={t('install.title')}>
      <div className="install-layout">
        <div>
          <dl className="install-commands">
            {blocks.map(({ label, cmd }) => (
              <div className="install-command" key={cmd}>
                <dt>{label}</dt>
                <dd><code>{cmd}</code></dd>
                <dd><button type="button" className="site-action" onClick={() => void copy(cmd)}>
                  {copied === cmd ? t('copy.done') : t('hero.copy')}
                </button></dd>
              </div>
            ))}
          </dl>
          <p className="section-note">{t('install.graph.desc')}</p>
        </div>
        <div className="install-platforms">
          <p>{t('install.platforms')}</p>
          <ul>{['Claude Code', 'Cursor', 'GitHub Copilot', 'Codex CLI', 'OpenCode', 'AGENTS.md'].map((ide) => <li key={ide}>{ide}</li>)}</ul>
        </div>
      </div>
    </Section>
  )
}

// ── Use Cases ─────────────────────────────────────────────────────────────────

function UseCasesSection() {
  const { t, lang } = useI18n()
  const [active, setActive] = useState('health')
  const [copied, setCopied] = useState('')
  const prompts = { health: 'hero.cmd.0', bug: 'hero.cmd.1', arch: 'hero.cmd.3', rbac: 'usecase.rbac.prompt', resume: 'hero.cmd.2' }

  return (
    <Section id="examples" title={t('examples.title')} desc={t('examples.desc')}>
      <Tabs className="example-workbench" value={active} onValueChange={(value) => { setActive(value); setCopied('') }}>
        <TabsList variant="line" className="example-tabs" aria-label={t('examples.label')}>
          {useCaseIds.map((id) => (
            <TabsTrigger key={id} value={id} className="example-tab">{t(`usecase.${id}.label`)}</TabsTrigger>
          ))}
        </TabsList>
        {useCaseIds.map((id) => {
          const command = t(prompts[id])
          return (
            <TabsContent key={id} value={id}>
              <div className="example-body">
                <div className="example-copy">
                  <h3>{t(`usecase.${id}.title`)}</h3>
                  <p>{t(`usecase.${id}.scenario`)}</p>
                  <p><strong>{t('usecase.youget')}</strong> {t(`usecase.${id}.outcome`)}</p>
                  <figure className="example-command">
                    <figcaption>{t('hero.terminal.label')}</figcaption>
                    <pre><code>{command}</code></pre>
                    <button type="button" className="site-action" onClick={() => {
                      void navigator.clipboard.writeText(command).then(() => setCopied(command), () => setCopied(''))
                    }}>{copied === command ? t('copy.done') : t('usecase.copy')}</button>
                  </figure>
                </div>
                <div className="example-stages">
                  <p>{t(`usecase.${id}.tag`)}</p>
                  <ol>{t(`usecase.${id}.flow`).split(',').map((stage) => <li key={stage}>{stage}</li>)}</ol>
                  <p>{t(`usecase.${id}.meta`)}</p>
                </div>
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
      <figure className="workflow-record" data-ui>
        <figcaption className="record-label" id="feature-workflow">
          <span>{t('hero.workflow')}</span>
          <code>/aiops</code>
        </figcaption>
        <ol className="record-log" role="list" aria-labelledby="feature-workflow">
          {featureSteps.map((phase) => (
            <li key={phase.phase_id} className={phase.phase_id === 'ship' ? 'record-approval' : undefined}>
              <span>{localize(phase.title, lang)}</span>
              <code>{phase.skill}</code>
            </li>
          ))}
        </ol>
      </figure>
    </Section>
  )
}

// ── Gates ─────────────────────────────────────────────────────────────────────

function GatesSection() {
  const { t } = useI18n()

  return (
    <Section id="gates" title={t('gates.title')} desc={t('gates.desc')}>
      <ol className="gate-list">
        {[1, 2, 3].map((i) => (
          <li key={i}>
            <h3>{t(`gates.${i}.name`)}</h3>
            <p>{t(`gates.${i}.desc`)}</p>
          </li>
        ))}
      </ol>
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

  const comparisons = [
    ['diff', '+56', '+32'],
    ['route', t('effects.route.before'), t('effects.route.after')],
    ['overeng', t('effects.compare.noaiops.overeng.val'), t('effects.compare.withaiops.overeng.val')],
    ['test', t('effects.tests.before'), t('effects.tests.after')],
  ]

  return (
    <Section id="effects" title={t('effects.title')}>
      <div className="effects-layout">
        <div className="effects-summary">
          <p>{t('effects.desc')}</p>
          <Link to="/docs/demos" className="text-link">{t('effects.demo.link')}</Link>
        </div>
        <dl className="effects-metrics">
          {stats.map(({ num, key }) => <div key={key}><dt>{t(key)}</dt><dd>{num}</dd></div>)}
        </dl>
        <table className="effects-table" role="table" aria-label={t('effects.title')}>
          <thead role="rowgroup">
            <tr role="row">
              <td role="cell" />
              <th role="columnheader" scope="col" id="fixture-baseline">{t('effects.compare.noaiops.title')}</th>
              <th role="columnheader" scope="col" id="fixture-aiops">{t('effects.compare.withaiops.title')}</th>
            </tr>
          </thead>
          <tbody role="rowgroup">{comparisons.map(([key, before, after]) => (
            <tr key={key} role="row">
              <th role="rowheader" scope="row" id={`metric-${key}`}>{t(`effects.compare.noaiops.${key}`)}</th>
              <td role="cell" headers={`metric-${key} fixture-baseline`}>{before}</td>
              <td role="cell" headers={`metric-${key} fixture-aiops`}>{after}</td>
            </tr>
          ))}</tbody>
        </table>
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
    <Section id="docs" title={t('docs.title')} desc={t('docs.desc')}>
      <ul className="doc-index">
        {links.map(({ to, icon: Icon, labelKey, descKey }) => (
          <li key={to}>
            <Link to={to}>
              <span className="doc-index-title"><Icon aria-hidden="true" />{t(labelKey)}</span>
              <span>{t(descKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  )
}

// ── Landing Page ──────────────────────────────────────────────────────────────

export default function Landing() {
  const { t } = useI18n()
  return (
    <main className="landing" id="main">
      <Hero />
      <InstallSection />
      <UseCasesSection />
      <Section id="journey" title={t('journey.title')} desc={t('journey.desc')}>
        <JourneyStateSection />
      </Section>
      <GatesSection />
      <EffectsSection />
      <DocsLinkSection />
    </main>
  )
}
