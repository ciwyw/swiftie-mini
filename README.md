# Taylor Swift 粉丝微信小程序 MVP

## 技术栈
- 微信小程序原生
- TypeScript + WXML + WXSS
- 本地 mock 数据
- `wx.setStorageSync` / `wx.getStorageSync`

## 主要功能
- 首页推荐与动态
- 内容库（专辑/歌曲）
- 歌曲详情（逐句歌词、释义弹层、收藏）
- 巡演时间轴首页
- 巡演详情与场次详情
- 抢票助手 Checklist
- 个人页（头像与收藏）

## 运行方式
1. 使用微信开发者工具打开项目根目录：`/Users/bytedance/projects/swiftie-mini`
2. 选择「小程序」项目并使用测试号/游客模式
3. 编译运行

## 巡演模块
- `pages/tour/index`：顶部状态区 + 巡演时间轴
- `pages/tour/detail`：进度条、官摄占位、场次列表
- `pages/show/detail`：根据状态显示抢票模块或 Surprise Songs
- `pages/guide/index`：本地持久化 Checklist

## 本地验证
1. 安装依赖：`npm install`
2. 运行业务测试：`npm run test:tour`
3. 运行类型检查：`npm run typecheck`
