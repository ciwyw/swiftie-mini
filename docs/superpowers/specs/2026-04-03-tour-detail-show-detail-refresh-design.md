# 巡演详情与场次详情改版设计

## 1. 目标

本次设计用于更新巡演模块中的巡演详情页与场次详情页，解决当前信息结构扁平、文案写死、场次列表层级不足的问题。

本次改版覆盖以下页面与数据链路：

- `pages/tour/detail/index`
- `pages/show/detail/index`
- `types/tour.ts`
- `data/tours.ts`
- `data/shows.ts`
- `data/showGuides.ts`
- `utils/selectors.ts`
- `tests/tour-module.test.ts`

本次改版继续遵循以下约束：

- 微信小程序原生开发
- TypeScript + WXML + WXSS
- 全部使用本地 mock 数据
- 页面跳转继续使用 `wx.navigateTo`
- 详情页仍通过简单 `id` 参数读取数据

## 2. 设计范围

本次改版只处理巡演详情页与场次详情页的内容结构和数据模型，不扩展到新的业务能力。

明确包含：

- 巡演时间范围展示
- 官方 setlist 展示
- 场次列表三级分层
- 场次状态枚举扩展
- 场次详情页结构化票务信息
- 场次详情页结构化场馆信息
- 惊喜嘉宾与 Surprise Songs 的场次级绑定

明确不包含：

- 抢票助手入口重设计
- 抢票技巧模块
- 巡演统计摘要
- `setlistVersionLabel`
- 新增真实后端接口
- 新增新的页面路由

## 3. 数据模型调整

### 3.1 Tour

`Tour` 只负责巡演级信息，不再承担场次或票务层内容。

建议结构：

```ts
type TourStatus = "ongoing" | "ended" | "break";

interface TourSetlistVersion {
  id: string;
  label: string;
  songs: string[];
}

interface Tour {
  id: string;
  name: string;
  year: number;
  status: TourStatus;
  cover: string;
  description: string;
  startDate: string;
  endDate: string;
  rangeLabel: string;
  setlists: TourSetlistVersion[];
}
```

字段约束：

- `startDate` / `endDate` 使用 `YYYY-MM-DD`
- `rangeLabel` 由 mock 明确给出，用于页面稳定展示，例如 `2023.3 - 2024.12`
- `setlists` 至少一份；如果只有一个版本，则页面按单版本展示

### 3.2 Show

`Show` 负责场次骨架信息，并绑定演出内容信息。

建议结构：

```ts
type ShowStatus = "upcoming" | "ongoing" | "ended" | "cancelled";

interface SurpriseSong {
  songId: string;
  name: string;
}

interface ShowGuest {
  name: string;
}

interface Show {
  id: string;
  tourId: string;
  country: string;
  city: string;
  venue: string;
  date: string;
  status: ShowStatus;
  surpriseGuests?: ShowGuest[];
  surpriseSongs?: SurpriseSong[];
}
```

字段约束：

- `country` 用于巡演详情页的第一层分组
- `city` 用于第二层分组
- `date` 继续使用 `YYYY-MM-DD`
- `cancelled` 场次禁止点击进入详情页
- `surpriseGuests` 与 `surpriseSongs` 均属于 `Show`，不再放在 `ShowGuide`

### 3.3 ShowGuide

`ShowGuide` 只负责票务与到场信息，不负责演出内容。

建议结构：

```ts
interface TicketTier {
  name: string;
  price: string;
}

interface ShowGuide {
  showId: string;
  ticketPlatform?: string;
  saleTime?: string;
  ticketTiers: TicketTier[];
  entryTime?: string;
  address: string;
  seatMapImage?: string;
  notes?: string[];
}
```

字段约束：

- `address` 保留为必填字段，场次详情页固定展示
- `ticketPlatform` / `saleTime` / `ticketTiers` 用于结构化票务信息
- `seatMapImage` 先使用本地占位图或可复用图片路径
- `notes` 只承载补充说明，不承载大段攻略文案

## 4. 巡演详情页设计

### 4.1 顶部 Hero

巡演详情页顶部保留大卡片，但信息改为：

- 巡演封面
- 巡演状态
- 巡演名称
- 巡演时间范围
- 巡演简介

状态文案规则：

- `ongoing` -> `进行中`
- `ended` -> `已结束`
- `break` -> `空档期`

### 4.2 进度条

巡演详情页继续保留进度条，但只作为补充信息，不再与任何入口按钮绑定。

展示规则：

- 仅 `ongoing` 巡演展示
- 文案继续显示 `已完成 x / y 场`
- 不再显示“打开抢票助手”按钮

### 4.3 官方 Setlist

巡演详情页新增 `官方 Setlist` 卡片。

展示规则：

- 若 `setlists.length === 1`，直接展示一份标准歌单
- 若 `setlists.length > 1`，按版本分组展示
- 每个版本展示：
  - 版本名称
  - 歌曲顺序列表
- 本次不提供歌曲详情跳转

### 4.4 场次列表

场次列表改为三级结构：

1. 第一层：国家
2. 第二层：城市
3. 第三层：具体场次

交互规则：

- 国家支持展开/收起
- 国家默认收起
- 城市作为分组标题常驻展示，不额外折叠
- 场次行点击后进入场次详情页
- `cancelled` 场次置灰且不可点击

场次行展示字段：

- 日期
- 场馆名
- 状态
- 可选惊喜嘉宾摘要

状态文案规则：

- `upcoming` -> `待开始`
- `ongoing` -> `进行中`
- `ended` -> `已结束`
- `cancelled` -> `已取消`

## 5. 场次详情页设计

### 5.1 顶部信息卡

页面顶部只保留最重要的信息：

- 场次时间
- 场馆名
- 状态
- 城市
- 国家
- 巡演名
- 可选惊喜嘉宾

顶部不再展示：

- 写死说明文案
- 抢票技巧
- 场馆攻略长文

### 5.2 抢票信息

使用结构化字段展示，不再使用纯字符串列表。

字段包括：

- 平台
- 开售时间
- 票种
- 价格

展示规则：

- 有数据才展示
- 单个票种以独立行展示
- 已结束场次可展示历史票务信息

### 5.3 场馆信息

使用结构化字段展示，不再使用攻略文案堆叠。

字段包括：

- 详细地址
- 入场时间
- 场馆座位图
- 补充说明

展示规则：

- 地址始终展示
- `entryTime` 有值时展示
- `seatMapImage` 有值时显示图片
- `notes` 以短条目形式展示

### 5.4 演出内容信息

演出内容由 `Show` 提供。

具体包括：

- `Surprise Guests`
- `Surprise Songs`

展示规则：

- `surpriseGuests` 有值时显示嘉宾姓名
- `surpriseSongs` 有值时显示列表
- `surpriseSongs` 保持可点击跳转到歌曲详情页
- 这些模块与 `ShowGuide` 解耦

### 5.5 移除模块

本次从场次详情页移除：

- 抢票技巧模块
- 场馆攻略折叠区

## 6. Selector 调整

为避免页面直接拼装复杂结构，需要在 selector 层补充巡演详情专用派生。

建议新增：

```ts
interface ShowListItem {
  id: string;
  country: string;
  city: string;
  venue: string;
  date: string;
  status: ShowStatus;
  statusText: string;
  clickable: boolean;
  surpriseGuestSummary: string;
}

interface TourShowCityGroup {
  city: string;
  shows: ShowListItem[];
}

interface TourShowCountryGroup {
  country: string;
  cities: TourShowCityGroup[];
}
```

建议补充的 selector 能力：

- `getTourShowGroupsByTourId(tourId)`
  - 输出国家 -> 城市 -> 场次的分组结构
- `getShowStatusText(status)`
  - 统一状态文案映射
- `isShowClickable(show)`
  - 控制取消场次不可点击

现有 `getTourProgress` 保留，但需适配新的 `ShowStatus` 枚举。

## 7. 页面状态与交互规则

### 7.1 巡演详情页

- `hasError`：无效 `tourId` 时展示空态
- `expandedCountries`：记录已展开国家列表
- `isEndedTour` 可继续保留，用于控制进度条是否显示

### 7.2 场次详情页

- `hasError`：无效 `showId` 时展示空态
- `guide` 不存在时，仅展示顶部基础信息与可用模块
- 有 `seatMapImage` 时展示座位图，无值时不显示占位

## 8. Fandom 参考吸收策略

参考页面：

- [The Eras Tour - Taylor Swift Wiki | Fandom](https://taylorswift.fandom.com/wiki/The_Eras_Tour)

本次吸收以下结构：

- 巡演开始与结束时间范围
- 多版本 setlist
- Tour dates 的层级组织方式
- 嘉宾信息以场次维度补充

本次不吸收以下百科型字段：

- attendance
- revenue
- personnel
- merch
- 媒体评价与长篇历史说明

原因：

- 当前产品定位为轻量可运行 MVP
- 上述字段会显著增加页面重量，但对当前浏览体验提升有限

## 9. 测试要求

本次至少补充或更新以下测试：

- `getTourById` 返回巡演时间范围与 setlist
- `getShowById` 支持 `country`、`cancelled`、`surpriseGuests`、`surpriseSongs`
- `getTourProgress` 在 `cancelled` 场次存在时行为明确
- `getTourShowGroupsByTourId` 正确输出国家/城市/场次三级结构
- `getShowGuideByShowId` 返回结构化票务和场馆信息
- `getShowStatusText` 对四种状态映射正确
- `isShowClickable` 对 `cancelled` 返回 `false`

## 10. 实施影响

本次设计预计会影响以下方面：

- 巡演详情页从一维场次列表升级为分组列表
- 巡演数据 mock 需要补充范围与 setlist
- 场次数据 mock 需要补充国家、取消状态、演出内容信息
- 场次详情页从“文案列表”升级为“字段卡片”
- 原有抢票助手入口将从巡演详情页移除

## 11. 成功标准

完成后应满足以下结果：

- 巡演详情页可展示 `2023.3 - 2024.12` 这类范围信息
- 巡演详情页存在官方 setlist 模块，并支持多版本展示
- 场次列表支持国家折叠、城市分组、日期级场次展示
- 取消场次明确显示且不可点击
- 场次详情页只保留重要顶部信息
- 票务信息与场馆信息均为结构化字段，不再依赖写死文案
- 惊喜嘉宾与 Surprise Songs 来自 `Show`，而不是 `ShowGuide`
