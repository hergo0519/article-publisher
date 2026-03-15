import React, { useState, useEffect, useContext } from 'react'
import { ToastContext } from '../App'
import './PlatformManager.css'

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
  username: string
  is_active: number
}

interface PlatformConfig {
  type: string
  name: string
  icon: string
  fields: {
    name: string
    label: string
    type: 'text' | 'password' | 'textarea'
    required: boolean
    placeholder?: string
    help?: string
  }[]
}

export const PlatformManager: React.FC = () => {
  const { showToast } = useContext(ToastContext)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [supportedPlatforms, setSupportedPlatforms] = useState<PlatformConfig[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accountForm, setAccountForm] = useState<Record<string, string>>({})
  const [testingAccount, setTestingAccount] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [platformsData, accountsData, supportedData] = await Promise.all([
      window.electronAPI.db.getPlatforms(),
      window.electronAPI.db.getAccounts(),
      window.electronAPI.platform.getSupportedPlatforms(),
    ])
    setPlatforms(platformsData)
    setAccounts(accountsData)
    setSupportedPlatforms(supportedData)
  }

  const getPlatformAccounts = (platformId: number) => {
    return accounts.filter(a => a.platform_id === platformId)
  }

  const getPlatformConfig = (type: string) => {
    return supportedPlatforms.find(p => p.type === type)
  }

  const handleAddAccount = (platform: Platform) => {
    setSelectedPlatform(platform)
    setEditingAccount(null)
    setAccountForm({ name: '' })
    setShowAccountModal(true)
  }

  const handleEditAccount = (account: Account) => {
    const platform = platforms.find(p => p.id === account.platform_id)
    if (!platform) return

    setSelectedPlatform(platform)
    setEditingAccount(account)
    
    const form: Record<string, string> = { name: account.name }
    if (account.username) form.username = account.username
    if (account.password) form.password = account.password
    if (account.token) form.token = account.token
    if (account.cookie) form.cookie = account.cookie
    if (account.config) {
      try {
        const config = JSON.parse(account.config)
        Object.assign(form, config)
      } catch {}
    }
    setAccountForm(form)
    setShowAccountModal(true)
  }

  const handleSaveAccount = async () => {
    if (!selectedPlatform) return
    if (!accountForm.name) {
      showToast('请输入账号名称', 'warning')
      return
    }

    const platformConfig = getPlatformConfig(selectedPlatform.type)
    const config: Record<string, string> = {}
    
    // 提取配置字段
    platformConfig?.fields.forEach(field => {
      if (field.name !== 'name' && accountForm[field.name]) {
        config[field.name] = accountForm[field.name]
      }
    })

    const accountData = {
      platform_id: selectedPlatform.id,
      name: accountForm.name,
      username: accountForm.username || '',
      password: accountForm.password || '',
      token: accountForm.token || '',
      cookie: accountForm.cookie || '',
      config: JSON.stringify(config),
      is_active: 1,
    }

    try {
      if (editingAccount) {
        await window.electronAPI.db.updateAccount(editingAccount.id, accountData)
        showToast('账号已更新', 'success')
      } else {
        await window.electronAPI.db.addAccount(accountData)
        showToast('账号已添加', 'success')
      }
      setShowAccountModal(false)
      loadData()
    } catch (error) {
      showToast('保存失败', 'error')
    }
  }

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm('确定要删除这个账号吗？')) return

    try {
      await window.electronAPI.db.deleteAccount(accountId)
      showToast('账号已删除', 'success')
      loadData()
    } catch (error) {
      showToast('删除失败', 'error')
    }
  }

  const handleTestConnection = async (account: Account) => {
    setTestingAccount(account.id)
    try {
      const result = await window.electronAPI.publish.testConnection(account.platform_id, account.id)
      if (result.success) {
        showToast('连接测试成功', 'success')
      } else {
        showToast(`连接测试失败: ${result.message || '请检查账号配置'}`, 'error')
      }
    } catch (error: any) {
      showToast(`测试失败: ${error.message || '未知错误'}`, 'error')
    } finally {
      setTestingAccount(null)
    }
  }

  const toggleAccountStatus = async (account: Account) => {
    try {
      await window.electronAPI.db.updateAccount(account.id, {
        is_active: account.is_active ? 0 : 1,
      })
      loadData()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  return (
    <div className="platform-manager">
      <div className="page-header">
        <h1 className="page-title">平台管理</h1>
        <p className="page-subtitle">管理您的发布平台账号</p>
      </div>

      <div className="page-content">
        <div className="platforms-grid">
          {platforms.map(platform => {
            const platformAccounts = getPlatformAccounts(platform.id)
            const config = getPlatformConfig(platform.type)

            return (
              <div key={platform.id} className="platform-card">
                <div className="platform-card-header">
                  <div className="platform-info">
                    <div className="platform-icon">{platform.icon[0].toUpperCase()}</div>
                    <div>
                      <h3 className="platform-name">{platform.name}</h3>
                      <span className="platform-type">{platformAccounts.length} 个账号</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAddAccount(platform)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    添加账号
                  </button>
                </div>

                <div className="platform-accounts">
                  {platformAccounts.length === 0 ? (
                    <div className="no-accounts">
                      <p>暂无账号，点击上方按钮添加</p>
                    </div>
                  ) : (
                    platformAccounts.map(account => (
                      <div key={account.id} className={`account-item ${!account.is_active ? 'inactive' : ''}`}>
                        <div className="account-info">
                          <span className="account-name">{account.name}</span>
                          {account.username && (
                            <span className="account-username">{account.username}</span>
                          )}
                        </div>
                        <div className="account-actions">
                          <button
                            className={`status-toggle ${account.is_active ? 'active' : ''}`}
                            onClick={() => toggleAccountStatus(account)}
                            title={account.is_active ? '点击禁用' : '点击启用'}
                          >
                            {account.is_active ? '已启用' : '已禁用'}
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => handleTestConnection(account)}
                            disabled={testingAccount === account.id}
                            title="测试连接"
                          >
                            {testingAccount === account.id ? (
                              <span className="animate-spin">⟳</span>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                              </svg>
                            )}
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => handleEditAccount(account)}
                            title="编辑"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="action-btn danger"
                            onClick={() => handleDeleteAccount(account.id)}
                            title="删除"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 账号编辑弹窗 */}
      {showAccountModal && selectedPlatform && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="modal-content account-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAccount ? '编辑账号' : '添加账号'} - {selectedPlatform.name}</h3>
              <button className="modal-close" onClick={() => setShowAccountModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* 账号名称字段 - 所有平台通用 */}
              <div className="form-group">
                <label>
                  账号名称
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入账号名称，如：我的知乎账号"
                  value={accountForm.name || ''}
                  onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <p className="field-help">用于区分不同账号，方便管理</p>
              </div>
              
              {/* 平台特定字段 */}
              {(() => {
                const config = getPlatformConfig(selectedPlatform.type)
                return config?.fields.filter(f => f.name !== 'name').map(field => (
                  <div key={field.name} className="form-group">
                    <label>
                      {field.label}
                      {field.required && <span className="required">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="input"
                        rows={4}
                        placeholder={field.placeholder}
                        value={accountForm[field.name] || ''}
                        onChange={e => setAccountForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                      />
                    ) : (
                      <input
                        type={field.type}
                        className="input"
                        placeholder={field.placeholder}
                        value={accountForm[field.name] || ''}
                        onChange={e => setAccountForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                      />
                    )}
                    {field.help && <p className="field-help">{field.help}</p>}
                  </div>
                ))
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAccountModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSaveAccount}>
                {editingAccount ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
