# 架构说明

## 技术栈

- 微信小程序原生开发
- TypeScript
- WXML
- WXSS
- 本地 mock 数据驱动
- 本地持久化：`wx.setStorageSync` / `wx.getStorageSync`

补充工具链：

- `tsx`：运行 Node 侧 TypeScript 测试
- `typescript`：类型检查
- `@types/node`：测试与脚本环境类型

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

### Era 展厅页面

- `pages/era/detail/index`

### 巡演相关页面

- `pages/tour/detail/index`
- `pages/show/detail/index`
- `pages/guide/index`
- `pages/video/upload/index`

## 目录职责

- `pages/`：页面生命周期、交互和视图状态
- `data/`：本地 mock 业务数据
- `types/`：领域类型定义
- `utils/selectors.ts`：跨模块通用读取与派生逻辑
- `utils/homeSelectors.ts`：首页专用聚合与派生
- `utils/librarySelectors.ts`：资料馆模块专用视图派生
- `utils/eraSelectors.ts`：Era 展厅详情聚合与跨域内容解析
- `utils/storage.ts`：本地持久化读写
- `utils/constants.ts`：路由、存储 key 和默认常量

## 关键实现入口

### 首页与资料馆

- [pages/home/index.ts](/Users/bytedance/projects/swiftie-mini/pages/home/index.ts)：首页 Hero、Era 卡片与最近动态摘要聚合
- [pages/library/index.ts](/Users/bytedance/projects/swiftie-mini/pages/library/index.ts)：资料馆入口聚合页
- [pages/album/index.ts](/Users/bytedance/projects/swiftie-mini/pages/album/index.ts)：专辑列表/详情双态
- [pages/song/index.ts](/Users/bytedance/projects/swiftie-mini/pages/song/index.ts)：歌曲详情、收藏、歌词、视频 mock 入口

### Era 展厅

- [pages/era/detail/index.ts](/Users/bytedance/projects/swiftie-mini/pages/era/detail/index.ts)：Era 展厅详情页控制器，负责 `id` 路由加载、空态和可点击模态复用
- [utils/eraSelectors.ts](/Users/bytedance/projects/swiftie-mini/utils/eraSelectors.ts)：Era 展厅详情聚合入口，组合 `data/eraExhibits.ts` 与现有 album/song/performance 数据

### 巡演

- [pages/tour/index.ts](/Users/bytedance/projects/swiftie-mini/pages/tour/index.ts)：巡演首页聚合
- [pages/tour/detail/index.ts](/Users/bytedance/projects/swiftie-mini/pages/tour/detail/index.ts)：巡演状态、进度条、场次列表
- [pages/show/detail/index.ts](/Users/bytedance/projects/swiftie-mini/pages/show/detail/index.ts)：场次详情聚合页
- [pages/guide/index.ts](/Users/bytedance/projects/swiftie-mini/pages/guide/index.ts)：Checklist 交互
- [pages/video/upload/index.ts](/Users/bytedance/projects/swiftie-mini/pages/video/upload/index.ts)：mock 上传流程

### 个人页

- [pages/profile/index.ts](/Users/bytedance/projects/swiftie-mini/pages/profile/index.ts)：用户资料缓存与收藏概览

## 实现边界

- 页面层优先消费 selector，而不是在页面内部直接拼装复杂业务数据
- Era 卡片承接到独立的 `pages/era/detail/index`，其页面数据由 `utils/eraSelectors.ts` 聚合
- 当前产品为前端自洽 MVP，页面能力以浏览、跳转、mock 交互为主
- 若后续引入真实后端或媒体播放能力，需要先更新本文档与 `docs/api.md`
