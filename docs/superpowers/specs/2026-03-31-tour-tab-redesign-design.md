# 巡演 Tab 重构设计

## 1. 背景与目标

本次重构基于 PRD，对现有微信小程序中的巡演 Tab 做一次完整升级。目标是让巡演模块从“巡演列表 + 简单详情”扩展为一条完整的浏览链路，覆盖巡演时间轴、巡演详情、场次详情、抢票助手和饭拍视频上传。

本次设计必须满足以下约束：

- 使用微信小程序原生开发，保持现有 TypeScript + WXML + WXSS 工程结构
- 仅使用本地 mock 数据，不接入真实后端
- 页面跳转统一使用 `wx.navigateTo`
- Checklist 勾选状态使用 `wx.setStorageSync` 持久化
- UI 保持白底、卡片布局、信息清晰，不引入第三方 UI 库

## 2. 本次范围

本次工作仅覆盖巡演模块相关重构，具体包括：

- 重构巡演首页 `pages/tour/index`
- 将旧页面 `pages/tourDetail/index` 迁移为新路由 `pages/tour/detail`
- 新增 `pages/show/detail`
- 新增 `pages/guide/index`
- 新增 `pages/video/upload`
- 扩展巡演相关 mock 数据、类型定义、selector 和 storage

本次不包含以下内容：

- 接入真实后端或云函数
- 真实视频上传能力
- 外部视频播放器或真实官摄链接解析
- UGC 审核、评论、点赞、搜索等扩展能力

## 3. 页面与路由结构

### 3.1 路由清单

- `pages/tour/index`：巡演首页
- `pages/tour/detail`：巡演详情
- `pages/show/detail`：场次详情
- `pages/guide/index`：抢票助手
- `pages/video/upload`：上传视频

### 3.2 兼容策略

现有 `pages/tour/index` 保留并重构。

现有 `pages/tourDetail/index` 不再作为主入口页面继续演进，其承担的职责迁移到 `pages/tour/detail`。路由常量和页面跳转逻辑统一改为新路径，避免新旧详情页并行造成维护成本。

## 4. 架构设计

本次重构采用“页面层 + 本地 mock 数据层 + selector/storage 层”的轻量架构。

### 4.1 页面层

页面层负责展示、交互和路由跳转，不直接承载复杂查询逻辑。每个页面只消费已经整理好的 mock 数据或 selector 返回结果。

### 4.2 本地 mock 数据层

巡演模块的数据全部来自 `data/` 目录下的本地静态文件。数据拆分为独立资源，避免将所有字段堆进单一结构。

建议的数据文件包括：

- `data/tours.ts`：巡演列表
- `data/shows.ts`：场次列表
- `data/videos.ts`：饭拍视频列表
- `data/showGuides.ts`：按 `showId` 关联的抢票信息、抢票技巧、场馆攻略、Surprise Songs

### 4.3 selector 与 storage 层

`utils/selectors.ts` 负责封装巡演模块的读取和聚合逻辑，包括：

- 获取巡演列表和单个巡演
- 按 `tourId` 获取场次列表
- 按 `showId` 获取场次详情
- 按 `showId` 获取视频和攻略配置
- 计算巡演首页顶部状态文案
- 计算巡演详情页进度条数据

`utils/storage.ts` 负责 Checklist 的本地持久化，不把折叠开关或上传页表单等一次性页面状态写入 storage。

## 5. 数据模型

### 5.1 Tour

巡演首页和巡演详情依赖的基础巡演结构如下：

```ts
interface Tour {
  id: string;
  name: string;
  year: number;
  status: 'ongoing' | 'ended' | 'break';
  cover: string;
  description: string;
}
```

### 5.2 Show

场次基础数据结构如下：

```ts
interface Show {
  id: string;
  tourId: string;
  city: string;
  venue: string;
  date: string;
  status: 'upcoming' | 'ongoing' | 'ended';
}
```

### 5.3 Video

饭拍视频数据结构如下：

```ts
interface Video {
  id: string;
  showId: string;
  title: string;
  cover: string;
  song?: string;
}
```

### 5.4 ShowGuide

与 `showId` 关联的配置结构如下：

```ts
interface ShowGuide {
  showId: string;
  ticketInfo: string[];
  tips: string[];
  venueGuide: string[];
  surpriseSongs: string[];
}
```

### 5.5 Checklist

抢票助手本地存储采用按巡演维度分桶的结构：

```ts
interface GuideChecklistState {
  [tourId: string]: string[];
}
```

值为当前巡演已完成条目的 `id` 数组。未传入 `tourId` 时回退到默认桶，保证页面单独打开时也可用。

## 6. 页面设计

### 6.1 巡演首页 `pages/tour/index`

该页面是巡演 Tab 的总入口，包含三个区域：

1. 顶部状态区  
   根据全部 mock 场次的时间和状态计算一个总状态，只展示三种文案：`正在进行中`、`已结束`、`空档期`。该区域使用卡片形式展示，并附带一句简短说明文案。

2. 巡演时间轴  
   以列表卡片展示所有巡演，字段包括 `cover`、`name`、`year`、`status`。点击卡片后通过 `wx.navigateTo` 跳转到 `pages/tour/detail?id={tourId}`。

3. 内容占位区  
   页面底部保留 `精选视频` 和 `Surprise Songs` 两个卡片区域，使用简单 mock 文案和占位项展示，为后续扩展留出结构。

### 6.2 巡演详情 `pages/tour/detail`

该页面负责单个巡演的总览信息，包含以下模块：

1. 头图和巡演信息  
   展示封面、巡演名、年份、状态、描述文案。

2. 进度条  
   使用 mock 计算结果展示“已完成场次 / 总场次”，视觉上是简单的线性进度条，不依赖复杂动画。

3. 操作按钮  
   保留一个主按钮“打开抢票助手”，跳转到 `pages/guide/index?tourId={tourId}`。

4. 官摄视频区  
   使用卡片展示外链占位内容，仅提供标题和说明，不接真实播放逻辑。

5. 场次列表  
   每个场次卡片展示 `城市`、`日期`、`场馆` 和状态标签。点击后跳转到 `pages/show/detail?id={showId}`。

### 6.3 场次详情 `pages/show/detail`

该页面为按场次聚合的详情页，必须根据场次状态动态展示模块。

通用区域：

- 基本信息：城市、日期、场馆、所属巡演
- 状态标签：`未开始`、`进行中`、`已结束`
- 饭拍视频区：展示 mock 视频列表，并提供“上传视频”按钮跳转到 `pages/video/upload?showId={showId}`

状态驱动展示规则如下：

- 当 `show.status` 为 `upcoming` 或 `ongoing` 时：
  - 显示抢票信息
  - 显示“抢票技巧”折叠区域
  - 显示“场馆攻略”折叠区域
  - 不显示 `Surprise Songs`

- 当 `show.status` 为 `ended` 时：
  - 保留抢票信息静态卡片
  - 隐藏“抢票技巧”折叠区域
  - 隐藏“场馆攻略”折叠区域
  - 显示 `Surprise Songs` 卡片区

其中 `ongoing` 归入“未开始侧”的展示逻辑，即与 `upcoming` 保持一致。

折叠区域的展开状态仅保存在页面内存中，不做持久化。

### 6.4 抢票助手 `pages/guide/index`

该页面仅实现 Checklist，不承载额外信息流。内容固定为三组：

- Step 1：注册账号、绑定支付
- Step 2：提前进入、多设备
- Step 3：候补、转售

交互要求：

- 每个条目都支持点击勾选/取消勾选
- 每次操作后立即通过 `wx.setStorageSync` 写入本地
- 页面进入时根据 `tourId` 读取已保存状态
- 页面底部可展示完成进度摘要，但不额外引入复杂统计逻辑

### 6.5 上传视频 `pages/video/upload`

该页面保持极简模拟流程：

1. 选择视频按钮  
   点击后仅切换为“已选择视频（模拟）”状态，不调用真实选择器。

2. 表单区  
   包含 `标题` 和 `歌曲（可选）` 两个输入项。

3. 提交按钮  
   点击时先校验标题是否为空。若为空则提示用户填写标题；若通过校验，则弹出“上传成功（模拟）”提示。

上传成功后允许返回上一页或重置表单，具体实现可以优先选择返回上一页，以减少冗余页面状态。

## 7. 导航与数据流

主要导航链路如下：

- 巡演 Tab 首页 -> 巡演详情
- 巡演详情 -> 抢票助手
- 巡演详情 -> 场次详情
- 场次详情 -> 上传视频

数据流原则如下：

- 所有页面都从本地 mock 数据初始化
- 路由参数仅传递 `tourId` 或 `showId`
- 页面通过 selector 查找自身所需数据，不跨页面直接共享临时对象
- Checklist 是唯一需要持久化的用户操作状态

## 8. 状态映射与显示规则

### 8.1 巡演首页顶部状态

巡演首页顶部总状态按以下规则计算：

- 如果存在 `ongoing` 场次，显示 `正在进行中`
- 如果不存在 `ongoing` 场次，但存在未来场次，显示 `空档期`
- 如果所有场次都已结束，显示 `已结束`

该状态只作为首页氛围信息，不参与业务跳转控制。

### 8.2 巡演状态文案

`Tour.status` 用于巡演卡片展示，和首页顶部状态区并行存在。巡演卡片的状态可直接来自 mock 数据，不依赖运行时推导，以便保留不同巡演的展示语义。

### 8.3 场次状态文案

`Show.status` 与页面标签文案的映射如下：

- `upcoming` -> `未开始`
- `ongoing` -> `进行中`
- `ended` -> `已结束`

## 9. 错误处理与空状态

所有新页面都需要具备基础容错，避免因 mock id 缺失导致白屏。

处理规则如下：

- 路由参数缺失：展示空状态卡片和返回提示
- id 查找失败：展示“内容不存在”空状态
- 列表为空：展示占位文案，不报错
- Checklist storage 读取失败或类型不合法：回退为默认全未选状态
- 上传视频标题为空：使用 `wx.showToast` 提示，而不是静默失败

## 10. UI 约束

样式遵循以下原则：

- 白底主视觉
- 卡片布局
- 清晰的列表层级
- 基础组件优先
- 不增加复杂视觉装饰

在实现层面优先复用现有全局样式、卡片样式和空状态组件，使巡演模块与当前项目风格保持统一。

## 11. 验收标准

重构完成后，需要满足以下结果：

- `app.json` 中包含并可访问 PRD 要求的 5 个页面
- 巡演首页能展示顶部状态区、时间轴列表和两个占位内容区
- 巡演详情能展示头图信息、进度条、抢票助手入口、官摄占位和场次列表
- 场次详情能依据 `show.status` 正确切换“抢票模块”与 `Surprise Songs`
- 抢票助手的勾选状态在重新进入页面后仍可恢复
- 上传视频流程可在无后端情况下完整跑通并给出模拟成功提示
- 所有数据均来自本地 mock，不依赖真实接口

## 12. 实施注意点

为了让本次改造与现有仓库兼容，页面脚本继续使用 `.ts`，不整体切换为 `.js`。这属于工程层面的兼容决策，不改变 PRD 所要求的功能、页面结构和交互结果。

本次设计完成后，下一步应基于该设计文档编写实施计划，再进入代码改造阶段。
