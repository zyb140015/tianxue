# Expo RN 项目初始化命令清单

以下命令基于当前项目方案：**Expo + React Native + TypeScript + Expo Router**。

---

## 1. 初始化项目

如果目录为空，推荐直接执行：

```bash
npx create-expo-app@latest frontend-interview-app --template tabs@latest
```

如果目录已经存在文档并希望在当前目录初始化，可采用当前项目这种方式：

1. 先创建 `package.json`
2. 再执行安装命令

---

## 2. 安装依赖

在项目根目录执行：

```bash
npm install
```

---

## 3. 启动开发环境

```bash
npm run start
```

常用命令：

```bash
npm run ios
npm run android
npm run web
```

---

## 4. 类型检查

```bash
npm run typecheck
```

---

## 5. 当前项目推荐依赖说明

当前骨架已包含：

- expo
- react-native
- expo-router
- zustand
- @tanstack/react-query
- react-hook-form
- zod
- axios
- react-native-reanimated
- expo-secure-store

---

## 6. 推荐初始化顺序

1. 安装依赖
2. 启动项目验证路由是否正常
3. 检查首页、题库页、收藏页、我的页面跳转
4. 再继续补 UI 和 mock 数据

---

## 7. 后续可选命令

如果后面需要补充常用能力，可再按需安装：

### 安装 MMKV

```bash
npx expo install react-native-mmkv
```

### 安装 NativeWind

```bash
npm install nativewind tailwindcss
```

> 当前骨架没有强制接入 NativeWind，先用 theme token + StyleSheet 保持结构最小化。
