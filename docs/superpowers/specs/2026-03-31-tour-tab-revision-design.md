# 巡演模块改版补充设计

## 1. 目标

本补充设计用于覆盖上一版巡演模块设计中的交互与信息架构调整，重点更新以下三个页面：

- `pages/tour/index`
- `pages/tour/detail`
- `pages/show/detail`

本次补充设计继续沿用以下约束：

- 微信小程序原生开发
- TypeScript + WXML + WXSS
- 全部使用本地 mock 数据
- 跳转统一使用 `wx.navigateTo`
- 本地持久化继续使用 `wx.setStorageSync`

## 2. 首页改版

### 2.1 顶部进行中巡演 Hero

首页顶部不再展示通用状态卡片，而是展示唯一一个“进行中的巡演”大海报卡片。

该区域必须包含：

- 大海报封面
- 巡演名称
- 状态文案

交互规则：

- 整个 Hero 卡片可点击
- 点击后跳转到对应巡演详情页

边界约束：

- 业务上只会有一个进行中的巡演，因此首页不需要支持多个并行 Hero
- 如果 mock 数据未来没有进行中巡演，可隐藏 Hero 区并直接显示已结束巡演时间轴

### 2.2 已结束巡演 Timeline

首页的“巡演时间轴”只展示已结束的巡演，不再混入进行中的巡演。

表现形式：

- 纵向 Timeline
- 使用年份和节点表达时间递进
- 每个节点对应一个已结束巡演

每个节点至少展示：

- 巡演名称
- 年份
- 简短说明或副标题

交互规则：

- 点击时间轴中的单个巡演节点，跳转到该巡演详情页

### 2.3 首页去除模块

以下两个区块从首页移除：

- 精选视频
- Surprise Songs

## 3. 巡演详情改版

### 3.1 顶部状态展示

巡演详情页顶部必须展示巡演状态。

可展示文案包括：

- 进行中
- 已结束
- 空档期

状态信息应出现在头图信息区，而不是仅依赖列表或进度条表达。

### 3.2 进行中巡演

当巡演状态为 `ongoing` 时：

- 显示进度条
- 显示“抢票助手”入口
- 场次列表中可保留单场状态

### 3.3 已结束巡演

当巡演状态为 `ended` 时：

- 隐藏进度条
- 隐藏“抢票助手”入口
- 场次列表中的每一场不再重复显示“已结束”状态

原因：

- 巡演已经结束时，整页状态已经明确，场次列表不需要重复传达同一信息

## 4. 场次详情改版

### 4.1 基本信息增强

场次详情页的基本信息区新增以下字段：

- 场馆具体地址

因此单场 `show` 数据需要包含：

- `address`

### 4.2 Surprise Songs 模块

`Surprise Songs` 模块只在以下条件满足时展示：

- 场次状态为 `ended`
- 且该场次存在有效的 `surpriseSongs` 数据

如果没有 `surpriseSongs` 数据：

- 整个模块不展示
- 不出现空占位

### 4.3 Surprise Songs 跳转

`Surprise Songs` 中的每首歌都应支持点击跳转到现有歌曲详情页。

因此建议数据结构从纯字符串扩展为可跳转对象：

```ts
interface SurpriseSong {
  songId: string;
  name: string;
}
```

对应地：

```ts
interface ShowGuide {
  showId: string;
  ticketInfo: string[];
  tips: string[];
  venueGuide: string[];
  surpriseSongs?: SurpriseSong[];
}
```

同时需要补齐本地 `songs` mock，确保本次展示到的歌曲都能在歌曲详情页查到。

### 4.4 饭拍视频信息增强

饭拍视频列表的每个卡片新增以下信息：

- 上传微信用户信息
- 上传时间

本次设计采用本地 mock 方式模拟，不接真实微信登录。

建议视频数据结构扩展为：

```ts
interface Video {
  id: string;
  showId: string;
  title: string;
  cover: string;
  song?: string;
  userName: string;
  uploadTime: string;
}
```

### 4.5 上传按钮固定到底部

“上传视频”按钮不再放在视频区顶部，而是改为页面底部固定操作栏。

交互要求：

- 页面滚动时按钮始终可见
- 不遮挡最后一条视频内容
- 页面内容区需要预留底部安全间距

## 5. 数据模型补充

### 5.1 Show

扩展为：

```ts
interface Show {
  id: string;
  tourId: string;
  city: string;
  venue: string;
  address: string;
  date: string;
  status: 'upcoming' | 'ongoing' | 'ended';
}
```

### 5.2 Video

扩展为：

```ts
interface Video {
  id: string;
  showId: string;
  title: string;
  cover: string;
  song?: string;
  userName: string;
  uploadTime: string;
}
```

### 5.3 ShowGuide

扩展为：

```ts
interface SurpriseSong {
  songId: string;
  name: string;
}

interface ShowGuide {
  showId: string;
  ticketInfo: string[];
  tips: string[];
  venueGuide: string[];
  surpriseSongs?: SurpriseSong[];
}
```

## 6. 页面行为规则

### 6.1 首页

- `activeTour`：唯一进行中的巡演
- `timelineTours`：仅已结束巡演

### 6.2 巡演详情

- `ongoing`：显示进度条与抢票助手入口
- `ended`：隐藏进度条与抢票助手入口

### 6.3 场次详情

- `upcoming` / `ongoing`：显示抢票信息、抢票技巧、场馆攻略、饭拍视频
- `ended`：显示抢票信息、饭拍视频；若有 `surpriseSongs` 则展示该模块；隐藏抢票技巧与场馆攻略

## 7. 实施影响

本次补充设计会影响以下实现点：

- 首页 view-model 需要拆分为 `activeTour` 与 `timelineTours`
- 巡演详情页需要按巡演状态做模块显隐
- 场次详情页需要补地址、歌曲跳转、UGC 元信息、底部固定上传栏
- `songs` mock 需要补齐 `Surprise Songs` 涉及到但当前不存在的歌曲

## 8. 验收补充

完成后应满足以下结果：

- 首页顶部仅展示一个进行中的巡演大海报，并可跳转
- 首页时间轴仅展示已结束巡演，且为纵向 Timeline
- 首页不再出现精选视频和 Surprise Songs 区块
- 已结束巡演详情页不显示进度条和抢票助手入口
- 已结束巡演的场次列表不重复显示“已结束”状态
- 场次详情显示场馆具体地址
- `Surprise Songs` 存在时可点击跳转歌曲详情；不存在时不显示模块
- 饭拍视频显示上传用户与上传时间
- 上传按钮固定在场次详情页底部
