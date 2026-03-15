import sharp from 'sharp'
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
   * 处理封面图
   * @param imagePath 原始图片路径
   * @param platformType 平台类型
   * @returns 处理后的图片路径
   */
  async processCoverImage(imagePath: string, platformType?: string): Promise<string> {
    // 获取目标尺寸
    const targetSize = platformType 
      ? ImageProcessor.PLATFORM_SIZES[platformType] || ImageProcessor.DEFAULT_SIZE
      : ImageProcessor.DEFAULT_SIZE

    // 生成输出路径
    const ext = path.extname(imagePath)
    const baseName = path.basename(imagePath, ext)
    const outputDir = path.dirname(imagePath)
    const outputPath = path.join(outputDir, `${baseName}_processed${ext}`)

    try {
      // 使用 sharp 处理图片
      await sharp(imagePath)
        .resize(targetSize.width, targetSize.height, {
          fit: 'cover',        // 裁剪模式：保持比例，填充整个区域
          position: 'center',  // 从中心裁剪
        })
        .jpeg({
          quality: 85,         // JPEG 质量
          progressive: true,   // 渐进式 JPEG
        })
        .toFile(outputPath)

      console.log(`Image processed: ${imagePath} -> ${outputPath}`)
      console.log(`Target size: ${targetSize.width}x${targetSize.height}`)

      return outputPath
    } catch (error) {
      console.error('Image processing error:', error)
      throw new Error('图片处理失败')
    }
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
      try {
        const processedPath = await this.processCoverImage(imagePath, platformType)
        results[platformType] = processedPath
      } catch (error) {
        console.error(`Failed to process image for ${platformType}:`, error)
        results[platformType] = imagePath  // 失败时返回原图
      }
    }

    return results
  }

  /**
   * 检查图片是否符合平台要求
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
      const metadata = await sharp(imagePath).metadata()
      const currentWidth = metadata.width || 0
      const currentHeight = metadata.height || 0

      // 检查文件大小（不能超过 2MB）
      const stats = fs.statSync(imagePath)
      if (stats.size > 2 * 1024 * 1024) {
        return {
          valid: false,
          message: '图片大小不能超过 2MB',
          currentSize: { width: currentWidth, height: currentHeight },
        }
      }

      // 检查尺寸
      const requiredSize = platformType 
        ? ImageProcessor.PLATFORM_SIZES[platformType]
        : null

      if (requiredSize) {
        // 如果图片尺寸与要求相差太大，提示需要裁剪
        const widthDiff = Math.abs(currentWidth - requiredSize.width) / requiredSize.width
        const heightDiff = Math.abs(currentHeight - requiredSize.height) / requiredSize.height

        if (widthDiff > 0.2 || heightDiff > 0.2) {
          return {
            valid: true,  // 仍然有效，但建议裁剪
            message: `建议裁剪为 ${requiredSize.width}x${requiredSize.height} 像素`,
            currentSize: { width: currentWidth, height: currentHeight },
            requiredSize,
          }
        }
      }

      return {
        valid: true,
        currentSize: { width: currentWidth, height: currentHeight },
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
    for (const path of processedPaths) {
      try {
        if (fs.existsSync(path) && path.includes('_processed')) {
          fs.unlinkSync(path)
          console.log('Cleaned up:', path)
        }
      } catch (error) {
        console.error('Failed to cleanup:', path, error)
      }
    }
  }
}

export const imageProcessor = new ImageProcessor()
