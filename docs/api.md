# 接口与契约

## 总体原则

- 当前项目没有真实后端 API
- 页面间的数据传递以路由参数、本地 mock 数据和 selector 为主
- 若未来接入服务端接口，应先在本文档中定义请求/响应契约，再开始实现

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

说明：

- 缺少必要参数时，相关详情页会进入错误态或兜底逻辑
- 页面参数目前均为简单字符串 id，不做复杂对象透传
- `pages/album/index` 是列表/详情双态页面；无 `id` 时展示专辑列表，有 `id` 时进入详情态
- Era exhibit 页面以 `id` 作为唯一入口参数；缺少或无效参数时进入错误态

## 页面数据接口约定

- 页面不直接依赖原始 mock 文件的结构细节，优先通过 selector 获取数据
- selector 可视为当前前端内部的数据接口层
- 对外部能力的 mock 交互应保持“可点击但不接真实服务”的明确边界

## 首页聚合契约

- 当前首页聚合数据由 `spotlights + eras + news` 组成
- `spotlights` 用于首页条件展示卡片列表，`eras` 用于 Era 博物馆横滑卡片，`news` 用于最近动态摘要
- `spotlights` 允许为空数组，页面需要在无数据时自然隐藏该模块
- 这三组数据目前都由本地 mock 和 selector 聚合得到，其中 `spotlights` 由首页聚合层基于专辑与巡演的时间窗自动生成
- Era 卡片现在直接跳转到 `pages/era/detail/index?id=<eraId>`，由独立的 Era exhibit 页面承接
- Era 卡片仍保留本地 mock 生成的 `albumId` 关联，但页面跳转只依赖 `eraId`

## 当前 mock 交互边界

- `MV / Live / 纪录片`：点击后展示信息弹层，不接播放或详情服务
- 视频上传：提交走本地 mock 流程，不产生真实上传记录
- 抢票助手：仅操作本地存储，不同步到云端

## 未来变更要求

- 新增页面参数或修改路由格式时，同步更新 `ROUTES`、目标页面 `onLoad` 和本文档
- 如果首页 Era 卡片的承接页发生变化，优先保持 `id=<eraId>` 这个参数约定稳定
- 如果首页改为服务端供数，优先设计 `GET /home`，返回 `spotlights`、`eras`、`news` 三个字段；其中 `spotlights` 允许为空数组
- 若引入真实 API，请至少补充：
  - 接口路径与方法
  - 请求参数
  - 响应字段
  - 错误态与兜底策略
