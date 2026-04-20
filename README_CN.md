# Quota Lens

macOS 菜单栏上的 AI Token 额度监控器。帮你随时掌握 Token 用量，避免额度超限。

## 它能做什么

- **一眼看到额度** — 点击菜单栏图标，实时查看 Token 使用百分比、剩余额度、重置时间
- **Token 消耗统计** — 今日、近 7 天、近 30 天用了多少 Token，一目了然
- **趋势曲线** — 近 7 天每小时消耗折线图，快速发现用量高峰
- **额度告警** — 额度达到阈值时自动推送系统通知，不用担心突然用超
- **每日汇总** — 每天定时推送一条用量摘要，睡前回顾今天的消耗
- **多账号切换** — 支持添加多个 AI 服务商账号，随时切换查看

## 支持的服务商

- **智谱 GLM** — 完整支持（Token 用量 + 额度限制 + MCP 月度配额）
- **Claude** — 开发中
- **OpenAI** — 开发中

## 使用方式

1. 启动后在菜单栏出现图标
2. 点击图标打开面板
3. 首次使用进入设置，填入服务商的 Base URL 和 Token
4. 面板每 5 分钟自动刷新，也可手动刷新

## 下载安装

> 当前版本 0.5.3，支持 macOS 12 及以上系统。

**下载**：[最新版本](https://github.com/flametest/quota-lens/releases)

或从源码构建：

```bash
npm install
npm run tauri build
```

如果 macOS 提示"Quota Lens 已损坏，无法打开"，在终端执行：

```bash
xattr -cr /Applications/Quota\ Lens.app
```

## 开发

前置依赖：[Node.js](https://nodejs.org/)、[Rust](https://www.rust-lang.org/tools/install)、[Tauri CLI](https://tauri.app/start/prerequisites/)

```bash
# 安装依赖
npm install

# 启动开发服务器（支持热更新）
npm run tauri dev
```

## 测试

```bash
# 运行所有测试
npm run test

# 仅运行 Rust 单元测试
cd src-tauri && cargo test

# 运行 GLM Provider 测试
cd src-tauri && cargo test --lib glm
```

## License

See [LICENSE](./LICENSE).
