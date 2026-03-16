import React, { useState, useCallback, useMemo } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { ArticleEditor } from './pages/ArticleEditor'
import { ArticleList } from './pages/ArticleList'
import { PlatformManager } from './pages/PlatformManager'
import { PublishHistory } from './pages/PublishHistory'
import { About } from './pages/About'
import { Toast, ToastType } from './components/Toast'
import './App.css'

// Toast 上下文
interface ToastContextType {
  showToast: (message: string, type: ToastType) => void
}

export const ToastContext = React.createContext<ToastContextType>({
  showToast: () => {},
})

// Toast 数据类型
interface ToastItem {
  id: number
  message: string
  type: ToastType
}

// 导航项配置
const NAV_ITEMS = [
  {
    path: '/',
    label: '写文章',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    end: true,
  },
  {
    path: '/articles',
    label: '文章列表',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    path: '/platforms',
    label: '平台管理',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    path: '/history',
    label: '发布历史',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    path: '/about',
    label: '关于',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
]

// Logo 组件
const Logo: React.FC = React.memo(() => (
  <div className="logo">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1890ff" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
    <span className="logo-text">文章发布助手</span>
  </div>
))

// 导航链接组件
const NavItem: React.FC<{
  path: string
  label: string
  icon: React.ReactNode
  end?: boolean
}> = React.memo(({ path, label, icon, end }) => (
  <NavLink
    to={path}
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    end={end}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
))

// 侧边栏组件
const Sidebar: React.FC = React.memo(() => (
  <aside className="sidebar">
    <div className="sidebar-header">
      <Logo />
    </div>

    <nav className="sidebar-nav">
      {NAV_ITEMS.map((item) => (
        <NavItem
          key={item.path}
          path={item.path}
          label={item.label}
          icon={item.icon}
          end={item.end}
        />
      ))}
    </nav>

    <div className="sidebar-footer">
      <div className="company-info">
        <div className="company-name">合果科技</div>
        <div className="company-website">www.hergo.com.cn</div>
      </div>
    </div>
  </aside>
))

// Toast 容器组件
const ToastContainer: React.FC<{ toasts: ToastItem[] }> = React.memo(({ toasts }) => (
  <div className="toast-container">
    {toasts.map((toast) => (
      <Toast key={toast.id} message={toast.message} type={toast.type} />
    ))}
  </div>
))

// 主应用组件
const App: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const toastContextValue = useMemo(
    () => ({ showToast }),
    [showToast]
  )

  return (
    <ToastContext.Provider value={toastContextValue}>
      <div className="app">
        <Sidebar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<ArticleEditor />} />
            <Route path="/articles" element={<ArticleList />} />
            <Route path="/platforms" element={<PlatformManager />} />
            <Route path="/history" element={<PublishHistory />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>

        <ToastContainer toasts={toasts} />
      </div>
    </ToastContext.Provider>
  )
}

export default App
