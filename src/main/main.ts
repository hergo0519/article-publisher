import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import path from 'path'
import { DatabaseManager } from './database/DatabaseManager'
import { PlatformManager } from './platforms/PlatformManager'
import { PublishService } from './services/PublishService'
import { imageProcessor } from './services/ImageProcessor'
import { TaskScheduler } from './services/TaskScheduler'

let mainWindow: BrowserWindow | null = null
let dbManager: DatabaseManager
let platformManager: PlatformManager
let publishService: PublishService
let taskScheduler: TaskScheduler

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  })

  // 加载渲染进程
  const rendererPath = path.join(__dirname, 'renderer', 'index.html')
  console.log('Loading renderer from:', rendererPath)
  
  // 使用绝对路径
  const absolutePath = path.resolve(rendererPath)
  console.log('Absolute path:', absolutePath)
  
  // 加载文件
  mainWindow.loadFile(absolutePath).then(() => {
    console.log('Loaded successfully')
  }).catch((err: any) => {
    console.error('Failed to load:', err)
  })
  
  // 监听加载完成
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading')
    console.log('Current URL:', mainWindow?.webContents.getURL())
  })
  
  // 生产环境不打开开发者工具
  // mainWindow.webContents.openDevTools()

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // 设置中文菜单
  setChineseMenu()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 设置中文菜单
function setChineseMenu() {
  const template: any[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建文章',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-article')
          }
        },
        {
          label: '保存文章',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu-save-article')
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
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
        { label: '全选', role: 'selectall' }
      ]
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
        { label: '全屏', role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '关闭', role: 'close' }
      ]
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
              detail: '版本: 1.0.0\n开发者: 合果科技\n官网: www.hergo.com.cn'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(async () => {
  // 初始化数据库
  dbManager = new DatabaseManager()
  await dbManager.init()

  // 初始化平台管理器
  platformManager = new PlatformManager()

  // 初始化发布服务
  publishService = new PublishService(dbManager, platformManager)

  // 初始化定时任务调度器
  taskScheduler = new TaskScheduler(async (task) => {
    console.log('Executing scheduled task:', task.id)
    try {
      const results = await publishService.publishArticle(task.article_id, task.platform_ids)
      console.log('Scheduled publish results:', results)
      
      // 可以在这里添加通知逻辑
      const successCount = results.filter((r: any) => r.success).length
      console.log(`Scheduled publish completed: ${successCount}/${results.length} succeeded`)
    } catch (error) {
      console.error('Scheduled publish failed:', error)
      throw error
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC 处理器
ipcMain.handle('db:getPlatforms', () => {
  return dbManager.getPlatforms()
})

ipcMain.handle('db:addPlatform', (_, platform) => {
  return dbManager.addPlatform(platform)
})

ipcMain.handle('db:updatePlatform', (_, id, platform) => {
  return dbManager.updatePlatform(id, platform)
})

ipcMain.handle('db:deletePlatform', (_, id) => {
  return dbManager.deletePlatform(id)
})

ipcMain.handle('db:getAccounts', (_, platformId) => {
  return dbManager.getAccounts(platformId)
})

ipcMain.handle('db:addAccount', (_, account) => {
  return dbManager.addAccount(account)
})

ipcMain.handle('db:updateAccount', (_, id, account) => {
  return dbManager.updateAccount(id, account)
})

ipcMain.handle('db:deleteAccount', (_, id) => {
  return dbManager.deleteAccount(id)
})

ipcMain.handle('db:getArticles', () => {
  return dbManager.getArticles()
})

ipcMain.handle('db:addArticle', (_, article) => {
  return dbManager.addArticle(article)
})

ipcMain.handle('db:updateArticle', (_, id, article) => {
  return dbManager.updateArticle(id, article)
})

ipcMain.handle('db:deleteArticle', (_, id) => {
  return dbManager.deleteArticle(id)
})

ipcMain.handle('db:getPublishHistory', (_, articleId) => {
  return dbManager.getPublishHistory(articleId)
})

// 发布相关
ipcMain.handle('publish:publishArticle', async (_, articleId, platformIds) => {
  return publishService.publishArticle(articleId, platformIds)
})

ipcMain.handle('publish:testConnection', async (_, platformId, accountId) => {
  return publishService.testConnection(platformId, accountId)
})

// 平台相关
ipcMain.handle('platform:getSupportedPlatforms', () => {
  return platformManager.getSupportedPlatforms()
})

ipcMain.handle('platform:getPlatformConfig', (_, platformType) => {
  return platformManager.getPlatformConfig(platformType)
})

// 文件对话框
ipcMain.handle('dialog:selectImage', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
    ],
  })
  return result.filePaths[0] || null
})

ipcMain.handle('dialog:saveFile', async (_, defaultPath) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
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
ipcMain.handle('app:getInfo', () => {
  return {
    version: app.getVersion(),
    name: '文章多平台发布助手',
    company: '合果科技',
    website: 'www.hergo.com.cn',
  }
})

// 图片处理
ipcMain.handle('image:process', async (_, imagePath: string, platformType?: string) => {
  try {
    const processedPath = await imageProcessor.processCoverImage(imagePath, platformType)
    return { success: true, path: processedPath }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('image:validate', async (_, imagePath: string, platformType?: string) => {
  return await imageProcessor.validateImage(imagePath, platformType)
})

// 定时任务
ipcMain.handle('schedule:addTask', async (_, task) => {
  return taskScheduler.addTask(task)
})

ipcMain.handle('schedule:cancelTask', async (_, taskId: number) => {
  return taskScheduler.cancelTask(taskId)
})

ipcMain.handle('schedule:getTasks', async (_, articleId?: number) => {
  return taskScheduler.getTasks(articleId)
})

ipcMain.handle('schedule:getPendingTasks', async () => {
  return taskScheduler.getPendingTasks()
})
