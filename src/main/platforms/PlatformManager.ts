import { WeChatOfficialPlatform } from './adapters/WeChatOfficialPlatform'
import { ZhihuPlatform } from './adapters/ZhihuPlatform'
import { ToutiaoPlatform } from './adapters/ToutiaoPlatform'
import { JianshuPlatform } from './adapters/JianshuPlatform'
import { CSDNPlatform } from './adapters/CSDNPlatform'
import { JuejinPlatform } from './adapters/JuejinPlatform'
import { BaijiahaoPlatform } from './adapters/BaijiahaoPlatform'
import { SohuPlatform } from './adapters/SohuPlatform'
import { NeteasePlatform } from './adapters/NeteasePlatform'
import { CookiePlatform } from './adapters/CookiePlatform'
import { CustomPlatform } from './adapters/CustomPlatform'
import { CustomWebsitePlatform } from './adapters/CustomWebsitePlatform'

export interface PlatformConfig {
  type: string
  name: string
  icon: string
  fields: {
    name: string
    label: string
    type: 'text' | 'password' | 'textarea'
    required: boolean
    placeholder?: string
    help?: string
  }[]
  features: {
    supportHTML: boolean
    supportMarkdown: boolean
    supportImage: boolean
    supportVideo: boolean
    maxTitleLength: number
    maxContentLength: number
  }
}

export interface PublishResult {
  success: boolean
  message?: string
  url?: string
  platformPostId?: string
}

export interface PlatformAdapter {
  config: PlatformConfig
  publish(title: string, content: string, options: any): Promise<PublishResult>
  testConnection(credentials: any): Promise<boolean | { success: boolean; message?: string }>
}

export class PlatformManager {
  private adapters: Map<string, PlatformAdapter> = new Map()

  constructor() {
    this.registerAdapters()
  }

  private registerAdapters() {
    this.adapters.set('wechat_official', new WeChatOfficialPlatform())
    this.adapters.set('zhihu', new ZhihuPlatform())
    this.adapters.set('toutiao', new ToutiaoPlatform())
    this.adapters.set('jianshu', new JianshuPlatform())
    this.adapters.set('csdn', new CSDNPlatform())
    this.adapters.set('juejin', new JuejinPlatform())
    this.adapters.set('baijiahao', new BaijiahaoPlatform())
    this.adapters.set('sohu', new SohuPlatform())
    this.adapters.set('netease', new NeteasePlatform())
    
    // 使用通用 Cookie 平台适配器的平台
    this.adapters.set('sina', new CookiePlatform({
      type: 'sina',
      name: '新浪看点',
      icon: 'sina',
      apiBase: 'https://mp.sina.com.cn',
      publishEndpoint: '/api/article/publish',
      testEndpoint: '/api/user/info',
      maxTitleLength: 100,
      maxContentLength: 200000,
    }))
    
    this.adapters.set('qq', new CookiePlatform({
      type: 'qq',
      name: '企鹅号',
      icon: 'qq',
      apiBase: 'https://om.qq.com',
      publishEndpoint: '/api/article/publish',
      testEndpoint: '/api/user/info',
      maxTitleLength: 100,
      maxContentLength: 200000,
    }))
    
    this.adapters.set('dayu', new CookiePlatform({
      type: 'dayu',
      name: '大鱼号',
      icon: 'dayu',
      apiBase: 'https://mp.dayu.com',
      publishEndpoint: '/api/article/publish',
      testEndpoint: '/api/user/info',
      maxTitleLength: 100,
      maxContentLength: 200000,
    }))
    
    this.adapters.set('yidian', new CookiePlatform({
      type: 'yidian',
      name: '一点资讯',
      icon: 'yidian',
      apiBase: 'https://mp.yidianzixun.com',
      publishEndpoint: '/api/article/publish',
      testEndpoint: '/api/user/info',
      maxTitleLength: 100,
      maxContentLength: 200000,
    }))
    
    this.adapters.set('cnblogs', new CookiePlatform({
      type: 'cnblogs',
      name: '博客园',
      icon: 'cnblogs',
      apiBase: 'https://i.cnblogs.com',
      publishEndpoint: '/api/posts/create',
      testEndpoint: '/api/user',
      maxTitleLength: 100,
      maxContentLength: 200000,
    }))
    
    // 自定义网站平台
    this.adapters.set('custom_website', new CustomWebsitePlatform())
    
    this.adapters.set('custom', new CustomPlatform())
  }

  getSupportedPlatforms(): PlatformConfig[] {
    return Array.from(this.adapters.values()).map(adapter => adapter.config)
  }

  getPlatformConfig(platformType: string): PlatformConfig | null {
    const adapter = this.adapters.get(platformType)
    return adapter ? adapter.config : null
  }

  getAdapter(platformType: string): PlatformAdapter | null {
    return this.adapters.get(platformType) || null
  }

  async publishToPlatform(
    platformType: string,
    title: string,
    content: string,
    options: any
  ): Promise<PublishResult> {
    const adapter = this.adapters.get(platformType)
    if (!adapter) {
      return { success: false, message: '不支持的平台类型' }
    }

    try {
      return await adapter.publish(title, content, options)
    } catch (error: any) {
      return { success: false, message: error.message || '发布失败' }
    }
  }

  async testPlatformConnection(platformType: string, credentials: any): Promise<{ success: boolean; message?: string }> {
    const adapter = this.adapters.get(platformType)
    if (!adapter) {
      return { success: false, message: '不支持的平台类型' }
    }

    try {
      const result = await adapter.testConnection(credentials)
      // 兼容旧的返回格式（boolean）和新的返回格式（object）
      if (typeof result === 'boolean') {
        return { success: result }
      }
      return result
    } catch (error: any) {
      return { success: false, message: error.message || '测试连接失败' }
    }
  }
}
