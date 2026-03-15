import { PlatformAdapter, PlatformConfig, PublishResult } from '../PlatformManager'

export class BaijiahaoPlatform implements PlatformAdapter {
  config: PlatformConfig = {
    type: 'baijiahao',
    name: '百家号',
    icon: 'baijiahao',
    fields: [
      {
        name: 'cookie',
        label: 'Cookie',
        type: 'textarea',
        required: true,
        placeholder: '请粘贴百家号的 Cookie',
        help: '登录百家号后，在浏览器开发者工具中复制 Cookie',
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
      
      // 百家号发布 API
      const postData = JSON.stringify({
        title: title,
        content: content,
        cover_images: options.coverImage ? [options.coverImage] : [],
        is_original: 1,
        save: options.saveAsDraft ? 1 : 0,
      })

      const result = await new Promise<any>((resolve, reject) => {
        const req = https.request(
          'https://baijiahao.baidu.com/builderinner/api/content/save',
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

      if (result.errno !== 0) {
        return { success: false, message: result.errmsg || '发布失败' }
      }

      return {
        success: true,
        message: options.saveAsDraft ? '已保存为草稿' : '发布成功',
        url: `https://baijiahao.baidu.com/`,
        platformPostId: String(result.data?.id || ''),
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
        https.get('https://baijiahao.baidu.com/builderinner/api/content/query?type=1&page=1&size=1', {
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
              if (result.errno === 0) {
                resolve({ success: true })
              } else {
                resolve({ success: false, message: result.errmsg })
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
