# 前端面试 App 项目说明（SPEC）

## 1. 项目概述

这是一个基于 **React Native** 的前端面试学习 App，当前阶段只做前端页面、交互和基础架构，后续再补充后端、数据库、鉴权与云端同步能力。

当前目标：

- 优先完成前端页面与导航结构
- 使用本地 mock 数据驱动界面
- 预留清晰的数据层与 API 接入层
- 保证后续能平滑接入真实后端

适用方向包括：

- JavaScript
- TypeScript
- React
- React Native
- 浏览器原理
- 网络基础
- 工程化与构建

---

## 2. 项目目标

### 当前阶段目标

1. 搭建一个可运行的 React Native 前端项目
2. 实现核心页面与主流程导航
3. 用 mock 数据完成页面联调与交互
4. 建立可扩展的目录结构和状态管理方案
5. 为后续接入后端保留统一的数据访问边界

### 当前阶段不包含

1. 真实注册登录
2. 真实后端接口
3. 数据库存储
4. 管理后台
5. AI 实时评分
6. 音视频面试
7. 社区互动能力

---

## 3. 目标用户

### 核心用户

- 准备前端面试的开发者
- 校招生 / 初中级前端工程师
- 准备跳槽、系统复习知识点的开发者

### 用户需求

- 浏览前端面试题
- 按分类、标签、难度筛选题目
- 收藏高频题目
- 查看题目答案与解析
- 进行模拟面试练习
- 记录学习进度

---

## 4. V1 功能范围

## 4.1 页面范围

### 1）欢迎页

作用：

- 展示产品定位
- 引导进入登录或游客体验

核心内容：

- App 名称 / slogan
- 简介文案
- 开始使用按钮

### 2）登录页

作用：

- 当前阶段做前端假登录

核心内容：

- 手机号或邮箱输入
- 验证码 / 密码占位输入
- 登录按钮

### 3）首页

作用：

- 作为主入口页，展示推荐内容和快捷导航

核心内容：

- 搜索入口
- 推荐题目
- 分类入口
- 最近学习
- 热门专题

### 4）题库页

作用：

- 浏览全部面试题

核心内容：

- 搜索框
- 分类筛选
- 标签筛选
- 难度展示
- 题目列表

### 5）题目详情页

作用：

- 展示题目全文、答案和解析

核心内容：

- 标题
- 题干
- 答案
- 解析
- 标签
- 难度
- 收藏 / 取消收藏
- 标记已学习

### 6）模拟面试页

作用：

- 提供面试练习体验

核心内容：

- 随机题目
- 倒计时
- 开始回答
- 下一题
- 录音 / AI 评分占位入口

### 7）收藏页

作用：

- 查看和管理收藏题目

核心内容：

- 收藏列表
- 取消收藏
- 进入题目详情

### 8）我的页面

作用：

- 展示用户信息与学习数据

核心内容：

- 头像与昵称
- 连续学习天数
- 已学习题数
- 收藏数量
- 设置入口

### 9）设置页

作用：

- 作为未来配置中心的预留页面

核心内容：

- 主题模式占位
- 通知设置占位
- 关于应用

---

## 5. 技术栈建议

推荐当前阶段默认使用：

- React Native
- Expo
- TypeScript
- Expo Router
- Zustand
- TanStack Query
- React Hook Form
- Zod
- React Native Reanimated
- NativeWind（或团队接受的稳定 RN 样式方案）
- Axios
- MMKV 或 SecureStore

### 推荐理由

1. **Expo**：启动快，适合优先做前端页面
2. **TypeScript**：类型安全，方便维护
3. **Expo Router**：目录式路由，结构清晰
4. **Zustand**：轻量，适合 App 级共享状态
5. **TanStack Query**：便于 mock 到真实 API 的平滑迁移
6. **React Hook Form + Zod**：表单和校验体验更稳定
7. **NativeWind**：前期页面开发效率高

---

## 6. 路由结构建议

```txt
app/
  (auth)/
    welcome.tsx
    login.tsx
  (tabs)/
    index.tsx
    question-bank.tsx
    mock-interview.tsx
    favorites.tsx
    profile.tsx
  question/
    [id].tsx
  settings/
    index.tsx
```

Tab 页面建议：

- 首页
- 题库
- 模拟面试
- 收藏
- 我的

---

## 7. 数据模型建议

### 用户

```ts
type User = {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  phone?: string;
  streakDays: number;
  learnedCount: number;
  favoriteCount: number;
};
```

### 题目

```ts
type Question = {
  id: string;
  title: string;
  content: string;
  answer: string;
  category: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  isFavorite: boolean;
  isLearned: boolean;
};
```

### 分类

```ts
type Category = {
  id: string;
  name: string;
  icon?: string;
};
```

### 模拟面试记录

```ts
type MockInterviewRecord = {
  id: string;
  questionId: string;
  startedAt: string;
  duration: number;
  note?: string;
};
```

---

## 8. 功能需求

## 8.1 登录能力（Mock）

- 用户可以进入登录页
- 假登录成功后进入主流程
- 登录态可以本地持久化
- 不依赖真实后端

## 8.2 题库浏览

- 可以查看题目列表
- 可以按分类筛选
- 可以按标签筛选
- 可以关键词搜索
- 可以展示题目难度

## 8.3 题目详情

- 可以查看题干与答案
- 可以查看解析和标签
- 可以收藏 / 取消收藏
- 可以标记为已学习

## 8.4 收藏管理

- 可以查看收藏题目
- 可以取消收藏
- 收藏状态在不同页面间同步

## 8.5 模拟面试

- 可以开始练习
- 可以随机展示题目
- 可以显示倒计时
- 可以切换下一题
- 面试记录可先本地保存

## 8.6 个人中心

- 可以查看基本用户信息
- 可以查看学习统计
- 可以进入设置页

---

## 9. 非功能要求

1. 全量使用 TypeScript
2. 目录结构清晰
3. 组件可复用
4. 设计风格统一
5. 易于未来接入后端
6. 支持本地持久化
7. 面向移动端布局优化
8. 架构上预留深色模式扩展能力

---

## 10. 目录结构建议

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

说明：

- `components/common`：通用基础组件
- `components/business`：业务通用组件
- `features/*`：按功能域拆分页面和逻辑
- `services/mock`：mock 数据与 mock service
- `services/api`：未来真实接口层
- `services/adapters`：必要时做数据转换
- `theme`：主题、颜色、字体、间距 token

---

## 11. 状态管理策略

### 本地状态

用于：

- 输入框内容
- 弹窗显示状态
- 局部交互状态

### 全局状态（Zustand）

用于：

- 登录态
- 用户信息
- 轻量级全局偏好设置

### 异步数据状态（TanStack Query）

用于：

- 题目列表
- 题目详情
- 收藏列表查询抽象
- 后续真实接口缓存管理

### 本地持久化

建议存储：

- 登录态
- 收藏状态
- 已学习记录
- 最近练习记录

---

## 12. 数据接入策略

当前阶段：

- 所有数据由 mock 提供

约束要求：

1. 页面层不直接依赖原始 mock 文件
2. 所有数据读取通过 service / query 层
3. 先定义类型，再定义数据访问方法
4. 后续只替换服务实现，不大改页面层

---

## 13. UI / UX 风格建议

关键词：

- 现代
- 简洁
- 科技感
- 卡片化
- 产品感

视觉建议：

- 主色可用蓝色 / 靛蓝色系
- 统一圆角卡片
- 清晰的信息层级
- 控制信息密度
- 动效轻量克制

设计原则：

1. 每个页面突出一个主要操作
2. 保证可读性优先
3. 保持触控区域友好
4. 统一列表、卡片、标签样式
5. 每页需要有加载、空状态、错误状态设计

---

## 14. V1 开发里程碑

### 第一阶段：项目初始化

- 初始化 Expo 项目
- 配置 TypeScript
- 配置路由
- 配置状态管理
- 配置 Query 层
- 配置主题 token
- 初始化目录结构

### 第二阶段：页面静态搭建

- 欢迎页
- 登录页
- 首页
- 题库页
- 题目详情页
- 收藏页
- 我的页
- 设置页

### 第三阶段：交互与 mock 联动

- 假登录
- 搜索与筛选
- 收藏状态切换
- 标记已学习
- 模拟面试流程

### 第四阶段：打磨与优化

- 加载态 / 空状态 / 错误态
- 动效优化
- 本地持久化
- 通用组件抽离与清理

---

## 15. 后端接入准备

后续后端建议支持：

- 登录鉴权接口
- 题目列表 / 详情接口
- 收藏同步接口
- 学习进度同步接口
- 模拟面试记录同步接口

前端当前阶段必须做到：

1. API 访问统一封装
2. 领域类型定义稳定
3. 页面不直接读 mock 文件
4. 本地存储逻辑与服务端同步逻辑分离

---

## 16. 风险说明

1. “最新技术栈”版本变化快，实际实现时需要再确认稳定版本
2. 样式方案一旦选定，不建议中途频繁切换
3. 如果后续原生能力变复杂，需要重新评估 Expo 边界
4. V1 容易功能膨胀，需要严格控制范围

---

## 17. 默认决策建议

如果没有特殊限制，默认选择：

- Expo
- TypeScript
- Expo Router
- Zustand
- TanStack Query
- React Hook Form
- Zod
- NativeWind

原因：

这套组合适合“先前端、后后端”的 React Native 项目，兼顾开发效率、结构清晰和后续扩展性。

---

## 18. V1 验收标准

满足以下条件即可认为 V1 可交付：

1. App 可以本地正常运行
2. 主导航完整可用
3. 核心页面已完成
4. mock 数据已通过 service / query 层接入
5. 收藏功能可用
6. 已学习状态可用
7. 模拟面试基础流程可用
8. 代码结构清晰，可支持后续接入后端
