import { PlatformAdapter, PlatformConfig, PublishResult } from '../PlatformManager'

export class NeteasePlatform implements PlatformAdapter {
  config: PlatformConfig = {
    type: 'netease',
    name: '网易号',
    icon: 'netease',
    fields: [
      {
        name: 'cookie',
        label: 'Cookie',
        type: 'textarea',
        required: true,
        placeholder: '请粘贴网易号的 Cookie',
        help: '登录网易号后，在浏览器开发者工具中复制 Cookie',
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
      const https = require('https')
      
      const postData = JSON.stringify({
        title: title,
        content: content,
        cover: options.coverImage || '',
        original: 1,
        draft: options.saveAsDraft ? 1 : 0,
      })

      const result = await new Promise<any>((resolve, reject) => {
        const req = https.request(
          'https://mp.163.com/v2/article/create',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookie,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (res: any) => {
            let data = ''
            res.on('data', (chunk: any) => data += chunk)
            res.on('end', () => {
              try {
                resolve(JSON.parse(data))
              } catch (e) {
                reject(new Error('解析响应失败'))
              }
            })
          }
        )
        req.on('error', reject)
        req.write(postData)
        req.end()
      })

      if (result.code !== 200) {
        return { success: false, message: result.message || '发布失败' }
      }

      return {
        success: true,
        message: options.saveAsDraft ? '已保存为草稿' : '发布成功',
        url: `https://mp.163.com/`,
        platformPostId: String(result.data?.articleId || ''),
      }
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }

  async testConnection(credentials: any): Promise<{ success: boolean; message?: string }> {
    try {
      const { cookie } = credentials
      const https = require('https')
      
      return new Promise((resolve) => {
        https.get('https://mp.163.com/v2/user/info', {
          headers: {
            'Cookie': cookie,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }, (res: any) => {
          let data = ''
          res.on('data', (chunk: any) => data += chunk)
          res.on('end', () => {
            try {
              const result = JSON.parse(data)
              if (result.code === 200) {
                resolve({ success: true })
              } else {
                resolve({ success: false, message: result.message })
              }
            } catch (e) {
              resolve({ success: false, message: '解析响应失败' })
            }
          })
        }).on('error', (err: any) => {
          resolve({ success: false, message: err.message })
        })
      })
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }
}
