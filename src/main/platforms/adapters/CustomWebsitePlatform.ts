import { PlatformAdapter, PlatformConfig, PublishResult } from '../PlatformManager'

export class CustomWebsitePlatform implements PlatformAdapter {
  config: PlatformConfig = {
    type: 'custom_website',
    name: '自定义网站',
    icon: 'website',
    fields: [
      {
        name: 'name',
        label: '网站名称',
        type: 'text',
        required: true,
        placeholder: '如：公司官网、个人博客',
      },
      {
        name: 'loginUrl',
        label: '登录地址',
        type: 'text',
        required: true,
        placeholder: 'https://example.com/admin/login',
        help: '网站后台登录页面的URL',
      },
      {
        name: 'publishUrl',
        label: '发布接口地址',
        type: 'text',
        required: true,
        placeholder: 'https://example.com/api/article/publish',
        help: '接收文章数据的API接口地址',
      },
      {
        name: 'username',
        label: '用户名',
        type: 'text',
        required: true,
        placeholder: '网站后台登录用户名',
      },
      {
        name: 'password',
        label: '密码',
        type: 'password',
        required: true,
        placeholder: '网站后台登录密码',
      },
      {
        name: 'authType',
        label: '认证方式',
        type: 'text',
        required: false,
        placeholder: 'cookie 或 token',
        help: '网站使用的认证方式：cookie（默认）或 token',
      },
      {
        name: 'headers',
        label: '自定义请求头',
        type: 'textarea',
        required: false,
        placeholder: '{"X-Custom-Header": "value"}',
        help: 'JSON格式，添加额外的请求头',
      },
      {
        name: 'fieldMapping',
        label: '字段映射',
        type: 'textarea',
        required: false,
        placeholder: '{"title": "post_title", "content": "body", "cover": "thumbnail"}',
        help: '将标准字段映射到网站特定的字段名',
      },
    ],
    features: {
      supportHTML: true,
      supportMarkdown: true,
      supportImage: true,
      supportVideo: false,
      maxTitleLength: 200,
      maxContentLength: 100000,
    },
  }

  async publish(title: string, content: string, options: any): Promise<PublishResult> {
    const { 
      loginUrl, 
      publishUrl, 
      username, 
      password, 
      authType = 'cookie',
      headers = '{}',
      fieldMapping = '{}'
    } = options.credentials

    try {
      const https = require('https')
      const http = require('http')
      const URL = require('url')
      
      // 解析字段映射
      const mapping = JSON.parse(fieldMapping)
      const customHeaders = JSON.parse(headers)
      
      // 1. 登录获取认证信息
      let authCookie = ''
      let authToken = ''
      
      if (authType === 'cookie') {
        // Cookie 认证方式
        authCookie = await this.loginWithCookie(https, loginUrl, username, password)
      } else {
        // Token 认证方式
        authToken = await this.loginWithToken(https, loginUrl, username, password)
      }
      
      // 2. 构建发布数据
      const postData: any = {}
      postData[mapping.title || 'title'] = title
      postData[mapping.content || 'content'] = content
      
      if (options.summary) {
        postData[mapping.summary || 'summary'] = options.summary
      }
      if (options.author) {
        postData[mapping.author || 'author'] = options.author
      }
      if (options.coverImage) {
        postData[mapping.cover || 'cover'] = options.coverImage
      }
      if (options.tags) {
        postData[mapping.tags || 'tags'] = options.tags
      }
      
      // 3. 发送发布请求
      const postBody = JSON.stringify(postData)
      const urlObj = new URL.URL(publishUrl)
      const client = urlObj.protocol === 'https:' ? https : http
      
      const result = await new Promise<any>((resolve, reject) => {
        const requestHeaders: any = {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postBody),
          ...customHeaders,
        }
        
        if (authType === 'cookie' && authCookie) {
          requestHeaders['Cookie'] = authCookie
        } else if (authType === 'token' && authToken) {
          requestHeaders['Authorization'] = `Bearer ${authToken}`
        }
        
        const req = client.request(
          {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: requestHeaders,
          },
          (res: any) => {
            let data = ''
            res.on('data', (chunk: any) => data += chunk)
            res.on('end', () => {
              try {
                resolve(JSON.parse(data))
              } catch (e) {
                resolve({ success: true, raw: data })
              }
            })
          }
        )
        req.on('error', reject)
        req.write(postBody)
        req.end()
      })
      
      // 4. 处理响应
      if (result.error || result.errcode || result.code !== 200) {
        return {
          success: false,
          message: result.message || result.error || '发布失败',
        }
      }
      
      return {
        success: true,
        message: '发布成功',
        url: result.url || result.data?.url || publishUrl,
        platformPostId: result.id || result.data?.id || '',
      }
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }
  
  private async loginWithCookie(https: any, loginUrl: string, username: string, password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const URL = require('url')
      const urlObj = new URL.URL(loginUrl)
      
      const postData = JSON.stringify({
        username,
        password,
      })
      
      const req = https.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res: any) => {
          // 从响应头中获取 Cookie
          const cookies = res.headers['set-cookie']
          if (cookies && cookies.length > 0) {
            resolve(cookies.join('; '))
          } else {
            reject(new Error('登录失败：未获取到 Cookie'))
          }
        }
      )
      req.on('error', reject)
      req.write(postData)
      req.end()
    })
  }
  
  private async loginWithToken(https: any, loginUrl: string, username: string, password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const URL = require('url')
      const urlObj = new URL.URL(loginUrl)
      
      const postData = JSON.stringify({
        username,
        password,
      })
      
      let data = ''
      const req = https.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res: any) => {
          res.on('data', (chunk: any) => data += chunk)
          res.on('end', () => {
            try {
              const result = JSON.parse(data)
              if (result.token || result.data?.token) {
                resolve(result.token || result.data?.token)
              } else {
                reject(new Error('登录失败：未获取到 Token'))
              }
            } catch (e) {
              reject(new Error('登录失败：解析响应失败'))
            }
          })
        }
      )
      req.on('error', reject)
      req.write(postData)
      req.end()
    })
  }

  async testConnection(credentials: any): Promise<{ success: boolean; message?: string }> {
    try {
      const { loginUrl, username, password, authType = 'cookie' } = credentials
      const https = require('https')
      
      if (authType === 'cookie') {
        await this.loginWithCookie(https, loginUrl, username, password)
      } else {
        await this.loginWithToken(https, loginUrl, username, password)
      }
      
      return { success: true }
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }
}
