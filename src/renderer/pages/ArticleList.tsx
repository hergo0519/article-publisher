import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ToastContext } from '../App'
import './ArticleList.css'

interface Article {
  id: number
  title: string
  content: string
  summary: string
  cover_image: string
  tags: string
  author: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export const ArticleList: React.FC = () => {
  const navigate = useNavigate()
  const { showToast } = useContext(ToastContext)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    setLoading(true)
    try {
      const data = await window.electronAPI.db.getArticles()
      setArticles(data)
    } catch (error) {
      showToast('加载文章失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这篇文章吗？')) return

    try {
      await window.electronAPI.db.deleteArticle(id)
      showToast('文章已删除', 'success')
      loadArticles()
    } catch (error) {
      showToast('删除失败', 'error')
    }
  }

  const handleEdit = (id: number) => {
    navigate(`/?edit=${id}`)
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="article-list-page">
      <div className="page-header">
        <h1 className="page-title">文章列表</h1>
        <div className="page-actions">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="搜索文章..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新建文章
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>加载中...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <h3 className="empty-state-title">
              {searchTerm ? '没有找到匹配的文章' : '还没有文章'}
            </h3>
            <p className="empty-state-desc">
              {searchTerm ? '请尝试其他关键词' : '点击右上角按钮创建第一篇文章'}
            </p>
            {!searchTerm && (
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                开始写作
              </button>
            )}
          </div>
        ) : (
          <div className="article-grid">
            {filteredArticles.map(article => (
              <div key={article.id} className="article-card">
                <div className="article-card-header">
                  <span className={`article-status ${article.status}`}>
                    {article.status === 'published' ? '已发布' : '草稿'}
                  </span>
                  <div className="article-actions">
                    <button
                      className="action-btn"
                      onClick={() => handleEdit(article.id)}
                      title="编辑"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="action-btn danger"
                      onClick={() => handleDelete(article.id)}
                      title="删除"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="article-card-body" onClick={() => handleEdit(article.id)}>
                  <h3 className="article-title">{article.title || '无标题'}</h3>
                  <p className="article-summary">
                    {article.summary || article.content.slice(0, 100) || '暂无内容'}
                  </p>
                </div>

                <div className="article-card-footer">
                  <div className="article-meta">
                    <span className="article-date">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {formatDate(article.updated_at)}
                    </span>
                    {article.author && (
                      <span className="article-author">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        {article.author}
                      </span>
                    )}
                  </div>
                  {article.tags && (
                    <div className="article-tags">
                      {article.tags.split(',').slice(0, 3).map((tag, i) => (
                        <span key={i} className="tag">{tag.trim()}</span>
                      ))}
                    </div>
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
