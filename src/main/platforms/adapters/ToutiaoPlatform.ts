import { PlatformAdapter, PlatformConfig, PublishResult } from '../PlatformManager'

export class ToutiaoPlatform implements PlatformAdapter {
  config: PlatformConfig = {
    type: 'toutiao',
    name: '今日头条',
    icon: 'toutiao',
    fields: [
      {
        name: 'cookie',
        label: 'Cookie',
        type: 'textarea',
        required: true,
        placeholder: '请粘贴今日头条的 Cookie',
        help: '登录今日头条创作者平台后，在浏览器开发者工具中复制 Cookie',
      },
    ],
    features: {
      supportHTML: true,
      supportMarkdown: false,
      supportImage: true,
      supportVideo: true,
      maxTitleLength: 100,
      maxContentLength: 200000,
    },
  }

  async publish(title: string, content: string, options: any): Promise<PublishResult> {
    const { cookie } = options.credentials

    try {
      // 今日头条发布 API（基于网页版）
      const headers = {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://mp.toutiao.com/',
      }

      // 创建文章
      const res = await fetch('https://mp.toutiao.com/profile_v4/graphic/publish', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          content,
          article_type: 0,
          save: options.saveAsDraft ? 1 : 0,
        }),
      })

      const data = await res.json() as any

      if (data.err_no !== 0) {
        return { success: false, message: data.message || '发布失败' }
      }

      return {
        success: true,
        message: options.saveAsDraft ? '已保存为草稿' : '发布成功',
        platformPostId: String(data.data?.id || ''),
      }
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }

  async testConnection(credentials: any): Promise<boolean> {
    try {
      const { cookie } = credentials
      const res = await fetch('https://mp.toutiao.com/profile_v4/', {
        headers: {
          Cookie: cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })
      const text = await res.text()
      return text.includes('mp.toutiao.com')
    } catch {
      return false
    }
  }
}
