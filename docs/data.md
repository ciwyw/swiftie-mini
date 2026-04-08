# 数据说明

## 数据来源

项目当前没有真实后端，所有业务数据都来自 `data/` 目录下的本地 mock。

### 首页数据

- [data/home.ts](/Users/bytedance/projects/swiftie-mini/data/home.ts)
- [data/news.ts](/Users/bytedance/projects/swiftie-mini/data/news.ts)

说明：

- `data/home.ts` 现在只维护首页的编辑型 era 卡片，不再手写 `spotlights`
- 首页 `spotlights` 由 `utils/homeSelectors.ts` 根据专辑与巡演时间窗自动生成
- `data/news.ts` 当前服务于首页最近动态摘要

### Era 展厅数据

- [data/eraExhibits.ts](/Users/bytedance/projects/swiftie-mini/data/eraExhibits.ts)

### 资料馆数据

- [data/albums.ts](/Users/bytedance/projects/swiftie-mini/data/albums.ts)
- [data/songs.ts](/Users/bytedance/projects/swiftie-mini/data/songs.ts)
- [data/performances.ts](/Users/bytedance/projects/swiftie-mini/data/performances.ts)
- [data/documentaries.ts](/Users/bytedance/projects/swiftie-mini/data/documentaries.ts)

### 巡演数据

- [data/tours.ts](/Users/bytedance/projects/swiftie-mini/data/tours.ts)
- [data/shows.ts](/Users/bytedance/projects/swiftie-mini/data/shows.ts)
- [data/videos.ts](/Users/bytedance/projects/swiftie-mini/data/videos.ts)
- [data/showGuides.ts](/Users/bytedance/projects/swiftie-mini/data/showGuides.ts)

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
- `data/songs.ts` 中的 `Song` 支持可选 `mv`
- `data/performances.ts` 使用 `Performance.domain` 区分资料馆内容与巡演语境
- `data/eraExhibits.ts` 只保存 Era 展厅的编辑型 mock 资料，不重复存储 album/song/performance 的完整内容

## Selector 与视图派生

- [utils/selectors.ts](/Users/bytedance/projects/swiftie-mini/utils/selectors.ts)：通用查询与派生
- [utils/homeSelectors.ts](/Users/bytedance/projects/swiftie-mini/utils/homeSelectors.ts)：首页聚合与派生
- [utils/librarySelectors.ts](/Users/bytedance/projects/swiftie-mini/utils/librarySelectors.ts)：资料馆专用派生
- [utils/eraSelectors.ts](/Users/bytedance/projects/swiftie-mini/utils/eraSelectors.ts)：Era 展厅聚合与跨域解析

当前主要负责：

- 专辑、歌曲、巡演、场次、视频数据的查找
- 首页 `spotlights + eras + news` 的聚合视图数据
- 资料馆入口、歌曲列表、收藏列表、视频区块的派生
- Era 展厅详情的查找、album/song/performance 解析和缺失引用过滤

补充说明：

- 首页 `spotlights` 是 selector 的派生结果，不直接由 `data/home.ts` 维护
- 巡演 Checklist 的读写由 [utils/storage.ts](/Users/bytedance/projects/swiftie-mini/utils/storage.ts) 负责，而不是 selector 层

## 本地持久化

- [utils/storage.ts](/Users/bytedance/projects/swiftie-mini/utils/storage.ts)：封装本地缓存读写
- [utils/constants.ts](/Users/bytedance/projects/swiftie-mini/utils/constants.ts)：定义存储 key 与默认值

当前存储内容：

- `favoriteSongIds`：收藏歌曲 id 列表
- `userProfileCache`：头像与昵称缓存
- `tourGuideChecklist`：按 `tourId` 组织的抢票助手勾选状态

## 修改建议

- 新增业务数据时，优先补 `types/` 再补 `data/`
- 页面需要新组合字段时，优先落到 selector，而不是在页面内重复计算
- 修改本地存储结构时，同步更新 `utils/storage.ts`、`utils/constants.ts` 和相关消费页面
