# 架构说明

## 技术栈

- 微信小程序原生开发
- TypeScript
- WXML
- WXSS
- Cloudflare Workers + D1 内容接口
- 本地持久化：`wx.setStorageSync` / `wx.getStorageSync`

补充工具链：

- `tsx`：运行 Node 侧 TypeScript 测试
- `typescript`：类型检查
- `@types/node`：测试与脚本环境类型
- `wrangler`：Cloudflare Workers / D1 本地开发与迁移

## 应用入口

- [app.ts](/Users/bytedance/projects/swiftie-mini/app.ts)：挂载全局 `userProfile`
- [app.json](/Users/bytedance/projects/swiftie-mini/app.json)：页面注册、Tab 配置、全局窗口样式
- [app.wxss](/Users/bytedance/projects/swiftie-mini/app.wxss)：全局背景、`.container`、`.card` 与基础文字样式

## 页面结构

### Tab

- 首页：`pages/home/index`
- 巡演：`pages/tour/index`
- 资料馆：`pages/library/index`
- 我的：`pages/profile/index`

### 资料馆相关页面

- `pages/album/index`
- `pages/song/index`
- `pages/song-list/index`
- `pages/performance/index`
- `pages/documentary/index`
- `pages/favorites/index`
- `pages/video/player/index`

### Era 展厅页面

- `pages/era/detail/index`

### 巡演相关页面

- `pages/tour/detail/index`
- `pages/show/detail/index`
- `pages/guide/index`
- `pages/video/upload/index`

## 目录职责

- `pages/`：页面生命周期、交互和视图状态
- `services/`：远程请求、接口封装和内容缓存层
- `scripts/`：本地运维脚本，例如 YouTube 下载、R2 增量同步和封面抽帧流水线
- `server/`：Cloudflare Workers 服务端与 D1 schema
- `types/`：领域类型定义
- `utils/storage.ts`：本地持久化读写
- `utils/constants.ts`：路由、存储 key 和默认常量

## 关键实现入口

### 首页与资料馆

- [pages/home/index.ts](/Users/bytedance/projects/swiftie-mini/pages/home/index.ts)：首页远程加载 `GET /home`
- [pages/library/index.ts](/Users/bytedance/projects/swiftie-mini/pages/library/index.ts)：资料馆入口聚合页
- [pages/album/index.ts](/Users/bytedance/projects/swiftie-mini/pages/album/index.ts)：专辑列表/详情双态，远程加载专辑与歌曲
- [pages/song-list/index.ts](/Users/bytedance/projects/swiftie-mini/pages/song-list/index.ts)：歌曲列表页，远程加载全部歌曲与专辑名映射
- [pages/favorites/index.ts](/Users/bytedance/projects/swiftie-mini/pages/favorites/index.ts)：收藏列表页，远程加载歌曲并结合本地收藏 id 过滤
- [pages/song/index.ts](/Users/bytedance/projects/swiftie-mini/pages/song/index.ts)：歌曲详情、收藏、本地歌词展示与远程视频关联内容
- [pages/performance/index.ts](/Users/bytedance/projects/swiftie-mini/pages/performance/index.ts)：资料馆 Live 视频列表，跳转独立播放器
- [pages/video/player/index.ts](/Users/bytedance/projects/swiftie-mini/pages/video/player/index.ts)：独立视频播放页，按 `performanceId` 加载视频

### Era 展厅

- [pages/era/detail/index.ts](/Users/bytedance/projects/swiftie-mini/pages/era/detail/index.ts)：Era 展厅详情页控制器，负责远程加载、空态、失败态和可点击模态复用
- [services/contentStore.ts](/Users/bytedance/projects/swiftie-mini/services/contentStore.ts)：Era 详情页组合 `era + album + performances`

### 巡演

- [pages/tour/index.ts](/Users/bytedance/projects/swiftie-mini/pages/tour/index.ts)：巡演首页远程聚合
- [pages/tour/detail/index.ts](/Users/bytedance/projects/swiftie-mini/pages/tour/detail/index.ts)：巡演状态、进度条、场次列表
- [pages/show/detail/index.ts](/Users/bytedance/projects/swiftie-mini/pages/show/detail/index.ts)：场次详情、票务信息和视频列表
- [pages/guide/index.ts](/Users/bytedance/projects/swiftie-mini/pages/guide/index.ts)：Checklist 交互
- [pages/video/upload/index.ts](/Users/bytedance/projects/swiftie-mini/pages/video/upload/index.ts)：mock 上传流程

### 个人页

- [pages/profile/index.ts](/Users/bytedance/projects/swiftie-mini/pages/profile/index.ts)：用户资料缓存与收藏概览

## 实现边界

- 页面层优先消费 `services/contentStore.ts`，而不是在页面内部直接拼装复杂业务数据
- `pages/library/index.ts` 仍保持静态入口，不发请求
- 公开内容页面现在默认走远程 API；请求失败显示统一失败态，不再回退到运行时 mock
- 收藏、用户资料缓存、抢票助手 Checklist 仍然保留本地存储
