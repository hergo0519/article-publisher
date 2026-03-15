import React, { useState, useEffect, useContext, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ToastContext } from '../App'
import './ArticleEditor.css'

interface Platform {
  id: number
  name: string
  type: string
  icon: string
  enabled: number
}

interface Account {
  id: number
  platform_id: number
  name: string
  is_active: number
}

interface Article {
  id?: number
  title: string
  content: string
  summary: string
  cover_image: string
  tags: string
  author: string
}

export const ArticleEditor: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const { showToast } = useContext(ToastContext)

  const [article, setArticle] = useState<Article>({
    title: '',
    content: '',
    summary: '',
    cover_image: '',
    tags: '',
    author: '',
  })

  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduledTime, setScheduledTime] = useState('')
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  // 加载数据
  useEffect(() => {
    loadPlatforms()
    loadAccounts()
    if (editId) {
      loadArticle(parseInt(editId))
    }
  }, [editId])

  const loadPlatforms = async () => {
    const data = await window.electronAPI.db.getPlatforms()
    setPlatforms(data.filter((p: Platform) => p.enabled))
  }

  const loadAccounts = async () => {
    const data = await window.electronAPI.db.getAccounts()
    setAccounts(data.filter((a: Account) => a.is_active))
  }

  const loadArticle = async (id: number) => {
    const articles = await window.electronAPI.db.getArticles()
    const found = articles.find((a: Article) => a.id === id)
    if (found) {
      setArticle(found)
    }
  }

  const handleInputChange = (field: keyof Article, value: string) => {
    setArticle(prev => ({ ...prev, [field]: value }))
  }

  const handleSelectCover = async () => {
    const path = await window.electronAPI.dialog.selectImage()
    if (path) {
      // 验证图片
      const validation = await window.electronAPI.image.validate(path)
      if (!validation.valid) {
        showToast(validation.message || '图片格式不正确', 'error')
        return
      }
      
      // 如果图片需要裁剪，提示用户
      if (validation.message) {
        showToast(validation.message + '，保存时将自动裁剪', 'warning')
      }
      
      handleInputChange('cover_image', path)
    }
  }

  const handleSave = async () => {
    if (!article.title.trim()) {
      showToast('请输入文章标题', 'warning')
      return
    }

    setIsSaving(true)
    try {
      if (editId) {
        await window.electronAPI.db.updateArticle(parseInt(editId), article)
        showToast('文章已更新', 'success')
      } else {
        const result = await window.electronAPI.db.addArticle(article)
        showToast('文章已保存', 'success')
        navigate(`/?edit=${result.id}`)
      }
    } catch (error) {
      showToast('保存失败', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!article.title.trim()) {
      showToast('请输入文章标题', 'warning')
      return
    }

    if (!article.content.trim()) {
      showToast('请输入文章内容', 'warning')
      return
    }

    if (selectedPlatforms.length === 0) {
      showToast('请选择至少一个发布平台', 'warning')
      return
    }

    // 先保存文章
    let articleId = editId ? parseInt(editId) : null
    if (!articleId) {
      const result = await window.electronAPI.db.addArticle(article)
      articleId = result.id
    } else {
      await window.electronAPI.db.updateArticle(articleId, article)
    }

    setIsPublishing(true)
    try {
      // 如果有封面图，先处理封面图
      let processedCoverImage = article.cover_image
      if (article.cover_image) {
        showToast('正在处理封面图...', 'info')
        
        // 获取选中的平台类型
        const platformTypes = selectedPlatforms.map(id => {
          const platform = platforms.find(p => p.id === id)
          return platform?.type
        }).filter(Boolean)
        
        // 使用第一个平台的尺寸要求（或者使用默认尺寸）
        const targetPlatform = platformTypes[0] || undefined
        
        const processResult = await window.electronAPI.image.process(article.cover_image, targetPlatform)
        if (processResult.success && processResult.path) {
          processedCoverImage = processResult.path
          showToast('封面图处理完成', 'success')
        } else {
          showToast('封面图处理失败，使用原图', 'warning')
        }
      }
      
      // 更新文章使用处理后的封面图
      const articleWithProcessedCover = {
        ...article,
        cover_image: processedCoverImage
      }
      await window.electronAPI.db.updateArticle(articleId!, articleWithProcessedCover)
      
      const results = await window.electronAPI.publish.publishArticle(articleId!, selectedPlatforms)
      
      const successCount = results.filter((r: any) => r.success).length
      const failCount = results.length - successCount

      if (successCount === results.length) {
        showToast(`成功发布到 ${successCount} 个平台`, 'success')
      } else if (successCount > 0) {
        showToast(`成功 ${successCount} 个，失败 ${failCount} 个`, 'warning')
      } else {
        showToast('发布失败，请检查账号配置', 'error')
      }

      // 更新文章状态
      await window.electronAPI.db.updateArticle(articleId!, { status: 'published' })
    } catch (error) {
      showToast('发布失败', 'error')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSchedulePublish = async () => {
    if (!article.title.trim()) {
      showToast('请输入文章标题', 'warning')
      return
    }

    if (!article.content.trim()) {
      showToast('请输入文章内容', 'warning')
      return
    }

    if (selectedPlatforms.length === 0) {
      showToast('请选择至少一个发布平台', 'warning')
      return
    }

    if (!scheduledTime) {
      showToast('请选择定时发布时间', 'warning')
      return
    }

    const scheduledDate = new Date(scheduledTime)
    if (scheduledDate <= new Date()) {
      showToast('定时发布时间必须在未来', 'warning')
      return
    }

    setIsSaving(true)
    try {
      // 先保存文章
      let articleId = editId ? parseInt(editId) : null
      if (!articleId) {
        const result = await window.electronAPI.db.addArticle(article)
        articleId = result.id
      } else {
        await window.electronAPI.db.updateArticle(articleId, article)
      }

      // 创建定时任务
      const task = await window.electronAPI.schedule.addTask({
        article_id: articleId,
        platform_ids: selectedPlatforms,
        scheduled_time: scheduledTime,
        status: 'pending',
      })

      showToast(`定时发布任务已创建，将在 ${scheduledTime} 执行`, 'success')
      setShowScheduleModal(false)
      setScheduledTime('')
    } catch (error) {
      showToast('创建定时任务失败', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const togglePlatform = (platformId: number) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const hasAccount = (platformId: number) => {
    return accounts.some(a => a.platform_id === platformId)
  }

  return (
    <div className="article-editor">
      <div className="editor-header">
        <h1 className="page-title">{editId ? '编辑文章' : '写文章'}</h1>
        <div className="editor-actions">
          <button
            className="btn btn-secondary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '保存草稿'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowScheduleModal(true)}
            disabled={isSaving}
          >
            定时发布
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? '发布中...' : '一键发布'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-main">
          {/* 标题输入 */}
          <div className="form-group">
            <input
              type="text"
              className="title-input"
              placeholder="请输入文章标题..."
              value={article.title}
              onChange={e => handleInputChange('title', e.target.value)}
            />
          </div>

          {/* 编辑器标签 */}
          <div className="editor-tabs">
            <button
              className={`tab ${activeTab === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit')}
            >
              编辑
            </button>
            <button
              className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              预览
            </button>
          </div>

          {/* 编辑区 */}
          {activeTab === 'edit' ? (
            <textarea
              className="content-editor"
              placeholder="在此输入文章内容..."
              value={article.content}
              onChange={e => handleInputChange('content', e.target.value)}
            />
          ) : (
            <div
              className="content-preview"
              dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }}
            />
          )}
        </div>

        <div className="editor-sidebar">
          {/* 平台选择 */}
          <div className="sidebar-section">
            <h3 className="section-title">选择发布平台</h3>
            <div className="platform-list">
              {platforms.map(platform => {
                const hasAcc = hasAccount(platform.id)
                return (
                  <label
                    key={platform.id}
                    className={`platform-item ${!hasAcc ? 'disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform.id)}
                      onChange={() => togglePlatform(platform.id)}
                      disabled={!hasAcc}
                    />
                    <span className="platform-name">{platform.name}</span>
                    {!hasAcc && <span className="platform-hint">未配置账号</span>}
                  </label>
                )
              })}
            </div>
          </div>

          {/* 文章设置 */}
          <div className="sidebar-section">
            <h3 className="section-title">文章设置</h3>
            
            <div className="form-group">
              <label>作者</label>
              <input
                type="text"
                className="input"
                placeholder="作者名称"
                value={article.author}
                onChange={e => handleInputChange('author', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>标签</label>
              <input
                type="text"
                className="input"
                placeholder="用逗号分隔，如：技术,编程,教程"
                value={article.tags}
                onChange={e => handleInputChange('tags', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>摘要</label>
              <textarea
                className="input"
                rows={3}
                placeholder="文章摘要（可选）"
                value={article.summary}
                onChange={e => handleInputChange('summary', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>封面图片</label>
              <p className="field-help" style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                建议尺寸 900×500 像素，不超过 2MB
              </p>
              <div className="cover-upload">
                {article.cover_image ? (
                  <div className="cover-preview">
                    <img src={article.cover_image} alt="封面" />
                    <button
                      className="cover-remove"
                      onClick={() => handleInputChange('cover_image', '')}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button className="cover-placeholder" onClick={handleSelectCover}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>点击选择封面</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 定时发布弹窗 */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content schedule-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>定时发布</h3>
              <button className="modal-close" onClick={() => setShowScheduleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>选择发布时间</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="field-help">请选择未来的时间</p>
              </div>
              <div className="form-group">
                <label>已选择的平台</label>
                <div className="selected-platforms">
                  {selectedPlatforms.length === 0 ? (
                    <p className="text-secondary">未选择任何平台</p>
                  ) : (
                    selectedPlatforms.map(id => {
                      const platform = platforms.find(p => p.id === id)
                      return platform ? (
                        <span key={id} className="platform-tag">{platform.name}</span>
                      ) : null
                    })
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>
                取消
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSchedulePublish}
                disabled={isSaving || !scheduledTime || selectedPlatforms.length === 0}
              >
                {isSaving ? '创建中...' : '创建定时任务'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
