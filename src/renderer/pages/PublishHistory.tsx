import React, { useState, useEffect, useContext } from 'react'
import { ToastContext } from '../App'
import './PublishHistory.css'

interface PublishRecord {
  id: number
  article_id: number
  account_id: number
  platform_name: string
  account_name: string
  status: 'pending' | 'success' | 'failed'
  message?: string
  url?: string
  created_at: string
}

interface Article {
  id: number
  title: string
}

export const PublishHistory: React.FC = () => {
  const { showToast } = useContext(ToastContext)
  const [history, setHistory] = useState<PublishRecord[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [historyData, articlesData] = await Promise.all([
        window.electronAPI.db.getPublishHistory(),
        window.electronAPI.db.getArticles(),
      ])
      setHistory(historyData)
      setArticles(articlesData)
    } catch (error) {
      showToast('加载历史记录失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getArticleTitle = (articleId: number) => {
    const article = articles.find(a => a.id === articleId)
    return article?.title || '未知文章'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const filteredHistory = history.filter(record => {
    if (filter === 'all') return true
    return record.status === filter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52c41a" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )
      case 'failed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#faad14" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        )
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '成功'
      case 'failed':
        return '失败'
      default:
        return '进行中'
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'success':
        return 'status-success'
      case 'failed':
        return 'status-failed'
      default:
        return 'status-pending'
    }
  }

  return (
    <div className="publish-history">
      <div className="page-header">
        <h1 className="page-title">发布历史</h1>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部
          </button>
          <button
            className={`filter-tab ${filter === 'success' ? 'active' : ''}`}
            onClick={() => setFilter('success')}
          >
            成功
          </button>
          <button
            className={`filter-tab ${filter === 'failed' ? 'active' : ''}`}
            onClick={() => setFilter('failed')}
          >
            失败
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>加载中...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <h3 className="empty-state-title">
              {filter === 'all' ? '暂无发布记录' : '没有符合条件的记录'}
            </h3>
            <p className="empty-state-desc">
              {filter === 'all'
                ? '发布文章后，这里会显示历史记录'
                : '尝试切换其他筛选条件'}
            </p>
          </div>
        ) : (
          <div className="history-list">
            {filteredHistory.map(record => (
              <div key={record.id} className="history-item">
                <div className={`history-status ${getStatusClass(record.status)}`}>
                  {getStatusIcon(record.status)}
                </div>
                <div className="history-content">
                  <div className="history-header">
                    <h4 className="article-title">{getArticleTitle(record.article_id)}</h4>
                    <span className={`status-badge ${getStatusClass(record.status)}`}>
                      {getStatusText(record.status)}
                    </span>
                  </div>
                  <div className="history-details">
                    <span className="platform-name">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      {record.platform_name}
                    </span>
                    <span className="account-name">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {record.account_name}
                    </span>
                    <span className="publish-time">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {formatDate(record.created_at)}
                    </span>
                  </div>
                  {record.message && (
                    <p className={`history-message ${record.status}`}>{record.message}</p>
                  )}
                  {record.url && (
                    <a
                      href={record.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="history-link"
                    >
                      查看文章
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
