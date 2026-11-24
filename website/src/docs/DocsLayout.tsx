import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { Button } from '../components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../components/ui/sheet'
import { BookOpen, Boxes, ChartNoAxesColumnIncreasing, GitBranch, Menu } from 'lucide-react'

const sidebarItems = [
  { to: '/docs/getting-started', icon: BookOpen, en: 'Getting Started', zh: '快速开始' },
  { to: '/docs/skills', icon: Boxes, en: 'Skills', zh: '技能' },
  { to: '/docs/agents', icon: GitBranch, en: 'Agents', zh: 'Agent 介绍' },
  { to: '/docs/demos', icon: ChartNoAxesColumnIncreasing, en: 'Demos & Benchmarks', zh: '实例与效果' },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { lang, t } = useI18n()
  return (
    <nav className="docs-links" aria-label={t('docs.sidebar')}>
      {sidebarItems.map(({ icon: Icon, to, ...labels }) => (
        <NavLink key={to} to={to} onClick={onNavigate}>
          <Icon aria-hidden="true" />
          {labels[lang]}
        </NavLink>
      ))}
    </nav>
  )
}

export default function DocsLayout() {
  const { t } = useI18n()
  const [drawerOpen, setDrawerOpen] = useState(false)
  return (
    <div className="site-container docs-layout">
      <aside className="docs-sidebar">
        <p className="docs-nav-title">{t('docs.sidebar')}</p>
        <SidebarContent />
      </aside>

      <div className="docs-mobile-nav">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger render={<Button variant="outline" className="site-action" />}>
            <Menu aria-hidden="true" />
            {t('docs.sidebar')}
          </SheetTrigger>
          <SheetContent side="left" className="docs-drawer">
            <SheetTitle>{t('docs.sidebar')}</SheetTitle>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <main id="main" className="docs-content">
        <Outlet />
      </main>
    </div>
  )
}
