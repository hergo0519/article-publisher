import { app } from 'electron'
import path from 'path'
import fs from 'fs'

/**
 * 简单的日志工具
 */
class Logger {
  private logPath: string
  private maxSize: number = 10 * 1024 * 1024 // 10MB

  constructor() {
    this.logPath = path.join(app.getPath('userData'), 'app.log')
  }

  private write(level: string, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString()
    const argsStr = args.length > 0 ? ' ' + args.map(a => 
      typeof a === 'object' ? JSON.stringify(a) : String(a)
    ).join(' ') : ''
    
    const logLine = `[${timestamp}] [${level}] ${message}${argsStr}\n`
    
    // 写入文件
    try {
      this.rotateIfNeeded()
      fs.appendFileSync(this.logPath, logLine)
    } catch {
      // 忽略写入错误
    }
    
    // 控制台输出
    if (level === 'ERROR') {
      console.error(logLine.trim())
    } else if (level === 'WARN') {
      console.warn(logLine.trim())
    } else {
      console.log(logLine.trim())
    }
  }

  private rotateIfNeeded(): void {
    try {
      const stats = fs.statSync(this.logPath)
      if (stats.size > this.maxSize) {
        const backupPath = `${this.logPath}.old`
        fs.renameSync(this.logPath, backupPath)
      }
    } catch {
      // 文件不存在，忽略
    }
  }

  info(message: string, ...args: any[]): void {
    this.write('INFO', message, ...args)
  }

  warn(message: string, ...args: any[]): void {
    this.write('WARN', message, ...args)
  }

  error(message: string, ...args: any[]): void {
    this.write('ERROR', message, ...args)
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      this.write('DEBUG', message, ...args)
    }
  }
}

export const logger = new Logger()
