import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { I18nProvider, useI18n } from './lib/i18n'
import { Button } from './components/ui/button'
import Landing from './pages/Landing'
import DocsLayout from './docs/DocsLayout'
import GettingStartedPage from './docs/GettingStartedPage'
import SkillRegistryPage from './docs/SkillRegistryPage'
import AgentRegistryPage from './docs/AgentRegistryPage'
import DemosPage from './docs/DemosPage'

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  const { t, toggle, lang } = useI18n()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-background/80 backdrop-blur-2xl border-b border-border/50"
      style={{ boxShadow: '0 1px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(108,138,255,0.06)' }}>
      <Link to="/" className="font-mono font-bold text-lg text-foreground hover:no-underline">
        ai<span className="text-primary">ops</span>
      </Link>
      <div className="flex items-center gap-1">
        <Link to="/docs/getting-started"
          className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all">
          {t('nav.docs')}
        </Link>
        <a href="https://github.com/yugasun/aiops" target="_blank" rel="noopener"
          className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all">
          GitHub
        </a>
        <Button variant="outline" size="sm" onClick={toggle}
          className="ml-2 font-mono text-xs h-7 px-2.5 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20">
          {lang === 'en' ? '中文' : 'EN'}
        </Button>
      </div>
    </nav>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border py-10 text-center bg-gradient-to-b from-background to-[rgba(108,138,255,0.03)]">
      <div className="flex gap-5 justify-center mb-3">
        <a href="https://github.com/yugasun/aiops" className="text-muted-foreground text-sm hover:text-foreground transition-colors">GitHub</a>
        <Link to="/docs/getting-started" className="text-muted-foreground text-sm hover:text-foreground transition-colors">Docs</Link>
        <a href="https://github.com/yugasun/aiops/blob/main/LICENSE" className="text-muted-foreground text-sm hover:text-foreground transition-colors">License</a>
      </div>
      <div className="text-xs text-muted-foreground">Apache 2.0 · <a href="https://github.com/yugasun" className="hover:text-foreground transition-colors">@yugasun</a></div>
    </footer>
  )
}

// ── Particles ─────────────────────────────────────────────────────────────────

function DataParticles() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="fixed w-[3px] h-[3px] rounded-full pointer-events-none z-0"
          style={{
            left: `${15 + i * 20}%`,
            background: ['var(--accent)', 'var(--green)', 'var(--cyan)', 'var(--accent)', 'var(--green)'][i],
            animation: `particleFloat ${15}s linear ${i * 3}s infinite`,
            opacity: 0,
          }} />
      ))}
    </>
  )
}

// ── Scroll to top on route change ───────────────────────────────────────────

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <I18nProvider>
      <ScrollToTop />
      <DataParticles />
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/docs" element={<DocsLayout />}>
          <Route path="getting-started" element={<GettingStartedPage />} />
          <Route path="skills" element={<SkillRegistryPage />} />
          <Route path="agents" element={<AgentRegistryPage />} />
          <Route path="demos" element={<DemosPage />} />
        </Route>
      </Routes>
      <Footer />
    </I18nProvider>
  )
}
