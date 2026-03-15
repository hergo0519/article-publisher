import { PlatformAdapter, PlatformConfig, PublishResult } from '../PlatformManager'

interface CookiePlatformOptions {
  type: string
  name: string
  icon: string
  apiBase: string
  publishEndpoint: string
  testEndpoint: string
  maxTitleLength: number
  maxContentLength: number
}

export class CookiePlatform implements PlatformAdapter {
  config: PlatformConfig
  private options: CookiePlatformOptions

  constructor(options: CookiePlatformOptions) {
    this.options = options
    this.config = {
      type: options.type,
      name: options.name,
      icon: options.icon,
      fields: [
        {
          name: 'cookie',
          label: 'Cookie',
          type: 'textarea',
          required: true,
          placeholder: `请粘贴${options.name}的 Cookie`,
          help: `登录${options.name}后，在浏览器开发者工具中复制 Cookie`,
        },
      ],
      features: {
        supportHTML: true,
        supportMarkdown: false,
        supportImage: true,
        supportVideo: false,
        maxTitleLength: options.maxTitleLength,
        maxContentLength: options.maxContentLength,
      },
    }
  }

  async publish(title: string, content: string, options: any): Promise<PublishResult> {
    const { cookie } = options.credentials

    try {
      const https = require('https')
      
      const postData = JSON.stringify({
        title: title,
        content: content,
        cover: options.coverImage || '',
        is_original: 1,
        status: options.saveAsDraft ? 0 : 1,
      })

      const result = await new Promise<any>((resolve, reject) => {
        const req = https.request(
          `${this.options.apiBase}${this.options.publishEndpoint}`,
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

      if (result.code !== 200 && result.errno !== 0) {
        return { success: false, message: result.message || result.errmsg || '发布失败' }
      }

      return {
        success: true,
        message: options.saveAsDraft ? '已保存为草稿' : '发布成功',
        url: this.options.apiBase,
        platformPostId: String(result.data?.id || result.data?.articleId || ''),
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
        https.get(`${this.options.apiBase}${this.options.testEndpoint}`, {
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
              if (result.code === 200 || result.errno === 0) {
                resolve({ success: true })
              } else {
                resolve({ success: false, message: result.message || result.errmsg })
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
