import path from 'path'
import fs from 'fs'

export interface ImageSize {
  width: number
  height: number
}

export class ImageProcessor {
  // 各平台推荐的封面图尺寸
  static readonly PLATFORM_SIZES: { [key: string]: ImageSize } = {
    wechat_official: { width: 900, height: 500 },  // 微信公众号
    zhihu: { width: 690, height: 400 },             // 知乎
    toutiao: { width: 800, height: 450 },           // 今日头条
    baijiahao: { width: 800, height: 450 },         // 百家号
    jianshu: { width: 700, height: 400 },           // 简书
    csdn: { width: 800, height: 450 },              // CSDN
    juejin: { width: 800, height: 450 },            // 掘金
    sohu: { width: 800, height: 450 },              // 搜狐号
    netease: { width: 800, height: 450 },           // 网易号
    sina: { width: 800, height: 450 },              // 新浪看点
    qq: { width: 800, height: 450 },                // 企鹅号
    dayu: { width: 800, height: 450 },              // 大鱼号
    yidian: { width: 800, height: 450 },            // 一点资讯
    cnblogs: { width: 800, height: 450 },           // 博客园
  }

  // 默认尺寸
  static readonly DEFAULT_SIZE: ImageSize = { width: 900, height: 500 }

  /**
   * 处理封面图（简化版，直接返回原图路径）
   * @param imagePath 原始图片路径
   * @param platformType 平台类型
   * @returns 处理后的图片路径
   */
  async processCoverImage(imagePath: string, platformType?: string): Promise<string> {
    // 由于移除了 sharp 依赖，暂时直接返回原图
    // 如需图片处理功能，可后续添加
    console.log(`Image processing skipped (sharp removed): ${imagePath}`)
    return imagePath
  }

  /**
   * 批量处理封面图（为多个平台生成不同尺寸）
   * @param imagePath 原始图片路径
   * @param platformTypes 平台类型数组
   * @returns 各平台对应的图片路径
   */
  async processCoverImageForPlatforms(
    imagePath: string, 
    platformTypes: string[]
  ): Promise<{ [key: string]: string }> {
    const results: { [key: string]: string } = {}

    for (const platformType of platformTypes) {
      // 简化处理，直接返回原图
      results[platformType] = imagePath
    }

    return results
  }

  /**
   * 检查图片是否符合平台要求（简化版）
   * @param imagePath 图片路径
   * @param platformType 平台类型
   * @returns 检查结果
   */
  async validateImage(imagePath: string, platformType?: string): Promise<{
    valid: boolean
    message?: string
    currentSize?: { width: number; height: number }
    requiredSize?: ImageSize
  }> {
    try {
      // 检查文件是否存在
      if (!fs.existsSync(imagePath)) {
        return {
          valid: false,
          message: '图片文件不存在',
        }
      }

      // 检查文件大小（不能超过 2MB）
      const stats = fs.statSync(imagePath)
      if (stats.size > 2 * 1024 * 1024) {
        return {
          valid: false,
          message: '图片大小不能超过 2MB',
        }
      }

      const requiredSize = platformType 
        ? ImageProcessor.PLATFORM_SIZES[platformType]
        : null

      return {
        valid: true,
        requiredSize: requiredSize || undefined,
      }
    } catch (error) {
      return {
        valid: false,
        message: '无法读取图片信息',
      }
    }
  }

  /**
   * 清理临时处理的图片
   * @param processedPaths 处理后的图片路径数组
   */
  cleanup(processedPaths: string[]): void {
    // 简化处理，无需清理
    console.log('Cleanup skipped (sharp removed)')
  }
}

export const imageProcessor = new ImageProcessor()
