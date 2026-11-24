import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { I18nProvider, useI18n } from './lib/i18n'
import { latestReleaseVersion } from './data/registry'
import Landing from './pages/Landing'
import DocsLayout from './docs/DocsLayout'
import GettingStartedPage from './docs/GettingStartedPage'
import SkillRegistryPage from './docs/SkillRegistryPage'
import AgentRegistryPage from './docs/AgentRegistryPage'
import DemosPage from './docs/DemosPage'

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  const { t, toggle, lang } = useI18n()
  const { pathname } = useLocation()
  return (
    <header className="site-header">
      <nav className="site-container site-nav" aria-label={t('nav.primary')}>
        <Link to="/" className="nav-mark" aria-label="aiops">
          <span className="site-wordmark">ai<span>ops</span></span>
          <span className="site-release">v{latestReleaseVersion}</span>
        </Link>
        <div className="nav-links">
          <Link to="/docs/getting-started" data-active={pathname.startsWith('/docs/') ? '' : undefined} aria-current={pathname === '/docs/getting-started' ? 'page' : undefined}>{t('nav.docs')}</Link>
          <a href="https://github.com/yugasun/aiops" target="_blank" rel="noopener">GitHub</a>
          <button type="button" onClick={toggle} className="language-action" lang={lang === 'en' ? 'zh' : 'en'}>
            {lang === 'en' ? '中文' : 'EN'}
          </button>
        </div>
      </nav>
    </header>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  const { t } = useI18n()
  return (
    <footer className="site-footer">
      <div className="site-container footer-layout">
        <div className="footer-details">
          <div className="footer-links">
            <a href="https://github.com/yugasun/aiops">GitHub</a>
            <Link to="/docs/getting-started">{t('nav.docs')}</Link>
            <a href="https://github.com/yugasun/aiops/blob/main/LICENSE">License</a>
          </div>
          <div className="footer-legal"><span>Apache 2.0</span><a href="https://github.com/yugasun">@yugasun</a></div>
        </div>
      </div>
    </footer>
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
