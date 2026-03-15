import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  // 数据库操作
  db: {
    getPlatforms: () => Promise<any[]>
    addPlatform: (platform: any) => Promise<any>
    updatePlatform: (id: number, platform: any) => Promise<any>
    deletePlatform: (id: number) => Promise<void>
    getAccounts: (platformId: number) => Promise<any[]>
    addAccount: (account: any) => Promise<any>
    updateAccount: (id: number, account: any) => Promise<any>
    deleteAccount: (id: number) => Promise<void>
    getArticles: () => Promise<any[]>
    addArticle: (article: any) => Promise<any>
    updateArticle: (id: number, article: any) => Promise<any>
    deleteArticle: (id: number) => Promise<void>
    getPublishHistory: (articleId: number) => Promise<any[]>
  }
  // 发布服务
  publish: {
    publishArticle: (articleId: number, platformIds: number[]) => Promise<any>
    testConnection: (platformId: number, accountId: number) => Promise<any>
  }
  // 平台管理
  platform: {
    getSupportedPlatforms: () => Promise<any[]>
    getPlatformConfig: (platformType: string) => Promise<any>
  }
  // 对话框
  dialog: {
    selectImage: () => Promise<string | null>
    saveFile: (defaultPath: string) => Promise<string | null>
  }
  // 应用信息
  app: {
    getInfo: () => Promise<{
      version: string
      name: string
      company: string
      website: string
    }>
  }
  // 图片处理
  image: {
    process: (imagePath: string, platformType?: string) => Promise<{ success: boolean; path?: string; error?: string }>
    validate: (imagePath: string, platformType?: string) => Promise<any>
  }
  // 定时任务
  schedule: {
    addTask: (task: any) => Promise<any>
    cancelTask: (taskId: number) => Promise<boolean>
    getTasks: (articleId?: number) => Promise<any[]>
    getPendingTasks: () => Promise<any[]>
  }
}

const api: ElectronAPI = {
  db: {
    getPlatforms: () => ipcRenderer.invoke('db:getPlatforms'),
    addPlatform: (platform) => ipcRenderer.invoke('db:addPlatform', platform),
    updatePlatform: (id, platform) => ipcRenderer.invoke('db:updatePlatform', id, platform),
    deletePlatform: (id) => ipcRenderer.invoke('db:deletePlatform', id),
    getAccounts: (platformId) => ipcRenderer.invoke('db:getAccounts', platformId),
    addAccount: (account) => ipcRenderer.invoke('db:addAccount', account),
    updateAccount: (id, account) => ipcRenderer.invoke('db:updateAccount', id, account),
    deleteAccount: (id) => ipcRenderer.invoke('db:deleteAccount', id),
    getArticles: () => ipcRenderer.invoke('db:getArticles'),
    addArticle: (article) => ipcRenderer.invoke('db:addArticle', article),
    updateArticle: (id, article) => ipcRenderer.invoke('db:updateArticle', id, article),
    deleteArticle: (id) => ipcRenderer.invoke('db:deleteArticle', id),
    getPublishHistory: (articleId) => ipcRenderer.invoke('db:getPublishHistory', articleId),
  },
  publish: {
    publishArticle: (articleId, platformIds) => ipcRenderer.invoke('publish:publishArticle', articleId, platformIds),
    testConnection: (platformId, accountId) => ipcRenderer.invoke('publish:testConnection', platformId, accountId),
  },
  platform: {
    getSupportedPlatforms: () => ipcRenderer.invoke('platform:getSupportedPlatforms'),
    getPlatformConfig: (platformType) => ipcRenderer.invoke('platform:getPlatformConfig', platformType),
  },
  dialog: {
    selectImage: () => ipcRenderer.invoke('dialog:selectImage'),
    saveFile: (defaultPath) => ipcRenderer.invoke('dialog:saveFile', defaultPath),
  },
  app: {
    getInfo: () => ipcRenderer.invoke('app:getInfo'),
  },
  image: {
    process: (imagePath, platformType) => ipcRenderer.invoke('image:process', imagePath, platformType),
    validate: (imagePath, platformType) => ipcRenderer.invoke('image:validate', imagePath, platformType),
  },
  schedule: {
    addTask: (task: any) => ipcRenderer.invoke('schedule:addTask', task),
    cancelTask: (taskId: number) => ipcRenderer.invoke('schedule:cancelTask', taskId),
    getTasks: (articleId?: number) => ipcRenderer.invoke('schedule:getTasks', articleId),
    getPendingTasks: () => ipcRenderer.invoke('schedule:getPendingTasks'),
  },
}

contextBridge.exposeInMainWorld('electronAPI', api)
