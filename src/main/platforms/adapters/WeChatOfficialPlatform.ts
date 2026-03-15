import { PlatformAdapter, PlatformConfig, PublishResult } from '../PlatformManager'

export class WeChatOfficialPlatform implements PlatformAdapter {
  config: PlatformConfig = {
    type: 'wechat_official',
    name: '微信公众号',
    icon: 'wechat',
    fields: [
      {
        name: 'appId',
        label: 'AppID',
        type: 'text',
        required: true,
        placeholder: '请输入微信公众号的 AppID',
        help: '在微信公众号后台「开发-基本配置」中获取',
      },
      {
        name: 'appSecret',
        label: 'AppSecret',
        type: 'password',
        required: true,
        placeholder: '请输入 AppSecret',
        help: '请妥善保管，不要泄露给他人',
      },
    ],
    features: {
      supportHTML: true,
      supportMarkdown: false,
      supportImage: true,
      supportVideo: true,
      maxTitleLength: 64,
      maxContentLength: 200000,
    },
  }

  async publish(title: string, content: string, options: any): Promise<PublishResult> {
    const { appId, appSecret } = options.credentials

    try {
      const https = require('https')
      const fs = require('fs')
      const path = require('path')
      
      // 1. 获取 access_token
      const accessToken = await this.getAccessToken(https, appId, appSecret)
      console.log('Got access token')

      // 2. 处理封面图 - 微信公众号必须要有封面图
      console.log('Cover image path:', options.coverImage)
      let thumbMediaId = ''
      
      if (options.coverImage && fs.existsSync(options.coverImage)) {
        try {
          console.log('Uploading cover image...')
          thumbMediaId = await this.uploadImage(https, accessToken, options.coverImage)
          console.log('=========================================')
          console.log('UPLOAD SUCCESS! thumb_media_id:', thumbMediaId)
          console.log('=========================================')
        } catch (e: any) {
          console.error('=========================================')
          console.error('UPLOAD FAILED:', e.message)
          console.error('=========================================')
          return { success: false, message: '上传封面图失败: ' + e.message }
        }
      } else {
        return { success: false, message: '请先上传封面图（文章设置中点击选择封面）' }
      }

      // 3. 准备内容
      const htmlContent = this.convertToWechatHtml(content)

      // 4. 使用草稿箱接口（draft/add）
      const draftData: any = {
        articles: [
          {
            title: title,
            content: htmlContent,
            thumb_media_id: thumbMediaId,
            show_cover_pic: 1  // 显示封面图
          }
        ]
      }
      
      // 添加可选字段
      if (options.author) draftData.articles[0].author = options.author
      if (options.summary) draftData.articles[0].digest = options.summary
      if (options.sourceUrl) draftData.articles[0].content_source_url = options.sourceUrl
      
      console.log('Draft data:', JSON.stringify(draftData, null, 2))

      const result = await this.callDraftApi(https, accessToken, draftData)
      console.log('Draft API result:', result)

      if (result.errcode) {
        console.error('Draft API error:', result)
        return { 
          success: false, 
          message: `保存草稿失败: ${result.errmsg} (错误码: ${result.errcode})` 
        }
      }

      return {
        success: true,
        message: '文章已保存到草稿箱',
        url: 'https://mp.weixin.qq.com/',
        platformPostId: result.media_id,
      }
    } catch (error) {
      const err = error as Error
      console.error('Publish error:', err)
      return { success: false, message: err.message }
    }
  }

  private async getAccessToken(https: any, appId: string, appSecret: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
      https.get(url, (res: any) => {
        let data = ''
        res.on('data', (chunk: any) => data += chunk)
        res.on('end', () => {
          try {
            const result = JSON.parse(data)
            if (result.errcode) {
              reject(new Error(`获取Token失败: ${result.errmsg}`))
            } else {
              resolve(result.access_token)
            }
          } catch (e) {
            reject(new Error('解析Token响应失败'))
          }
        })
      }).on('error', reject)
    })
  }

  private async uploadImage(https: any, accessToken: string, imagePath: string): Promise<string> {
    const fs = require('fs')
    const path = require('path')
    
    return new Promise((resolve, reject) => {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2)
      const fileName = path.basename(imagePath)
      const fileData = fs.readFileSync(imagePath)
      
      // 检查文件大小（不能超过 2MB）
      if (fileData.length > 2 * 1024 * 1024) {
        reject(new Error('图片大小不能超过 2MB'))
        return
      }
      
      const formData = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${fileName}"\r\nContent-Type: image/jpeg\r\n\r\n`),
        fileData,
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ])
      
      // 使用 material/add_material 接口上传永久素材
      const req = https.request(
        `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=thumb`,
        {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': formData.length,
          },
        },
        (res: any) => {
          let data = ''
          res.on('data', (chunk: any) => data += chunk)
          res.on('end', () => {
            try {
              const result = JSON.parse(data)
              console.log('Upload image result:', result)
              if (result.errcode) {
                reject(new Error(result.errmsg))
              } else if (result.media_id) {
                resolve(result.media_id)
              } else {
                reject(new Error('上传成功但未返回 media_id'))
              }
            } catch (e) {
              reject(new Error('解析上传响应失败: ' + data))
            }
          })
        }
      )
      req.on('error', (err: any) => reject(err))
      req.write(formData)
      req.end()
    })
  }

  private async callDraftApi(https: any, accessToken: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data)
      const req = https.request(
        `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
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
              reject(new Error('解析响应失败: ' + data))
            }
          })
        }
      )
      req.on('error', reject)
      req.write(postData)
      req.end()
    })
  }

  private convertToWechatHtml(content: string): string {
    if (!content) return '<p></p>'
    const paragraphs = content.split('\n').filter(p => p.trim())
    if (paragraphs.length === 0) return '<p></p>'
    return paragraphs.map(p => `<p>${this.escapeHtml(p)}</p>`).join('')
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  async testConnection(credentials: any): Promise<{ success: boolean; message?: string }> {
    try {
      const { appId, appSecret } = credentials
      const https = require('https')
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
      
      return new Promise((resolve) => {
        https.get(url, (res: any) => {
          let data = ''
          res.on('data', (chunk: any) => data += chunk)
          res.on('end', () => {
            try {
              const result = JSON.parse(data)
              if (result.errcode) {
                resolve({ success: false, message: `错误码: ${result.errcode}, ${result.errmsg}` })
              } else {
                resolve({ success: true })
              }
            } catch (e) {
              resolve({ success: false, message: '解析响应失败' })
            }
          })
        }).on('error', (err: any) => {
          resolve({ success: false, message: `请求失败: ${err.message}` })
        })
      })
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }
}
