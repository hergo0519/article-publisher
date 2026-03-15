import path from 'path'
import { app } from 'electron'
import fs from 'fs'

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

export class DatabaseManager {
  private dbPath: string
  private data: Database
  private nextId: { [key: string]: number }

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'data.json')
    this.data = {
      platforms: [],
      accounts: [],
      articles: [],
      publish_history: []
    }
    this.nextId = { platforms: 1, accounts: 1, articles: 1, publish_history: 1 }
  }

  async init(): Promise<void> {
    // 加载已有数据
    if (fs.existsSync(this.dbPath)) {
      try {
        const content = fs.readFileSync(this.dbPath, 'utf-8')
        this.data = JSON.parse(content)
        // 计算下一个ID
        this.nextId.platforms = Math.max(0, ...this.data.platforms.map(p => p.id || 0)) + 1
        this.nextId.accounts = Math.max(0, ...this.data.accounts.map(a => a.id || 0)) + 1
        this.nextId.articles = Math.max(0, ...this.data.articles.map(a => a.id || 0)) + 1
        this.nextId.publish_history = Math.max(0, ...this.data.publish_history.map(h => h.id || 0)) + 1
      } catch {
        // 如果解析失败，使用空数据
      }
    }

    // 初始化默认平台
    await this.initDefaultPlatforms()
    await this.save()
  }

  private async save(): Promise<void> {
    fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2))
  }

  private async initDefaultPlatforms(): Promise<void> {
    const platforms = [
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

    for (const platform of platforms) {
      const exists = this.data.platforms.find(p => p.type === platform.type)
      if (!exists) {
        this.data.platforms.push({
          id: this.nextId.platforms++,
          name: platform.name,
          type: platform.type,
          icon: platform.icon,
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }
  }

  // 平台操作
  async getPlatforms(): Promise<Platform[]> {
    return [...this.data.platforms].sort((a, b) => (a.id || 0) - (b.id || 0))
  }

  async addPlatform(platform: Platform): Promise<Platform> {
    const newPlatform = {
      ...platform,
      id: this.nextId.platforms++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.data.platforms.push(newPlatform)
    await this.save()
    return newPlatform
  }

  async updatePlatform(id: number, platform: Partial<Platform>): Promise<void> {
    const index = this.data.platforms.findIndex(p => p.id === id)
    if (index !== -1) {
      this.data.platforms[index] = {
        ...this.data.platforms[index],
        ...platform,
        updated_at: new Date().toISOString()
      }
      await this.save()
    }
  }

  async deletePlatform(id: number): Promise<void> {
    this.data.platforms = this.data.platforms.filter(p => p.id !== id)
    await this.save()
  }

  // 账号操作
  async getAccounts(platformId?: number): Promise<Account[]> {
    let accounts = [...this.data.accounts]
    if (platformId) {
      accounts = accounts.filter(a => a.platform_id === platformId)
    }
    return accounts.sort((a, b) => (a.id || 0) - (b.id || 0))
  }

  async addAccount(account: Account): Promise<Account> {
    const newAccount = {
      ...account,
      id: this.nextId.accounts++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.data.accounts.push(newAccount)
    await this.save()
    return newAccount
  }

  async updateAccount(id: number, account: Partial<Account>): Promise<void> {
    const index = this.data.accounts.findIndex(a => a.id === id)
    if (index !== -1) {
      this.data.accounts[index] = {
        ...this.data.accounts[index],
        ...account,
        updated_at: new Date().toISOString()
      }
      await this.save()
    }
  }

  async deleteAccount(id: number): Promise<void> {
    this.data.accounts = this.data.accounts.filter(a => a.id !== id)
    await this.save()
  }

  // 文章操作
  async getArticles(): Promise<Article[]> {
    return [...this.data.articles].sort((a, b) => 
      new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    )
  }

  async addArticle(article: Article): Promise<Article> {
    const newArticle = {
      ...article,
      id: this.nextId.articles++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.data.articles.push(newArticle)
    await this.save()
    return newArticle
  }

  async updateArticle(id: number, article: Partial<Article>): Promise<void> {
    const index = this.data.articles.findIndex(a => a.id === id)
    if (index !== -1) {
      this.data.articles[index] = {
        ...this.data.articles[index],
        ...article,
        updated_at: new Date().toISOString()
      }
      await this.save()
    }
  }

  async deleteArticle(id: number): Promise<void> {
    this.data.articles = this.data.articles.filter(a => a.id !== id)
    await this.save()
  }

  // 发布历史
  async getPublishHistory(articleId?: number): Promise<PublishHistory[]> {
    let history = [...this.data.publish_history]
    if (articleId) {
      history = history.filter(h => h.article_id === articleId)
    }
    return history.sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
  }

  async addPublishHistory(history: PublishHistory): Promise<PublishHistory> {
    const newHistory = {
      ...history,
      id: this.nextId.publish_history++,
      created_at: new Date().toISOString()
    }
    this.data.publish_history.push(newHistory)
    await this.save()
    return newHistory
  }

  async updatePublishHistory(id: number, status: string, message?: string, url?: string): Promise<void> {
    const index = this.data.publish_history.findIndex(h => h.id === id)
    if (index !== -1) {
      this.data.publish_history[index] = {
        ...this.data.publish_history[index],
        status: status as any,
        message,
        url
      }
      await this.save()
    }
  }
}
