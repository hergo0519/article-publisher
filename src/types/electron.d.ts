export interface ElectronAPI {
  db: {
    getPlatforms: () => Promise<any[]>
    addPlatform: (platform: any) => Promise<any>
    updatePlatform: (id: number, platform: any) => Promise<any>
    deletePlatform: (id: number) => Promise<void>
    getAccounts: (platformId?: number) => Promise<any[]>
    addAccount: (account: any) => Promise<any>
    updateAccount: (id: number, account: any) => Promise<any>
    deleteAccount: (id: number) => Promise<void>
    getArticles: () => Promise<any[]>
    addArticle: (article: any) => Promise<any>
    updateArticle: (id: number, article: any) => Promise<any>
    deleteArticle: (id: number) => Promise<void>
    getPublishHistory: (articleId?: number) => Promise<any[]>
  }
  publish: {
    publishArticle: (articleId: number, platformIds: number[]) => Promise<any[]>
    testConnection: (platformId: number, accountId: number) => Promise<boolean>
  }
  platform: {
    getSupportedPlatforms: () => Promise<any[]>
    getPlatformConfig: (platformType: string) => Promise<any>
  }
  dialog: {
    selectImage: () => Promise<string | null>
    saveFile: (defaultPath: string) => Promise<string | null>
  }
  app: {
    getInfo: () => Promise<{
      version: string
      name: string
      company: string
      website: string
    }>
  }
  image: {
    process: (imagePath: string, platformType?: string) => Promise<{ success: boolean; path?: string; error?: string }>
    validate: (imagePath: string, platformType?: string) => Promise<any>
  }
  schedule: {
    addTask: (task: any) => Promise<any>
    cancelTask: (taskId: number) => Promise<boolean>
    getTasks: (articleId?: number) => Promise<any[]>
    getPendingTasks: () => Promise<any[]>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
