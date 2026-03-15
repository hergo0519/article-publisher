import { PlatformAdapter, PlatformConfig, PublishResult } from '../PlatformManager'

export class ZhihuPlatform implements PlatformAdapter {
  config: PlatformConfig = {
    type: 'zhihu',
    name: '知乎',
    icon: 'zhihu',
    fields: [
      {
        name: 'cookie',
        label: 'Cookie',
        type: 'textarea',
        required: true,
        placeholder: '请粘贴知乎的 Cookie',
        help: '登录知乎后，在浏览器开发者工具中复制 Cookie',
      },
    ],
    features: {
      supportHTML: false,
      supportMarkdown: true,
      supportImage: true,
      supportVideo: false,
      maxTitleLength: 100,
      maxContentLength: 100000,
    },
  }

  async publish(title: string, content: string, options: any): Promise<PublishResult> {
    const { cookie } = options.credentials

    try {
      // 知乎文章发布 API
      const headers = {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }

      // 1. 创建草稿
      const draftRes = await fetch('https://zhuanlan.zhihu.com/api/articles/drafts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          content,
          is_publish: options.publishImmediately || false,
        }),
      })

      const draftData = await draftRes.json() as any

      if (draftData.error) {
        return { success: false, message: draftData.error.message }
      }

      const articleId = draftData.id

      // 2. 如果设置为立即发布
      if (options.publishImmediately) {
        const publishRes = await fetch(`https://zhuanlan.zhihu.com/api/articles/${articleId}/publish`, {
          method: 'PUT',
          headers,
        })
        const publishData = await publishRes.json() as any

        if (publishData.error) {
          return { success: false, message: publishData.error.message }
        }

        return {
          success: true,
          message: '文章发布成功',
          url: `https://zhuanlan.zhihu.com/p/${articleId}`,
          platformPostId: String(articleId),
        }
      }

      return {
        success: true,
        message: '文章已保存为草稿',
        url: `https://zhuanlan.zhihu.com/p/${articleId}`,
        platformPostId: String(articleId),
      }
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }

  async testConnection(credentials: any): Promise<boolean> {
    try {
      const { cookie } = credentials
      const res = await fetch('https://www.zhihu.com/api/v4/me', {
        headers: {
          Cookie: cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })
      const data = await res.json() as any
      return data.name !== undefined
    } catch {
      return false
    }
  }
}
