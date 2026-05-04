# Vision Space

面向 macOS 的本地图像查看器，基于 Tauri 2、React 和 Base UI 构建。

[English README](README.md)

## 功能

- 打开单张图片或文件夹
- 支持本地图片拖放
- 缩放、平移、旋转、适配窗口
- 底部缩略图条便于快速浏览
- 主题模式：跟随系统、浅色、深色
- 支持强调色自定义

## 技术栈

- Tauri 2
- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- 基于 Base UI 的 coss/ui
- Zustand

## 开发

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
pnpm tauri build
```

## 简介

Vision Space 是一个本地优先、轻量快速的图像查看器，当前面向 macOS，后续会扩展到 Linux。
