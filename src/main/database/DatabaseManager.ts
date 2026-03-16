import path from 'path'
import { app } from 'electron'
import fs from 'fs'
import { logger } from '../utils/logger'

// ==================== 类型定义 ====================

export interface Platform {
  id?: number
  name: string
  type: string
  icon: string
  enabled: boolean
  config?: string
  created_at?: string
  updated_at?: string
}

export interface Account {
  id?: number
  platform_id: number
  name: string
  username: string
  password?: string
  token?: string
  cookie?: string
  config?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface Article {
  id?: number
  title: string
  content: string
  summary?: string
  cover_image?: string
  tags?: string
  author?: string
  status: 'draft' | 'published'
  created_at?: string
  updated_at?: string
}

export interface PublishHistory {
  id?: number
  article_id: number
  account_id: number
  platform_name: string
  status: 'pending' | 'success' | 'failed'
  message?: string
  url?: string
  created_at?: string
}

interface Database {
  platforms: Platform[]
  accounts: Account[]
  articles: Article[]
  publish_history: PublishHistory[]
}

interface NextIdMap {
  platforms: number
  accounts: number
  articles: number
  publish_history: number
}

// ==================== 默认平台配置 ====================

const DEFAULT_PLATFORMS: Array<{ name: string; type: string; icon: string }> = [
  { name: '微信公众号', type: 'wechat_official', icon: 'wechat' },
  { name: '知乎', type: 'zhihu', icon: 'zhihu' },
  { name: '今日头条', type: 'toutiao', icon: 'toutiao' },
  { name: '百家号', type: 'baijiahao', icon: 'baijiahao' },
  { name: '简书', type: 'jianshu', icon: 'jianshu' },
  { name: '博客园', type: 'cnblogs', icon: 'cnblogs' },
  { name: 'CSDN', type: 'csdn', icon: 'csdn' },
  { name: '掘金', type: 'juejin', icon: 'juejin' },
  { name: '搜狐号', type: 'sohu', icon: 'sohu' },
  { name: '网易号', type: 'netease', icon: 'netease' },
  { name: '新浪看点', type: 'sina', icon: 'sina' },
  { name: '企鹅号', type: 'qq', icon: 'qq' },
  { name: '大鱼号', type: 'dayu', icon: 'dayu' },
  { name: '一点资讯', type: 'yidian', icon: 'yidian' },
  { name: '自定义网站', type: 'custom_website', icon: 'website' },
  { name: '自定义平台', type: 'custom', icon: 'custom' },
]

// ==================== 数据库管理器 ====================

export class DatabaseManager {
  private dbPath: string
  private data: Database
  private nextId: NextIdMap
  private initialized: boolean = false

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'data.json')
    this.data = {
      platforms: [],
      accounts: [],
      articles: [],
      publish_history: [],
    }
    this.nextId = { platforms: 1, accounts: 1, articles: 1, publish_history: 1 }
  }

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.initialized) return

    try {
      // 加载已有数据
      await this.load()
      
      // 初始化默认平台
      await this.initDefaultPlatforms()
      
      // 保存数据
      await this.save()
      
      this.initialized = true
      logger.info('Database initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize database:', error)
      throw error
    }
  }

  /**
   * 关闭数据库
   */
  async close(): Promise<void> {
    if (this.initialized) {
      await this.save()
      this.initialized = false
      logger.info('Database closed')
    }
  }

  /**
   * 加载数据
   */
  private async load(): Promise<void> {
    if (!fs.existsSync(this.dbPath)) {
      logger.info('Database file not found, creating new database')
      return
    }

    try {
      const content = fs.readFileSync(this.dbPath, 'utf-8')
      this.data = JSON.parse(content)
      
      // 计算下一个ID
      this.calculateNextIds()
      
      logger.info('Database loaded successfully')
    } catch (error) {
      logger.error('Failed to load database:', error)
      // 如果解析失败，使用空数据
      this.data = { platforms: [], accounts: [], articles: [], publish_history: [] }
    }
  }

  /**
   * 保存数据
   */
  private async save(): Promise<void> {
    try {
      // 确保目录存在
      const dir = path.dirname(this.dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2))
    } catch (error) {
      logger.error('Failed to save database:', error)
      throw error
    }
  }

  /**
   * 计算下一个ID
   */
  private calculateNextIds(): void {
    const getMaxId = (items: Array<{ id?: number }>): number => {
      return items.length > 0 ? Math.max(...items.map((i) => i.id || 0)) : 0
    }

    this.nextId = {
      platforms: getMaxId(this.data.platforms) + 1,
      accounts: getMaxId(this.data.accounts) + 1,
      articles: getMaxId(this.data.articles) + 1,
      publish_history: getMaxId(this.data.publish_history) + 1,
    }
  }

  /**
   * 初始化默认平台
   */
  private async initDefaultPlatforms(): Promise<void> {
    for (const platform of DEFAULT_PLATFORMS) {
      const exists = this.data.platforms.find((p) => p.type === platform.type)
      if (!exists) {
        this.data.platforms.push({
          id: this.nextId.platforms++,
          name: platform.name,
          type: platform.type,
          icon: platform.icon,
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }
  }

  // ==================== 平台操作 ====================

  async getPlatforms(): Promise<Platform[]> {
    return [...this.data.platforms].sort((a, b) => (a.id || 0) - (b.id || 0))
  }

  async addPlatform(platform: Omit<Platform, 'id' | 'created_at' | 'updated_at'>): Promise<Platform> {
    const newPlatform: Platform = {
      ...platform,
      id: this.nextId.platforms++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.data.platforms.push(newPlatform)
    await this.save()
    return newPlatform
  }

  async updatePlatform(id: number, platform: Partial<Omit<Platform, 'id' | 'created_at'>>): Promise<void> {
    const index = this.data.platforms.findIndex((p) => p.id === id)
    if (index === -1) {
      throw new Error(`Platform with id ${id} not found`)
    }
    
    this.data.platforms[index] = {
      ...this.data.platforms[index],
      ...platform,
      updated_at: new Date().toISOString(),
    }
    await this.save()
  }

  async deletePlatform(id: number): Promise<void> {
    const index = this.data.platforms.findIndex((p) => p.id === id)
    if (index === -1) {
      throw new Error(`Platform with id ${id} not found`)
    }
    
    this.data.platforms.splice(index, 1)
    
    // 级联删除关联的账号
    this.data.accounts = this.data.accounts.filter((a) => a.platform_id !== id)
    
    await this.save()
  }

  // ==================== 账号操作 ====================

  async getAccounts(platformId?: number): Promise<Account[]> {
    let accounts = [...this.data.accounts]
    if (platformId !== undefined) {
      accounts = accounts.filter((a) => a.platform_id === platformId)
    }
    return accounts.sort((a, b) => (a.id || 0) - (b.id || 0))
  }

  async addAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const newAccount: Account = {
      ...account,
      id: this.nextId.accounts++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.data.accounts.push(newAccount)
    await this.save()
    return newAccount
  }

  async updateAccount(id: number, account: Partial<Omit<Account, 'id' | 'created_at'>>): Promise<void> {
    const index = this.data.accounts.findIndex((a) => a.id === id)
    if (index === -1) {
      throw new Error(`Account with id ${id} not found`)
    }
    
    this.data.accounts[index] = {
      ...this.data.accounts[index],
      ...account,
      updated_at: new Date().toISOString(),
    }
    await this.save()
  }

  async deleteAccount(id: number): Promise<void> {
    const index = this.data.accounts.findIndex((a) => a.id === id)
    if (index === -1) {
      throw new Error(`Account with id ${id} not found`)
    }
    
    this.data.accounts.splice(index, 1)
    await this.save()
  }

  // ==================== 文章操作 ====================

  async getArticles(): Promise<Article[]> {
    return [...this.data.articles].sort(
      (a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    )
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    return this.data.articles.find((a) => a.id === id)
  }

  async addArticle(article: Omit<Article, 'id' | 'created_at' | 'updated_at'>): Promise<Article> {
    const newArticle: Article = {
      ...article,
      id: this.nextId.articles++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.data.articles.push(newArticle)
    await this.save()
    return newArticle
  }

  async updateArticle(id: number, article: Partial<Omit<Article, 'id' | 'created_at'>>): Promise<void> {
    const index = this.data.articles.findIndex((a) => a.id === id)
    if (index === -1) {
      throw new Error(`Article with id ${id} not found`)
    }
    
    this.data.articles[index] = {
      ...this.data.articles[index],
      ...article,
      updated_at: new Date().toISOString(),
    }
    await this.save()
  }

  async deleteArticle(id: number): Promise<void> {
    const index = this.data.articles.findIndex((a) => a.id === id)
    if (index === -1) {
      throw new Error(`Article with id ${id} not found`)
    }
    
    this.data.articles.splice(index, 1)
    
    // 级联删除关联的发布历史
    this.data.publish_history = this.data.publish_history.filter((h) => h.article_id !== id)
    
    await this.save()
  }

  // ==================== 发布历史 ====================

  async getPublishHistory(articleId?: number): Promise<PublishHistory[]> {
    let history = [...this.data.publish_history]
    if (articleId !== undefined) {
      history = history.filter((h) => h.article_id === articleId)
    }
    return history.sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
  }

  async addPublishHistory(history: Omit<PublishHistory, 'id' | 'created_at'>): Promise<PublishHistory> {
    const newHistory: PublishHistory = {
      ...history,
      id: this.nextId.publish_history++,
      created_at: new Date().toISOString(),
    }
    this.data.publish_history.push(newHistory)
    await this.save()
    return newHistory
  }

  async updatePublishHistory(
    id: number,
    status: PublishHistory['status'],
    message?: string,
    url?: string
  ): Promise<void> {
    const index = this.data.publish_history.findIndex((h) => h.id === id)
    if (index === -1) {
      throw new Error(`Publish history with id ${id} not found`)
    }
    
    this.data.publish_history[index] = {
      ...this.data.publish_history[index],
      status,
      message,
      url,
    }
    await this.save()
  }

  // ==================== 统计 ====================

  async getStats(): Promise<{
    totalArticles: number
    totalPlatforms: number
    totalAccounts: number
    totalPublishes: number
  }> {
    return {
      totalArticles: this.data.articles.length,
      totalPlatforms: this.data.platforms.filter((p) => p.enabled).length,
      totalAccounts: this.data.accounts.filter((a) => a.is_active).length,
      totalPublishes: this.data.publish_history.length,
    }
  }
}
