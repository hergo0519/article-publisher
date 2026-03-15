import { PlatformAdapter, PlatformConfig, PublishResult } from '../PlatformManager'

export class CSDNPlatform implements PlatformAdapter {
  config: PlatformConfig = {
    type: 'csdn',
    name: 'CSDN',
    icon: 'csdn',
    fields: [
      {
        name: 'cookie',
        label: 'Cookie',
        type: 'textarea',
        required: true,
        placeholder: '请粘贴 CSDN 的 Cookie',
        help: '登录 CSDN 后，在浏览器开发者工具中复制 Cookie',
      },
    ],
    features: {
      supportHTML: true,
      supportMarkdown: true,
      supportImage: true,
      supportVideo: false,
      maxTitleLength: 100,
      maxContentLength: 200000,
    },
  }

  async publish(title: string, content: string, options: any): Promise<PublishResult> {
    const { cookie } = options.credentials

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://editor.csdn.net/',
      }

      // CSDN 发布 API
      const res = await fetch('https://bizapi.csdn.net/blog-console-api/v3/mdeditor/saveArticle', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          markdowncontent: content,
          content: content,
          readType: 'public',
          status: options.saveAsDraft ? 0 : 1,
        }),
      })

      const data = await res.json() as any

      if (data.code !== 200) {
        return { success: false, message: data.msg || '发布失败' }
      }

      return {
        success: true,
        message: options.saveAsDraft ? '已保存为草稿' : '发布成功',
        url: data.data?.url || '',
        platformPostId: String(data.data?.article_id || ''),
      }
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }

  async testConnection(credentials: any): Promise<boolean> {
    try {
      const { cookie } = credentials
      const res = await fetch('https://bizapi.csdn.net/blog-console-api/v3/user/info', {
        headers: {
          Cookie: cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })
      const data = await res.json() as any
      return data.code === 200
    } catch {
      return false
    }
  }
}
