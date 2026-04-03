# 天学 品牌资源与替换说明

## 当前状态

项目当前已经完成 Expo 配置接线：

- App 图标：`app.json -> expo.icon`
- Android 自适应图标：`app.json -> expo.android.adaptiveIcon`
- 启动图：`app.json -> expo.splash`

目前这些配置临时复用了现有 iOS 1024 图标文件：

`ios/app/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`

这能保证构建链路可用，但**不建议直接用于正式上架**。

## 建议的正式资源

请准备以下品牌资源：

### 1. 应用图标

- 文件建议：`assets/branding/app-icon-1024.png`
- 尺寸：`1024 x 1024`
- 格式：PNG
- 要求：
  - 不带透明安全区提示线
  - 图标主体居中
  - 避免过细文字
  - 保证缩小后仍可识别

### 2. Android 自适应图标前景图

- 文件建议：`assets/branding/adaptive-icon-foreground.png`
- 尺寸：`1024 x 1024`
- 格式：PNG
- 要求：
  - 仅保留品牌前景主体
  - 背景透明
  - 关键内容放在中心安全区域

### 3. 启动图 Logo

- 文件建议：`assets/branding/splash-logo.png`
- 尺寸建议：`1242 x 1242`
- 格式：PNG
- 要求：
  - 透明背景
  - 仅保留核心 Logo 或品牌字标
  - 不建议把完整海报直接作为启动图

### 4. 启动图背景色

- 当前配置：`#4B38D3`
- 建议：继续沿用主品牌色，保持首屏识别一致性

## 建议替换后的 Expo 配置

准备好正式素材后，把 `app.json` 中的资源路径更新为：

- `expo.icon` -> `./assets/branding/app-icon-1024.png`
- `expo.android.adaptiveIcon.foregroundImage` -> `./assets/branding/adaptive-icon-foreground.png`
- `expo.splash.image` -> `./assets/branding/splash-logo.png`

## 推荐目录结构

```text
assets/
  branding/
    app-icon-1024.png
    adaptive-icon-foreground.png
    splash-logo.png
```

## 替换完成后的验证

1. 本地查看 Expo 配置：

```bash
npx expo config --type public
```

2. 构建 Android 预览包：

```bash
eas build -p android --profile preview
```

3. 真机检查：

- 桌面图标是否清晰
- 自适应图标是否被裁切
- 启动图是否居中
- 启动图背景色是否符合品牌视觉

## 备注

如果你把正式 PNG 发给我，我下一步可以直接把 `app.json` 路径切换到 `assets/branding/`，并帮你做一轮发布前检查。
