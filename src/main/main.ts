import { app, BrowserWindow, ipcMain, dialog, Menu, nativeImage } from 'electron'
import path from 'path'
import { DatabaseManager } from './database/DatabaseManager'
import { PlatformManager } from './platforms/PlatformManager'
import { PublishService } from './services/PublishService'
import { imageProcessor } from './services/ImageProcessor'
import { TaskScheduler } from './services/TaskScheduler'
import { logger } from './utils/logger'

// 全局实例
let mainWindow: BrowserWindow | null = null
let dbManager: DatabaseManager | null = null
let platformManager: PlatformManager | null = null
let publishService: PublishService | null = null
let taskScheduler: TaskScheduler | null = null

const isDev = process.env.NODE_ENV === 'development'

/**
 * 创建主窗口
 */
function createWindow(): void {
  const iconPath = path.join(__dirname, '../../assets/icon.png')
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
    icon: nativeImage.createFromPath(iconPath),
  })

  // 加载渲染进程
  const rendererPath = path.join(__dirname, 'renderer', 'index.html')
  const absolutePath = path.resolve(rendererPath)
  
  logger.info('Loading renderer from:', absolutePath)
  
  mainWindow.loadFile(absolutePath).catch((err: Error) => {
    logger.error('Failed to load renderer:', err)
  })
  
  // 开发环境打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    if (isDev) {
      mainWindow?.webContents.openDevTools()
    }
  })

  // 设置应用菜单
  setApplicationMenu()

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 处理窗口崩溃
  mainWindow.webContents.on('crashed', () => {
    logger.error('Renderer process crashed')
    dialog.showErrorBox('应用错误', '渲染进程崩溃，请重启应用')
  })

  mainWindow.webContents.on('unresponsive', () => {
    logger.warn('Renderer process unresponsive')
  })
}

/**
 * 设置应用菜单
 */
function setApplicationMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建文章',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendToRenderer('menu-new-article'),
        },
        {
          label: '保存文章',
          accelerator: 'CmdOrCtrl+S',
          click: () => sendToRenderer('menu-save-article'),
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '全选', role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '刷新', role: 'reload' },
        { label: '强制刷新', role: 'forceReload' },
        { type: 'separator' },
        { label: '开发者工具', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', role: 'resetZoom' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', role: 'togglefullscreen' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '关闭', role: 'close' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于',
              message: '文章多平台发布助手',
              detail: `版本: ${app.getVersion()}\n开发者: 合果科技\n官网: www.hergo.com.cn`,
              icon: nativeImage.createFromPath(path.join(__dirname, '../../assets/icon.png')),
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

/**
 * 发送消息到渲染进程
 */
function sendToRenderer(channel: string, ...args: any[]): void {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send(channel, ...args)
  }
}

/**
 * 初始化服务
 */
async function initializeServices(): Promise<void> {
  try {
    // 初始化数据库
    dbManager = new DatabaseManager()
    await dbManager.init()
    logger.info('Database initialized')

    // 初始化平台管理器
    platformManager = new PlatformManager()
    logger.info('Platform manager initialized')

    // 初始化发布服务
    publishService = new PublishService(dbManager, platformManager)
    logger.info('Publish service initialized')

    // 初始化定时任务调度器
    taskScheduler = new TaskScheduler(async (task) => {
      logger.info('Executing scheduled task:', task.id)
      try {
        if (!publishService) throw new Error('Publish service not initialized')
        const results = await publishService.publishArticle(task.article_id, task.platform_ids)
        
        const successCount = results.filter((r) => r.success).length
        logger.info(`Scheduled publish completed: ${successCount}/${results.length} succeeded`)
        
        // TODO: 发送系统通知
      } catch (error) {
        logger.error('Scheduled publish failed:', error)
        throw error
      }
    })
    logger.info('Task scheduler initialized')
  } catch (error) {
    logger.error('Failed to initialize services:', error)
    throw error
  }
}

/**
 * 清理资源
 */
async function cleanup(): Promise<void> {
  logger.info('Cleaning up resources...')
  
  if (taskScheduler) {
    taskScheduler.destroy()
    taskScheduler = null
  }
  
  if (dbManager) {
    await dbManager.close()
    dbManager = null
  }
  
  platformManager = null
  publishService = null
}

// ==================== 应用生命周期 ====================

app.whenReady().then(async () => {
  try {
    await initializeServices()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  } catch (error) {
    logger.error('Failed to start application:', error)
    dialog.showErrorBox('启动错误', '应用启动失败，请检查日志')
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async (event) => {
  event.preventDefault()
  await cleanup()
  app.exit()
})

// 防止多开
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  logger.warn('Another instance is already running')
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// ==================== IPC 处理器 ====================

// 数据库操作
ipcMain.handle('db:getPlatforms', () => dbManager?.getPlatforms() ?? [])
ipcMain.handle('db:addPlatform', (_, platform) => dbManager?.addPlatform(platform))
ipcMain.handle('db:updatePlatform', (_, id, platform) => dbManager?.updatePlatform(id, platform))
ipcMain.handle('db:deletePlatform', (_, id) => dbManager?.deletePlatform(id))

ipcMain.handle('db:getAccounts', (_, platformId) => dbManager?.getAccounts(platformId) ?? [])
ipcMain.handle('db:addAccount', (_, account) => dbManager?.addAccount(account))
ipcMain.handle('db:updateAccount', (_, id, account) => dbManager?.updateAccount(id, account))
ipcMain.handle('db:deleteAccount', (_, id) => dbManager?.deleteAccount(id))

ipcMain.handle('db:getArticles', () => dbManager?.getArticles() ?? [])
ipcMain.handle('db:addArticle', (_, article) => dbManager?.addArticle(article))
ipcMain.handle('db:updateArticle', (_, id, article) => dbManager?.updateArticle(id, article))
ipcMain.handle('db:deleteArticle', (_, id) => dbManager?.deleteArticle(id))

ipcMain.handle('db:getPublishHistory', (_, articleId) => dbManager?.getPublishHistory(articleId) ?? [])

// 发布相关
ipcMain.handle('publish:publishArticle', async (_, articleId, platformIds) => {
  if (!publishService) throw new Error('Publish service not initialized')
  return publishService.publishArticle(articleId, platformIds)
})

ipcMain.handle('publish:testConnection', async (_, platformId, accountId) => {
  if (!publishService) throw new Error('Publish service not initialized')
  return publishService.testConnection(platformId, accountId)
})

// 平台相关
ipcMain.handle('platform:getSupportedPlatforms', () => platformManager?.getSupportedPlatforms() ?? [])
ipcMain.handle('platform:getPlatformConfig', (_, platformType) => platformManager?.getPlatformConfig(platformType))

// 文件对话框
ipcMain.handle('dialog:selectImage', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
    ],
  })
  return result.filePaths[0] || null
})

ipcMain.handle('dialog:saveFile', async (_, defaultPath) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'HTML', extensions: ['html'] },
      { name: '文本文件', extensions: ['txt'] },
    ],
  })
  return result.filePath || null
})

// 获取应用信息
ipcMain.handle('app:getInfo', () => ({
  version: app.getVersion(),
  name: '文章多平台发布助手',
  company: '合果科技',
  website: 'www.hergo.com.cn',
}))

// 图片处理
ipcMain.handle('image:process', async (_, imagePath: string, platformType?: string) => {
  try {
    const processedPath = await imageProcessor.processCoverImage(imagePath, platformType)
    return { success: true, path: processedPath }
  } catch (error) {
    logger.error('Image processing failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('image:validate', async (_, imagePath: string, platformType?: string) => {
  return imageProcessor.validateImage(imagePath, platformType)
})

// 定时任务
ipcMain.handle('schedule:addTask', async (_, task) => {
  if (!taskScheduler) throw new Error('Task scheduler not initialized')
  return taskScheduler.addTask(task)
})

ipcMain.handle('schedule:cancelTask', async (_, taskId: number) => {
  if (!taskScheduler) throw new Error('Task scheduler not initialized')
  return taskScheduler.cancelTask(taskId)
})

ipcMain.handle('schedule:getTasks', async (_, articleId?: number) => {
  if (!taskScheduler) throw new Error('Task scheduler not initialized')
  return taskScheduler.getTasks(articleId)
})

ipcMain.handle('schedule:getPendingTasks', async () => {
  if (!taskScheduler) throw new Error('Task scheduler not initialized')
  return taskScheduler.getPendingTasks()
})
