import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export interface ScheduledTask {
  id?: number
  article_id: number
  platform_ids: number[]
  scheduled_time: string  // ISO 8601 格式
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  created_at?: string
  executed_at?: string
  error_message?: string
}

export class TaskScheduler {
  private tasksPath: string
  private tasks: ScheduledTask[] = []
  private nextId: number = 1
  private checkInterval: NodeJS.Timeout | null = null
  private onExecuteTask: (task: ScheduledTask) => Promise<void>

  constructor(onExecuteTask: (task: ScheduledTask) => Promise<void>) {
    this.tasksPath = path.join(app.getPath('userData'), 'scheduled-tasks.json')
    this.onExecuteTask = onExecuteTask
    this.loadTasks()
    this.startScheduler()
  }

  private loadTasks(): void {
    if (fs.existsSync(this.tasksPath)) {
      try {
        const content = fs.readFileSync(this.tasksPath, 'utf-8')
        this.tasks = JSON.parse(content)
        this.nextId = Math.max(0, ...this.tasks.map(t => t.id || 0)) + 1
        // 清理已完成的任务（保留7天）
        this.cleanupOldTasks()
      } catch {
        this.tasks = []
      }
    }
  }

  private saveTasks(): void {
    fs.writeFileSync(this.tasksPath, JSON.stringify(this.tasks, null, 2))
  }

  private cleanupOldTasks(): void {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    this.tasks = this.tasks.filter(task => {
      if (task.status === 'completed' || task.status === 'cancelled') {
        const executedAt = task.executed_at ? new Date(task.executed_at) : null
        return !executedAt || executedAt > sevenDaysAgo
      }
      return true
    })
  }

  private startScheduler(): void {
    // 每分钟检查一次
    this.checkInterval = setInterval(() => {
      this.checkAndExecuteTasks()
    }, 60000)
    
    // 立即检查一次
    this.checkAndExecuteTasks()
  }

  private async checkAndExecuteTasks(): Promise<void> {
    const now = new Date()
    const pendingTasks = this.tasks.filter(
      task => task.status === 'pending' && new Date(task.scheduled_time) <= now
    )

    for (const task of pendingTasks) {
      console.log('Executing scheduled task:', task.id)
      try {
        await this.onExecuteTask(task)
        task.status = 'completed'
        task.executed_at = new Date().toISOString()
      } catch (error: any) {
        console.error('Task execution failed:', error)
        task.status = 'failed'
        task.error_message = error.message
        task.executed_at = new Date().toISOString()
      }
      this.saveTasks()
    }
  }

  addTask(task: Omit<ScheduledTask, 'id' | 'created_at'>): ScheduledTask {
    const newTask: ScheduledTask = {
      ...task,
      id: this.nextId++,
      created_at: new Date().toISOString(),
    }
    this.tasks.push(newTask)
    this.saveTasks()
    return newTask
  }

  cancelTask(taskId: number): boolean {
    const task = this.tasks.find(t => t.id === taskId)
    if (task && task.status === 'pending') {
      task.status = 'cancelled'
      task.executed_at = new Date().toISOString()
      this.saveTasks()
      return true
    }
    return false
  }

  getTasks(articleId?: number): ScheduledTask[] {
    let tasks = [...this.tasks]
    if (articleId) {
      tasks = tasks.filter(t => t.article_id === articleId)
    }
    return tasks.sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
  }

  getPendingTasks(): ScheduledTask[] {
    return this.tasks
      .filter(t => t.status === 'pending')
      .sort((a, b) => 
        new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
      )
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}
