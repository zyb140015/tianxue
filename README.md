# 前端面试 App

一个基于 **React Native + Expo** 的前端面试学习 App。

当前阶段只做前端：

- 先完成页面与交互
- 使用 mock 数据
- 暂不接后端、数据库和真实鉴权
- 为后续 API、数据库、用户系统预留清晰边界

---

## 项目目标

该项目用于帮助用户完成前端面试准备，核心场景包括：

- 浏览面试题
- 查看答案与解析
- 分类筛选和搜索
- 收藏高频题
- 模拟面试练习
- 查看个人学习记录

---

## 当前阶段范围

### 已规划页面

- 欢迎页
- 登录页（假登录）
- 首页
- 题库页
- 题目详情页
- 模拟面试页
- 收藏页
- 我的页面
- 设置页

### 当前不做

- 真实登录注册
- 后端接口
- 数据库存储
- 管理后台
- AI 打分
- 音视频面试

---

## 当前已实现能力

- 假登录与登录态持久化
- 题库搜索、分类、难度、标签、排序筛选
- 收藏、已学习、未掌握状态管理
- 最近浏览、最近练习记录
- 模拟面试基础流程
- 首页、我的页、统计页联动
- 设置页主题切换
- 导出 / 导入本地数据（当前导入导出以 Web 端为主）

更完整说明见：

- `./功能总览.md`
- `./API_CONTRACT.md`

---

## 推荐技术栈

- React Native
- Expo
- TypeScript
- Expo Router
- Zustand
- TanStack Query
- React Hook Form
- Zod
- React Native Reanimated
- NativeWind
- Axios
- MMKV / SecureStore

---

## 目录说明

建议目录结构：

```txt
app/
src/
  components/
    common/
    business/
  features/
    auth/
    home/
    question/
    interview/
    favorites/
    profile/
    settings/
  services/
    api/
    mock/
    adapters/
  store/
  hooks/
  constants/
  types/
  utils/
  theme/
  assets/
```

---

## 开发原则

1. 全量使用 TypeScript
2. 页面层不直接依赖 mock 文件
3. 所有数据访问统一走 service / query 层
4. 组件职责单一，避免巨型组件
5. 样式统一走 theme token
6. 不滥用全局状态
7. 保持前后端解耦

详细规则见：

- `./RULES.md`
- `./SPEC.md`

---

## 适合 Codex 的使用方式

建议顺序：

1. 先把 `SPEC.md` 和 `RULES.md` 提供给 Codex
2. 再使用 `Codex Prompt.md` 中的初始化提示词
3. 先搭项目骨架，再逐页生成页面
4. 每完成一个模块就让 Codex 只验证该模块

---

## 建议开发顺序

### 第一阶段：初始化

- 初始化 Expo 项目
- 配置 TypeScript
- 配置 Expo Router
- 配置 Zustand / TanStack Query
- 建立目录结构
- 配置主题 token

### 第二阶段：页面静态开发

- 欢迎页
- 登录页
- 首页
- 题库页
- 题目详情页
- 收藏页
- 我的页面
- 设置页

### 第三阶段：基础交互

- 假登录
- 题库搜索与筛选
- 收藏切换
- 已学习状态
- 模拟面试流程

### 第四阶段：打磨

- 加载态
- 空状态
- 错误态
- 动效优化
- 本地持久化

---

## 本目录文档说明

- `SPEC.md`：产品说明与技术方案
- `RULES.md`：开发规则与约束
- `Codex Prompt.md`：给 Codex 的提示词模板
- `目录结构脚手架说明.md`：项目目录与职责说明
- `功能总览.md`：当前前端功能清单
- `API_CONTRACT.md`：后端接口契约草案

---

## 默认建议

如果你现在准备直接开工，建议默认采用：

- Expo
- TypeScript
- Expo Router
- Zustand
- TanStack Query
- NativeWind

先把前端页面和 mock 跑通，再补后端。
