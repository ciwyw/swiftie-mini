# 项目上下文

## 项目背景

这是一个 Taylor Swift 粉丝向微信小程序 MVP，目标是用原生小程序能力搭建一个以内容浏览、Era 展厅和巡演信息为核心的轻量产品。当前产品已经从基础内容库扩展为包含首页、资料馆、Era 展厅、巡演、个人页的完整可运行结构，公开内容已统一走远程内容接口。

## 当前产品范围

### 首页

- 条件展示的首页事件 Hero
- Era 博物馆横滑卡片
- 最近动态摘要

说明：Era 卡片已跳转到独立的 Era exhibit 页面，承接更完整的时代展陈体验。

### Era 展厅

- 独立 Era exhibit 详情页
- 展示 era 视觉、里程碑、听/看入口和影响摘要
- 通过首页 Era 卡片直接进入对应 era 展厅

### 资料馆

- 资料馆入口页
- 专辑列表与专辑详情
- 独立歌曲列表与歌曲详情
- 歌词逐句展示
- 歌曲收藏与独立收藏页
- 歌曲关联 MV 入口
- 非巡演 `Live 表演` 列表
- `Live 表演` 独立视频播放页
- `纪录片` 列表
- `MV / 纪录片` 的 mock 信息弹层入口

### 巡演

- 巡演首页：进行中巡演 Hero + 已结束巡演时间线
- 巡演详情：状态、进度条、抢票助手入口、场次列表
- 场次详情：地址、状态、抢票信息、`Surprise Songs`
- 抢票助手：本地持久化 Checklist

### 个人页

- 头像与昵称缓存
- 收藏歌曲概览
- 跳转独立收藏页

## 核心约束

- 公开内容依赖 `server/` 提供的 Cloudflare Workers + D1 只读接口
- 不再保留运行时本地 mock 数据兜底
- 非 Tab 页面使用 `wx.navigateTo`，Tab 切换使用 `wx.switchTab`
- 不使用第三方 UI 组件库
- 视觉方向保持简洁白底和卡片布局
- 产品包含独立的 Era exhibit 页面能力，首页 Era 卡片不再复用专辑详情页
- 资料馆中的 `Live 表演` 已接入真实视频播放；`MV / 纪录片` 仍为 mock 入口
- 巡演模块中的 `Surprise Songs` 为可选模块，有数据才展示

## 文档导航

- [docs/architecture.md](/Users/bytedance/projects/swiftie-mini/docs/architecture.md)：技术栈、页面结构、目录职责、关键实现入口
- [docs/data.md](/Users/bytedance/projects/swiftie-mini/docs/data.md)：mock 数据来源、类型模型、selector、存储约定
- [docs/api.md](/Users/bytedance/projects/swiftie-mini/docs/api.md)：路由参数、页面跳转约定、无后端场景下的数据接口契约

## 使用建议

- 新开线程先读本文件，快速建立项目背景和边界
- 需要改架构、页面组织或核心实现时，再读 `docs/architecture.md`
- 需要改数据、类型、内容接口、存储时，再读 `docs/data.md`
- 需要改页面跳转、参数传递或接口契约时，再读 `docs/api.md`
