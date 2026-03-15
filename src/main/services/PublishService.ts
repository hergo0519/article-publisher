import { DatabaseManager } from '../database/DatabaseManager'
import { PlatformManager } from '../platforms/PlatformManager'

export class PublishService {
  constructor(
    private dbManager: DatabaseManager,
    private platformManager: PlatformManager
  ) {}

  async publishArticle(articleId: number, platformIds: number[]): Promise<any[]> {
    // 获取文章
    const articles = await this.dbManager.getArticles()
    const article = articles.find(a => a.id === articleId)

    if (!article) {
      throw new Error('文章不存在')
    }

    const results = []

    for (const platformId of platformIds) {
      // 获取账号
      const accounts = await this.dbManager.getAccounts(platformId)
      const activeAccount = accounts.find(a => a.is_active)

      if (!activeAccount) {
        results.push({
          platformId,
          success: false,
          message: '该平台没有激活的账号',
        })
        continue
      }

      // 获取平台类型
      const platforms = await this.dbManager.getPlatforms()
      const platform = platforms.find(p => p.id === platformId)

      if (!platform) {
        results.push({
          platformId,
          success: false,
          message: '平台不存在',
        })
        continue
      }

      // 创建发布历史记录
      const history = await this.dbManager.addPublishHistory({
        article_id: articleId,
        account_id: activeAccount.id!,
        platform_name: platform.name,
        status: 'pending',
      })

      try {
        // 解析账号凭证
        const credentials: any = {}
        if (activeAccount.username) credentials.username = activeAccount.username
        if (activeAccount.password) credentials.password = activeAccount.password
        if (activeAccount.token) credentials.token = activeAccount.token
        if (activeAccount.cookie) credentials.cookie = activeAccount.cookie
        if (activeAccount.config) {
          try {
            const config = JSON.parse(activeAccount.config)
            Object.assign(credentials, config)
            console.log('Account config parsed:', Object.keys(config))
          } catch (e) {
            console.error('Failed to parse account config:', e)
          }
        }
        
        console.log('Credentials keys:', Object.keys(credentials))
        console.log('Has appId:', !!credentials.appId)
        console.log('Has appSecret:', !!credentials.appSecret)

        // 发布到平台
        console.log(`Publishing to ${platform.name}...`)
        console.log('Article title:', article.title)
        console.log('Content length:', article.content?.length)
        
        const result = await this.platformManager.publishToPlatform(
          platform.type,
          article.title,
          article.content,
          {
            credentials,
            summary: article.summary,
            author: article.author,
            coverImage: article.cover_image,
            tags: article.tags ? article.tags.split(',') : [],
          }
        )
        
        console.log('Publish result:', result)

        // 更新发布历史
        await this.dbManager.updatePublishHistory(
          history.id!,
          result.success ? 'success' : 'failed',
          result.message,
          result.url
        )

        results.push({
          platformId,
          platformName: platform.name,
          ...result,
        })
      } catch (error: any) {
        // 更新发布历史为失败
        await this.dbManager.updatePublishHistory(
          history.id!,
          'failed',
          error.message
        )

        results.push({
          platformId,
          platformName: platform.name,
          success: false,
          message: error.message,
        })
      }
    }

    return results
  }

  async testConnection(platformId: number, accountId: number): Promise<{ success: boolean; message?: string }> {
    // 获取平台
    const platforms = await this.dbManager.getPlatforms()
    const platform = platforms.find(p => p.id === platformId)

    if (!platform) {
      return { success: false, message: '平台不存在' }
    }

    // 获取账号
    const accounts = await this.dbManager.getAccounts(platformId)
    const account = accounts.find(a => a.id === accountId)

    if (!account) {
      return { success: false, message: '账号不存在' }
    }

    // 解析凭证
    const credentials: any = {}
    if (account.username) credentials.username = account.username
    if (account.password) credentials.password = account.password
    if (account.token) credentials.token = account.token
    if (account.cookie) credentials.cookie = account.cookie
    if (account.config) {
      const config = JSON.parse(account.config)
      Object.assign(credentials, config)
    }

    const result = await this.platformManager.testPlatformConnection(platform.type, credentials)
    return result
  }
}
