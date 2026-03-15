import { PlatformAdapter, PlatformConfig, PublishResult } from '../PlatformManager'

export class JianshuPlatform implements PlatformAdapter {
  config: PlatformConfig = {
    type: 'jianshu',
    name: '简书',
    icon: 'jianshu',
    fields: [
      {
        name: 'cookie',
        label: 'Cookie',
        type: 'textarea',
        required: true,
        placeholder: '请粘贴简书的 Cookie',
        help: '登录简书后，在浏览器开发者工具中复制 Cookie',
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
        'Referer': 'https://www.jianshu.com/',
      }

      // 创建文章
      const res = await fetch('https://www.jianshu.com/author/notes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          content,
        }),
      })

      const data = await res.json() as any

      if (data.error) {
        return { success: false, message: data.error }
      }

      const noteId = data.id

      // 发布文章
      if (!options.saveAsDraft) {
        const publishRes = await fetch(`https://www.jianshu.com/author/notes/${noteId}/publicize`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            id: noteId,
          }),
        })
        const publishData = await publishRes.json() as any

        if (publishData.error) {
          return { success: false, message: publishData.error }
        }

        return {
          success: true,
          message: '发布成功',
          url: `https://www.jianshu.com/p/${noteId}`,
          platformPostId: String(noteId),
        }
      }

      return {
        success: true,
        message: '已保存为草稿',
        platformPostId: String(noteId),
      }
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }

  async testConnection(credentials: any): Promise<boolean> {
    try {
      const { cookie } = credentials
      const res = await fetch('https://www.jianshu.com/author/notes', {
        headers: {
          Cookie: cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })
      return res.status === 200
    } catch {
      return false
    }
  }
}
