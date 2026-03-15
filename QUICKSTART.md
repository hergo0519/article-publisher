# 快速开始

## 安装依赖

```bash
npm install
```

## 开发模式

```bash
# 同时启动主进程和渲染进程
npm run dev
```

## 构建

```bash
# 构建主进程和渲染进程
npm run build
```

## 打包发布

```bash
# 打包 Windows 版本
npm run dist:win

# 打包 macOS 版本
npm run dist:mac

# 打包 Linux 版本
npm run dist:linux

# 打包所有平台
npm run dist
```

## 项目结构

```
article-publisher/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── main.ts        # 主入口
│   │   ├── preload.ts     # 预加载脚本
│   │   ├── database/      # 数据库管理
│   │   ├── platforms/     # 平台适配器
│   │   └── services/      # 业务服务
│   ├── renderer/          # 渲染进程 (React)
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 通用组件
│   │   ├── App.tsx        # 应用根组件
│   │   └── main.tsx       # 渲染入口
│   └── types/             # 类型定义
├── assets/                # 静态资源
├── dist/                  # 构建输出
└── release/               # 打包输出
```

## 添加新平台

1. 在 `src/main/platforms/adapters/` 创建适配器
2. 继承 `PlatformAdapter` 接口
3. 在 `PlatformManager` 中注册

示例：

```typescript
import { PlatformAdapter, PlatformConfig, PublishResult } from '../PlatformManager'

export class MyPlatform implements PlatformAdapter {
  config: PlatformConfig = {
    type: 'my_platform',
    name: '我的平台',
    icon: 'myicon',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'text',
        required: true,
      },
    ],
    features: {
      supportHTML: true,
      supportMarkdown: false,
      supportImage: true,
      supportVideo: false,
      maxTitleLength: 100,
      maxContentLength: 100000,
    },
  }

  async publish(title: string, content: string, options: any): Promise<PublishResult> {
    // 实现发布逻辑
    return { success: true, message: '发布成功' }
  }

  async testConnection(credentials: any): Promise<boolean> {
    // 实现连接测试
    return true
  }
}
```

## 技术栈

- **Electron** - 桌面应用框架
- **React** - UI 框架
- **TypeScript** - 类型安全
- **SQLite** - 本地数据库
- **Vite** - 构建工具
