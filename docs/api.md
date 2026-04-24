# 接口与契约

## 总体原则

- 当前项目已经具备真实内容 API 运行链路
- 页面间的数据传递分为两类：
  - 公开内容：通过 `services/contentApi.ts` / `services/contentStore.ts` 请求 `server/`
  - 用户私有状态：继续走本地存储
- 资料馆入口页保持静态，不发请求

## 路由常量

- [utils/constants.ts](/Users/bytedance/projects/swiftie-mini/utils/constants.ts) 中的 `ROUTES` 是页面跳转的唯一常量入口
- Tab 切换使用 `wx.switchTab`
- 非 Tab 页面跳转使用 `wx.navigateTo`

## 当前页面参数契约

- `pages/album/index`：专辑列表态
- `pages/album/index?id=<albumId>`：专辑详情态
- `pages/era/detail/index?id=<eraId>`：Era exhibit 详情页
- `pages/song/index?id=<songId>`：歌曲详情
- `pages/tour/detail/index?id=<tourId>`：巡演详情
- `pages/show/detail/index?id=<showId>`：场次详情
- `pages/guide/index?tourId=<tourId>`：抢票助手
- `pages/video/upload/index?showId=<showId>`：上传视频
- `pages/video/player/index?id=<performanceId>`：资料馆视频播放

说明：

- 缺少必要参数时，相关详情页会进入错误态或兜底逻辑
- 页面参数目前均为简单字符串 id，不做复杂对象透传
- `pages/album/index` 是列表/详情双态页面；无 `id` 时展示专辑列表，有 `id` 时进入详情态
- Era exhibit 页面以 `id` 作为唯一入口参数；缺少或无效参数时进入错误态

## 页面数据接口约定

- 页面不直接调用零散 `wx.request`，统一通过：
  - [services/request.ts](/Users/bytedance/projects/swiftie-mini/services/request.ts)
  - [services/contentApi.ts](/Users/bytedance/projects/swiftie-mini/services/contentApi.ts)
  - [services/contentStore.ts](/Users/bytedance/projects/swiftie-mini/services/contentStore.ts)
- 页面统一区分 `loading / loadError / ready`
- 接口失败时不回退 mock，统一显示失败态 UI

## 首页聚合契约

- 当前首页聚合数据由 `spotlights + eras + news` 组成
- `spotlights` 用于首页条件展示卡片列表，`eras` 用于 Era 博物馆横滑卡片，`news` 用于最近动态摘要
- `spotlights` 允许为空数组，页面需要在无数据时自然隐藏该模块
- 这三组数据现在由 `GET /home` 返回
- `spotlights` 仍然由服务端基于专辑与巡演时间窗动态生成
- Era 卡片现在直接跳转到 `pages/era/detail/index?id=<eraId>`，由独立的 Era exhibit 页面承接
- Era 卡片仍保留 `albumId` 关联，但页面跳转只依赖 `eraId`

## 当前内容接口

- `GET /health`
- `GET /home`
- `GET /albums`
- `GET /albums/:id`
- `GET /albums/:id/songs`（按版本分组的 track listing）
- `GET /albums/:id/editions`
- `GET /editions/:id/tracks`
- `GET /songs`
- `GET /singles`
- `GET /songs/:id`
- `GET /performances`
- `GET /performances/:id`
- `GET /documentaries`
- `GET /eras/:id`
- `GET /tours`
- `GET /tours/:id`
- `GET /tours/:id/shows`
- `GET /shows/:id`
- `GET /shows/:id/videos`

补充约定：

- `GET /albums` 默认只返回 `Album.kind = 'album'` 的专辑列表（不包含单曲）
- `GET /singles` 返回 `songs.album_id IS NULL` 的歌曲列表
- `GET /singles` 中的单曲优先使用 `songs.artist_credit` 作为列表页副标题展示，`songs.year` 继续用于排序和筛选
- `GET /albums/:id/songs` 返回 `AlbumSongSection[]`，顺序为 `isPrimary` 优先，其次按 `releaseAt` 倒序
- 若数据库没有 editions，则 `GET /albums/:id/songs` 会退化为仅 1 个 `Standard` section（按 `songs.album_id` 查询）
- `GET /editions/:id/tracks` 当前由 `songs` 按 `edition_id` 直接派生（不单独维护 tracks 表）
- `GET /performances` 和 `GET /performances/:id` 返回 `videoUri` 相对路径，前端负责补齐 R2 域名

空库契约：

- `GET /home` 返回 `{ spotlights: [], eras: [], news: [] }`
- 列表接口返回 `[]`
- 详情接口返回 `null`

图片字段契约：

- 接口返回的图片字段统一为可直接渲染的完整 URL
- 当前由服务端对相对图片路径自动补齐 CDN 前缀，例如 `/assets/images/...`、`/tours/eras.jpg`
- 用户头像缓存不走该规则，继续保留微信返回或本地缓存的原始地址

## 当前本地交互边界

- 视频上传：提交走本地 mock 流程，不产生真实上传记录
- 抢票助手：仅操作本地存储，不同步到云端
- 收藏和用户资料缓存继续保留本地存储

## 未来变更要求

- 新增页面参数或修改路由格式时，同步更新 `ROUTES`、目标页面 `onLoad` 和本文档
- 如果首页 Era 卡片的承接页发生变化，优先保持 `id=<eraId>` 这个参数约定稳定
- 若新增内容接口，同步更新：
  - 路径与方法
  - 空库响应
  - 前端 `contentStore` 的组合加载逻辑
  - 页面失败态与空态处理
