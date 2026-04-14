# 数据说明

## 数据来源

项目当前已经接入真实内容 API 的运行链路：

- 页面运行时优先走 `services/` 下的远程请求与缓存层
- `server/` 提供 Cloudflare Workers + D1 的只读接口
- 公开内容不再保留运行时本地 mock 数据

### 首页与内容接口数据

- [services/contentApi.ts](/Users/bytedance/projects/swiftie-mini/services/contentApi.ts)
- [services/contentStore.ts](/Users/bytedance/projects/swiftie-mini/services/contentStore.ts)

说明：

- 运行时首页数据通过 `GET /home` 获取
- 首页 `spotlights` 由服务端根据专辑与巡演时间窗动态生成
- Era 卡片与 news 摘要都由 `GET /home` 一并返回

### Era 展厅数据

- `GET /eras/:id`

### 资料馆数据

- `GET /albums`
- `GET /albums/:id`
- `GET /albums/:id/songs`
- `GET /songs`
- `GET /songs/:id`
- `GET /performances`
- `GET /documentaries`

### 巡演数据

- `GET /tours`
- `GET /tours/:id`
- `GET /tours/:id/shows`
- `GET /shows/:id`
- `GET /shows/:id/videos`

## 类型模型

- [types/song.ts](/Users/bytedance/projects/swiftie-mini/types/song.ts)：歌曲与 MV 相关类型
- [types/album.ts](/Users/bytedance/projects/swiftie-mini/types/album.ts)：专辑类型
- [types/library.ts](/Users/bytedance/projects/swiftie-mini/types/library.ts)：资料馆领域类型
- [types/news.ts](/Users/bytedance/projects/swiftie-mini/types/news.ts)：动态类型
- [types/home.ts](/Users/bytedance/projects/swiftie-mini/types/home.ts)：首页聚合类型
- [types/tour.ts](/Users/bytedance/projects/swiftie-mini/types/tour.ts)：巡演、场次、视频、Checklist 等类型
- [types/era.ts](/Users/bytedance/projects/swiftie-mini/types/era.ts)：Era 展厅类型

重点：

- `types/home.ts` 承担首页聚合类型出口
- `types/library.ts` 承担资料馆模块的主类型出口
- `types/tour.ts` 承担巡演模块的主类型出口
- `types/era.ts` 承担 Era 展厅的主类型出口
- 实际时间字段统一使用时间戳
- `Song` 支持可选 `mv`
- `Performance.domain` 区分资料馆内容与巡演语境
- `Show` 已经并入票务/场馆字段，不再单独维护 `ShowGuide`

## 运行时远程数据层

- [services/request.ts](/Users/bytedance/projects/swiftie-mini/services/request.ts)：统一 `wx.request`、超时和 HTTP 错误处理
- [services/contentApi.ts](/Users/bytedance/projects/swiftie-mini/services/contentApi.ts)：封装具体接口
- [services/contentStore.ts](/Users/bytedance/projects/swiftie-mini/services/contentStore.ts)：做按接口缓存和页面级组合加载

补充：

- 公开内容接口返回的相对图片路径会由服务端统一补齐为 R2 完整 URL

当前通过远程接口加载的页面：

- [pages/home/index.ts](/Users/bytedance/projects/swiftie-mini/pages/home/index.ts)
- [pages/album/index.ts](/Users/bytedance/projects/swiftie-mini/pages/album/index.ts)
- [pages/song-list/index.ts](/Users/bytedance/projects/swiftie-mini/pages/song-list/index.ts)
- [pages/favorites/index.ts](/Users/bytedance/projects/swiftie-mini/pages/favorites/index.ts)
- [pages/song/index.ts](/Users/bytedance/projects/swiftie-mini/pages/song/index.ts)
- [pages/performance/index.ts](/Users/bytedance/projects/swiftie-mini/pages/performance/index.ts)
- [pages/documentary/index.ts](/Users/bytedance/projects/swiftie-mini/pages/documentary/index.ts)
- [pages/era/detail/index.ts](/Users/bytedance/projects/swiftie-mini/pages/era/detail/index.ts)
- [pages/tour/index.ts](/Users/bytedance/projects/swiftie-mini/pages/tour/index.ts)
- [pages/tour/detail/index.ts](/Users/bytedance/projects/swiftie-mini/pages/tour/detail/index.ts)
- [pages/show/detail/index.ts](/Users/bytedance/projects/swiftie-mini/pages/show/detail/index.ts)

## 本地持久化

- [utils/storage.ts](/Users/bytedance/projects/swiftie-mini/utils/storage.ts)：封装本地缓存读写
- [utils/constants.ts](/Users/bytedance/projects/swiftie-mini/utils/constants.ts)：定义存储 key 与默认值

当前存储内容：

- `favoriteSongIds`：收藏歌曲 id 列表
- `userProfileCache`：头像与昵称缓存
- `tourGuideChecklist`：按 `tourId` 组织的抢票助手勾选状态

## 修改建议

- 新增业务数据时，优先补 `types/`、`server/` schema 与接口映射
- 页面需要新组合字段时，优先落到 `services/contentStore.ts`，而不是在页面内重复计算
- 修改本地存储结构时，同步更新 `utils/storage.ts`、`utils/constants.ts` 和相关消费页面
