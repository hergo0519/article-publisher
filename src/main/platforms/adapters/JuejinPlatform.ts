import { PlatformAdapter, PlatformConfig, PublishResult } from '../PlatformManager'

export class JuejinPlatform implements PlatformAdapter {
  config: PlatformConfig = {
    type: 'juejin',
    name: '掘金',
    icon: 'juejin',
    fields: [
      {
        name: 'cookie',
        label: 'Cookie',
        type: 'textarea',
        required: true,
        placeholder: '请粘贴掘金的 Cookie',
        help: '登录掘金后，在浏览器开发者工具中复制 Cookie',
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
      const headers = {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://juejin.cn/',
      }

      // 掘金发布 API
      const res = await fetch('https://api.juejin.cn/content_api/v1/article_draft/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          mark_content: content,
          brief_content: options.summary || content.slice(0, 100),
          category_id: options.categoryId || '6809637769959178254',
          tag_ids: options.tags || [],
        }),
      })

      const data = await res.json() as any

      if (data.err_no !== 0) {
        return { success: false, message: data.err_msg || '发布失败' }
      }

      const draftId = data.data?.id

      // 发布文章
      if (!options.saveAsDraft) {
        const publishRes = await fetch('https://api.juejin.cn/content_api/v1/article/publish', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            draft_id: draftId,
          }),
        })
        const publishData = await publishRes.json() as any

        if (publishData.err_no !== 0) {
          return { success: false, message: publishData.err_msg || '发布失败' }
        }

        return {
          success: true,
          message: '发布成功',
          url: `https://juejin.cn/post/${publishData.data?.article_id}`,
          platformPostId: String(publishData.data?.article_id),
        }
      }

      return {
        success: true,
        message: '已保存为草稿',
        platformPostId: String(draftId),
      }
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }

  async testConnection(credentials: any): Promise<boolean> {
    try {
      const { cookie } = credentials
      const res = await fetch('https://api.juejin.cn/user_api/v1/user/get', {
        headers: {
          Cookie: cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })
      const data = await res.json() as any
      return data.err_no === 0
    } catch {
      return false
    }
  }
}
