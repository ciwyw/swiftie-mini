# Home Spotlight 聚合设计

## 1. 目标

本次设计用于重构首页 `spotlight` 数据来源，使其不再由首页单独维护静态 mock，而是基于专辑与巡演主数据按时间自动聚合生成。

目标是同时满足以下约束：

- 首页只消费 `/home` 聚合结果，不直接请求或依赖专辑列表、巡演列表
- spotlight 最终以列表形式返回，而不是单条 Hero
- 专辑与巡演各自最多生成一条 spotlight，因此首页最多同时展示两条
- 当前本地 mock 阶段通过 selector 模拟 `/home` 聚合
- 后续接入真实接口时，服务端可复用同一套时间规则产出 `spotlights`

## 2. 设计范围

本次设计明确包含：

- 首页 `spotlight` 从单条改为列表
- 首页 `spotlight` 从 `data/home.ts` 独立维护改为由 `/home` 聚合生成
- 专辑与巡演主数据补充最小时间元数据
- `spotlight` 的类型、排序和文案映射规则
- `GET /home` 的前端内部契约调整

本次设计明确不包含：

- 首页其他模块布局重设计
- 首页直接请求专辑页或巡演页的数据接口
- 为 spotlight 单独增加存储配置或 CMS 字段
- 服务端真实接口实现

## 3. 聚合边界

首页不能形成“先请求专辑列表和巡演列表，再在页面层拼出 spotlight”的 fan-out 模式。

因此首页的数据边界应明确为：

- `pages/home/index.ts` 只调用 `getHomeFeed()`
- `getHomeFeed()` 负责返回 `spotlights + eras + news`
- `spotlights` 在当前阶段由本地 selector 聚合得到，但语义上等价于未来的 `GET /home`

这样可以保证：

- 首页页面层不感知专辑/巡演原始数据结构
- 后续切换真实接口时，首页页面消费方式保持稳定
- 服务端未来只需查询“最新需要关注的一条专辑记录”和“最新需要关注的一条巡演记录”，并按相同规则生成 `spotlights`

## 4. 数据模型调整

### 4.1 HomeFeed

`types/home.ts` 中的首页聚合结构从单条 spotlight 调整为列表：

```ts
interface HomeFeed {
  spotlights: HomeSpotlight[];
  eras: HomeEraCard[];
  news: NewsItem[];
}
```

首页空态统一使用空数组，不再使用 `null`。

### 4.2 HomeSpotlight

`HomeSpotlight` 改为“语义型聚合结果”，不在数据层存标题、摘要和按钮文案。

建议结构：

```ts
enum HomeSpotlightType {
  AlbumPreview = "album_preview",
  AlbumReleaseWeek = "album_release_week",
  TourPreview = "tour_preview",
  TourOngoing = "tour_ongoing"
}

interface HomeSpotlight {
  id: string;
  type: HomeSpotlightType;
  entityId: string;
  name: string;
  cover: string;
  startDate: string;
  endDate: string;
  action: HomeAction;
}
```

字段约束：

- `type` 同时表达内容域和阶段，不额外拆分 `kind`
- `type` 在类型层使用枚举表达，避免页面和 selector 中散落字符串字面量
- `entityId` 指向专辑或巡演主数据 id
- `startDate` / `endDate` 表示 spotlight 生效时间窗，格式统一为 `YYYY-MM-DD`
- `action` 由聚合层根据实体类型生成

### 4.3 Album

`types/album.ts` / `data/albums.ts` 补充：

```ts
interface Album {
  id: string;
  name: string;
  year: number;
  cover: string;
  announcementDate?: string;
  releaseDate?: string;
}
```

字段说明：

- `announcementDate`：专辑官宣日期
- `releaseDate`：专辑发布日期
- 缺少任一关键时间字段时，该专辑不参与 spotlight 聚合

### 4.4 Tour

`types/tour.ts` / `data/tours.ts` 补充：

```ts
interface Tour {
  id: string;
  name: string;
  year: number;
  status: TourStatus;
  cover: string;
  description: string;
  announcementDate?: string;
  startDate: string;
  endDate: string;
  rangeLabel: string;
  setlists: TourSetlistVersion[];
}
```

字段说明：

- `announcementDate`：巡演官宣日期
- `startDate` / `endDate` 继续作为巡演时间窗的权威来源
- 首页聚合不依赖 `shows` 反推巡演开始和结束时间

## 5. Spotlight 自动生成规则

首页 `spotlights` 由专辑和巡演各自产出 0 或 1 条结果，再合并排序。

### 5.1 专辑规则

输入字段：

- `announcementDate`
- `releaseDate`

生成规则：

- 当 `announcementDate <= today < releaseDate` 时，生成 `album_preview`
- 当 `releaseDate <= today <= releaseDate + 6 天` 时，生成 `album_release_week`
- 其他时间窗不生成 spotlight

说明：

- 发布后只保留首周入口，因此使用 7 天窗口
- 同一张专辑任一时刻最多命中一条规则

### 5.2 巡演规则

输入字段：

- `announcementDate`
- `startDate`
- `endDate`

生成规则：

- 当 `announcementDate <= today < startDate` 时，生成 `tour_preview`
- 当 `startDate <= today <= endDate` 时，生成 `tour_ongoing`
- 其他时间窗不生成 spotlight

说明：

- 巡演“进行中”阶段持续到终场结束日
- 当前聚合规则不依赖 `Tour.status`，以时间字段作为 spotlight 是否生效的唯一依据

### 5.3 同时存在时的排序

排序规则统一为“按当前 spotlight 窗口开始时间倒序”：

- `album_preview` 使用 `announcementDate`
- `album_release_week` 使用 `releaseDate`
- `tour_preview` 使用 `announcementDate`
- `tour_ongoing` 使用 `startDate`

排序目标：

- 最近进入 spotlight 窗口的内容排在前面
- 例如巡演进行中期间官宣新专辑，则新专预告排第一，巡演入口排第二

当开始时间相同，使用固定兜底优先级：

1. `album_preview`
2. `tour_preview`
3. `album_release_week`
4. `tour_ongoing`

## 6. 文案映射策略

spotlight 标题、摘要和 CTA 不进入主数据，也不单独存储。

页面展示层根据 `type` 进行前端固定映射：

- `album_preview`
  - eyebrow: `ALBUM TEASER`
  - title: `${name} 即将发布`
  - summary: `查看专辑信息与相关内容入口。`
  - ctaText: `查看专辑`
- `album_release_week`
  - eyebrow: `NEW RELEASE`
  - title: `${name} 发布中`
  - summary: `发布首周快捷入口，快速进入专辑页。`
  - ctaText: `查看专辑`
- `tour_preview`
  - eyebrow: `ON TOUR SOON`
  - title: `${name} 即将开始`
  - summary: `查看巡演信息、场次安排与详情入口。`
  - ctaText: `查看巡演`
- `tour_ongoing`
  - eyebrow: `ON TOUR`
  - title: `${name} 进行中`
  - summary: `查看巡演进度、场次状态与快捷入口。`
  - ctaText: `查看巡演`

这样可以保证：

- 服务端只负责返回“当前有哪些 spotlight”
- 前端统一控制中文文案和视觉展示
- 文案调整不需要改动数据层或后端接口

## 7. 代码落点

### 7.1 类型与数据

- `types/home.ts`
  - `HomeFeed.spotlight` 改为 `HomeFeed.spotlights`
  - `HomeSpotlight` 改为语义型结构
- `types/album.ts`
  - 增加 `announcementDate`、`releaseDate`
- `types/tour.ts`
  - 增加 `announcementDate`
- `data/home.ts`
  - 删除 `homeSpotlights`
  - 保留 `homeEraCards`
- `data/albums.ts`
  - 为需要参与 spotlight 的专辑补时间字段
- `data/tours.ts`
  - 为需要参与 spotlight 的巡演补时间字段

### 7.2 聚合层

`utils/homeSelectors.ts` 负责实现 mock 阶段的 `/home` 聚合逻辑。

建议新增以下职责清晰的函数：

- `getAlbumSpotlights(today?: string): HomeSpotlight[]`
- `getTourSpotlights(today?: string): HomeSpotlight[]`
- `getHomeSpotlights(today?: string): HomeSpotlight[]`
- `getHomeFeed(today?: string): HomeFeed`

约束：

- 首页页面层只调用 `getHomeFeed()`
- `today` 允许测试时注入，默认取当前日期
- 缺少关键时间字段的实体直接跳过

### 7.3 页面层

`pages/home/index.ts` 与视图层只负责：

- 调用 `getHomeFeed()`
- 渲染 `spotlights[]`
- 根据 `type` 映射文案与跳转

页面层不承担任何 spotlight 判定、排序或时间计算逻辑。

## 8. /home 接口契约对齐

为后续真实接口接入，`docs/api.md` 中首页聚合契约建议稳定为：

- `GET /home`
- 返回字段：
  - `spotlights`
  - `eras`
  - `news`

其中：

- `spotlights` 允许为空数组
- `spotlights` 返回结构与当前 `HomeSpotlight[]` 保持一致
- 当前 selector 实现视为该接口的本地 mock 版本

这样未来切真实接口时，页面只需要替换数据来源，不需要重写 spotlight 渲染逻辑。

## 9. 容错与空态

- 专辑或巡演缺少关键时间字段时，不生成 spotlight
- 两边都未命中时间窗时，`spotlights` 返回空数组
- 首页在 `spotlights.length === 0` 时隐藏整个 spotlight 模块
- 聚合层不回退到 `data/home.ts` 的静态 spotlight 数据

## 10. 验证策略

测试应聚焦聚合层，而不是页面层。

建议覆盖以下场景：

- 专辑在预告期内时生成 `album_preview`
- 专辑在发布后 7 天内生成 `album_release_week`
- 巡演在官宣后首场前生成 `tour_preview`
- 巡演在进行中生成 `tour_ongoing`
- 专辑与巡演同时命中时按窗口开始时间倒序排序
- 未命中任何时间窗时返回空数组
- 缺少关键时间字段时跳过且不报错

## 11. 验收标准

- 首页不再维护独立 `homeSpotlights` mock
- 首页 `spotlight` 以列表形式消费 `/home` 聚合结果
- 首页页面层不直接读取专辑列表或巡演列表来拼装 spotlight
- 专辑和巡演任一主数据更新时间变化后，spotlight 可按时间窗自动变化
- 后续接入真实 `GET /home` 时，首页页面消费结构保持稳定
