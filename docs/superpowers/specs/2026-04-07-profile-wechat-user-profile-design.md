# Profile 微信资料同步设计

## 背景

当前个人页头像和昵称来自本地 mock 与手动输入，不符合“展示当前微信登录用户资料”的目标。

微信小程序无法仅凭 `wx.login` 静默拿到头像和昵称，因此本次改造采用用户主动触发的资料同步流程。

## 方案

- 个人页移除手动头像选择与昵称输入能力
- 保留头像和昵称展示区
- 新增“同步微信资料”入口，由用户点击后调用 `wx.getUserProfile`
- 成功后将头像和昵称写回页面状态、本地缓存和 `app.globalData`
- 未授权或获取失败时保留当前展示内容，并用 toast 提示

## 影响范围

- `pages/profile/index.ts`
- `pages/profile/index.wxml`
- `pages/profile/index.wxss`
- `tests/profile-module.test.ts`
- `typings/index.d.ts`

## 验收标准

- 个人页不再出现 `chooseAvatar` 和昵称输入框
- 用户点击同步入口后，可用微信资料替换默认 mock 资料
- 页面重新进入后仍能从本地缓存读取上次同步结果
- 获取失败时页面不报错，并给出明确提示
