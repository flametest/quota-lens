# Quota Lens

An AI Token quota monitor that lives in your macOS menu bar. Keep track of your Token usage at a glance and never run out unexpectedly.

[中文文档](./README_CN.md)

## What It Does

- **Quota at a Glance** — Click the menu bar icon to see real-time Token usage percentage, remaining quota, and reset time
- **Usage Stats** — See how many Tokens you've used today, over the past 7 days, and the past 30 days
- **Trend Chart** — A 7-day hourly usage line chart to help you spot usage spikes
- **Quota Alerts** — Get system notifications when your quota hits the threshold, so you're never caught off guard
- **Daily Summary** — A scheduled daily push notification to recap your usage for the day
- **Multi-Account** — Add multiple AI provider accounts and switch between them freely

## Supported Providers

- **Zhipu GLM** — Fully supported (Token usage + quota limits + MCP monthly quota)
- **Claude** — Coming soon
- **OpenAI** — Coming soon

## Getting Started

1. Launch the app — an icon appears in your menu bar
2. Click the icon to open the panel
3. On first use, go to Settings and fill in your provider's Base URL and Token
4. The panel auto-refreshes every 5 minutes, or refresh manually anytime

## Installation

> Current version: 0.4.0. Requires macOS 12 or later.

**Download**: [Latest Release](https://github.com/flametest/quota-lens/releases)

Or build from source:

```bash
npm install
npm run tauri build
```

## License

See [LICENSE](./LICENSE).
