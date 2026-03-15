import { PlatformAdapter, PlatformConfig, PublishResult } from '../PlatformManager'

export class CustomPlatform implements PlatformAdapter {
  config: PlatformConfig = {
    type: 'custom',
    name: '自定义平台',
    icon: 'custom',
    fields: [
      {
        name: 'name',
        label: '平台名称',
        type: 'text',
        required: true,
        placeholder: '请输入平台名称',
      },
      {
        name: 'apiUrl',
        label: 'API 地址',
        type: 'text',
        required: true,
        placeholder: 'https://api.example.com/publish',
        help: '接收文章的 API 接口地址',
      },
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: false,
        placeholder: '可选，用于 API 认证',
      },
      {
        name: 'headers',
        label: '自定义 Headers',
        type: 'textarea',
        required: false,
        placeholder: '{"Authorization": "Bearer xxx"}',
        help: 'JSON 格式的自定义请求头',
      },
      {
        name: 'method',
        label: '请求方法',
        type: 'text',
        required: false,
        placeholder: 'POST',
      },
      {
        name: 'fieldMapping',
        label: '字段映射',
        type: 'textarea',
        required: false,
        placeholder: '{"title": "post_title", "content": "body"}',
        help: 'JSON 格式，将标准字段映射到平台特定字段',
      },
    ],
    features: {
      supportHTML: true,
      supportMarkdown: true,
      supportImage: true,
      supportVideo: false,
      maxTitleLength: 1000,
      maxContentLength: 1000000,
    },
  }

  async publish(title: string, content: string, options: any): Promise<PublishResult> {
    const { apiUrl, apiKey, headers, method, fieldMapping } = options.credentials

    try {
      // 构建请求头
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...JSON.parse(headers || '{}'),
      }

      if (apiKey) {
        requestHeaders['Authorization'] = `Bearer ${apiKey}`
      }

      // 字段映射
      const mapping = JSON.parse(fieldMapping || '{}')
      const body: Record<string, any> = {}

      // 标准字段
      body[mapping.title || 'title'] = title
      body[mapping.content || 'content'] = content

      // 额外字段
      if (options.summary) body[mapping.summary || 'summary'] = options.summary
      if (options.author) body[mapping.author || 'author'] = options.author
      if (options.tags) body[mapping.tags || 'tags'] = options.tags

      const res = await fetch(apiUrl, {
        method: method || 'POST',
        headers: requestHeaders,
        body: JSON.stringify(body),
      })

      const data = await res.json() as any

      if (!res.ok) {
        return { success: false, message: data.message || `HTTP ${res.status}` }
      }

      return {
        success: true,
        message: '发布成功',
        url: data.url || '',
        platformPostId: data.id || '',
      }
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }

  async testConnection(credentials: any): Promise<boolean> {
    try {
      const { apiUrl, apiKey, headers, method } = credentials

      const requestHeaders: Record<string, string> = {
        ...JSON.parse(headers || '{}'),
      }

      if (apiKey) {
        requestHeaders['Authorization'] = `Bearer ${apiKey}`
      }

      const res = await fetch(apiUrl, {
        method: method || 'GET',
        headers: requestHeaders,
      })

      return res.ok
    } catch {
      return false
    }
  }
}
