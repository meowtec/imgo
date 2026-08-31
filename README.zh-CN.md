# IMGo

[English](./README.md) | [简体中文](./README.zh-CN.md)

> [!IMPORTANT]
> IMGo 是原版 [meowtec/Imagine](https://github.com/meowtec/Imagine) 的新一代重构版本。桌面端已从 Electron 重构为 Tauri，安装体积更小、支持更多图片格式，并提供可直接在浏览器中使用的完整网页版。
>
> 如果你更习惯原版的 UI 交互，但又需要更多格式支持，可以考虑 [Imagine-plus](https://github.com/xianfei/Imagine-plus)。

IMGo（`image optimizer` 的缩写）是一款注重隐私的批量图片压缩与格式转换工具。你可以一次处理多张图片，调整画质和尺寸，并在常见图片格式之间转换，全程无需上传文件。

![IMGo 批量处理界面](./docs/images/imgo.webp)

![IMGo 图片对比界面](./docs/images/imgo-2.webp)

## 功能特点

- 批量压缩图片与转换格式
- 本地处理，图片始终留在你的设备上
- 支持画质、无损模式、尺寸和元数据选项
- 支持动态 PNG、GIF、WebP 和 AVIF
- 提供 macOS、Windows 和 Linux 原生桌面应用
- 提供无需安装的浏览器版本

## 目标格式

| 版本   | 目标格式                                        |
| ------ | ----------------------------------------------- |
| 网页版 | JPEG、PNG、GIF、WebP、AVIF、HEIC                |
| 桌面版 | JPEG、PNG、GIF、WebP、AVIF、HEIC、JPEG XL (JXL) |

支持输出动态 PNG、GIF、WebP 和 AVIF。

## 在线使用

打开 [imgo.app](https://imgo.app/) 即可开始处理图片。网页版在浏览器本地运行，无需上传图片。

## 下载桌面版

前往 [GitHub Releases](https://github.com/meowtec/imgo/releases) 下载最新版本。

| 平台    | 下载文件                             |
| ------- | ------------------------------------ |
| macOS   | 适用于 Apple 芯片或 Intel 芯片的 DMG |
| Windows | 适用于 ARM64 或 x64 的安装程序       |
| Linux   | 适用于 ARM64 或 x64 的 AppImage      |

请选择与你的操作系统和处理器相匹配的文件，然后打开文件安装或运行 IMGo。

当前 Windows 安装程序尚未签名，macOS 应用也尚未经过公证。首次打开时，操作系统可能会显示安全提示。

如果 macOS 阻止 IMGo 打开，请先将 `IMGo.app` 移动到“应用程序”文件夹，然后打开“终端”并运行：

```bash
xattr -cr "/Applications/IMGo.app"
```

运行后再次打开 IMGo。
