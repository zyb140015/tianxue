# Codex 提示词模板

下面内容可直接复制给 Codex 使用。

---

## 1. 项目初始化 Prompt

```md
请帮我初始化一个 React Native 前端项目，用于“前端面试 App”。

要求如下：

1. 使用最新稳定技术栈，优先选择：
   - Expo
   - React Native
   - TypeScript
   - Expo Router
   - Zustand
   - TanStack Query
   - React Hook Form
   - Zod
   - React Native Reanimated
   - NativeWind

2. 当前阶段只做前端，不接后端。
3. 所有页面先使用 mock 数据。
4. 请优先保证目录结构清晰、可扩展。
5. 请严格遵守我项目中的 `SPEC.md` 和 `RULES.md`。
6. 页面风格要求：现代、简洁、科技感、移动端友好。
7. 不要过度设计，不要引入当前用不到的复杂依赖。

请先输出：
1. 技术选型说明
2. 项目目录结构
3. 页面拆分方案
4. 状态管理方案
5. mock 数据接入方案
6. 初始化实施步骤
```

---

## 2. 生成项目骨架 Prompt

```md
请根据以下要求，帮我生成 React Native 项目骨架代码：

1. 使用 Expo + TypeScript + Expo Router。
2. 生成基础目录结构：
   - app
   - src/components
   - src/features
   - src/services
   - src/store
   - src/theme
   - src/types
   - src/constants
   - src/utils
3. 配置 Zustand 和 TanStack Query。
4. 配置基础 theme token。
5. 创建基础通用组件占位：
   - Button
   - Input
   - Card
   - EmptyState
   - LoadingState
6. 先不要接真实接口。
7. 所有异步数据先从 mock service 获取。
8. 代码保持最小可运行，不做无关扩展。

请先生成：
1. 目录结构
2. 每个关键文件的职责说明
3. 关键初始化代码
4. 后续页面接入方式
```

---

## 3. 页面生成 Prompt

```md
请帮我继续开发“前端面试 App”的页面。

项目要求：
- React Native + Expo
- TypeScript
- Expo Router
- Zustand
- TanStack Query
- mock 数据驱动

请严格遵守以下规则：
- 不使用 any
- 页面层不直接读取 mock 文件
- 公共组件优先复用
- 样式统一，走 theme token
- 保持移动端友好
- 不做无关重构

请先实现以下页面：
- 欢迎页
- 登录页
- 首页
- 题库页
- 题目详情页
- 收藏页
- 模拟面试页
- 我的页面

要求：
1. 先完成静态 UI 和导航
2. 再补 mock 数据联动
3. 每个页面都要考虑加载态、空状态、错误态
4. 组件要按 feature 拆分
5. 输出时说明新增了哪些文件
```

---

## 4. 单页开发 Prompt

```md
请只开发 [页面名] 页面，不要改其他无关模块。

要求：
1. 保持与现有项目技术栈一致
2. 优先复用已有组件
3. 页面结构清晰，组件职责单一
4. 使用 mock service 获取数据
5. 不要直接在页面里写死原始 mock 数据
6. 样式走统一 theme token
7. 如果需要新增组件，请放到合理目录

完成后请输出：
1. 修改了哪些文件
2. 为什么这样拆分
3. 如何验证该页面
```

---

## 5. 状态管理 Prompt

```md
请帮我设计这个 React Native 项目的状态管理方案。

要求：
1. 局部状态使用组件内状态
2. 登录态、用户信息、轻量全局偏好使用 Zustand
3. 题目列表、题目详情、收藏查询使用 TanStack Query
4. 本地持久化只保留必要数据
5. 不允许把全部数据都放进全局 store

请输出：
1. 哪些状态属于局部状态
2. 哪些状态属于 Zustand
3. 哪些状态属于 TanStack Query
4. 推荐的 store 划分
5. 推荐的数据流设计
```

---

## 6. mock 数据 Prompt

```md
请帮我为“前端面试 App”设计 mock 数据和 mock service。

要求：
1. 数据结构贴近真实业务
2. 使用 TypeScript 类型约束
3. 页面不能直接读取 mock 文件
4. 通过 service 层暴露查询方法
5. 预留未来切换成真实 API 的空间

请输出：
1. 用户 mock 数据结构
2. 题目 mock 数据结构
3. 收藏与学习记录结构
4. mock service 示例
5. 页面接入示例
```

---

## 7. UI 优化 Prompt

```md
请帮我优化这个 React Native App 的 UI，但不要改动业务结构。

要求：
1. 保持现代、简洁、科技感
2. 移动端可读性优先
3. 优化卡片、列表、标签、按钮、输入框风格
4. 保持统一的间距、圆角、颜色体系
5. 不引入新的复杂 UI 库，除非当前项目确实需要
6. 只做必要 UI 优化，不做无关重构

请输出：
1. 优化点清单
2. 修改文件清单
3. 为什么这些改动更适合当前产品
```

---

## 8. 规则约束 Prompt

```md
在后续所有代码生成中，请严格遵守以下规则：

1. 使用 TypeScript
2. 不使用 any
3. 不写魔法数字和无说明字符串
4. 页面层不直接依赖 mock 文件
5. 所有异步数据统一走 service / query 层
6. 组件职责单一
7. 公共样式和 token 集中管理
8. 不做与当前任务无关的重构
9. 优先最小正确改动
10. 输出时说明修改的文件和验证方式

如果项目内已有 `SPEC.md` 和 `RULES.md`，请以它们为最高约束。
```

---

## 9. 推荐使用顺序

建议你实际使用 Codex 时按下面顺序投喂：

1. 先给 `RULES.md`
2. 再给 `SPEC.md`
3. 再给“项目初始化 Prompt”
4. 接着给“项目骨架 Prompt”
5. 再逐个使用“页面生成 Prompt”或“单页开发 Prompt”

---

## 10. 使用建议

1. 每次只让 Codex 做一件明确的事
2. 每次生成后让它说明修改文件清单
3. 每次只验证当前模块，避免范围过大
4. 页面先完成，再逐步接 mock，再接后端
5. 先保证能跑通，再追求细节优化
